// src/layouts/Navbar.jsx
import React, { useState, useCallback } from 'react'; // Added useCallback
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '@/stores/useAuthStore';
import SearchBar from '@/components/UI/SearchBar.jsx'; // Use alias and extension
import Button from '@/components/UI/Button.jsx'; // <<<<< CORRECTED IMPORT PATH
import { Home, TrendingUp, List, LogIn, UserPlus, LogOut, Settings, ShieldCheck, UploadCloud, DatabaseZap, User } from 'lucide-react';

const NavLink = ({ to, children, Icon }) => {
  const location = useLocation();
  // Ensure 'to' is a string before calling startsWith
  const toPath = typeof to === 'string' ? to : '';
  // Corrected isActive logic for nested routes
  const isActive = location.pathname === toPath || (toPath !== '/' && location.pathname.startsWith(toPath + '/'));

  return (
    <Link
      to={to}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
        isActive ? 'bg-black/10 text-white' : 'text-white/80 hover:text-white hover:bg-black/5'
      }`}
      aria-current={isActive ? 'page' : undefined} // Add aria-current for accessibility
    >
      {Icon && <Icon size={16} aria-hidden="true" />}
      {children}
    </Link>
  );
};

const DropdownLink = ({ to, children, Icon, onClick }) => {
  const location = useLocation();
   // Ensure 'to' is a string before calling startsWith
  const toPath = typeof to === 'string' ? to : '';
  const isActive = location.pathname === toPath || (toPath !== '/' && location.pathname.startsWith(toPath + '/'));
  return (
    <Link
      to={to}
      onClick={onClick} // Ensure onClick is passed to close dropdown
      className={`flex items-center gap-2 w-full px-4 py-2 text-left text-sm transition-colors ${
        isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
      }`}
      role="menuitem"
    >
      {Icon && <Icon size={16} className="text-gray-500" aria-hidden="true" />}
      {children}
    </Link>
  );
};

const Navbar = () => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const logout = useAuthStore(state => state.logout);
  const user = useAuthStore(state => state.user);
  const isSuperuser = useAuthStore(state => state.isSuperuser); // Get the function itself

  const navigate = useNavigate();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // useCallback for stable function references
  const handleLogout = useCallback(() => {
    logout();
    setIsSettingsOpen(false); // Close dropdown on logout
    navigate('/login');
  }, [logout, navigate]); // Dependencies

  const closeDropdown = useCallback(() => {
    setIsSettingsOpen(false);
  }, []); // Stable function

  const toggleSettings = useCallback(() => {
    setIsSettingsOpen(prev => !prev);
  }, []); // Stable function

  // Blur handler to close dropdown, slight delay to allow clicks
  const handleBlur = useCallback((e) => {
       // Check if the related target (where focus is moving to) is inside the dropdown menu container
      if (e.currentTarget && !e.currentTarget.contains(e.relatedTarget)) {
           // Use requestAnimationFrame to delay check slightly, ensuring click events register
           requestAnimationFrame(() => {
                 // Double check if menu should still be open after the potential click
                 // This part might need refinement depending on exact focus behavior
                  // setIsSettingsOpen(false); // Simpler approach: just close on blur outside
                  // Use timeout for robustness against quick focus shifts
                   setTimeout(() => {
                       // Check if focus is still outside before closing
                       if (document.activeElement && !e.currentTarget.contains(document.activeElement)) {
                            setIsSettingsOpen(false);
                       }
                   }, 150); // Delay allows link clicks inside dropdown to register
           });

      }
  }, []); // Dependencies


  return (
    <nav className="bg-[#D1B399] p-3 shadow-md sticky top-0 z-30">
      <div className="container mx-auto flex justify-between items-center gap-4">
        <Link to="/" className="text-2xl font-bold text-white flex-shrink-0">
          DOOF
        </Link>

        <div className="flex-1 min-w-0 px-4 md:px-8">
          <SearchBar />
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <NavLink to="/" Icon={Home}>Home</NavLink>
          <NavLink to="/trending" Icon={TrendingUp}>Trending</NavLink>
          {isAuthenticated ? (
            <>
              <NavLink to="/lists" Icon={List}>My Lists</NavLink>
              {/* Call isSuperuser() to check */}
              {isSuperuser() && <NavLink to="/admin" Icon={ShieldCheck}>Admin Panel</NavLink>}
              <NavLink to="/profile" Icon={User}>Profile</NavLink>

              {/* Settings Dropdown with focus management */}
              <div className="relative" onBlur={handleBlur}> {/* Add onBlur to the container */}
                <button
                  onClick={toggleSettings}
                  type="button"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors text-white/80 hover:text-white hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-white/50"
                  aria-expanded={isSettingsOpen}
                  aria-haspopup="true"
                  aria-controls="settings-menu" // Added aria-controls
                >
                  <Settings size={16} />
                  {/* Display username in settings button */}
                  <span>{user?.username || 'Settings'}</span>
                </button>

                {isSettingsOpen && (
                  <div
                    id="settings-menu" // Added id for aria-controls
                    className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none py-1 z-40" // Increased width
                    role="menu"
                    aria-orientation="vertical"
                    tabIndex="-1"
                  >
                    {/* User Info */}
                     <div className="px-4 py-2 border-b border-gray-100">
                         <p className="text-sm font-medium text-gray-900 truncate">Signed in as</p>
                         <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                     </div>
                     <div className="py-1" role="none"> {/* Group links */}
                        {/* Pass closeDropdown to onClick of each link */}
                        <DropdownLink to="/dashboard" Icon={UploadCloud} onClick={closeDropdown}>
                          My Submissions
                        </DropdownLink>
                        {/* Show Admin links only to superusers */}
                        {isSuperuser() && (
                            <>
                                <DropdownLink to="/admin" Icon={ShieldCheck} onClick={closeDropdown}>
                                Admin Panel
                                </DropdownLink>
                                <DropdownLink to="/bulk-add" Icon={DatabaseZap} onClick={closeDropdown}>
                                Bulk Add Tool
                                </DropdownLink>
                            </>
                        )}
                     </div>
                      {/* Logout */}
                     <div className="py-1 border-t border-gray-100" role="none">
                         <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
                            role="menuitem"
                          >
                            <LogOut size={16} className="text-red-500" />
                            Logout
                          </button>
                      </div>
                  </div>
                )}
              </div>
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

export default React.memo(Navbar); // Memoize Navbar