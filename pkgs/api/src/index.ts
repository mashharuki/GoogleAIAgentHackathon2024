import { serve } from "@hono/node-server";
import { HumanMessage } from "@langchain/core/messages";
import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { Hono } from "hono";
import { runCdpChatMode } from "./lib/cdpGaiaAgent";
import { model } from "./lib/langChain";
import {
  createGeminiAIAgent,
  createOpenAIAIAgent,
  createTools,
  createVertexAIAIAgent,
} from "./lib/langGraph";
import {
  countTokens,
  functionCallingChat,
  functionCallingGenerateContentStream,
  generateContent,
  multiPartContent,
  multiPartContentImageString,
  multiPartContentVideo,
  sendChat,
  streamChat,
  streamGenerateContent,
} from "./lib/vertex";

const app = new Hono();

// デフォルトのメソッド
app.get("/", (c) => {
  return c.text("Hello, World!");
});

// ヘルスチェックメソッド
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

//streamGenerateContentメソッド
app.post("/streamGenerateContent", async (c) => {
  // メソッドを呼び出し
  const result = await streamGenerateContent();
  return c.json({
    result: result,
  });
});

// generateContentメソッド
app.post("/generateContent", async (c) => {
  const result = await generateContent();
  return c.json({
    result: result,
  });
});

// streamChatメソッド
app.post("/streamChat", async (c) => {
  const result = await streamChat();
  return c.json({
    result: result,
  });
});

// sendChatメソッド
app.post("/sendChat", async (c) => {
  const result = await sendChat();
  return c.json({
    result: result,
  });
});

// multiPartContentメソッド
app.post("/multiPartContent", async (c) => {
  const result = await multiPartContent();
  return c.json({
    result: result,
  });
});

// multiPartContentImageStringメソッド
app.post("/multiPartContentImageString", async (c) => {
  const result = await multiPartContentImageString();
  return c.json({
    result: result,
  });
});

// multiPartContentVideoメソッド
app.post("/multiPartContentVideo", async (c) => {
  const result = await multiPartContentVideo();
  return c.json({
    result: result,
  });
});

// functionCallingChatメソッド
app.post("/functionCallingChat", async (c) => {
  const result = await functionCallingChat();
  return c.json({
    result: result,
  });
});

// functionCallingGenerateContentStreamメソッド
app.post("/functionCallingGenerateContentStream", async (c) => {
  const result = await functionCallingGenerateContentStream();
  return c.json({
    result: result,
  });
});

// countTokensメソッド
app.post("/countTokens", async (c) => {
  const result = await countTokens();
  return c.json({
    result: result,
  });
});

// langChainメソッド
app.post("/langChain", async (c) => {
  const result = await model.invoke([
    [
      "human",
      "What would be a good company name for a company that makes colorful socks?",
    ],
  ]);

  return c.json({
    result: result,
  });
});

// OpenAI のLLMを使ったAIAgentのサンプルメソッドを呼び出す
app.post("/agentOpenAI", async (c) => {
  const toolNode = createTools();
  // AI agent用のインスタンスを作成する。
  const agent = createOpenAIAIAgent(toolNode);

  // Amazon Aurora DSQLについて聞いてみる。
  const agentNextState = await agent.invoke(
    { messages: [new HumanMessage("what about Amazon Aurora DSQL?")] },
    { configurable: { thread_id: "42" } },
  );

  console.log(
    agentNextState.messages[agentNextState.messages.length - 1].content,
  );

  return c.json({
    result: agentNextState.messages[agentNextState.messages.length - 1].content,
  });
});

// Gemini のLLMを使ったAIAgentのサンプルメソッドを呼び出す
app.post("/agentGemini", async (c) => {
  const toolNode = createTools();
  // GeminiのAI agent用のインスタンスを作成する。
  const agent = createGeminiAIAgent();

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
    const response = await agent.invoke(state.messages);

    // We return a list, because this will get added to the existing list
    return { messages: [response] };
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

  // Use the agent
  const finalState = await app.invoke({
    messages: [new HumanMessage("what is the weather in sf")],
  });

  console.log(finalState.messages[finalState.messages.length - 1].content);

  const nextState = await app.invoke({
    // Including the messages from the previous run gives the LLM context.
    // This way it knows we're asking about the weather in NY
    messages: [
      ...finalState.messages,
      new HumanMessage("what about Amazon Aurora DSQL?"),
    ],
  });

  console.log(nextState.messages[nextState.messages.length - 1].content);

  return c.json({
    result: nextState.messages[nextState.messages.length - 1].content,
  });
});

// Vertex AI のLLMを使ったAIAgentのサンプルメソッドを呼び出す
app.post("/agentVertexAI", async (c) => {
  const toolNode = createTools();
  // GeminiのAI agent用のインスタンスを作成する。
  const agent = createVertexAIAIAgent();

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
    const response = await agent.generateContent({
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

  // Use the agent
  const finalState = await app.invoke({
    messages: [new HumanMessage("what is AWS?")],
  });
  console.log(finalState.messages[finalState.messages.length - 1].content);

  const nextState = await app.invoke({
    messages: [
      ...finalState.messages,
      new HumanMessage("Please tell me about Amazon Aurora DSQL?"),
    ],
  });

  console.log(nextState.messages[nextState.messages.length - 1].content);

  return c.json({
    result: nextState.messages[nextState.messages.length - 1].content,
  });
});

// CDP AgentKitを使ったAIのメソッドを呼び出す。
app.post("/runCdpChatMode", async (c) => {
  // リクエストボディからプロンプトを取得
  const { prompt } = await c.req.json();

  // プロンプトが存在しない場合にエラーハンドリング
  if (!prompt) {
    return c.json(
      {
        error: "Prompt is required",
      },
      400,
    );
  }

  const response = await runCdpChatMode(prompt);

  return c.json({
    result: response,
  });
});

serve(app);

export default app;
