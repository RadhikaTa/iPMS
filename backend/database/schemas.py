# backend/database/schemas.py

from pydantic import BaseModel, Field
from datetime import date, time, datetime  # <-- 1. ADD 'datetime' HERE
from typing import Optional


class Part(BaseModel):
    # This setup is clever and correct.
    id: str = Field(alias='part_no')
    part_no: str

    # These fields match your SQL query AND your React table
    part_name: str
    status: str
    
    # Fields that might be NULL in the database
    #inactive_date: Optional[date] = None
    #case_pack_fctr: Optional[int] = None
    
    # 2. CHANGE THIS LINE from Optional[str] to Optional[datetime]
    #last_updt_tm: Optional[datetime] = None 

    class Config:
        populate_by_name = True
    
class Chart(BaseModel):
    # This setup is clever and correct.
    # id: str = Field(alias='part_no')

    # These fields match your SQL query AND your React table
    part_count: int
    status: str

    class Config:
        populate_by_name = True

class Chart1(BaseModel):
    # This setup is clever and correct.
    # id: str = Field(alias='part_no')

    # These fields match your SQL query AND your React table
    items_count: int
    category: str

    class Config:
        populate_by_name = True


class listModel(BaseModel):
    # This setup is clever and correct.
    # id: str = Field(alias='part_no')

    # These fields match your SQL query AND your React table
    dealer_code: str
    part_no: str
    part_name: str
    status: str

    class Config:
        populate_by_name = True