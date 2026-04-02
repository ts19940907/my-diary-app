from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models, schemas, database
from fastapi.middleware.cors import CORSMiddleware # 追加：Reactとの接続に必要

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

# ★重要：React（ポート5173）からのアクセスを許可する設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 一覧取得 API
@app.get("/diaries", response_model=List[schemas.Diary])
def get_diaries(db: Session = Depends(database.get_db)):
    return db.query(models.Diary).all()

# 保存（作成・更新） API
@app.post("/diaries", response_model=schemas.Diary)
def create_or_update_diary(diary: schemas.DiaryCreate, db: Session = Depends(database.get_db)):
    # 同じ日付のデータがあるか確認
    db_diary = db.query(models.Diary).filter(models.Diary.date == diary.date).first()
    
    if db_diary:
        # 既にあれば更新
        db_diary.work = diary.work
        db_diary.issue = diary.issue
        db_diary.solution = diary.solution
        db_diary.summary = diary.summary
    else:
        # なければ新規作成
        db_diary = models.Diary(**diary.model_dump())
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