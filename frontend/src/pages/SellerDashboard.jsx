import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PackagePlus, ClipboardList, ArrowUpCircle, CheckCircle, AlertCircle, BellRing, Sparkles } from 'lucide-react';

const SellerDashboard = () => {
  const username = localStorage.getItem('username');
  const sellerCategory = localStorage.getItem('seller_category') || 'General';
  
  const [activeTab, setActiveTab] = useState('inventory'); 
  const [myProducts, setMyProducts] = useState([]);
  const [notifications, setNotifications] = useState([]); 
  const [restockAmounts, setRestockAmounts] = useState({}); 
  const [message, setMessage] = useState('');

  const [formData, setFormData] = useState({
    name: '', category: sellerCategory, price: '', stock_quantity: '', image_url: 'https://placehold.co/500x500/e2e8f0/1e293b?text=New+Item'
  });

  useEffect(() => {
    if (!username || localStorage.getItem('role') !== 'clerk') {
      window.location.href = '/login';
    } else {
      fetchMyProducts();
      fetchNotifications(); 
      // Auto-refresh inbox every 5 seconds!
      const inboxPoller = setInterval(fetchNotifications, 5000);
      return () => clearInterval(inboxPoller);
    }
  }, [username]);

  const fetchMyProducts = () => {
    axios.get(`https://online-supermarket-system.onrender.com/api/seller/${username}/products`)
      .then(res => setMyProducts(res.data))
      .catch(err => console.error("Error fetching products:", err));
  };

  const fetchNotifications = () => {
    axios.get(`https://online-supermarket-system.onrender.com/api/seller/${username}/notifications`)
      .then(res => setNotifications(res.data))
      .catch(err => console.error("Error fetching alerts:", err));
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage(''), 4000);
  };

  const handleCreateProduct = (e) => {
    e.preventDefault();
    const payload = { ...formData, price: parseFloat(formData.price), stock_quantity: parseInt(formData.stock_quantity) };

    axios.post(`https://online-supermarket-system.onrender.com/api/products?username=${username}`, payload)
      .then(res => {
        showMessage(res.data.message, 'success');
        setFormData({ name: '', category: sellerCategory, price: '', stock_quantity: '', image_url: 'https://placehold.co/500x500/e2e8f0/1e293b?text=New+Item' });
        setActiveTab('inventory'); // Send them back to see their new item!
        fetchMyProducts(); 
      })
      .catch(err => showMessage("Failed to launch product", 'error'));
  };

  const handleRestock = (productId) => {
    const amountToAdd = parseInt(restockAmounts[productId]);
    if (!amountToAdd || amountToAdd <= 0) return;

    axios.put(`https://online-supermarket-system.onrender.com/api/products/${productId}/restock`, { added_quantity: amountToAdd })
      .then(res => {
        showMessage(res.data.message, 'success');
        setRestockAmounts({ ...restockAmounts, [productId]: '' }); 
        fetchMyProducts(); 
      })
      .catch(err => showMessage("Failed to restock item", 'error'));
  };

  // --- NEW: 1-Click Launch Action ---
  const handleSourceNewItem = (productName) => {
    setFormData({ ...formData, name: productName });
    setActiveTab('new_product');
  };
  const handleDismissNotification = (id) => {
    axios.delete(`https://online-supermarket-system.onrender.com/api/notifications/${id}`)
      .then(() => fetchNotifications())
      .catch(err => console.error(err));
  };
  return (
    <div className="max-w-6xl mx-auto p-6 mt-6 flex gap-8">
      
      {/* SIDEBAR NAVIGATION */}
      <div className="w-64 bg-white rounded-xl shadow-md border border-gray-100 p-4 h-fit sticky top-6">
        <div className="mb-6 px-2">
          <h2 className="text-xl font-black text-gray-800 tracking-wider">Seller Portal</h2>
          <p className="text-xs font-bold text-blue-600 mt-1 uppercase">{sellerCategory} Dept.</p>
        </div>
        
        <nav className="space-y-2">
          <button onClick={() => setActiveTab('inventory')} className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all font-bold ${activeTab === 'inventory' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-gray-600 hover:bg-gray-50'}`}>
            <span className="flex items-center gap-3"><ClipboardList size={20} /> My Inventory</span>
            {notifications.length > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{notifications.length}</span>}
          </button>
          
          <button onClick={() => setActiveTab('new_product')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-bold ${activeTab === 'new_product' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-gray-600 hover:bg-gray-50'}`}>
            <PackagePlus size={20} /> Launch New Item
          </button>
        </nav>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1">
        
        {message && (
          <div className={`mb-6 p-4 rounded-lg font-bold text-sm shadow-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
            {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            {message.text}
          </div>
        )}

        {/* TAB 1: MANAGE INVENTORY & INBOX */}
        {activeTab === 'inventory' && (
          <div className="space-y-6 animate-fade-in">
            
            {/* --- UPGRADED: SMART MANAGER INBOX --- */}
            {notifications.length > 0 && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-red-800 font-black text-lg flex items-center gap-2 mb-4">
                  <BellRing size={20} /> Alerts from Manager
                </h3>
                <div className="space-y-3">
                  {notifications.map((note) => {
                    const isNewDemand = note.message.includes('HIGH DEMAND');
                    
                    return (
                      <div key={note.id} className={`p-4 rounded-lg border font-bold text-gray-800 shadow-sm flex justify-between items-center ${isNewDemand ? 'bg-purple-50 border-purple-200' : 'bg-white border-red-100'}`}>
                        <div>
                          <span className={`text-xs px-2 py-1 rounded mr-3 uppercase tracking-wider ${isNewDemand ? 'bg-purple-100 text-purple-700' : 'bg-red-100 text-red-700'}`}>
                            {isNewDemand ? 'New Item Request' : 'Restock Request'}
                          </span>
                          {note.message}
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg border">Product: {note.product}</span>
                          
                          {/* If it's a completely new item, give them a button to instantly start creating it! */}
                          {isNewDemand && (
                            <button 
                              onClick={() => handleSourceNewItem(note.product)}
                              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1 shadow-sm"
                            >
                              <Sparkles size={14} /> Launch Item
                            </button>
                          )}
                          {/* NEW DISMISS BUTTON */}
                          <button 
                            onClick={() => handleDismissNotification(note.id)}
                            className="text-gray-400 hover:text-red-500 font-bold ml-2 text-lg transition-colors"
                            title="Dismiss Alert"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h2 className="text-2xl font-black text-gray-800">Manage {sellerCategory} Stock</h2>
                  <p className="text-sm text-gray-500 mt-1">You are authorized to manage all items in the {sellerCategory} department.</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {myProducts.length === 0 ? (
                  <div className="text-center p-10 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                    No products found in the {sellerCategory} department.
                  </div>
                ) : (
                  myProducts.map(product => (
                    <div key={product.id} className={`p-4 rounded-xl border flex items-center justify-between ${product.stock_quantity === 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                      
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white rounded-lg overflow-hidden border border-gray-100">
                          {product.image_url ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" /> : <div className="bg-gray-200 w-full h-full"></div>}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-800 text-lg">{product.name}</h4>
                          <span className="text-xs font-bold text-blue-600 uppercase bg-blue-50 px-2 py-1 rounded">{product.category}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">In Stock</p>
                          <span className={`text-2xl font-black ${product.stock_quantity === 0 ? 'text-red-600' : 'text-gray-800'}`}>
                            {product.stock_quantity}
                          </span>
                        </div>
                        
                        <div className="h-10 w-px bg-gray-300"></div>

                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            min="1" 
                            placeholder="Qty..." 
                            value={restockAmounts[product.id] || ''}
                            onChange={(e) => setRestockAmounts({ ...restockAmounts, [product.id]: e.target.value })}
                            className="w-24 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-center font-bold"
                          />
                          <button 
                            onClick={() => handleRestock(product.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg font-bold transition-all flex items-center gap-1 shadow-sm"
                          >
                            <ArrowUpCircle size={20} /> Restock
                          </button>
                        </div>
                      </div>

                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LAUNCH NEW ITEM */}
        {activeTab === 'new_product' && (
          <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100 animate-fade-in">
            <h2 className="text-2xl font-black text-gray-800 mb-6">Launch New {sellerCategory} Item</h2>
            
            <form onSubmit={handleCreateProduct} className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Product Name</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Department Constraint</label>
                  <input type="text" value={formData.category} disabled className="w-full p-3 border rounded-lg bg-gray-200 text-gray-600 cursor-not-allowed font-bold" title="You can only create products in your assigned department." />
                </div>
                <div className="flex gap-4">
                  <div className="w-1/2">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Price (₹)</label>
                    <input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} required className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="w-1/2">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Initial Stock</label>
                    <input type="number" value={formData.stock_quantity} onChange={(e) => setFormData({...formData, stock_quantity: e.target.value})} required className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
              </div>
              <div className="space-y-4 flex flex-col">
                <div className="flex-grow">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Image URL</label>
                  <input type="text" value={formData.image_url} onChange={(e) => setFormData({...formData, image_url: e.target.value})} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <button type="submit" className="w-full py-4 bg-gray-900 hover:bg-gray-800 text-white font-black text-lg rounded-xl transition-all shadow-md">
                  Publish to Store
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};

export default SellerDashboard;