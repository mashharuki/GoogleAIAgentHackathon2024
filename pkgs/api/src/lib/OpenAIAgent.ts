import { MemorySaver } from "@langchain/langgraph";
import { type ToolNode, createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";

import * as dotenv from "dotenv";

dotenv.config();

const { OPENAI_API_KEY } = process.env;

/**
 * OpenAIのLLMを使ってAI Agent用のインスタンスを作成するメソッド
 */
export const createOpenAIAIAgent = (
  agentTools: ToolNode,
  systemPrompt: string,
) => {
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
    stateModifier: systemPrompt,
  });

  return agent;
};
