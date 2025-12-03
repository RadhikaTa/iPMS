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
    """Schema for the initial data fetched for the comparison table."""
    dealer_code: str = Field(alias='cust_number')
    part_number: str = Field(alias='item_no')
    piPrediction: int = Field(alias='qty_on_hand_pe_suggested') # PI's suggested quantity
    current_stock: int = Field(alias='qty_on_hand') # Actual quantity on hand

    class Config:
        populate_by_name = True