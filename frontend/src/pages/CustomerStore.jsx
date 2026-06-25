import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const CustomerStore = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('customer_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // --- SEARCH STATES ---
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Memory bank to prevent spamming the backend
  const reportedSearches = useRef(new Set()); 

  // Fetch products from database
  useEffect(() => {
    const fetchFreshStock = () => {
      axios.get('http://127.0.0.1:8000/api/products')
        .then(res => setProducts(res.data))
        .catch(err => console.error("Error fetching products:", err));
    };
    fetchFreshStock(); 
    const stockPoller = setInterval(fetchFreshStock, 5000); 
    return () => clearInterval(stockPoller); 
  }, []);

  // Save cart to memory when it changes
  useEffect(() => localStorage.setItem('customer_cart', JSON.stringify(cart)), [cart]);

  // --- SMART SEARCH TRACKER ---
  // 1. Wait 1 second after the user stops typing before making a decision (Debounce)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 1000);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 2. Filter the products dynamically based on what they type
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 3. If the search results in NOTHING, secretly report it to the Manager!
  useEffect(() => {
    if (debouncedSearch.trim() !== '' && filteredProducts.length === 0) {
      const searchTerm = debouncedSearch.toLowerCase();
      
      // Only send the alert if we haven't already reported this exact word!
      if (!reportedSearches.current.has(searchTerm)) {
        console.log(`Reporting high demand for: ${debouncedSearch}`); 
        
        // Add to memory IMMEDIATELY so it doesn't double-fire
        reportedSearches.current.add(searchTerm);
        
        axios.post('http://127.0.0.1:8000/api/search/record_miss', { query: debouncedSearch })
          .catch(err => console.error("Error reporting missed search:", err));
      }
    }
  }, [debouncedSearch, filteredProducts.length]);

  const addToCart = (product) => {
    setCart(prevCart => {
      const existing = prevCart.find(item => item.id === product.id);
      const dbStock = product.stock_quantity ?? product.stock ?? 0;
      if (existing && existing.quantity >= dbStock) return prevCart; 

      if (existing) return prevCart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => {
      const existing = prevCart.find(item => item.id === productId);
      if (!existing) return prevCart;
      if (existing.quantity === 1) return prevCart.filter(item => item.id !== productId);
      return prevCart.map(item => item.id === productId ? { ...item, quantity: item.quantity - 1 } : item);
    });
  };

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <div className="max-w-7xl mx-auto p-6 mt-6">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-black text-gray-800">Welcome to SuperMart</h1>
          <p className="text-gray-500 mt-2 text-lg">Browse our fresh selection of groceries uploaded by our verified sellers.</p>
        </div>
        <Link to="/checkout" className="relative bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2">
          <span>🛒 Checkout</span>
          {cartItemCount > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-6 h-6 flex items-center justify-center rounded-full border-2 border-white shadow-sm">{cartItemCount}</span>}
        </Link>
      </div>

      {/* --- THE SEARCH BAR UI --- */}
      <div className="mb-8">
        <input 
          type="text" 
          placeholder="🔍 Search for products or departments (e.g., 'Apples' or 'Dairy')..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-4 pl-6 text-lg border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all shadow-sm font-bold text-gray-700"
        />
      </div>

      {/* Show a message if the search yields zero results */}
      {filteredProducts.length === 0 && searchQuery !== '' && (
        <div className="text-center p-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <h3 className="text-2xl font-bold text-gray-700 mb-2">No items found for "{searchQuery}"</h3>
          <p className="text-gray-500">We've let our Store Manager know so they can restock this soon!</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredProducts.map(product => {
          const dbStock = product.stock_quantity ?? product.stock ?? 0; 
          const inCart = cart.find(item => item.id === product.id)?.quantity || 0;
          const exactAvailable = dbStock - inCart; 
          const isCompletelySoldOut = dbStock === 0;
          const isMaxedOutInCart = inCart >= dbStock && !isCompletelySoldOut;

          return (
            <div key={product.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden border border-gray-100 flex flex-col">
              <div className="h-48 bg-gray-100 w-full relative overflow-hidden">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className={`w-full h-full object-cover transition-all duration-300 ${isCompletelySoldOut ? 'grayscale opacity-50' : 'hover:scale-105'}`} />
                ) : <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">No Image</div>}
                
                {isCompletelySoldOut && (
                  <div className="absolute inset-0 flex items-center justify-center backdrop-blur-[1px] bg-black/10">
                    <span className="bg-red-600 text-white px-6 py-2 rounded-lg font-black uppercase tracking-widest shadow-xl border-2 border-white -rotate-12 scale-110">Out of Stock</span>
                  </div>
                )}
              </div>
              
              <div className="p-5 flex-grow flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-black text-blue-600 uppercase tracking-wider">{product.category}</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-md border ${isCompletelySoldOut ? 'bg-red-50 text-red-600 border-red-200' : exactAvailable === 0 ? 'bg-orange-50 text-orange-600 border-orange-200' : exactAvailable <= 5 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                    {isCompletelySoldOut ? 'Empty' : exactAvailable === 0 ? 'Max Reached' : `${exactAvailable} Available`}
                  </span>
                </div>

                <h3 className={`text-lg font-bold leading-tight mb-4 ${isCompletelySoldOut ? 'text-gray-400 line-through decoration-2' : 'text-gray-800'}`}>{product.name}</h3>
                
                <div className="mt-auto flex justify-between items-center pt-4 border-t border-gray-100">
                  <span className={`text-2xl font-black ${isCompletelySoldOut ? 'text-gray-400' : 'text-gray-900'}`}>₹{product.price.toFixed(2)}</span>
                  
                  {isCompletelySoldOut ? (
                    <button disabled className="bg-gray-100 text-gray-400 px-4 py-2 rounded-lg font-bold text-sm cursor-not-allowed border border-gray-200">Sold Out</button>
                  ) : inCart > 0 ? (
                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 border border-gray-200">
                      <button onClick={() => removeFromCart(product.id)} className="w-8 h-8 flex items-center justify-center bg-white text-red-600 rounded shadow-sm hover:bg-red-50 font-black transition-colors">−</button>
                      <span className="w-8 text-center font-bold text-gray-800 text-sm">{inCart}</span>
                      <button onClick={() => addToCart(product)} disabled={isMaxedOutInCart} className={`w-8 h-8 flex items-center justify-center rounded shadow-sm font-black transition-colors ${isMaxedOutInCart ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white text-blue-600 hover:bg-blue-50'}`}>+</button>
                    </div>
                  ) : (
                    <button onClick={() => addToCart(product)} className="bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md px-4 py-2 rounded-lg font-bold text-sm transition-all active:scale-95">Add to Cart</button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default CustomerStore;