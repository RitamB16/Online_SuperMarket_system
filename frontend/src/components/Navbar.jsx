import React from 'react';
import { Link } from 'react-router-dom';
import Button from './Button';

const Navbar = ({ userRole, onLogout }) => {
  return (
    <nav className="bg-gray-900 text-white p-4 shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        
        {/* Brand Logo */}
        <div className="text-xl font-bold tracking-wider flex items-center gap-2">
          <span className="text-blue-400 text-2xl">🛒</span>
          <Link to="/">SUPERMART</Link>
        </div>

        {/* Navigation Links */}
        <ul className="hidden md:flex space-x-8 items-center text-sm font-medium">
          <li><Link to="/" className="hover:text-blue-400 transition-colors">Home</Link></li>
          <li><Link to="/" className="hover:text-blue-400 transition-colors">Products</Link></li>
          
          {userRole === 'customer' && (
            <li><Link to="/cart" className="hover:text-blue-400 transition-colors">Cart</Link></li>
          )}
          {userRole === 'manager' && (
            <li><Link to="/manager" className="hover:text-blue-400 transition-colors">Admin Panel</Link></li>
          )}
        </ul>

        {/* User Actions */}
        <div>
          {userRole ? (
            <Button variant="danger" onClick={onLogout}>Logout</Button>
          ) : (
            <Link to="/login">
              <Button variant="primary">Login / Profile</Button>
            </Link>
          )}
        </div>

      </div>
    </nav>
  );
};

export default Navbar;