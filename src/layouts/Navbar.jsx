// src/layouts/Navbar.jsx
import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Settings, ChevronDown } from 'lucide-react';

const Navbar = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const toggleSettings = () => {
    setIsSettingsOpen((prev) => !prev);
  };

  const getNavLinkClass = ({ isActive }) => {
    return isActive
      ? "text-white bg-[#b89e89] px-3 py-2 rounded-md text-sm font-medium"
      : "text-white hover:bg-[#c1a389]/50 hover:text-white px-3 py-2 rounded-md text-sm font-medium";
  };

  return (
    <nav className="bg-[#D1B399] p-4 flex justify-between items-center shadow-md">
      <Link to="/" className="text-2xl font-bold text-white tracking-tight">
        DOOF
      </Link>
      <div className="flex items-center space-x-2 sm:space-x-4">
        <NavLink to="/trending" className={getNavLinkClass}>
          Trending
        </NavLink>
        <NavLink to="/lists" className={getNavLinkClass}>
          My Lists
        </NavLink>
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
          {isSettingsOpen && (
            <div
              className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-20"
              role="menu"
              aria-orientation="vertical"
              tabIndex="-1"
              onBlur={() => setIsSettingsOpen(false)}
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
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;