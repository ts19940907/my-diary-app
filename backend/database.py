import os
import boto3
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 1. 環境変数 "DATABASE_URL" があればそれを使用、なければローカルの SQLite を使用
# App Runner の環境変数に設定した値が優先されます
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./diary.db")

# 2. 接続設定の切り替え
if SQLALCHEMY_DATABASE_URL.startswith("postgresql"):
    # RDS (PostgreSQL) 用の設定
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    lambda_client = boto3.client('lambda', region_name='ap-northeast-1')
else:
    # SQLite 用の設定（check_same_thread は SQLite 特有の引数です）
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
    lambda_client = None

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()