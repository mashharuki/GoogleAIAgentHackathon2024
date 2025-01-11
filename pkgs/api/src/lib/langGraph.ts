import { VertexAI } from "@google-cloud/vertexai";
import { HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { MemorySaver } from "@langchain/langgraph";
import { ToolNode, createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import * as dotenv from "dotenv";

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
  });

  return agent;
};
