import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ProductCard from '../components/ProductCard';

const Home = () => {
  // Start with an empty array. The page will load blank for a split second.
  const [products, setProducts] = useState([]);

  // useEffect runs automatically as soon as the page loads on the screen
  useEffect(() => {
    axios.get('https://online-supermarket-system.onrender.com/api/products')
      .then((response) => {
        // Success! We got the data from Python. Save it to our state.
        setProducts(response.data);
      })
      .catch((error) => {
        console.error("Uh oh! Failed to fetch data from FastAPI:", error);
      });
  }, []);

  const handleAddToCart = (product) => {
    alert(`Added ${product.name} to cart!`);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Featured Products</h1>
        <p className="text-gray-500 mt-2">Browse our fresh selection of groceries.</p>
      </div>
      
      {/* This grid automatically adjusts from 1 column on phones to 4 columns on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map(product => (
          <ProductCard 
            key={product.id} 
            product={product} 
            onAddToCart={handleAddToCart} 
          />
        ))}
      </div>

    </div>
  );
};

export default Home;