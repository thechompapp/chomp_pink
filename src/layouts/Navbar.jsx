import React, { useState } from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const toggleSettings = () => {
    setIsSettingsOpen((prev) => !prev);
  };

  return (
    <nav className="bg-[#D1B399] p-4 flex justify-between items-center">
      <Link to="/" className="text-2xl font-bold text-white">
        DOOF
      </Link>
      <div className="flex items-center space-x-4">
        <Link to="/lists" className="text-white hover:text-gray-200">
          My Lists
        </Link>
        <div className="relative">
          <button
            onClick={toggleSettings}
            className="text-white hover:text-gray-200 flex items-center focus:outline-none"
          >
            Settings
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>
          {isSettingsOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
              <Link
                to="/admin"
                onClick={() => setIsSettingsOpen(false)} // Close dropdown on click
                className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
              >
                Admin Panel
              </Link>
              {/* Add more settings links here if needed */}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;