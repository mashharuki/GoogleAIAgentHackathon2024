import { serve } from "@hono/node-server";
import { HumanMessage } from "@langchain/core/messages";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { runCdpChatMode } from "./lib/cdpGaiaAgent";
import { createChatGrogAgent, createCryptTools } from "./lib/chatGrog";
import {
  createAgentTask,
  createGeminiAIAgent,
  createOpenAIAIAgent,
  createTools,
  createVertexAIAIAgent,
} from "./lib/langGraph";

const app = new Hono();

// CORSの設定
app.use(
  "*", // 全てのエンドポイントに適用
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

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

// Gemini のLLMを使ったAIAgentのサンプルメソッドを呼び出す
app.post("/agentGemini", async (c) => {
  const toolNode = createTools();
  // GeminiのAI agent用のインスタンスを作成する。
  const agent = createGeminiAIAgent();

  // ワークフローを構築する。
  const app = await createAgentTask(agent, toolNode);

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

  // ワークフローを構築する。
  const app = await createAgentTask(agent, toolNode);

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

// Chat Groq Agentを使ったAIのメソッドを呼び出す。
// ツールの設定は、lib/chatGrog.tsに記述されている。
app.post("/runChatGroqAgent", async (c) => {
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

  // Agentを生成
  const agent = await createChatGrogAgent();

  const result = await agent.invoke(
    { messages: [prompt] },
    { configurable: { thread_id: "43" } },
  );
  const response = result.messages[3].content;

  console.log("Result:", response);

  return c.json({
    result: response,
  });
});

// OpenAI のLLMを使ったAIAgentのサンプルメソッドを呼び出す
app.post("/runCryptOpenAIAgent", async (c) => {
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

  const toolNode = createCryptTools();
  // AI agent用のインスタンスを作成する。
  const agent = createOpenAIAIAgent(toolNode);

  // AI の推論を実行してみる。
  const agentNextState = await agent.invoke(
    { messages: [new HumanMessage(prompt)] },
    { configurable: { thread_id: "44" } },
  );

  console.log(
    agentNextState.messages[agentNextState.messages.length - 1].content,
  );

  return c.json({
    result: agentNextState.messages[agentNextState.messages.length - 1].content,
  });
});

serve(app);

export default app;
