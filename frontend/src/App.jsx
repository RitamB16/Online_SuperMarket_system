import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Login from './pages/Login';
import SellerDashboard from './pages/SellerDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import CustomerStore from './pages/CustomerStore';
import Checkout from './pages/Checkout';
function App() {
  // Check if someone is logged in by looking for their username
  const username = localStorage.getItem('username');

  // The Logout function simply shreds the digital ID cards and kicks them to the login screen
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100">
        
        {/* --- SMART NAVBAR --- */}
        <nav className="bg-gray-900 text-white p-4 shadow-md">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            
            {/* Logo & Links */}
            <div className="flex items-center gap-6">
              <Link to="/" className="text-xl font-black tracking-wider flex items-center gap-2">
                🛒 SUPERMART
              </Link>
              
              {/* ONLY show "Seller Dashboard" to Sellers (Clerks) */}
              {localStorage.getItem('role') === 'clerk' && (
                <Link to="/seller" className="text-gray-300 hover:text-white font-semibold transition-colors border-l border-gray-600 pl-4 ml-2">My Seller Dashboard</Link>
              )}

              {/* ONLY show "Admin HQ" to Managers */}
              {localStorage.getItem('role') === 'manager' && (
                <Link to="/admin" className="text-green-400 hover:text-green-300 font-bold transition-colors border-l border-gray-600 pl-4 ml-2">Admin HQ</Link>
              )}
            </div>

            {/* User Controls */}
            <div>
              {username ? (
                <div className="flex items-center gap-4">
                  <span className="font-bold text-gray-300">Hi, <span className="text-white">{username}</span></span>
                  <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-bold text-sm transition-colors shadow-sm">
                    Logout
                  </button>
                </div>
              ) : (
                <Link to="/login" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded font-bold transition-colors shadow-sm">
                  Login / Register
                </Link>
              )}
            </div>
            
          </div>
        </nav>

        {/* --- PAGE CONTENT --- */}
        <Routes>
          <Route path="/" element={<CustomerStore />} /> 
          <Route path="/login" element={<Login />} />
          <Route path="/seller" element={<SellerDashboard />} />
          <Route path="/admin" element={<ManagerDashboard />} />
          <Route path="/checkout" element={<Checkout />} />
        </Routes>
        
      </div>
    </BrowserRouter>
  );
}

export default App;