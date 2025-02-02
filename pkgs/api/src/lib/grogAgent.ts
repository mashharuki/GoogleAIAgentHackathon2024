import { ChatGroq } from "@langchain/groq";
import { MemorySaver } from "@langchain/langgraph";
import { ToolNode, createReactAgent } from "@langchain/langgraph/prebuilt";
import * as dotenv from "dotenv";
import {
  borrowCrypto,
  getTokenBalance,
  getUserAccountData,
  lendCrypto,
} from "./tools/aaveTool";
import { getTrendingTokens, search } from "./tools/coinGeckoTool";
import { getEthAndStEthBalances, stakeWithLido } from "./tools/lidoTool";
import { swapTokens } from "./tools/uniswapTool";

dotenv.config();

const { Groq_API_Key } = process.env;

/**
 * 暗号資産操作用の外部ツールをAI Agentに割り当てられるようにするToolNodeオブジェクトを作成するメソッド
 * @returns
 */
export const createCryptTools = () => {
  // 外部ツールを設定
  const tools = [
    getTokenBalance,
    getUserAccountData,
    lendCrypto,
    borrowCrypto,
    search,
    getTrendingTokens,
    swapTokens,
    getEthAndStEthBalances,
    stakeWithLido,
  ];

  const toolNode = new ToolNode(tools);

  return toolNode;
};

/**
 * ChatGroqのAI Agentインスタンスを作成するメソッド
 */
export const createChatGrogAgent = async (
  tools: ToolNode,
  systemPrompt: string,
) => {
  // LLM インスタンスを生成
  const llm = new ChatGroq({ model: "llama3-70b-8192", apiKey: Groq_API_Key });
  // MemoryServerインスタンスを生成
  const agentCheckpointer = new MemorySaver();

  // AI Agent用のインスタンスを生成
  const agent = createReactAgent({
    // @ts-ignore
    llm: llm,
    tools: tools,
    checkpointSaver: agentCheckpointer,
    messageModifier: systemPrompt,
  });

  return agent;
};
