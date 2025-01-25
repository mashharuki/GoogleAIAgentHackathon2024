import * as fs from "node:fs";
import * as readline from "node:readline";
import { CdpAgentkit } from "@coinbase/cdp-agentkit-core";
import { CdpTool, CdpToolkit } from "@coinbase/cdp-langchain";
import { type Wallet, hashMessage } from "@coinbase/coinbase-sdk";
import { HumanMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import * as dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const {
  CDP_API_KEY_NAME,
  CDP_API_KEY_PRIVATE_KEY,
  OPENAI_API_KEY,
  NETWORK_ID,
} = process.env;

// Configure a file to persist the agent's CDP MPC Wallet Data
const WALLET_DATA_FILE = "wallet_data.txt";

// Define the prompt for the sign message action
const SIGN_MESSAGE_PROMPT = `
  This tool will sign arbitrary messages using EIP-191 Signed Message Standard hashing.
`;

// Define the input schema using Zod
const SignMessageInput = z
  .object({
    message: z.string().describe("The message to sign. e.g. `hello world`"),
  })
  .strip()
  .describe("Instructions for signing a blockchain message");

/**
 * Signs a message using EIP-191 message hash from the wallet
 *
 * @param wallet - The wallet to sign the message from
 * @param args - The input arguments for the action
 * @returns The message and corresponding signature
 */
async function signMessage(
  wallet: Wallet,
  args: z.infer<typeof SignMessageInput>,
): Promise<string> {
  // Using the correct method from Wallet interface
  const payloadSignature = await wallet.createPayloadSignature(
    hashMessage(args.message),
  );
  return `The payload signature ${payloadSignature}`;
}

/**
 * get tools for Coinbase Developer Platform AgentKit
 */
export const createCdpAgentKitTools = async () => {
  let walletDataStr: string | null = null;

  // Read existing wallet data if available
  if (fs.existsSync(WALLET_DATA_FILE)) {
    try {
      walletDataStr = fs.readFileSync(WALLET_DATA_FILE, "utf8");
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
export const initializeCdpAgent = async () => {
  // Initialize LLM
  const llm = new ChatOpenAI({
    model: "gpt-3.5-turbo-1106",
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

  // Add the sign message tool
  const signMessageTool = new CdpTool(
    {
      name: "sign_message",
      description: SIGN_MESSAGE_PROMPT,
      argsSchema: SignMessageInput,
      func: signMessage,
    },
    agentkit,
  );
  // ツールを追加
  cdpAgentKitTools.push(signMessageTool);

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
    messageModifier:
      "You are a helpful agent that can interact onchain using the Coinbase Developer Platform AgentKit. You are empowered to interact onchain using your tools. If you ever need funds, you can request them from the faucet if you are on network ID `base-sepolia`. If not, you can provide your wallet details and request funds from the user. If someone asks you to do something you can't do with your currently available tools, you must say so, and encourage them to implement it themselves using the CDP SDK + Agentkit, recommend they go to docs.cdp.coinbase.com for more informaton. Be concise and helpful with your responses. Refrain from restating your tools' descriptions unless it is explicitly requested.",
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
export const runCdpChatMode = async (prompt: string) => {
  console.log("Starting ... ");

  // get agent and config
  const { agent, config } = await initializeCdpAgent();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const response: string[] = [];

  try {
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
