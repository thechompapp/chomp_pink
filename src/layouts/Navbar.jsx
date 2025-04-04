// src/layouts/Navbar.jsx
import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Settings, ChevronDown, LogOut, UserCircle, LogIn, ShieldCheck } from 'lucide-react'; // Added ShieldCheck for admin
import useAuthStore from '@/stores/useAuthStore';

const Navbar = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const navigate = useNavigate();

  // Select state and actions individually
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const isAdmin = useAuthStore(state => state.isAdmin()); // Get admin status using the store function

  const toggleSettings = () => {
    setIsSettingsOpen((prev) => !prev);
  };

  const handleLogout = () => {
      logout();
      setIsSettingsOpen(false); // Close dropdown
      navigate('/'); // Navigate to home page after logout
  };

  const closeDropdown = () => setIsSettingsOpen(false);

  // NavLink class function
  const getNavLinkClass = ({ isActive }) => {
    return isActive
      ? "text-white bg-[#b89e89] px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150"
      : "text-white hover:bg-[#c1a389]/50 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150";
  };

  return (
    <nav className="bg-[#D1B399] p-4 flex justify-between items-center shadow-md">
      {/* Logo */}
      <Link to="/" className="text-2xl font-bold text-white tracking-tight">
        DOOF
      </Link>

      {/* Navigation Links & User Section */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        {/* Common Links */}
        <NavLink to="/trending" className={getNavLinkClass}>
          Trending
        </NavLink>
        {/* Add other public links here if needed */}

        {/* Conditional Links based on Auth State */}
        {isAuthenticated ? (
          <>
            {/* Links for logged-in users */}
            <NavLink to="/lists" className={getNavLinkClass}>
              My Lists
            </NavLink>
            <NavLink to="/dashboard" className={getNavLinkClass}>
              Submissions
            </NavLink>

            {/* User/Settings Dropdown */}
            <div className="relative">
              <button
                onClick={toggleSettings}
                className="text-white hover:bg-[#c1a389]/50 p-1.5 rounded-full flex items-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#D1B399] focus:ring-white"
                aria-haspopup="true"
                aria-expanded={isSettingsOpen}
                title={user?.username || 'User Menu'}
              >
                <UserCircle size={22} />
                <ChevronDown size={16} className="ml-1" />
              </button>
              {isSettingsOpen && (
                <div
                  className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-20"
                  role="menu"
                  aria-orientation="vertical"
                  tabIndex="-1"
                  // Optional: Add onBlur to close dropdown
                  // onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) { closeDropdown(); } }}
                >
                  {/* Display username */}
                  {user?.username && (
                      <span className="block px-4 py-2 text-sm text-gray-500 truncate border-b border-gray-100 mb-1" role="none">
                          Hi, {user.username}
                      </span>
                  )}
                  {/* Admin Panel Link - Conditionally Rendered */}
                  {isAdmin && (
                     <Link
                       to="/admin"
                       onClick={closeDropdown} // Close dropdown on click
                       className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                       role="menuitem"
                       tabIndex="-1"
                     >
                        <span className="flex items-center gap-2">
                            <ShieldCheck size={16} className="text-blue-600"/> Admin Panel
                        </span>
                     </Link>
                  )}

                  {/* Separator if admin link was shown */}
                  {isAdmin && <div className="border-t border-gray-100 my-1" role="separator"></div>}

                  {/* Standard Settings/Profile Link (Example) */}
                   {/*
                   <Link
                     to="/settings" // Example path
                     onClick={closeDropdown}
                     className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                     role="menuitem"
                     tabIndex="-1"
                   >
                      <span className="flex items-center gap-2"><Settings size={16} /> Settings</span>
                   </Link>
                   */}

                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    role="menuitem"
                    tabIndex="-1"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Links for logged-out users */}
            <NavLink to="/login" className={getNavLinkClass}>
               <span className="flex items-center gap-1"><LogIn size={16} /> Login</span>
            </NavLink>
            <NavLink to="/register" className="text-white bg-white/20 hover:bg-white/30 px-3 py-2 rounded-md text-sm font-medium">
                Sign Up
            </NavLink>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;