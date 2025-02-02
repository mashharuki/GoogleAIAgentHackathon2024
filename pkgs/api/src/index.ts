import { serve } from "@hono/node-server";
import { HumanMessage } from "@langchain/core/messages";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { createOpenAIAIAgent } from "./lib/OpenAIAgent";
import { runCdpChatMode } from "./lib/cdpGaiaAgent";
import { defiAssistantSystemPrompt } from "./lib/config";
import { createChatGrogAgent, createCryptTools } from "./lib/grogAgent";
import {
  createAgentTask,
  createTools,
  createVertexAIAIAgent,
} from "./lib/vertexAgent";

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

/**
 * デフォルトのメソッド
 */
app.get("/", (c) => {
  return c.text("Hello, World!");
});

/**
 * ヘルスチェックメソッド
 */
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

/**
 * Vertex AI のLLMを使ったAIAgentのサンプルメソッドを呼び出す
 */
app.post("/agentVertexAI", async (c) => {
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

  const toolNode = createTools();
  // GeminiのAI agent用のインスタンスを作成する。
  const agent = createVertexAIAIAgent(defiAssistantSystemPrompt);

  // ワークフローを構築する。
  const app = await createAgentTask(agent, toolNode);

  // Use the agent
  const finalState = await app.invoke({
    messages: [new HumanMessage(prompt)],
  });
  const response = finalState.messages[finalState.messages.length - 1].content;
  console.log(response);

  return c.json({
    result: response,
  });
});

/**
 * CDP AgentKitを使ったAIのメソッドを呼び出すメソッド
 */
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

/**
 * Chat Groq Agentを使ったAIのメソッドを呼び出す。
 * ツールの設定は、lib/chatGrog.tsに記述されている。
 */
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
  const agent = await createChatGrogAgent(
    createCryptTools(),
    defiAssistantSystemPrompt,
  );

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

  // AI agent用のインスタンスを作成する。
  const agent = createOpenAIAIAgent(
    createCryptTools(),
    defiAssistantSystemPrompt,
  );

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
