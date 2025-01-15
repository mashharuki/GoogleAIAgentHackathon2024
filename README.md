# GoogleAIAgentHackathon2024

GoogleAIAgentHackathon用リポジトリです。

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
        GEMINI_API_KEY=""
        OPENAI_API_KEY=""
        TAVILY_API_KEY=""
        PROJECT_ID=""
        REGION=""
        ```

    - CDK for Terraform

        ```txt
        PROJECT_ID=""
        REGION=""
        GEMINI_API_KEY=""
        OPENAI_API_KEY=""
        TAVILY_API_KEY=""
        ```

    - スマートコントラクト

        ```txt
        PRIVATE_KEY=""
        ARBITRUM_ETHERSCAN_KEY=""
        ```

    - フロントエンド

        ```txt

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

        `api` フォルダ配下で動かしてください。

        ```bash
        docker build . -t hono-vertexai-image:latest
        ```

        以下でDocker イメージを確認

        ```bash
        docker image ls
        ```

    - dockerイメージを使ってコンテナを起動させる

        ```bash
        docker run --env-file .env -p 3000:3000 <イメージID>
        ```

    - docker イメージを格納するためのリポジトリをGoogle Cloud側に作成する。

        ※ あらかじめ gcloudの認証は済ませておくこと！

        ```bash
        gcloud artifacts repositories create <コンテナリポジトリ名> --repository-format docker --location <リージョン名>
        ```

    - docker イメージのプッシュ

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
