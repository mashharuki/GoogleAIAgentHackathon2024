import * as fs from "node:fs";
import * as readline from "node:readline";
import { CdpAgentkit } from "@coinbase/cdp-agentkit-core";
import { CdpToolkit } from "@coinbase/cdp-langchain";
import { HumanMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import * as dotenv from "dotenv";
import {
  createBorrowCryptoToolForCdp,
  createGetTokenBalanceToolForCdp,
  createGetUserAccountDataToolForCdp,
  createLendCryptoToolForCdp,
} from "./tools/cdp/cdpAaveTool";
import { createSignMessageTool } from "./tools/cdp/signMessage";

dotenv.config();

const { OPENAI_API_KEY, NETWORK_ID } = process.env;

// Configure a file to persist the agent's CDP MPC Wallet Data
const WALLET_DATA_FILE = "wallet_data.txt";

/**
 * get tools for Coinbase Developer Platform AgentKit
 */
export const createCdpAgentKitTools = async () => {
  let walletDataStr: string | null = null;

  // Read existing wallet data if available
  if (fs.existsSync(WALLET_DATA_FILE)) {
    try {
      walletDataStr = fs.readFileSync(WALLET_DATA_FILE, "utf8");
      console.log("Read wallet data:", walletDataStr);
    } catch (error) {
      console.error("Error reading wallet data:", error);
      // Continue without wallet data
    }
  }

  // Configure CDP AgentKit
  const config = {
    cdpWalletData: walletDataStr || undefined,
    networkId: NETWORK_ID || "base-sepolia",
  };

  // Initialize CDP AgentKit
  const agentkit = await CdpAgentkit.configureWithWallet(config);

  // Initialize CDP AgentKit Toolkit and get tools
  const cdpToolkit = new CdpToolkit(agentkit);
  const cdpAgentKitTools = cdpToolkit.getTools();

  return { agentkit, cdpAgentKitTools };
};

/**
 * Initialize the agent with CDP AgentKit method
 * @returns Agent executor and config
 */
export const initializeCdpAgent = async (systemPrompt: string) => {
  // Initialize LLM
  const llm = new ChatOpenAI({
    model: "gpt-3.5-turbo",
    apiKey: OPENAI_API_KEY,
    // apiKey: "gaia",
    /*
    configuration: {
      baseURL: "https://llamatool.us.gaianet.network/v1",
    },
    */
  });

  // create CDP AgentKit tools
  const { agentkit, cdpAgentKitTools } = await createCdpAgentKitTools();

  // Add tools
  const signMessageTool = createSignMessageTool(agentkit);
  const borrowCryptoTool = createBorrowCryptoToolForCdp(agentkit);
  const lendCryptoTool = createLendCryptoToolForCdp(agentkit);
  const getUserAccountDataTool = createGetUserAccountDataToolForCdp(agentkit);
  const getTokenBalanceToolForCdp = createGetTokenBalanceToolForCdp(agentkit);
  // ツールを追加
  cdpAgentKitTools.push(signMessageTool);
  cdpAgentKitTools.push(borrowCryptoTool);
  cdpAgentKitTools.push(lendCryptoTool);
  cdpAgentKitTools.push(getUserAccountDataTool);
  cdpAgentKitTools.push(getTokenBalanceToolForCdp);

  // Store buffered conversation history in memory
  const memory = new MemorySaver();
  const agentConfig = {
    configurable: { thread_id: "CDP AgentKit Chatbot Example!" },
  };

  // Create React Agent using the LLM and CDP AgentKit tools
  const agent = createReactAgent({
    llm,
    tools: cdpAgentKitTools,
    checkpointSaver: memory,
    stateModifier: systemPrompt,
  });

  // Save wallet data
  const exportedWallet = await agentkit.exportWallet();
  fs.writeFileSync(WALLET_DATA_FILE, exportedWallet);

  return { agent, config: agentConfig };
};

/**
 * Run the agent interactively based on user input
 *
 * @param agent - The agent executor
 * @param config - Agent configuration
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const runCdpChatMode = async (systemPrompt: string, prompt: string) => {
  console.log("Starting ... ");

  const response: string[] = [];

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    // get agent and config
    const { agent, config } = await initializeCdpAgent(systemPrompt);

    const stream = await agent.stream(
      { messages: [new HumanMessage(prompt)] },
      config,
    );

    for await (const chunk of stream) {
      if ("agent" in chunk) {
        if (chunk.agent.messages?.[0]) {
          console.log(chunk.agent.messages[0].content);
          response.push(chunk.agent.messages[0].content);
        }
      } else if ("tools" in chunk) {
        if (chunk.tools.messages[0]) {
          console.log(chunk.tools.messages[0].content);
          response.push(chunk.tools.messages[0].content);
        }
      }
      console.log("-------------------");
      response.push("-------------------");
    }
    rl.close();

    return response;
  } catch (error) {
    console.error("Error running chat mode:", error);
    response.push("Error running chat mode:");

    rl.close();
    return response;
  }
};
