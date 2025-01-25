import type { CdpAgentkit } from "@coinbase/cdp-agentkit-core";
import { CdpTool } from "@coinbase/cdp-langchain";
import { type Wallet, hashMessage } from "@coinbase/coinbase-sdk";
import { z } from "zod";

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
 * SignMessage用のツールを作成するメソッド
 */
export const createSignMessageTool = (agentkit: CdpAgentkit) => {
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

  return signMessageTool;
};
