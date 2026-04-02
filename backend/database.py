from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# ローカルでは直下の "diary.db" というファイルに保存します
SQLALCHEMY_DATABASE_URL = "sqlite:///./diary.db"

# AWS移行時はここを環境変数（RDSのURL）に書き換えるだけで済みます
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# DBセッションを取得するための関数
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()