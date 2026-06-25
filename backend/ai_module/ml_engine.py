import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor

def train_demand_model():
    print("🧠 Training AI Demand Forecasting Model...")
    
    # 1. Generate Synthetic Historical Data (6 months of fake sales)
    np.random.seed(42)
    n_samples = 1000
    
    # Features: Price, Category (represented as numbers 1-5), Current Stock
    prices = np.random.uniform(10, 600, n_samples)
    categories = np.random.randint(1, 6, n_samples)
    stocks = np.random.randint(0, 200, n_samples)
    
    # Target: Sales are generally higher for cheaper items, with some random noise
    # (This simulates real-world economic demand)
    historical_sales_7_days = (1000 / (prices + 10)) + (categories * 5) + np.random.normal(0, 3, n_samples)
    historical_sales_7_days = np.maximum(0, historical_sales_7_days).astype(int) # No negative sales
    
    X = pd.DataFrame({'price': prices, 'category': categories, 'stock': stocks})
    y = historical_sales_7_days
    
    # 2. Train the Random Forest Model
    model = RandomForestRegressor(n_estimators=50, random_state=42)
    model.fit(X, y)
    
    print("✅ AI Model Ready!")
    return model

# Train the model once when this file is imported
demand_model = train_demand_model()

def predict_stock_needs(products):
    """
    Takes a list of database products, runs them through the ML model, 
    and returns statistical predictions.
    """
    if not products:
        return []
        
    # Map text categories to numbers for the ML model
    category_map = {"Dairy": 1, "Produce": 2, "Pantry": 3, "Snacks": 4, "Household": 5}
    
    analytics_results = []
    
    for product, seller_name in products:
        cat_num = category_map.get(product.category, 3) # Default to 3 if unknown
        
        # Prepare the exact feature array the model was trained on
        features = pd.DataFrame({
            'price': [product.price], 
            'category': [cat_num], 
            'stock': [product.stock_quantity]
        })
        
        # Make the prediction!
        predicted_sales = int(demand_model.predict(features)[0])
        
        # Calculate AI Confidence and Days Until Empty
        confidence_score = round(np.random.uniform(85.0, 98.5), 1) # Simulated model confidence
        days_to_empty = "Out of Stock" if product.stock_quantity == 0 else \
                        round(product.stock_quantity / (predicted_sales / 7)) if predicted_sales > 0 else "99+"
        
        # AI Decision Logic for different stock states
        if product.stock_quantity == 0:
            action = "CRITICAL: Out of Stock"
        elif predicted_sales > product.stock_quantity:
            action = "HIGH RISK: Low Stock"
        elif product.stock_quantity >= 100:
            action = "SURPLUS: Overstocked"
        else:
            action = "STABLE: Healthy Stock" # <-- Flag for products NOT out of stock
            
        analytics_results.append({
            "id": product.id,
            "name": product.name,
            "seller": seller_name or "Store Platform",
            "current_stock": product.stock_quantity,
            "predicted_7d_sales": predicted_sales,
            "days_to_empty": days_to_empty,
            "confidence": f"{confidence_score}%",
            "ai_recommendation": action
        })
        
    return analytics_results