import models, schemas, database
import requests
from fastapi import FastAPI, Depends, HTTPException, status, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from jose import jwt
from sqlalchemy.orm import Session
from typing import List

models.Base.metadata.create_all(bind=database.engine)

# 設定値
REGION = "ap-northeast-1"
USER_POOL_ID = "ap-northeast-1_aF0Y5jHjm"
APP_CLIENT_ID = "21mepukacpmgr0o94t9lpbf97t"
# Cognitoの公開鍵URL
JWKS_URL = f"https://cognito-idp.{REGION}.amazonaws.com/{USER_POOL_ID}/.well-known/jwks.json"

security = HTTPBearer()

def verify_token(auth: HTTPAuthorizationCredentials = Security(security)):
    token = auth.credentials
    try:
        # 1. 本来はここで公開鍵(JWKS)をキャッシュして検証します
        # 2. 署名・有効期限・発行元・クライアントIDをチェック
        payload = jwt.decode(
            token, 
            requests.get(JWKS_URL).json(), # 本番では起動時に1回取得でOK
            algorithms=["RS256"],
            audience=APP_CLIENT_ID,
            issuer=f"https://cognito-idp.{REGION}.amazonaws.com/{USER_POOL_ID}"
        )
        return payload  # 成功すればユーザー情報（emailなど）が返る
    except Exception as e:
        print(f"DEBUG - トークン検証エラーの詳細: {type(e).__name__} - {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="無効なトークンです"
        )

app = FastAPI()

# ★重要：React（ポート5173）からのアクセスを許可する設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://feature-deploy-aws.d2lez1n8yk1q7y.amplifyapp.com",
        "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 一覧取得 API
@app.get("/diaries", response_model=List[schemas.Diary])
def get_diaries(db: Session = Depends(database.get_db),
    current_user: dict = Depends(verify_token) # ★認証の門番を追加
):
    # current_user にはトークンを解読したデータ（emailやsub）が入っています
    user_email = current_user.get("email")
    
    # ★重要：全件取得ではなく、ログインユーザーのメールアドレスで絞り込む
    # ※models.Diary に user_email カラムがある前提です
    return db.query(models.Diary).filter(models.Diary.user_email == user_email).all()

# 保存（作成・更新） API
@app.post("/diaries", response_model=schemas.Diary)
def create_or_update_diary(
    diary: schemas.DiaryCreate,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(verify_token) # ★認証を追加
):
    user_email = current_user["email"]
    # 同じ日付のデータがあるか確認
    db_diary= db.query(models.Diary).filter(
        models.Diary.date == diary.date,
        models.Diary.user_email == user_email
    ).first()
    
    if db_diary:
        # 既にあれば更新
        db_diary.work = diary.work
        db_diary.issue = diary.issue
        db_diary.solution = diary.solution
        db_diary.summary = diary.summary
    else:
        # なければ新規作成
        db_diary = models.Diary(**diary.dict(), user_email=user_email)
        db.add(db_diary)
    
    db.commit()
    db.refresh(db_diary)
    return db_diary

@app.delete("/diaries/{date}")
def delete_diary(date: str, db: Session = Depends(database.get_db)):
    db_diary = db.query(models.Diary).filter(models.Diary.date == date).first()
    if not db_diary:
        raise HTTPException(status_code=404, detail="Diary not found")
    db.delete(db_diary)
    db.commit()
    return {"message": "Deleted successfully"}