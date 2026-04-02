from pydantic import BaseModel
from typing import Optional

class DiaryBase(BaseModel):
    date: str
    work: str
    issue: str
    solution: str
    summary: str

class DiaryCreate(DiaryBase):
    pass

class Diary(DiaryBase):
    id: int

    class Config:
        from_attributes = True