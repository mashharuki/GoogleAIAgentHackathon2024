# CDK for Terraform 用のコード

## 事前準備

- Terraform CLI のインストール

- CDK for Terraform CLI のインストール

- コンテナイメージ用のリポジトリが作成済でイメージも Google Cloud にプッシュ済みとします。

## プロバイダーのインストール

Google Cloud の場合

```bash
cdktf provider add hashicorp/google
```

## 動かし方

- インストール

  ```bash
  bun install
  ```

- diff

  ```bash
  bun run diff
  ```

- デプロイ

  ```bash
  bun run deploy 'hono-vertexai-sample-api'
  ```

  以下のように出力されれば OK!

  ```bash
  cdktf
  region = us-central1
  service_name = hono-vertexai-sample
  service_url = https://<固有値>.a.run.app
  ```

- 削除

  ```bash
  bun run destroy 'hono-vertexai-sample-api'
  ```

## API の叩き方

`api`の`sample.http`を参照のこと！！

### 参考文献

1. [GitHub CloudRun サンプル実装例](https://github.com/hashicorp/terraform-cdk/blob/main/examples/typescript/google-cloudrun/main.ts)
