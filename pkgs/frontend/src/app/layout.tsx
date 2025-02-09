import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "../components/Providers";
import "@coinbase/onchainkit/styles.css";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AgentDeFiSphere",
  description: "Interactive AI Agent Discussion Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
