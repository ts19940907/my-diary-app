# 1. ベース画像として公式のPythonイメージを使用
FROM python:3.11-slim

# 2. 作業ディレクトリを設定
WORKDIR /app

# 3. 依存関係ファイルをコピーしてインストール
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 4. ソースコードをコピー
COPY . .

# 5. FastAPIを起動 (ポート8000)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]