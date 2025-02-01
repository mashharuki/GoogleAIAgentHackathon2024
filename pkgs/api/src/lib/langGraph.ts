import {
  type GenerativeModel,
  HarmBlockThreshold,
  HarmCategory,
  VertexAI,
} from "@google-cloud/vertexai";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { HumanMessage } from "@langchain/core/messages";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import {
  MemorySaver,
  MessagesAnnotation,
  StateGraph,
} from "@langchain/langgraph";
import { ToolNode, createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import * as dotenv from "dotenv";
import { SYSTEM_PROMPT } from "./chatGrog";

dotenv.config();

const { OPENAI_API_KEY, GEMINI_API_KEY, TAVILY_API_KEY, PROJECT_ID, REGION } =
  process.env;

/**
 * AI Agentに割り当てるツール群を指定する。
 */
export const createTools = () => {
  const tools = [
    new TavilySearchResults({ apiKey: TAVILY_API_KEY, maxResults: 3 }),
  ];
  const toolNode = new ToolNode(tools);

  return toolNode;
};

/**
 * OpenAIのLLMを使ってAI Agent用のインスタンスを作成するメソッド
 */
export const createOpenAIAIAgent = (agentTools: ToolNode) => {
  // Initialize memory to persist state between graph runs
  const agentCheckpointer = new MemorySaver();
  const agentModel = new ChatOpenAI({
    apiKey: OPENAI_API_KEY,
    temperature: 0,
  });

  // AI Agent用のインスタンスをs
  const agent = createReactAgent({
    llm: agentModel,
    tools: agentTools,
    checkpointSaver: agentCheckpointer,
    stateModifier: SYSTEM_PROMPT,
  });

  return agent;
};

/**
 * Google API (Gemini)のLLMを使ってAI Agent用のインスタンスを作成するメソッド
 */
export const createGeminiAIAgent = () => {
  const agent = new ChatGoogleGenerativeAI({
    apiKey: GEMINI_API_KEY,
    modelName: "gemini-pro",
    maxOutputTokens: 2048,
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
      },
    ],
  });

  return agent;
};

/**
 *Vertex AI提供のLLMを使ってAI Agent用のインスタンスを作成するメソッド
 */
export const createVertexAIAIAgent = () => {
  // VertexAIインスタンスを作成。
  const vertexAI = new VertexAI({
    project: PROJECT_ID,
    location: REGION,
  });

  // Instantiate Gemini models
  const agent = vertexAI.getGenerativeModel({
    model: "gemini-pro",
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ],
    generationConfig: {
      maxOutputTokens: 2048,
    },
    systemInstruction: {
      role: "system",
      parts: [
        {
          text: SYSTEM_PROMPT,
        },
      ],
    },
  });

  return agent;
};

/**
 * AI Agentに実行させるワークフローとタスクを定義するメソッド
 * @parma AI Agent instance
 * @param toolNode 外部ツール
 */
export const createAgentTask = async (
  agent: GenerativeModel | ChatGoogleGenerativeAI | VertexAI,
  toolNode: ToolNode,
) => {
  /**
   * Define the function that determines whether to continue or not
   * @param param0
   * @returns
   */
  function shouldContinue({ messages }: typeof MessagesAnnotation.State) {
    const lastMessage = messages[messages.length - 1];

    // If the LLM makes a tool call, then we route to the "tools" node
    if (lastMessage.additional_kwargs.tool_calls) {
      return "tools";
    }
    // Otherwise, we stop (reply to the user) using the special "__end__" node
    return "__end__";
  }

  /**
   * Define the function that calls the model
   * @param state
   * @returns
   */
  async function callModel(state: typeof MessagesAnnotation.State) {
    // AIに推論させる
    const response = await (agent as GenerativeModel).generateContent({
      contents: [
        {
          role: "model",
          parts: [
            {
              text: `${state.messages[state.messages.length - 1].content.toString()}`,
            },
          ],
        },
      ],
    });

    // Extract the first candidate's content
    const content = response.response.candidates?.[0].content;
    // Create a HumanMessage object
    const message = new HumanMessage(content?.parts[0].text as string);
    // console.log("message:", message)
    return { messages: [message] };
  }

  // ワークフローを構築する。
  const workflow = new StateGraph(MessagesAnnotation)
    .addNode("agent", callModel)
    .addEdge("__start__", "agent") // __start__ is a special name for the entrypoint
    .addNode("tools", toolNode)
    .addEdge("tools", "agent")
    .addConditionalEdges("agent", shouldContinue);

  // Finally, we compile it into a LangChain Runnable.
  const app = workflow.compile();

  return app;
};
