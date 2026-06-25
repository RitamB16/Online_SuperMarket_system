import React from 'react';
import Button from './Button';

const ProductCard = ({ product, onAddToCart }) => {
  return (
    <div className="border rounded-xl p-0 shadow-sm hover:shadow-lg transition-all duration-300 bg-white flex flex-col h-full overflow-hidden group">
      
      {/* PROFESSIONAL IMAGE CONTAINER */}
      <div className="h-56 w-full bg-gray-50 overflow-hidden relative">
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
        )}
        
        {/* Out of stock badge overlay */}
        {product.stock === 0 && (
          <div className="absolute top-3 right-3 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
            Sold Out
          </div>
        )}
      </div>
      
      {/* Product Details */}
      <div className="p-5 flex-grow flex flex-col">
        <div className="flex-grow">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">{product.category}</p>
          <h3 className="text-lg font-bold text-gray-800 leading-tight">{product.name}</h3>
        </div>
        
        {/* Price and Action */}
        <div className="flex justify-between items-end mt-4 pt-4 border-t border-gray-100">
          <div>
            <p className="text-sm text-gray-500 mb-1">Price</p>
            <span className="text-2xl font-black text-gray-900">₹{product.price.toFixed(2)}</span>
          </div>
          <Button 
            variant={product.stock > 0 ? "primary" : "secondary"} 
            onClick={() => onAddToCart(product)}
            disabled={product.stock === 0}
            className={product.stock === 0 ? "opacity-50 cursor-not-allowed" : "shadow-md"}
          >
            {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
          </Button>
        </div>
      </div>

    </div>
  );
};

export default ProductCard;