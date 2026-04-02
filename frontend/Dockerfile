# 1. ビルド環境
FROM node:20 as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 2. 実行環境 (Nginxを使用して配信)
FROM nginx:alpine
# ビルドした成果物をNginxの公開ディレクトリにコピー
COPY --from=build /app/dist /usr/share/nginx/html
# Nginxのデフォルト設定を上書き（SPA対応用など、必要に応じて）
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]