import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Button from '../components/Button';

const Register = () => {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [role, setRole] = useState('customer');
  const [sellerCategory, setSellerCategory] = useState('Produce');
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleRegister = (e) => {
    e.preventDefault();
    const payload = { 
      username: formData.username, 
      email: formData.email, 
      password: formData.password, 
      role: role, 
      seller_category: role === 'clerk' ? sellerCategory : null 
    };

    axios.post('https://online-supermarket-system.onrender.com/api/register', payload)
      .then(res => {
        alert('Account created successfully! Please log in.');
        navigate('/login');
      })
      .catch(err => {
        alert(err.response?.data?.detail || "Failed to create account.");
      });
  };

  return (
    <div className="flex justify-center items-center min-h-[75vh] py-10">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md border border-gray-100">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800">Create an Account</h2>
          <p className="text-gray-500 text-sm mt-1">Join SuperMart today</p>
        </div>
        
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">Username</label>
            <input type="text" name="username" onChange={handleChange} required className="w-full px-4 py-2 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">Email</label>
            <input type="email" name="email" onChange={handleChange} required className="w-full px-4 py-2 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">Password</label>
            <input type="password" name="password" onChange={handleChange} required className="w-full px-4 py-2 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">I want to register as a...</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-500 font-semibold">
              <option value="customer">Shopper (Customer)</option>
              <option value="clerk">Seller (Store Clerk)</option>
            </select>
          </div>

          {role === 'clerk' && (
            <div className="animate-fade-in bg-blue-50 p-4 rounded-lg border border-blue-100">
              <label className="block text-blue-800 text-sm font-bold mb-2">Select Your Department</label>
              <select value={sellerCategory} onChange={(e) => setSellerCategory(e.target.value)} className="w-full px-4 py-2 bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-semibold text-gray-700">
                <option value="Produce">Produce (Fruits & Veg)</option>
                <option value="Dairy">Dairy & Eggs</option>
                <option value="Pantry">Pantry & Dry Goods</option>
                <option value="Snacks">Snacks & Beverages</option>
                <option value="Household">Household & Cleaning</option>
              </select>
            </div>
          )}

          <Button type="submit" className="w-full py-3 mt-6 text-lg">Create Account</Button>
        </form>
        <p className="text-center text-sm text-gray-600 mt-6 pt-6 border-t">
          Already have an account? <Link to="/login" className="text-blue-600 font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
};
export default Register;