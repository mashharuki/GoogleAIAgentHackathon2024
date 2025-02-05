# API (built with Hono)

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

## ライブディスカッションAPIの実行結果例

```bash
{
  "groqResult": "Based on the current market trends, it seems that Ethereum has seen a significant increase in its 24-hour trading volume, which could be a good opportunity to consider. Since you have assets in Sepolia and Holesky, I would recommend exploring potential opportunities to leverage these assets to maximize your returns.\n\nConsidering the current market situation, I would suggest the following:\n\n1. **Stake your Sepolia assets**: With the current trend, staking your Sepolia assets could generate a decent yield. This would allow you to earn passive income while maintaining control over your assets.\n2. **Leverage Holesky's liquidity**: Holesky's liquidity could be utilized to swap or lend your assets to take advantage of the current market trends. This could help you capitalize on the increasing trading volume and potentially increase your returns.\n\nBefore making any decisions, I would recommend analyzing the current market trends and liquidity in more detail. This would help you make a more informed decision and optimize your investment strategy.\n\nWould you like me to explore other tools to gather more insights on the current market trends and liquidity?",
  "vertexResult": "  **Here are some specific questions you could ask to clarify the investor's insights:**\n\n  * What does \"24-hour trading volume\" mean, and why is it important for Ethereum?\n  * Can you explain how I can leverage my Sepolia and Holesky assets for maximum returns? Could you give examples?\n  * When you say \"analyze the current market trends and liquidity in more detail,\" what specific information should I be looking for?\n  * What are some reliable sources for gathering insights on the DeFi market?\n\n  **Remember to ask questions in a simple and straightforward manner, demonstrating your beginner status and willingness to learn.**\n",
  "OpenAIResult": "I have executed a trade based on the insights from the previous conversation and your current account details:\n\n1. **Trade Executed:** Staked 30 stETH with Lido for staking rewards.\n2. **Transaction Details:**\n   - **New Collateral Situation:** You have staked 30 stETH with Lido.\n   - **Transaction Hash:** 0x5d6cd49f6f2959d3b7949ab6a34865cfe06a507d301598de6f0b0a34f3c80df0\n   - **Transaction Status:** Success\n\nThis trade aligns with the discussion on leveraging assets for maximum returns and staking as a strategy for earning rewards. If you have any further questions or need assistance, feel free to ask!"
}
```

### 参考文献

1. [Zenn - Docker で Bun を使ってサーバーを立ててみた](https://zenn.dev/nanasi_1/articles/6375c0fbaa3b8d)
2. [Zenn - Bun と Hono](https://zenn.dev/yusukebe/articles/efa173ab4b9360)
3. [Containerize a Bun application with Docker](https://bun.sh/guides/ecosystem/docker)
