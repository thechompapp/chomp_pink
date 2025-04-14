/* src/layouts/Navbar.jsx */
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '@/stores/useAuthStore';
import SearchBar from '@/components/UI/SearchBar.jsx';
import Button from '@/components/UI/Button.jsx'; // Assuming Button is not used directly here anymore
import { Home, TrendingUp, List, LogIn, UserPlus, LogOut, Settings, ShieldCheck, UploadCloud, DatabaseZap, User } from 'lucide-react';

// NavLink Component (No changes needed from previous versions)
const NavLink = ({ to, children, Icon }) => {
  const location = useLocation();
  const toPath = typeof to === 'string' ? to : '';
  const isActive = location.pathname === toPath || (toPath !== '/' && location.pathname.startsWith(toPath + '/'));

  return (
    <Link
      to={to}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${ // Added whitespace-nowrap
        isActive ? 'bg-black/10 text-white' : 'text-white/80 hover:text-white hover:bg-black/5'
      }`}
      aria-current={isActive ? 'page' : undefined}
    >
      {Icon && <Icon size={16} aria-hidden="true" className="flex-shrink-0" />} {/* Added flex-shrink-0 */}
      {children}
    </Link>
  );
};

// DropdownLink Component (No changes needed from previous versions)
const DropdownLink = ({ to, children, Icon, onClick }) => {
    const location = useLocation();
    const toPath = typeof to === 'string' ? to : '';
    const isActive = location.pathname === toPath || (toPath !== '/' && location.pathname.startsWith(toPath + '/'));
    return (
        <Link
          to={to}
          onClick={onClick}
          className={`flex items-center gap-2 w-full px-4 py-2 text-left text-sm transition-colors ${ isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}`}
          role="menuitem"
        >
          {Icon && <Icon size={16} className="text-gray-500 flex-shrink-0" />}
          {children}
        </Link>
    );
};


const Navbar = () => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const logout = useAuthStore(state => state.logout);
  const user = useAuthStore(state => state.user);
  const isSuperuser = useAuthStore(state => state.isSuperuser); // Get the function

  const navigate = useNavigate();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsRef = useRef(null);

  const handleLogout = useCallback(() => {
    logout();
    setIsSettingsOpen(false);
    navigate('/login');
  }, [logout, navigate]);

  const closeDropdown = useCallback(() => setIsSettingsOpen(false), []);
  const toggleSettings = useCallback(() => setIsSettingsOpen(prev => !prev), []);

  useEffect(() => {
     const handleClickOutside = (event) => {
       if (settingsRef.current && !settingsRef.current.contains(event.target)) {
         setIsSettingsOpen(false);
       }
     };
     if (isSettingsOpen) document.addEventListener('mousedown', handleClickOutside);
     return () => document.removeEventListener('mousedown', handleClickOutside);
   }, [isSettingsOpen]);

  return (
    <nav className="bg-[#D1B399] p-3 shadow-md sticky top-0 z-30">
      {/* Changed max-w-7xl to max-w-full for full width */}
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center gap-4">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold text-white flex-shrink-0">DOOF</Link>

        {/* Search Bar - Adjusted width constraints */}
        <div className="flex-1 min-w-0 max-w-xl mx-4"><SearchBar /></div>

        {/* Navigation Links & Actions - Adjusted spacing */}
        <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0"> {/* Consistent spacing */}
          <NavLink to="/" Icon={Home}>Home</NavLink>
          <NavLink to="/trending" Icon={TrendingUp}>Trending</NavLink>
          {isAuthenticated ? (
            <>
              <NavLink to="/lists" Icon={List}>My Lists</NavLink>
              {/* Call isSuperuser function */}
              {isSuperuser() && <NavLink to="/admin" Icon={ShieldCheck}>Admin Panel</NavLink>}
              <NavLink to="/profile" Icon={User}>Profile</NavLink>

              {/* Settings Dropdown - Adjusted trigger button styling */}
              <div className="relative" ref={settingsRef}>
                <button
                    onClick={toggleSettings}
                    type="button"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium text-white/80 hover:text-white hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#D1B399] focus:ring-white"
                    aria-expanded={isSettingsOpen}
                    aria-haspopup="true"
                    aria-controls="settings-menu"
                >
                  <Settings size={16} />
                  <span className="hidden sm:inline">{user?.username || 'Settings'}</span> {/* Hide text on small screens */}
                </button>

                {isSettingsOpen && (
                  <div
                    id="settings-menu"
                    className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none py-1 z-40"
                    role="menu"
                    aria-orientation="vertical"
                    tabIndex="-1"
                  >
                     {/* User Info */}
                     <div className="px-4 py-2 border-b border-gray-100">
                         <p className="text-sm font-medium text-gray-900 truncate">Signed in as</p>
                         <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                     </div>
                     {/* Links */}
                     <div className="py-1" role="none">
                        <DropdownLink to="/dashboard" Icon={UploadCloud} onClick={closeDropdown}>My Submissions</DropdownLink>
                        {isSuperuser() && (
                            <>
                                {/* No changes needed inside dropdown */}
                                <DropdownLink to="/admin" Icon={ShieldCheck} onClick={closeDropdown}>Admin Panel</DropdownLink>
                                <DropdownLink to="/bulk-add" Icon={DatabaseZap} onClick={closeDropdown}>Bulk Add Tool</DropdownLink>
                            </>
                        )}
                     </div>
                      {/* Logout */}
                     <div className="py-1 border-t border-gray-100" role="none">
                         <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
                            role="menuitem"
                            tabIndex="-1" // Added for accessibility if needed
                         >
                            <LogOut size={16} className="text-red-500" /> Logout
                          </button>
                      </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            // Logged out links
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

export default React.memo(Navbar);