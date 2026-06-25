import React, { useState } from 'react';
import axios from 'axios';

const Login = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({ 
    username: '', email: '', password: '', role: 'customer', manager_token: '', seller_category: 'Produce' 
  });
  const [message, setMessage] = useState('');

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    const endpoint = isRegistering ? 'https://online-supermarket-system.onrender.com/api/register' : 'https://online-supermarket-system.onrender.com/api/login';
    
    const payload = { ...formData };
    if (payload.role !== 'clerk') payload.seller_category = null;

    axios.post(endpoint, payload)
      .then(res => {
        if (isRegistering) {
          setMessage(`Success! Registered as ${formData.role}. You can now log in.`);
          setIsRegistering(false); 
        } else {
          localStorage.setItem('token', res.data.access_token);
          localStorage.setItem('username', res.data.username); 
          localStorage.setItem('role', res.data.role); 
          localStorage.setItem('seller_category', res.data.seller_category || 'General'); // IMPORTANT
          
          setMessage(`Welcome back, ${res.data.username}! Redirecting...`);
          
          setTimeout(() => { 
            if (res.data.role === 'manager') window.location.href = '/admin';
            else if (res.data.role === 'clerk') window.location.href = '/seller';
            else window.location.href = '/';
          }, 1500);
        }
      })
      .catch(err => setMessage(err.response?.data?.detail || "An error occurred"));
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-100">
        <h2 className="text-3xl font-black text-center text-gray-800 mb-6">{isRegistering ? 'Create Account' : 'Welcome Back'}</h2>
        {message && <div className={`mb-4 p-3 rounded text-center font-bold text-sm ${message.includes('Success') || message.includes('Welcome') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{message}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Account Type</label>
                <select name="role" value={formData.role} onChange={handleChange} className="w-full p-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="customer">Customer (Buy Only)</option>
                  <option value="clerk">Clerk / Seller</option>
                  <option value="manager">Store Manager</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Username</label>
                <input type="text" name="username" onChange={handleChange} required className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              {formData.role === 'manager' && (
                <div className="bg-red-50 p-3 rounded border border-red-200 animate-fade-in">
                  <label className="block text-sm font-bold text-red-700 mb-1">Secret Manager Token</label>
                  <input type="password" name="manager_token" onChange={handleChange} required className="w-full p-2 border rounded outline-none" />
                </div>
              )}
              {formData.role === 'clerk' && (
                <div className="bg-blue-50 p-3 rounded border border-blue-200 animate-fade-in">
                  <label className="block text-sm font-bold text-blue-700 mb-1">Select Your Department</label>
                  <select name="seller_category" value={formData.seller_category} onChange={handleChange} className="w-full p-2 border border-blue-100 rounded outline-none bg-white font-semibold">
                    <option value="Produce">Produce (Fruits & Veg)</option>
                    <option value="Dairy">Dairy & Eggs</option>
                    <option value="Pantry">Pantry & Dry Goods</option>
                    <option value="Snacks">Snacks & Beverages</option>
                    <option value="Household">Household & Cleaning</option>
                  </select>
                </div>
              )}
            </>
          )}
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
            <input type="email" name="email" onChange={handleChange} required className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
            <input type="password" name="password" onChange={handleChange} required className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          <button type="submit" className="w-full py-3 mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md">{isRegistering ? 'Sign Up' : 'Log In'}</button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button type="button" onClick={() => { setIsRegistering(!isRegistering); setMessage(''); }} className="text-blue-600 font-bold hover:underline">
            {isRegistering ? 'Log In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
};
export default Login;