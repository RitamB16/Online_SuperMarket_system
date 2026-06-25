from sqlalchemy import Column, Integer, String, Float, Enum, ForeignKey, DateTime
from sqlalchemy.sql import func
from database.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    email = Column(String(100), unique=True, index=True)
    password_hash = Column(String(255))
    role = Column(Enum('customer', 'clerk', 'manager'), default='customer')
    seller_category = Column(String(50), nullable=True)
    # NEW: Keep track of if the manager has approved them!
    status = Column(Enum('pending', 'approved', 'rejected'), default='approved')
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), index=True)
    category = Column(String(50))
    price = Column(Float)
    stock_quantity = Column(Integer, default=0)
    image_url = Column(String(255))
    # NEW: Every product is now tied to the specific clerk/seller who added it
    seller_id = Column(Integer, ForeignKey("users.id")) 
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())