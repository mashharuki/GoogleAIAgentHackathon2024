import { task } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types";
import { formatEther } from "viem";

/**
 * 【Task】get the balance of the account
 */
task("getBalance", "getBalance").setAction(
  async (hre: HardhatRuntimeEnvironment) => {
    console.log(
      "################################### [START] ###################################",
    );
    const [owner] = await hre.viem.getWalletClients();

    const publicClient = await hre.viem.getPublicClient();
    const bobBalance = await publicClient.getBalance({
      address: owner.account.address,
    });

    console.log(
      `Balance of ${owner.account.address}: ${formatEther(bobBalance)} ETH`,
    );

    console.log(
      "################################### [END] ###################################",
    );
  },
);
