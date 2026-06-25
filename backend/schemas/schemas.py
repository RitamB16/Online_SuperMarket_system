from pydantic import BaseModel
from typing import Optional

# Base Product Schema
class ProductBase(BaseModel):
    name: str
    category: str
    price: float
    stock_quantity: int
    image_url: Optional[str] = None 

# Schema for creating a new product (inherits from Base)
class ProductCreate(ProductBase):
    pass

# Schema for sending a product back to React (includes ID)
class ProductResponse(ProductBase):
    id: int

    class Config:
        from_attributes = True
#  Schemas for the POS Checkout ---
class CartItem(BaseModel):
    product_id: int
    quantity: int

class CheckoutRequest(BaseModel):
    items: list[CartItem]

# User Authentication Schemas ---
class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: str = "customer" # Default to customer if they don't say otherwise
    manager_token: Optional[str] = None # The secret password
    seller_category: Optional[str] = None # The department they sell

class UserLogin(BaseModel):
    email: str
    password: str
# --- Admin Status Update ---
class StatusUpdate(BaseModel):
    status: str  # We will send "approved" or "rejected" from React
class StockRestock(BaseModel):
    added_quantity: int