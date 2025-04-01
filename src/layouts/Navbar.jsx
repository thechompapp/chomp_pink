// src/layouts/Navbar.jsx
import React, { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom"; // Use NavLink for active styling
import useAppStore from "@/hooks/useAppStore";
import { Settings, ChevronDown } from 'lucide-react'; // Import icons

const Navbar = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const toggleSettings = () => {
    setIsSettingsOpen((prev) => !prev);
  };

  // Helper for NavLink active style
  const getNavLinkClass = ({ isActive }) => {
    return isActive
      ? "text-white bg-[#b89e89] px-3 py-2 rounded-md text-sm font-medium" // Active style
      : "text-white hover:bg-[#c1a389]/50 hover:text-white px-3 py-2 rounded-md text-sm font-medium"; // Default style
  };


  return (
    <nav className="bg-[#D1B399] p-4 flex justify-between items-center shadow-md">
      {/* Logo */}
      <Link to="/" className="text-2xl font-bold text-white tracking-tight">
        DOOF
      </Link>

      {/* Navigation Links */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        {/* Added Trending Link */}
        <NavLink to="/trending" className={getNavLinkClass}>
          Trending
        </NavLink>
        <NavLink to="/lists" className={getNavLinkClass}>
          My Lists
        </NavLink>

        {/* Settings Dropdown */}
        <div className="relative">
          <button
            onClick={toggleSettings}
            className="text-white hover:bg-[#c1a389]/50 p-2 rounded-full flex items-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#D1B399] focus:ring-white"
            aria-haspopup="true"
            aria-expanded={isSettingsOpen}
          >
            <Settings size={20} />
            <ChevronDown size={16} className="ml-1" />
          </button>
          {/* Dropdown Menu */}
          {isSettingsOpen && (
            <div
               className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-20"
               role="menu"
               aria-orientation="vertical"
               tabIndex="-1"
               onBlur={() => setIsSettingsOpen(false)} // Close on blur might need adjustment
             >
              <Link
                to="/dashboard"
                onClick={() => setIsSettingsOpen(false)}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                role="menuitem"
                tabIndex="-1"
              >
                Pending Submissions
              </Link>
              <Link
                to="/admin"
                onClick={() => setIsSettingsOpen(false)}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                role="menuitem"
                tabIndex="-1"
              >
                Admin Panel
              </Link>
               {/* Add other settings links here if needed */}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;