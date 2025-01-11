# HonoとDcokerで構築したAI Agent用のAPI

## 動かし方(ローカル編)

- インストール

  ```bash
  pnpm install
  ```

- ローカルで起動

  ```bash
  pnpm run dev
  ```

  以下で API を呼び出す。

  `sample.http`ファイルも参照してください。

  ```bash
  curl -XGET "http://localhost:3000"
  ```

  ```bash
  curl -XGET "http://localhost:3000/health"
  ```

  ```bash
  curl -XPOST "http://localhost:3000/streamGenerateContent"
  ```

  ```bash
  curl -XPOST "http://localhost:3000/countTokens"
  ```

  ```bash
  curl -XPOST "http://localhost:3000/streamChat"
  ```

- Docker コンテナをビルド

  `hono-vertexai-image`という名前で`latest`をタグ付け

  ```bash
  docker build . -t hono-vertexai-image:latest
  ```

- Docker コンテナを起動

  ```bash
  docker run -p 3000:3000 <imageid>
  ```

  イメージ ID は以下で確認

  ```bash
  docker image ls
  ```

- Docker コンテナを停止

  ```bash
  docker stop <imageid>
  ```

  以下のコマンドでイメージ削除

  ```bash
  docker image rm -f <imageid>
  ```

## 動かし方(Cloud Run 編)

まず、ローカルで Docker のビルド＆起動ができることを確認すること！

- コンテナイメージ用のリポジトリを作成する。

  `hono-vertexai-sample-repo` という名前のリポジトリを作成する。

  ```bash
  gcloud artifacts repositories create hono-vertexai-sample-repo --repository-format docker --location us-central1
  ```

- コンテナイメージをプッシュする。

  ```bash
  gcloud builds submit --tag us-central1-docker.pkg.dev/lyrical-art-273306/hono-vertexai-sample-repo/hono-vertexai-image
  ```

- サービスアカウントを作成する。

  ```bash
  gcloud iam service-accounts create honoSampleAccount
  ```

- vertex AI を使うための権限を付与する。

  ```bash
  gcloud projects add-iam-policy-binding lyrical-art-273306 \
  --member serviceAccount:honoSampleAccount@lyrical-art-273306.iam.gserviceaccount.com \
  --role=roles/aiplatform.user
  ```

- CloudRun に API をデプロイする。

  ```bash
  gcloud run deploy hono-vertexai-sample --service-account honoSampleAccount@lyrical-art-273306.iam.gserviceaccount.com  --image us-central1-docker.pkg.dev/lyrical-art-273306/hono-vertexai-sample/sample
  ```

  上手く行けば API がデプロイされるので、以下のように API を呼び出してみる。

  ```bash
  curl -XGET "<出力されたエンドポイント>"
  ```

  `Hello Hono!`と返ってくれば OK!!

- Cloud Run でデプロイした API を停止する。

  ```bash
  gcloud run services delete hono-vertexai-sample
  ```

### 参考文献

1. [Zenn - Docker で Bun を使ってサーバーを立ててみた](https://zenn.dev/nanasi_1/articles/6375c0fbaa3b8d)
2. [Zenn - Bun と Hono](https://zenn.dev/yusukebe/articles/efa173ab4b9360)
3. [Containerize a Bun application with Docker](https://bun.sh/guides/ecosystem/docker)
