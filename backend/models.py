from sqlalchemy import Column, Integer, String, Text, Date
from database import Base

class Diary(Base):
    __tablename__ = "diaries"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(String, unique=True, index=True) # "2026-04-01" 形式
    work = Column(Text)       # 実施した業務
    issue = Column(Text)      # 課題点
    solution = Column(Text)   # 解決策
    summary = Column(String)  # カレンダー表示用の要約