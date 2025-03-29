import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';

const Navbar = () => {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex-shrink-0 flex items-center text-[#D1B399] font-bold text-xl">Chomp</Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/" className="text-gray-700 hover:text-[#D1B399] px-3 py-2 rounded-md text-sm font-medium">Home</Link>
            <Link to="/trending" className="text-gray-700 hover:text-[#D1B399] px-3 py-2 rounded-md text-sm font-medium">Trending</Link>
            <Link to="/lists" className="text-gray-700 hover:text-[#D1B399] px-3 py-2 rounded-md text-sm font-medium">My Lists</Link>
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="text-gray-700 hover:text-[#D1B399] px-3 py-2 rounded-md text-sm font-medium flex items-center"
              >
                Settings
                <ChevronDown size={16} className="ml-1" />
              </button>
              {showSettings && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                  <Link
                    to="/settings/pending"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#D1B399] hover:text-white transition-colors"
                    onClick={() => setShowSettings(false)}
                  >
                    Pending
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;