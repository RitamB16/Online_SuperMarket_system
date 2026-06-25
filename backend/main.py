from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database.database import engine, Base, get_db
from models import models
import bcrypt
from jose import jwt
from datetime import datetime, timedelta
from schemas import schemas
from ai_module.ml_engine import predict_stock_needs
from pydantic import BaseModel

# In-Memory Databases (Resets on server restart)
active_notifications = []
missed_searches = {}

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="SuperMart API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = "super_secret_supermart_key"
ALGORITHM = "HS256"
MASTER_MANAGER_TOKEN = "Ritam@2005"

@app.get("/")
def read_root():
    return {"message": "SuperMart Backend is running smoothly!"}

# --- USER REGISTRATION ---
@app.post("/api/register")
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    if user.role == "manager":
        if user.manager_token != MASTER_MANAGER_TOKEN:
            raise HTTPException(status_code=403, detail="Invalid Manager Token! Access Denied.")
        if db.query(models.User).filter(models.User.role == "manager").first():
            raise HTTPException(status_code=403, detail="Store already has a Manager! Only one allowed.")

    if user.role == "clerk" and not user.seller_category:
        raise HTTPException(status_code=400, detail="Clerks must specify a seller category (e.g., Dairy).")

    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(user.password.encode('utf-8'), salt).decode('utf-8')
    initial_status = "pending" if user.role == "clerk" else "approved"

    new_user = models.User(
        username=user.username, 
        email=user.email, 
        password_hash=hashed_password,
        role=user.role,
        seller_category=user.seller_category if user.role == "clerk" else None,
        status=initial_status
    )
    db.add(new_user)
    db.commit()
    return {"message": f"Account created successfully! Status: {initial_status}"}

# --- USER LOGIN ---
@app.post("/api/login")
def login_user(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    
    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
        
    is_password_correct = bcrypt.checkpw(user.password.encode('utf-8'), db_user.password_hash.encode('utf-8'))
    
    if not is_password_correct:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if db_user.role == "clerk":
        if db_user.status == "pending":
            raise HTTPException(status_code=403, detail="Your seller account is waiting for Manager approval.")
        if db_user.status == "rejected":
            raise HTTPException(status_code=403, detail="Your seller account has been suspended by the Manager.")    
            
    token_data = {"sub": db_user.email, "role": db_user.role}
    token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)
    
    return {
        "access_token": token, 
        "role": db_user.role, 
        "username": db_user.username,
        "seller_category": db_user.seller_category
    }

# --- NOTIFICATIONS (MESSAGING) ---
@app.post("/api/admin/notify")
def notify_seller(request: dict):
    active_notifications.append({
        "id": len(active_notifications) + 1,
        "seller": request.get("seller"),
        "product": request.get("product"),
        "message": request.get("message")
    })
    return {"message": "Alert transmitted to seller's dashboard!"}

@app.get("/api/seller/{username}/notifications")
def get_notifications(username: str, db: Session = Depends(get_db)):
    seller = db.query(models.User).filter(models.User.username == username).first()
    if not seller: return []
        
    # Get alerts addressed to specific username OR their department category!
    my_alerts = [
        n for n in active_notifications 
        if n["seller"] == username or n["seller"] == seller.seller_category
    ]
    return my_alerts

# --- PRODUCTS & DB INIT ---
@app.post("/api/init-db")
def initialize_database(db: Session = Depends(get_db)):
    if db.query(models.Product).count() > 0:
        return {"message": "Database already has products!"}

    realistic_products = [
        models.Product(name="Aashirvaad Whole Wheat Atta (5kg)", category="Pantry", price=240.00, stock_quantity=50, image_url="/images/ashirwadatta.png"),
        models.Product(name="Amul Taaza Milk (1L)", category="Dairy", price=68.00, stock_quantity=120, image_url="/images/ammul.png"),
        models.Product(name="Tata Salt (1kg)", category="Pantry", price=28.00, stock_quantity=200, image_url="/images/tata.jpg"),
        models.Product(name="Fortune Sunflower Oil (1L)", category="Pantry", price=145.00, stock_quantity=45, image_url="/images/Fortune-Sunlite-Refined-Sunflower-Oil-1l.png"),
        models.Product(name="Fresh Kashmiri Apples (1kg)", category="Produce", price=180.00, stock_quantity=30, image_url="/images/apple.png"),
        models.Product(name="Maggi 2-Minute Noodles (4 Pack)", category="Snacks", price=56.00, stock_quantity=85, image_url="/images/maggi.png"),
        models.Product(name="Brooke Bond Red Label Tea (500g)", category="Beverages", price=250.00, stock_quantity=40, image_url="/images/red_lebel.png"),
        models.Product(name="Farm Fresh Eggs (12 pcs)", category="Dairy", price=85.00, stock_quantity=0, image_url="/images/Eggs-Final-1.png"),
        models.Product(name="Daawat Basmati Rice (5kg)", category="Pantry", price=550.00, stock_quantity=25, image_url="/images/rice.png"),
        models.Product(name="Fresh Red Onions (1kg)", category="Produce", price=45.00, stock_quantity=100, image_url="/images/onion.png"),
        models.Product(name="Surf Excel Easy Wash (1kg)", category="Household", price=130.00, stock_quantity=60, image_url="/images/surf-excel.png"),
        models.Product(name="Everest Garam Masala (100g)", category="Pantry", price=82.00, stock_quantity=50, image_url="/images/Everest-Garam-Masala.png"),
    ]
    db.add_all(realistic_products)
    db.commit()
    return {"message": "Massive realistic inventory added!"}

@app.get("/api/products")
def get_products(db: Session = Depends(get_db)):
    products = db.query(models.Product).all()
    return [
        {
            "id": p.id,
            "name": p.name,
            "category": p.category,
            "price": p.price,
            "stock_quantity": p.stock_quantity,
            "image_url": p.image_url
        } for p in products
    ]

@app.post("/api/products")
def create_product(product: schemas.ProductCreate, username: str, db: Session = Depends(get_db)):
    global active_notifications
    seller = db.query(models.User).filter(models.User.username == username).first()
    new_product = models.Product(
        name=product.name,
        category=product.category, 
        price=product.price,
        stock_quantity=product.stock_quantity,
        image_url=product.image_url,
        seller_id=seller.id if seller else None 
    )
    db.add(new_product)
    db.commit()

    # AUTO-CLEAR MAGIC: Erase from Manager Demand & Seller Inbox if it matches!
    keys_to_delete = [k for k in missed_searches.keys() if k.lower() == product.name.lower()]
    for k in keys_to_delete:
        del missed_searches[k]
        
    active_notifications = [n for n in active_notifications if n["product"].lower() != product.name.lower()]

    return {"message": f"Successfully added {product.name} to the store!"}

# --- SELLER: RESTOCK & GET PRODUCTS ---
@app.get("/api/seller/{username}/products")
def get_seller_products(username: str, db: Session = Depends(get_db)):
    seller = db.query(models.User).filter(models.User.username == username).first()
    if not seller: return []
    return db.query(models.Product).filter(models.Product.category == seller.seller_category).all()

@app.put("/api/products/{product_id}/restock")
def restock_product(product_id: int, request: schemas.StockRestock, db: Session = Depends(get_db)):
    global active_notifications
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product: raise HTTPException(status_code=404, detail="Product not found")
    
    product.stock_quantity += request.added_quantity
    db.commit()
    
    # AUTO-CLEAR MAGIC: Remove restock alert from Seller Inbox!
    active_notifications = [n for n in active_notifications if n["product"].lower() != product.name.lower()]
    
    return {"message": f"Successfully restocked! Added {request.added_quantity} units."}
# --- CHECKOUT ---
@app.post("/api/checkout/validate")
def validate_stock(request: schemas.CheckoutRequest, db: Session = Depends(get_db)):
    for item in request.items:
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        if not product or product.stock_quantity < item.quantity:
            raise HTTPException(status_code=400, detail=f"Not enough stock for {product.name if product else 'this item'}!")
    return {"status": "ok"}

@app.post("/api/checkout")
def process_checkout(request: schemas.CheckoutRequest, db: Session = Depends(get_db)):
    total_amount = 0
    for item in request.items:
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        if not product: raise HTTPException(status_code=404, detail=f"Product ID {item.product_id} not found")
        if product.stock_quantity < item.quantity: raise HTTPException(status_code=400, detail=f"Not enough stock for {product.name}!")
            
    for item in request.items:
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        product.stock_quantity -= item.quantity
        total_amount += (product.price * item.quantity)
        
    db.commit()
    return {"message": "Sale successful!", "total_charged": total_amount}

# --- ADMIN ROUTES ---
@app.get("/api/admin/sellers")
def get_all_sellers(db: Session = Depends(get_db)):
    return db.query(models.User).filter(models.User.role == "clerk").all()

@app.put("/api/admin/sellers/{seller_id}/status")
def update_seller_status(seller_id: int, request: schemas.StatusUpdate, db: Session = Depends(get_db)):
    seller = db.query(models.User).filter(models.User.id == seller_id, models.User.role == "clerk").first()
    if not seller: raise HTTPException(status_code=404, detail="Seller not found")
    seller.status = request.status
    db.commit()
    return {"message": f"Seller {seller.username} is now {request.status}!"}

@app.get("/api/admin/analytics")
def get_inventory_analytics(db: Session = Depends(get_db)):
    products = db.query(models.Product, models.User.username).outerjoin(models.User, models.Product.seller_id == models.User.id).all()
    return predict_stock_needs(products)

# --- SEARCH DEMAND TRACKER ---
class SearchRequest(BaseModel):
    query: str

@app.post("/api/search/record_miss")
def record_miss(request: SearchRequest):
    term = request.query.strip().title()
    if term:
        missed_searches[term] = missed_searches.get(term, 0) + 1
        print(f"Recorded missing item: {term}") 
    return {"message": "Missed search recorded."}

@app.get("/api/admin/demand")
def get_market_demand():
    sorted_demand = [{"term": item[0], "searches": item[1]} for item in sorted(missed_searches.items(), key=lambda x: x[1], reverse=True)]
    return sorted_demand

@app.delete("/api/notifications/{notif_id}")
def dismiss_notification(notif_id: int):
    global active_notifications
    active_notifications = [n for n in active_notifications if n["id"] != notif_id]
    return {"message": "Notification cleared."}

@app.delete("/api/admin/demand/{term}")
def dismiss_demand(term: str):
    if term in missed_searches:
        del missed_searches[term]
    return {"message": f"Demand for '{term}' dismissed."}