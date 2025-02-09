# GoogleAIAgentHackathon2024

GoogleAIAgentHackathon用リポジトリです。

![](./docs/background.png)

---

## Live Demo

- Vercel

    [https://google-ai-agent-hackathon2024.vercel.app/](https://google-ai-agent-hackathon2024.vercel.app/)

## プロジェクト構成

```bash
.
├── README.md
├── biome.json
├── docs
│   └── overview.drawio
├── package.json
├── pkgs
│   ├── api              APIサーバー用のディレクトリ
│   ├── cdktf            CDK for Terraform用のディレクトリ
│   ├── contract         スマートコントラクト用のディレクトリ
│   └── frontend         フロントエンド用のディレクトリ
├── pnpm-lock.yaml
└── pnpm-workspace.yaml
```

## アーキテクチャ図

![](./docs/architecture.png)

## シーケンス図

```mermaid
sequenceDiagram
    title: Sequence Diagram for Hackathon Application
    autonumber
    actor user as User
    participant frontend as Frontend
    participant userWallet as Privy or OnChainKit
    participant api as API Server
    participant agent1 as Social Trend Collection Specialist<br/>Agent
    participant agent2 as News and Fundamental Information Specialist<br/>Agent
    participant agent3 as Risk Management Agent<br/>Agent
    participant agent4 as Performance Monitoring Agent<br/>Agent<br/>(Signer Role)
    participant agent5 as Analysis and Strategy Agent<br/>Agent
    participant agent6 as Execution and Operation Agent<br/>Agent
    participant tools as Various Tools
    participant llm as Various LLMs
    participant blockchain as Blockchain
    user ->> frontend: Access
    frontend ->> userWallet: Create Wallet
    userWallet ->> frontend: Return Wallet Information
    frontend ->> user: Display Wallet Information
    frontend ->> api: Request to Start Live Discussion
    api ->> agent1: Create Social Trend Collection Specialist Agent
    api ->> agent2: Create News and Fundamental Information Specialist Agent
    api ->> agent3: Create Risk Management Agent
    api ->> agent4: Create Performance Monitoring Agent
    api ->> agent5: Create Analysis and Strategy Agent
    api ->> agent6: Create Execution and Operation Agent
    note over api, agent6: Start Live Discussion
    note over agent1, llm: Subsequent inferences will access external tools and LLMs
    user ->> frontend: Request to Write Chat Message
    frontend ->> api: Pass Chat Message as Prompt
    note over agent1, agent6: Discussion on User Input
    user ->> frontend: Request to Send Tips
    frontend ->> userWallet: Call Tip Processing
    userWallet ->> user: Request Signature
    user ->> userWallet: Execute Signature
    userWallet ->> blockchain: Send Transaction
    blockchain ->> userWallet: Return Execution Result
    userWallet ->> frontend: Return Execution Result
    frontend ->> user: Return Execution Result
    agent6 ->> blockchain: Check Balance
    blockchain ->> agent6: Return Balance
    note over agent1, agent6: Discussion Based on Balance Information
    agent6 ->> blockchain: Call DeFi Swap Function, etc.
    blockchain ->> agent6: Return Execution Result
    note over agent1, agent6: Discussion Based on Execution Result
    note over api, agent6: End Live Discussion
```

## セットアップ

- ### **CLI系**

    - pnpmをインストールすること
    - gcloud CLIをインストールすること
    - Terraform CLIをインストールすること
    - CDKTF CLIをインストールすること
    - docker CLIをインストールすること

- ### **環境変数系**

    動かすためにはそれぞれ以下の通り環境変数をセットアップする必要があります。

    - API

        ```txt
        PROJECT_ID=""
        REGION=""
        OPENAI_API_KEY=""
        TAVILY_API_KEY=""
        CDP_API_KEY_NAME=
        CDP_API_KEY_PRIVATE_KEY=
        NETWORK_ID="base-sepolia"
        ALCHEMY_API_KEY=""
        Groq_API_Key=""
        COINGECKO_API_KEY=""
        PRIVY_APP_ID=""
        PRIVY_APP_SECRET_KEY=""
        ANTHROPIC_KEY_API=
        ```

    - CDK for Terraform

        ```txt
        PROJECT_ID=""
        REGION=""
        OPENAI_API_KEY=""
        TAVILY_API_KEY=""
        CDP_API_KEY_NAME=
        CDP_API_KEY_PRIVATE_KEY=
        NETWORK_ID="base-sepolia"
        ALCHEMY_API_KEY=""
        Groq_API_Key=""
        COINGECKO_API_KEY=""
        PRIVY_APP_ID=""
        PRIVY_APP_SECRET_KEY=""
        ANTHROPIC_KEY_API=
        ```

    - スマートコントラクト

        ```txt
        PRIVATE_KEY=""
        ARBITRUM_ETHERSCAN_KEY=""
        BASESCAN_API_KEY=""
        ```

    - フロントエンド

        ```txt
        NEXT_PUBLIC_ONCHAINKIT_API_KEY=
        ```

## 動かし方

- ### 共通

    - インストール

        ```bash
        pnpm install
        ```

    - formatter & liter 適用

        ```bash
        pnpm run biome:check
        ```

    - スマートコントラクト側にformatter & liter 適用

        ```bash
        pnpm contract format
        ```

- ### API

    - ローカルでの起動方法

        ```bash
        pnpm api dev
        ```

    - dockerイメージのビルド

        ```bash
        pnpm api run container:build
        ```

        以下でDocker イメージを確認

        ```bash
        docker image ls
        ```

    - dockerイメージを使ってコンテナを起動させる

        ```bash
        pnpm api run container:run hono-vertexai-image:latest
        ```

    - docker イメージを格納するためのリポジトリをGoogle Cloud側に作成する。

        ※ あらかじめ gcloudの認証は済ませておくこと！

        ```bash
        gcloud artifacts repositories create <コンテナリポジトリ名> --repository-format docker --location <リージョン名>
        ```

    - docker イメージのプッシュ

        `api` フォルダ配下で動かしてください。

        ※ あらかじめ gcloudの認証は済ませておくこと！

        ```bash
        gcloud builds submit --tag <リージョン名>-docker.pkg.dev/<プロジェクトID>/<コンテナリポジトリ名>/<コンテナイメージ名>
        ```

- ### CDK for Terraform

    ※ あらかじめ gcloudの認証は済ませておくこと！

    - デプロイ

        ```bash
        pnpm cdktf run deploy 'hono-vertexai-sample-api'
        ```

    - 削除

        ```bash
        pnpm cdktf run destroy 'hono-vertexai-sample-api'
        ```

- ### スマートコントラクト

    - コンパイル

        ```bash
        pnpm contract compile
        ```

    - テスト

        ```bash
        pnpm contract test
        ```

    - デプロイ

        ```bash
        pnpm contract deploy:Lock --network <ネットワーク名>
        ```

        デプロイできる ネットワーク名は `hardhat.config.ts`を参照してください。

    - verify

        ```bash
        pnpm contract verify chain-<チェーンID>
        ```

    - get getChainInfo

        ```bash
        pnpm contract getChainInfo --network <ネットワーク名>
        ```

    - get Balance

        ```bash
        pnpm contract getBalance --network <ネットワーク名>
        ```

- ### フロントエンド

    - ビルド

        ```bash
        pnpm frontend build
        ```


    - ローカルで起動

        ```bash
        pnpm frontend dev
        ```
