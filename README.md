# GoogleAIAgentHackathon2024
GoogleAIAgentHackathon用リポジトリです。

## プロジェクト構成

```bash
.
├── README.md
├── biome.json
├── docs
│   └── overview.drawio
├── node_modules
│   └── @biomejs
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

- ### **環境変数系**

## 動かし方

- インストール

    ```bash
    pnpm install
    ```

- formatter & liter 適用

    ```bash
    pnpm run biome:check
    ```
