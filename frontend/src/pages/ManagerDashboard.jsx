import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { LayoutDashboard, Users, AlertTriangle, BrainCircuit, Send, CheckCircle, XCircle, TrendingUp } from 'lucide-react';

const ManagerDashboard = () => {
  const [activeTab, setActiveTab] = useState('ai_dashboard');
  const [sellers, setSellers] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [message, setMessage] = useState('');
  
  const [stockFilter, setStockFilter] = useState('all'); 
  
  // --- NEW: Added state to track market demands ---
  const [demands, setDemands] = useState([]);
  
  const role = localStorage.getItem('role');
  const username = localStorage.getItem('username');

  useEffect(() => {
    if (role !== 'manager') {
      window.location.href = '/login';
      return;
    }
    
    // Fetch immediately on load
    fetchSellers();
    fetchAnalytics();
    fetchDemands(); // <-- NEW

    // Auto-refresh the AI and Demand data every 5 seconds
    const aiPoller = setInterval(() => {
      fetchAnalytics();
      fetchDemands(); // <-- NEW
    }, 5000);

    return () => clearInterval(aiPoller);
  }, [role]);

  const fetchSellers = () => {
    axios.get('https://online-supermarket-system.onrender.com/admin/sellers')
      .then(res => setSellers(res.data))
      .catch(err => console.error(err));
  };

  const fetchAnalytics = () => {
    axios.get('https://online-supermarket-system.onrender.com/admin/analytics')
      .then(res => setAnalytics(res.data))
      .catch(err => console.error("Error fetching AI analytics:", err));
  };

  // --- NEW: Fetch Market Demand ---
  const fetchDemands = () => {
    axios.get('https://online-supermarket-system.onrender.com/admin/demand')
      .then(res => setDemands(res.data))
      .catch(err => console.error("Error fetching demands:", err));
  };

  const handleUpdateStatus = (sellerId, newStatus) => {
    axios.put(`https://online-supermarket-system.onrender.com/admin/sellers/${sellerId}/status`, { status: newStatus })
      .then(res => {
        showMessage(res.data.message, 'success');
        fetchSellers();
      })
      .catch(err => showMessage("Error updating seller.", 'error'));
  };

  const handleNotifySeller = (sellerName, productName, actionReq) => {
    axios.post('https://online-supermarket-system.onrender.com/admin/notify', {
      seller: sellerName,
      product: productName,
      message: `MANAGER URGENT: Fulfill stock for ${productName} (${actionReq})`
    })
    .then(res => showMessage(res.data.message, 'success'))
    .catch(err => showMessage("Failed to send alert", 'error'));
  };
  const handleDismissDemand = (term) => {
    axios.delete(`https://online-supermarket-system.onrender.com/admin/demand/${term}`)
      .then(res => {
        showMessage(res.data.message, 'success');
        fetchDemands();
      })
      .catch(err => showMessage("Failed to dismiss demand", 'error'));
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage(''), 4000);
  };

  const criticalItems = analytics.filter(item => item.ai_recommendation.includes('CRITICAL') || item.ai_recommendation.includes('HIGH RISK'));

  return (
    <div className="flex h-[calc(100vh-80px)] bg-gray-50 mt-1">
      
      {/* --- LEFT SIDEBAR NAVIGATION --- */}
      <div className="w-64 bg-gray-900 text-gray-300 flex flex-col shadow-xl z-10">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-xl font-black text-white tracking-wider">Control Center</h2>
          <p className="text-xs text-green-400 mt-1"> BE A MANAGER</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab('ai_dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-bold ${activeTab === 'ai_dashboard' ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-gray-800 hover:text-white'}`}>
            <BrainCircuit size={20} /> AI Predictions
          </button>
          
          <button onClick={() => setActiveTab('sellers')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-bold ${activeTab === 'sellers' ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-gray-800 hover:text-white'}`}>
            <Users size={20} /> Seller Management
          </button>

          <button onClick={() => setActiveTab('alerts')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-bold ${activeTab === 'alerts' ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-gray-800 hover:text-white'}`}>
            <AlertTriangle size={20} /> Inventory Alerts
            {criticalItems.length > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{criticalItems.length}</span>
            )}
          </button>

          {/* --- NEW: MARKET DEMAND TAB BUTTON --- */}
          <button onClick={() => setActiveTab('demands')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-bold ${activeTab === 'demands' ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-gray-800 hover:text-white'}`}>
            <TrendingUp size={20} /> Market Demand
            {demands.length > 0 && (
              <span className="ml-auto bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full">{demands.length}</span>
            )}
          </button>
        </nav>
      </div>

      {/* --- RIGHT MAIN CONTENT AREA --- */}
      <div className="flex-1 overflow-y-auto p-8">
        
        {message && (
          <div className={`mb-6 p-4 rounded-lg font-bold text-sm shadow-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
            {message.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
            {message.text}
          </div>
        )}

        {/* TAB 1: AI DASHBOARD & GRAPHS */}
        {activeTab === 'ai_dashboard' && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-3xl font-black text-gray-800 flex items-center gap-3">
              <BrainCircuit className="text-blue-600" size={32}/> AI Prediction Engine
            </h2>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-700 mb-6">Current Stock vs. Predicted 7-Day Demand</h3>
              <div className="h-96 w-full">
                {analytics.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <XAxis dataKey="name" tick={{fontSize: 12}} />
                      <YAxis />
                      <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: 'none'}} />
                      <Legend />
                      <Bar dataKey="current_stock" name="Actual Stock" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="predicted_7d_sales" name="AI Predicted Sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">No product analytics data available.</div>
                )}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-2">
              <button onClick={() => setStockFilter('all')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${stockFilter === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                All Products ({analytics.length})
              </button>
              <button onClick={() => setStockFilter('deficits')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${stockFilter === 'deficits' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}>
                Stock Deficits ({analytics.filter(item => item.current_stock <= 20).length})
              </button>
              <button onClick={() => setStockFilter('healthy')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${stockFilter === 'healthy' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>
                Stable & Surplus (Not Out of Stock) ({analytics.filter(item => item.current_stock > 20).length})
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-100 font-bold text-gray-700 uppercase tracking-wider text-xs">
                Detailed AI Analysis Matrix
              </div>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-gray-500 uppercase tracking-wider bg-white border-b text-xs">
                    <th className="p-4">Product</th>
                    <th className="p-4">Current Stock</th>
                    <th className="p-4">Predicted Sales</th>
                    <th className="p-4 text-center">AI Confidence</th>
                    <th className="p-4">Est. Days to Empty</th>
                    <th className="p-4">AI Status Flag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {analytics
                    .filter(item => {
                      if (stockFilter === 'deficits') return item.current_stock <= 20;
                      if (stockFilter === 'healthy') return item.current_stock > 20;
                      return true;
                    })
                    .map((stat, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-gray-900">{stat.name}</div>
                          <div className="text-xs text-gray-500">Seller: {stat.seller}</div>
                        </td>
                        <td className="p-4 font-mono font-bold text-gray-700">{stat.current_stock} units</td>
                        <td className="p-4 font-mono font-bold text-blue-600">{stat.predicted_7d_sales} units</td>
                        <td className="p-4 text-center">
                          <span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold border border-gray-200">
                            {stat.confidence}
                          </span>
                        </td>
                        <td className="p-4 font-mono">{stat.days_to_empty === 'Out of Stock' ? 'Out of Stock' : `${stat.days_to_empty} days`}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                            stat.ai_recommendation.includes('CRITICAL') || stat.ai_recommendation.includes('IMMEDIATELY') ? 'bg-red-100 text-red-700 border border-red-200' : 
                            stat.ai_recommendation.includes('RISK') ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                            stat.ai_recommendation.includes('SURPLUS') || stat.ai_recommendation.includes('OVERSTOCKED') ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                            'bg-green-100 text-green-700 border border-green-200'
                          }`}>
                            {stat.ai_recommendation}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: SELLER MANAGEMENT */}
        {activeTab === 'sellers' && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-3xl font-black text-gray-800 flex items-center gap-3">
              <Users className="text-blue-600" size={32}/> Seller Network
            </h2>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider border-b">
                    <th className="p-4">Seller Info</th>
                    <th className="p-4">Department</th>
                    <th className="p-4">Products Listed</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Approvals</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sellers.map((seller) => {
                    const sellerProducts = analytics.filter(p => p.seller === seller.username);
                    
                    return (
                      <tr key={seller.id} className="hover:bg-gray-50">
                        <td className="p-4">
                          <div className="font-bold text-gray-800">{seller.username}</div>
                          <div className="text-xs text-gray-500">{seller.email}</div>
                        </td>
                        <td className="p-4 font-semibold text-blue-600">{seller.seller_category}</td>
                        <td className="p-4">
                          {sellerProducts.length === 0 ? <span className="text-gray-400 italic text-sm">No products</span> : (
                            <div className="flex flex-wrap gap-1">
                              {sellerProducts.map((p, i) => <span key={i} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded border">{p.name}</span>)}
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${seller.status === 'approved' ? 'bg-green-100 text-green-700' : seller.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {seller.status}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          {seller.status !== 'approved' && <button onClick={() => handleUpdateStatus(seller.id, 'approved')} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded font-bold text-xs transition-colors shadow-sm">Approve</button>}
                          {seller.status !== 'rejected' && <button onClick={() => handleUpdateStatus(seller.id, 'rejected')} className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded font-bold text-xs transition-colors">Reject</button>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: INVENTORY ALERTS (MESSAGING SYSTEM) */}
        {activeTab === 'alerts' && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-3xl font-black text-gray-800 flex items-center gap-3">
              <AlertTriangle className="text-red-500" size={32}/> Required Actions
            </h2>
            <p className="text-gray-500">Items that are out of stock or projected to run out based on AI forecasting.</p>

            <div className="grid gap-4">
              {criticalItems.length === 0 ? (
                <div className="bg-green-50 p-8 rounded-xl text-center text-green-700 font-bold border border-green-200">
                  🎉 All inventory levels are healthy! No actions required.
                </div>
              ) : (
                criticalItems.map((item, i) => (
                  <div key={i} className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-red-500 flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-xl font-bold text-gray-800">{item.name}</h3>
                        <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded font-bold uppercase">{item.ai_recommendation}</span>
                      </div>
                      <p className="text-gray-500 text-sm">
                        Current Stock: <span className="font-bold text-gray-800">{item.current_stock}</span> | 
                        Predicted Need: <span className="font-bold text-blue-600">{item.predicted_7d_sales} units</span>
                      </p>
                      <p className="text-sm mt-2 text-gray-600">Supplied by: <span className="font-bold">{item.seller}</span></p>
                    </div>
                    
                    <button 
                      onClick={() => handleNotifySeller(item.seller, item.name, item.ai_recommendation)}
                      className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-5 py-3 rounded-lg font-bold transition-all shadow-md"
                    >
                      <Send size={18} /> Ask Seller to Restock
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* --- NEW: TAB 4: MARKET DEMAND SOURCING --- */}
        {activeTab === 'demands' && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-3xl font-black text-gray-800 flex items-center gap-3">
              <TrendingUp className="text-purple-600" size={32}/> Market Sourcing
            </h2>
            <p className="text-gray-500">Items customers are searching for that are currently not in our catalog.</p>

            <div className="grid gap-4">
              {demands.length === 0 ? (
                <div className="bg-gray-50 p-8 rounded-xl text-center text-gray-500 font-bold border border-gray-200">
                  No missing searches logged yet.
                </div>
              ) : (
                demands.map((item, i) => (
                  <div key={i} className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-purple-500 flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-1">"{item.term}"</h3>
                      <p className="text-purple-600 font-bold text-sm">
                        🔥 Searched {item.searches} times by customers
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                       <select id={`dept-${i}`} className="p-3 border rounded-lg bg-gray-50 font-bold outline-none text-gray-700">
                         <option value="Produce">Produce</option>
                         <option value="Dairy">Dairy</option>
                         <option value="Pantry">Pantry</option>
                         <option value="Snacks">Snacks</option>
                         <option value="Household">Household</option>
                       </select>
                       
                       <button 
                         onClick={() => {
                           const dept = document.getElementById(`dept-${i}`).value;
                           handleNotifySeller(dept, item.term, `HIGH DEMAND: Source this item immediately!`);
                         }}
                         className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-3 rounded-lg font-bold shadow-md transition-colors"
                       >
                         <Send size={18} /> Request
                       </button>

                       {/* NEW DISMISS BUTTON */}
                       <button 
                         onClick={() => handleDismissDemand(item.term)}
                         className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-3 rounded-lg font-bold transition-colors"
                       >
                         Dismiss
                       </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ManagerDashboard;