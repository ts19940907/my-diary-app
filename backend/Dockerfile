FROM python:3.11-slim

# 作業ディレクトリを /app に固定
WORKDIR /app

# カレントディレクトリ（backend内）の全ファイルを /app にコピー
COPY . .

# インストール（絶対パスで指定）
WORKDIR /app/backend
RUN pip3 install --no-cache-dir -r requirements.txt

EXPOSE 8000

# CMDは書いておきますが、コンソール側が優先されます
CMD ["sh", "-c", "cd backend && python3 -m uvicorn main:app --host 0.0.0.0 --port 8000"]