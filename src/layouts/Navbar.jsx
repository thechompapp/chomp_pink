// src/layouts/Navbar.jsx
import React, { useState } from 'react'; // Added useState for dropdown
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '@/stores/useAuthStore';
import SearchBar from '@/components/UI/SearchBar';
import { Home, TrendingUp, List, LogIn, UserPlus, LogOut, Settings, ShieldCheck, UploadCloud, DatabaseZap } from 'lucide-react'; // Added Settings, UploadCloud, DatabaseZap

// NavLink component remains the same
const NavLink = ({ to, children, Icon }) => {
    const location = useLocation();
    const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to + '/'));
    return (
        <Link
            to={to}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                ? 'bg-black/10 text-white'
                : 'text-white/80 hover:text-white hover:bg-black/5'
            }`}
        >
            {Icon && <Icon size={16} />}
            {children}
        </Link>
    );
};

// Dropdown Link component for reuse inside dropdown
const DropdownLink = ({ to, children, Icon, onClick }) => {
     const location = useLocation();
     const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to + '/'));
    return (
        <Link
            to={to}
            onClick={onClick} // Allow closing dropdown on click
            className={`flex items-center gap-2 w-full px-4 py-2 text-left text-sm transition-colors ${
                isActive
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
            role="menuitem"
        >
            {Icon && <Icon size={16} className="text-gray-500" />}
            {children}
        </Link>
    );
};


const Navbar = () => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const logout = useAuthStore(state => state.logout);
  const user = useAuthStore(state => state.user); // Get user info conditionally if needed
  const showAdmin = user?.role === 'admin'; // Assuming role exists on user object

  const navigate = useNavigate();
  // State to control dropdown visibility
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Close dropdown when an item is clicked
  const closeDropdown = () => {
      setIsSettingsOpen(false);
  }

  return (
    <nav className="bg-[#D1B399] p-3 shadow-md sticky top-0 z-30">
      <div className="container mx-auto flex justify-between items-center gap-4">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold text-white flex-shrink-0">
          DOOF
        </Link>

        {/* Search Bar */}
        <div className="flex-1 min-w-0 px-4 md:px-8">
          <SearchBar />
        </div>

        {/* Navigation Links & Auth */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <NavLink to="/" Icon={Home}>Home</NavLink>
          <NavLink to="/trending" Icon={TrendingUp}>Trending</NavLink>
          {isAuthenticated ? (
            <>
              <NavLink to="/lists" Icon={List}>My Lists</NavLink>
              {showAdmin && <NavLink to="/admin" Icon={ShieldCheck}>Admin Panel</NavLink>}

              {/* --- Settings Dropdown --- */}
              <div className="relative">
                 {/* Settings Button */}
                <button
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                    onBlur={() => setTimeout(() => setIsSettingsOpen(false), 150)} // Close on blur with delay
                    type="button"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors text-white/80 hover:text-white hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-white/50"
                    aria-expanded={isSettingsOpen}
                    aria-haspopup="true"
                >
                    <Settings size={16} />
                    <span>Settings</span>
                    {/* Optional: Add dropdown icon */}
                    {/* <ChevronDown size={14} className={`ml-1 transition-transform ${isSettingsOpen ? 'rotate-180' : ''}`} /> */}
                </button>

                {/* Dropdown Menu */}
                {isSettingsOpen && (
                    <div
                        className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none py-1 z-40" // Ensure high z-index
                        role="menu"
                        aria-orientation="vertical"
                        aria-labelledby="settings-menu-button" // Needs an id on the button if using aria-labelledby
                        tabIndex="-1"
                    >
                        <DropdownLink to="/dashboard" Icon={UploadCloud} onClick={closeDropdown}>
                            Submissions
                        </DropdownLink>
                        {/* Add Bulk Add link - assuming route will be /bulk-add */}
                         <DropdownLink to="/bulk-add" Icon={DatabaseZap} onClick={closeDropdown}>
                            Bulk Add
                        </DropdownLink>
                        {/* Add other settings links here if needed */}
                    </div>
                )}
              </div>
              {/* --- End Settings Dropdown --- */}

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors text-white/80 hover:text-white hover:bg-black/5"
                title={`Logged in as ${user?.username || ''}`}
              >
                <LogOut size={16} />
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" Icon={LogIn}>Login</NavLink>
              <NavLink to="/register" Icon={UserPlus}>Register</NavLink>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar; // No need for memo here usually