import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';

const Cart = () => {
  // Dummy cart state using our new INR prices
  const cartItems = [
    { id: 1, name: 'Amul Taaza Milk 1L', price: 68.00, quantity: 2 },
    { id: 2, name: 'Britannia Whole Wheat Bread', price: 50.00, quantity: 1 },
  ];

  const total = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  if (cartItems.length === 0) {
    return <div className="text-center mt-20 text-xl text-gray-600">Your cart is empty.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Your Cart</h1>
      
      <div className="bg-white shadow-sm border rounded-lg p-6">
        <ul className="divide-y">
          {cartItems.map(item => (
            <li key={item.id} className="py-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">{item.name}</h3>
                <p className="text-gray-500">Qty: {item.quantity} x ₹{item.price.toFixed(2)}</p>
              </div>
              <span className="font-bold text-lg text-gray-800">₹{(item.price * item.quantity).toFixed(2)}</span>
            </li>
          ))}
        </ul>
        
        <div className="mt-6 border-t pt-6 flex justify-between items-center">
          <span className="text-2xl font-bold">Total:</span>
          <span className="text-2xl font-bold text-green-600">₹{total.toFixed(2)}</span>
        </div>
        
        <div className="mt-8 flex justify-end">
          <Link to="/checkout">
            <Button variant="primary" className="px-8 py-3 text-lg">Proceed to Checkout</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Cart;