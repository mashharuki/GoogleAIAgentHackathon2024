import type { CdpAgentkit } from "@coinbase/cdp-agentkit-core";
import { CdpTool } from "@coinbase/cdp-langchain";
import type { Wallet } from "@coinbase/coinbase-sdk";
import { http, createPublicClient, parseUnits } from "viem";
import { baseSepolia } from "viem/chains";
import { z } from "zod";
import { AAVE_LENDING_POOL_ABI_TESTNET } from "../abis/aave_lending_pool_abi_testnet";
import { ERC20_ABI } from "../abis/erc20_abi";

// AAVE Lending Pool contract address (Base Sepolia)
const AAVE_LENDING_POOL_ADDRESS = "0x07eA79F68B2B3df564D0A34F8e19D9B1e339814b";

// public Clientを作成
const client = createPublicClient({
  chain: baseSepolia,
  transport: http("https://sepolia.base.org"),
});

/**
 * Borrow crypto tool
 * @param wallet
 * @param args
 * @returns
 */
async function borrowCrypto(
  wallet: Wallet,
  args: z.infer<typeof BorrowCryptoInput>,
): Promise<string> {
  const { amount, assetAddress } = args;
  const interestRateMode = 2;

  try {
    const decimals = (await client.readContract({
      abi: ERC20_ABI,
      address: assetAddress,
      functionName: "decimals",
    })) as number;

    const amountInWei = parseUnits(amount.toString(), decimals);

    console.log(`decimals: ${decimals}`);
    console.log(`Amount in Wei: ${amountInWei.toString()}`);

    // walletAddress
    const walletData = await wallet.getDefaultAddress();
    const walletJsonData = JSON.parse(JSON.stringify(walletData));
    console.log("wallet address:", walletJsonData.id);

    // borrow method call
    const borrowHash = await wallet.invokeContract({
      contractAddress: AAVE_LENDING_POOL_ADDRESS,
      abi: AAVE_LENDING_POOL_ABI_TESTNET,
      method: "borrow",
      args: {
        asset: assetAddress,
        amount: amountInWei.toString(),
        interestRateMode: interestRateMode.toString(),
        referralCode: (0).toString(),
        onBehalfOf: walletJsonData.id as `0x${string}`,
      },
    });

    const result = await borrowHash.wait();
    return `Borrow transaction : ${result.getTransactionLink()}`;
  } catch (error) {
    console.error("Error executing lend_crypto:", error);
    return "Error executing lend_crypto";
  }
}

const BorrowCryptoInput = z
  .object({
    amount: z
      .number()
      .positive()
      .describe("The amount of cryptocurrency to borrow."),
    assetAddress: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address")
      .transform((val) => val as `0x${string}`)
      .describe("The address of the cryptocurrency asset."),
  })
  .describe("Borrow crypto from AAVE Lending Pool");

/**
 * Lend crypto tool
 * @param wallet
 * @param args
 * @returns
 */
async function lendCrypto(
  wallet: Wallet,
  args: z.infer<typeof LendCryptoInput>,
): Promise<string> {
  const { amount, assetAddress } = args;

  try {
    const decimals = (await client.readContract({
      abi: ERC20_ABI,
      address: assetAddress,
      functionName: "decimals",
    })) as number;

    const amountInWei = parseUnits(amount.toString(), decimals).toString();

    console.log(`decimals: ${decimals}`);
    console.log(`Amount in Wei: ${amountInWei}`);

    // approve method call
    const approveHash = await wallet.invokeContract({
      abi: ERC20_ABI,
      contractAddress: assetAddress,
      method: "approve",
      args: {
        _spender: AAVE_LENDING_POOL_ADDRESS,
        _value: amountInWei,
      },
    });

    const result = await approveHash.wait();

    console.log(`Approve transaction: ${result.getTransactionLink()}`);

    // walletAddress
    const walletData = await wallet.getDefaultAddress();
    const walletJsonData = JSON.parse(JSON.stringify(walletData));
    console.log("wallet address:", walletJsonData.id);

    // supply method call
    const supplyHash = await wallet.invokeContract({
      contractAddress: AAVE_LENDING_POOL_ADDRESS,
      abi: AAVE_LENDING_POOL_ABI_TESTNET,
      method: "supply",
      args: {
        asset: assetAddress,
        amount: amountInWei,
        onBehalfOf: walletJsonData.id as `0x${string}`,
        referralCode: (0).toString(),
      },
    });

    const result2 = await supplyHash.wait();

    console.log(`Supply transaction: ${result2.getTransactionLink()}`);

    return `Supply transaction hash: ${result2.getTransactionLink()}`;
  } catch (error) {
    console.error("Error executing lend_crypto:", error);
    return "Error executing lend_crypto";
  }
}

const LendCryptoInput = z
  .object({
    amount: z
      .number()
      .positive()
      .describe("The amount of cryptocurrency to lend."),
    assetAddress: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address")
      .transform((val) => val as `0x${string}`)
      .describe("The address of the cryptocurrency asset."),
  })
  .describe("Lend crypto to AAVE Lending Pool");

/**
 * Get user account data tool
 * @param wallet
 * @param args
 * @returns
 */
async function getUserAccountData(
  wallet: Wallet,
  args: z.infer<typeof GetUserAccountDataInput>,
): Promise<object> {
  const { userAddress } = args;
  const accountData = (await client.readContract({
    abi: AAVE_LENDING_POOL_ABI_TESTNET,
    address: AAVE_LENDING_POOL_ADDRESS,
    functionName: "getUserAccountData",
    args: [userAddress],
  })) as [bigint, bigint, bigint, bigint, bigint, bigint];

  return {
    totalCollateralBase: Number(accountData[0]),
    totalDebtBase: Number(accountData[1]),
    availableBorrowsBase: Number(accountData[2]),
    currentLiquidationThreshold: Number(accountData[3]),
    ltv: Number(accountData[4]),
    healthFactor: Number(accountData[5]) / 1e18,
  };
}

const GetUserAccountDataInput = z
  .object({
    userAddress: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address")
      .transform((val) => val as `0x${string}`)
      .describe("The user's wallet address."),
  })
  .describe("Retrieve the user's account data from AAVE");

/**
 *  Get token balance tool
 * @param wallet
 * @param args
 * @returns
 */
async function getTokenBalance(
  wallet: Wallet,
  args: z.infer<typeof GetTokenBalanceInput>,
): Promise<number> {
  const { tokenAddress, userAddress } = args;
  const finalUserAddress = userAddress || (await wallet.getDefaultAddress());

  const balance = await client.readContract({
    abi: ERC20_ABI,
    address: tokenAddress,
    functionName: "balanceOf",
    args: [finalUserAddress],
  });

  const decimals = await client.readContract({
    abi: ERC20_ABI,
    address: tokenAddress,
    functionName: "decimals",
  });

  return Number(balance) / 10 ** (decimals as number);
}

const GetTokenBalanceInput = z
  .object({
    tokenAddress: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address")
      .transform((val) => val as `0x${string}`)
      .describe("The token contract address."),
    userAddress: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address")
      .optional()
      .transform((val) => val as `0x${string}`)
      .describe("The user's wallet address (optional)."),
  })
  .describe("Get the token balance for the given token address.");

// ==========================================================================================
// 各種ツールの作成
//　==========================================================================================

export const createBorrowCryptoToolForCdp = (agentkit: CdpAgentkit) => {
  return new CdpTool(
    {
      name: "borrow_crypto",
      description: "Borrow cryptocurrency from AAVE.",
      argsSchema: BorrowCryptoInput,
      func: borrowCrypto,
    },
    agentkit,
  );
};

export const createLendCryptoToolForCdp = (agentkit: CdpAgentkit) => {
  return new CdpTool(
    {
      name: "lend_crypto",
      description: "Lend cryptocurrency to AAVE.",
      argsSchema: LendCryptoInput,
      func: lendCrypto,
    },
    agentkit,
  );
};

export const createGetUserAccountDataToolForCdp = (agentkit: CdpAgentkit) => {
  return new CdpTool(
    {
      name: "get_user_account_data",
      description: "Retrieve user account data from AAVE.",
      argsSchema: GetUserAccountDataInput,
      func: getUserAccountData,
    },
    agentkit,
  );
};

export const createGetTokenBalanceToolForCdp = (agentkit: CdpAgentkit) => {
  return new CdpTool(
    {
      name: "get_token_balance",
      description: "Get token balance for a given user.",
      argsSchema: GetTokenBalanceInput,
      func: getTokenBalance,
    },
    agentkit,
  );
};
