import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import doofLogo from '../assets/doof.svg'; // Updated logo path to SVG

const Navbar = () => {
  const location = useLocation();

  return (
    <nav className="bg-white shadow fixed top-0 left-0 w-full z-50">
      {/* Logo Section - Reduced padding */}
      <div className="flex justify-center py-4 border-b border-gray-100"> {/* Reduced from py-6 to py-4 */}
        <Link to="/" className="text-lg font-bold text-pink-500">
          <img
            src={doofLogo}
            alt="Chomp Logo"
            className="h-24 w-auto object-contain" // Reduced from h-36 to h-24
          />
        </Link>
      </div>

      {/* Navigation Links Section - Reduced padding */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="relative flex items-center py-2"> {/* Reduced from py-3 to py-2 */}
          {/* Navigation Links */}
          <div className="flex-1 flex justify-center space-x-8">
            <Link
              to="/"
              className={`text-gray-700 hover:text-pink-500 ${
                location.pathname === '/' ? 'font-bold text-pink-500' : ''
              }`}
            >
              Home
            </Link>
            <Link
              to="/trending"
              className={`text-gray-700 hover:text-pink-500 ${
                location.pathname === '/trending' ? 'font-bold text-pink-500' : ''
              }`}
            >
              Trending
            </Link>
            <Link
              to="/nightplanner"
              className={`text-gray-700 hover:text-pink-500 ${
                location.pathname === '/nightplanner' ? 'font-bold text-pink-500' : ''
              }`}
            >
              Night Planner
            </Link>
            <Link
              to="/mylists"
              className={`text-gray-700 hover:text-pink-500 ${
                location.pathname === '/mylists' ? 'font-bold text-pink-500' : ''
              }`}
            >
              My Lists
            </Link>
          </div>

          {/* User Profile Icon - Positioned Absolute Right */}
          <div className="absolute right-0">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-700 flex-shrink-0 hover:bg-gray-300 cursor-pointer">
              <span>U</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;