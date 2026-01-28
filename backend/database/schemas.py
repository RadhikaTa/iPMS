from pydantic import BaseModel, Field
from datetime import date, time, datetime 
from typing import Optional


class Part(BaseModel):
    id: str = Field(alias='part_no')
    dealer_code:str
    part_no: str
    part_name: str
    available_qty:int
    part_returnable_fl:Optional[str] = None
    monthly_suggested:Optional[int] = None 
    dnp:int
    last_sales_date:Optional[date] = None 
    last_purchase_date:Optional[date] = None 
    age:Optional[int] = None 
    sale_in_12_months:Optional[int] = None 
    heirarchy:str 
    status: Optional[str] = None 
    last_updt_tm: Optional[datetime] = None 

    class Config:
        populate_by_name = True
        
class Chart(BaseModel):
    part_count: int
    status: str

    class Config:
        populate_by_name = True


class StockDetail(BaseModel):
    dealer_code: str = Field(alias='cust_number')
    part_number: str = Field(alias='item_no')
    pe_suggested_stock_qty: Optional[int] = Field(alias='pe_suggested_stock_qty')

    class Config:
        populate_by_name = True


class PredictionResponse(BaseModel):
    predicted_quantity: int


class Chart1(BaseModel):
    items_count: int
    category: str
 
    class Config:
        populate_by_name = True
 
 
class listModel(BaseModel):
    dealer_code: str
    part_no: str
    part_name: str
    status: str
 
    class Config:
        populate_by_name = True
