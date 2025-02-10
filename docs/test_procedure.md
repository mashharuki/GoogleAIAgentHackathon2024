# 放課後DeFAIクラブ テスト手順

## 前提条件
- テスト環境: Base Sepolia testnet
- ブラウザ: Chrome/Firefox/Safari (最新版)
- Reward AI機能は"Base Sepolia ETH"トークンの用意が必要となるため、本手順では割愛

## 1. ウォレット接続テスト

### 1.1 初回ログイン
1. [アプリケーションのURL](https://google-ai-agent-hackathon2024.vercel.app/)にアクセス
2. 「Log In」ボタンをクリック
3. Smart Walletの接続画面で「Connect to onchainkit and more apps」と表示されていることを確認
4. 「Sign Up」をクリック
5. パスキーでサインイン
6. ウォレットが正常に作成され、アプリケーションに接続されることを確認
   - ウォレットアドレスが画面右端に表示される（しばらく待つ必要あり）
   - 「Reward AI」ボタンが表示される
   - 画面下部にChat入力フォームが表示される

### 1.2 ログイン（2回目以降）
1. [アプリケーションのURL](https://google-ai-agent-hackathon2024.vercel.app/)にアクセス
2. 「Log In」ボタンをクリック
3. Smart Walletの接続画面で「Connect to onchainkit」と表示されていることを確認
4. 「Approve」ボタンをクリック
5. アプリケーションに接続されることを確認
   - ウォレットアドレスが画面右端に表示される（しばらく待つ必要あり）
   - 「Reward AI」ボタンが表示される
   - 画面下部にChat入力フォームが表示される

## 2. チャット機能テスト

### 2.1 メッセージ送信
1. チャット入力欄に以下のテストメッセージを入力：
```
Please tell me the latest news about Web3 or cryptocurrency or blockchain. I have to plan to swap some token on sepolia.
```
2. 「Send Message」をクリック
3. メッセージが正常に送信されたことを確認
   - 送信メッセージがチャット画面に表示される

## 3. AI応答確認

### 3.1 応答待機と確認
1. AI Agentの応答待機中インジケータ（ローディング表示）を確認
2. 応答が表示されるまで待機
3. 応答内容を確認
  - テキストが正しく表示される
  - トランザクション情報が含まれていることを確認

## 4. トランザクション確認

### 4.1 Base Sepoliaエクスプローラーでの確認
1. AI応答に含まれるトランザクションハッシュをコピー（最後から2つ目の応答）
2. [Base Sepolia Network Testnet Explorer](https://sepolia.basescan.org/)にアクセス
3. 検索欄にトランザクションハッシュを貼り付けて検索
4. トランザクション詳細を確認
  - ステータスが「Success」であることを確認
  - トランザクション実行時刻が正しいことを確認

