import {
  Address,
  Avatar,
  Badge,
  EthBalance,
  Identity,
  Name,
} from "@coinbase/onchainkit/identity";
import {
  ConnectWallet,
  Wallet,
  WalletDefault,
  WalletDropdown,
  WalletDropdownBasename,
  WalletDropdownLink,
} from "@coinbase/onchainkit/wallet";

export default function Home() {
  return <WalletDefault />;
}
