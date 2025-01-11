# ベースイメージ
FROM node:18-alpine

# プロジェクトルートを変更する（任意）
WORKDIR /usr/src/app

# pnpmをグローバルインストール
RUN npm install -g pnpm

# フォルダの中身を全てコピーする
COPY ./ ./

# 依存関係をインストール
RUN pnpm install --prod

# アプリを実行するユーザーを指定（セキュリティのため root を避ける）
USER node
EXPOSE 3000/tcp

# サーバーを起動する
CMD ["pnpm", "run", "dev"]
