# backend/database/schemas.py

from pydantic import BaseModel, Field
from datetime import date, time, datetime # <-- Updated import
from typing import Optional


class Part(BaseModel):
    # This setup is clever and correct.
    id: str = Field(alias='part_no')
    part_no: str

    # These fields match your SQL query AND your React table
    part_name: str
    status: str
    
    # Fields that might be NULL in the database
    # inactive_date: Optional[date] = None
    # case_pack_fctr: Optional[int] = None
    
    # Updated to Optional[datetime] as requested
    last_updt_tm: Optional[datetime] = None 

    class Config:
        populate_by_name = True
        
class Chart(BaseModel):
    # This setup is clever and correct.
    part_count: int
    status: str

    class Config:
        populate_by_name = True

# --- NEW SCHEMA FOR COMPARISON TABLE DATA FETCH ---
class StockDetail(BaseModel):
    dealer_code: str = Field(alias='cust_number')
    part_number: str = Field(alias='item_no')
    pe_suggested_stock_qty: Optional[int] = Field(alias='pe_suggested_stock_qty')

    class Config:
        populate_by_name = True


class PredictionResponse(BaseModel):
    predicted_quantity: int


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
