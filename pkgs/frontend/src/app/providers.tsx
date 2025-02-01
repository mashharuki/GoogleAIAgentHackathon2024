"use client";

import { OnchainKitProvider } from "@coinbase/onchainkit";
import type { ReactNode } from "react";
import { baseSepolia } from "wagmi/chains";

export function Providers(props: { children: ReactNode }) {
  return (
    <OnchainKitProvider
      apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
      chain={baseSepolia}
    >
      {props.children}
    </OnchainKitProvider>
  );
}
