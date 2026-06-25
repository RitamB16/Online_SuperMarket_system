import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Checkout = () => {
  const [cart, setCart] = useState([]);
  const [formData, setFormData] = useState({ fullName: '', address: '', paymentMethod: 'upi' });
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedCart = localStorage.getItem('customer_cart');
    if (!savedCart) return;
    
    const cartItems = JSON.parse(savedCart);
    setCart(cartItems);

    // PRE-CHECKOUT VALIDATION (Fail-Fast)
    if (cartItems.length > 0) {
      axios.post('https://online-supermarket-system.onrender.com/checkout/validate', { 
        items: cartItems.map(item => ({ product_id: item.id, quantity: item.quantity })) 
      })
      .catch(err => {
        alert(err.response?.data?.detail || "Stock error. Some items are no longer available.");
        navigate('/'); 
      });
    }
  }, [navigate]);

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleRemoveFromCart = (productId) => {
    const updatedCart = cart.filter(item => item.id !== productId);
    setCart(updatedCart);
    localStorage.setItem('customer_cart', JSON.stringify(updatedCart)); 
  };

  const handlePayment = (e) => {
    e.preventDefault();
    if (cart.length === 0) return alert("Your cart is empty!");
    setIsProcessing(true);

    const payload = { items: cart.map(item => ({ product_id: item.id, quantity: item.quantity })) };

    axios.post('https://online-supermarket-system.onrender.com/api/checkout', payload)
      .then(res => {
        setIsProcessing(false);
        alert(`Payment of ₹${res.data.total_charged.toFixed(2)} Successful! Order placed.`);
        localStorage.removeItem('customer_cart');
        setCart([]);
        navigate('/');
      })
      .catch(err => {
        setIsProcessing(false);
        alert(err.response?.data?.detail || "Checkout failed");
      });
  };

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Your cart is empty!</h2>
        <button onClick={() => navigate('/')} className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold">Return to Store</button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 mt-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        
        {/* Left Side: Review Order */}
        <div className="bg-gray-50 p-8 rounded-2xl">
          <h2 className="text-3xl font-black text-gray-800 mb-8">Review Order</h2>
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-h-96 overflow-y-auto">
              {cart.map((item, index) => (
                <div key={index} className="flex justify-between items-center pb-4 border-b border-gray-50 last:border-0 last:pb-0 mb-4 last:mb-0">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden">
                      {item.image_url && <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800">{item.name}</h4>
                      <p className="text-sm text-gray-500">Qty: {item.quantity} x ₹{item.price}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-800 mb-1">₹{(item.price * item.quantity).toFixed(2)}</div>
                    <button onClick={() => handleRemoveFromCart(item.id)} className="text-xs font-bold text-red-500 hover:text-red-700 hover:underline transition-colors">
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
              <span className="text-xl font-bold text-gray-600">Total to Pay:</span>
              <span className="text-4xl font-black text-gray-900">₹{cartTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Payment Form */}
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
          <h2 className="text-3xl font-black text-gray-800 mb-8">Checkout Details</h2>
          <form onSubmit={handlePayment} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
              <input type="text" required onChange={(e) => setFormData({...formData, fullName: e.target.value})} className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Shipping Address</label>
              <textarea required rows="3" onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            
            <div className="pt-4 border-t border-gray-100">
              <label className="block text-sm font-bold text-gray-700 mb-4">Select Payment Method</label>
              <div className="grid grid-cols-2 gap-4">
                <button type="button" onClick={() => setFormData({...formData, paymentMethod: 'upi'})} className={`p-4 rounded-xl border-2 font-bold flex items-center justify-center gap-2 ${formData.paymentMethod === 'upi' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500'}`}>📱 Mock UPI</button>
                <button type="button" onClick={() => setFormData({...formData, paymentMethod: 'cod'})} className={`p-4 rounded-xl border-2 font-bold flex items-center justify-center gap-2 ${formData.paymentMethod === 'cod' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500'}`}>💵 Cash on Delivery</button>
              </div>
            </div>

            <button type="submit" disabled={isProcessing} className="w-full py-4 mt-6 bg-gray-900 hover:bg-gray-800 text-white font-black text-lg rounded-xl transition-all shadow-md disabled:bg-gray-400">
              {isProcessing ? 'Processing Secure Payment...' : `Pay ₹${cartTotal.toFixed(2)} & Place Order`}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
export default Checkout;