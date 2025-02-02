import * as dotenv from "dotenv";
import { privateKeyToAccount } from "viem/accounts";

dotenv.config();

const { PRIVATE_KEY } = process.env;

// 秘密鍵からアカウントを作成
export const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);
