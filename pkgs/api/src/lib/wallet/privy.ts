import {
  PrivyClient,
  type WalletApiWalletResponseType,
} from "@privy-io/server-auth";
import { createViemAccount } from "@privy-io/server-auth/viem";
import * as dotenv from "dotenv";
import type { PublicClient } from "viem";

dotenv.config();

const { PRIVY_APP_ID, PRIVY_APP_SECRET_KEY } = process.env;

// Instantiate PrivyClient
const privy = new PrivyClient(
  PRIVY_APP_ID as string,
  PRIVY_APP_SECRET_KEY as string,
);

// Wallet ID
const walletId = "vshl96x85uvrq1f9z1g5r0wn";

// Variables for wallet data
let walletData: WalletApiWalletResponseType;

/**
 * Method for retrieving data from the wallet Id
 */
export const createPrivyWallet = async () => {
  walletData = await privy.walletApi.getWallet({
    id: walletId,
  });

  console.log("walletData:", walletData);

  return walletData;
};

/**
 * Method for creating a wallet account for viem
 */
export const createPrivyViemAccount = async () => {
  const account = await createViemAccount({
    walletId: walletId,
    address: walletData.address as `0x${string}`,
    privy,
  });

  return account;
};

/**
 * Method to send a transaction.
 * @param client
 * @param walletData
 * @param chainId
 * @param to
 * @param value
 * @param data
 */
export const sendTransactionFromPrivyWallet = async (
  client: PublicClient,
  walletData: WalletApiWalletResponseType,
  to: `0x${string}`,
  value: bigint,
  data: `0x${string}`,
) => {
  console.log("walletData.id:", walletData.id);
  // Send a small amount of ETH.
  const txData = await privy.walletApi.ethereum.sendTransaction({
    walletId: walletData.id,
    caip2: `eip155:${client.chain?.id}`,
    transaction: {
      to: to,
      value: value,
      chainId: client.chain?.id,
      data: data,
    },
  });

  console.log("transaction hash:", txData.hash);

  const result = await client.getTransactionReceipt({
    hash: txData.hash as `0x${string}`,
  });

  console.log("transaction result:", result);

  return result;
};
