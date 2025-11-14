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
    part_returnable_fl: str
    vndr_no: str
    ovrsize_hvywt_flag: str
    hazmat_item_flag: str
    last_userid_cd: str
    
    # Fields that might be NULL in the database
    inactive_date: Optional[date] = None
    case_pack_fctr: Optional[int] = None
    
    # 2. CHANGE THIS LINE from Optional[str] to Optional[datetime]
    last_updt_tm: Optional[datetime] = None 

    class Config:
        populate_by_name = True