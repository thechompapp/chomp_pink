import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '@/stores/useAuthStore';
import SearchBar from '@/components/UI/SearchBar';
import { Home, TrendingUp, List, LogIn, UserPlus, LogOut, Settings, ShieldCheck, UploadCloud, DatabaseZap, User } from 'lucide-react';

const NavLink = ({ to, children, Icon }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to + '/'));
  return (
    <Link
      to={to}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
        isActive ? 'bg-black/10 text-white' : 'text-white/80 hover:text-white hover:bg-black/5'
      }`}
    >
      {Icon && <Icon size={16} />}
      {children}
    </Link>
  );
};

const DropdownLink = ({ to, children, Icon, onClick }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to + '/'));
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-2 w-full px-4 py-2 text-left text-sm transition-colors ${
        isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
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
  const user = useAuthStore(state => state.user);
  const showAdmin = user?.account_type === 'superuser';

  const navigate = useNavigate();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeDropdown = () => {
    setIsSettingsOpen(false);
  };

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
              {showAdmin && <NavLink to="/admin" Icon={ShieldCheck}>Admin Panel</NavLink>}
              <NavLink to="/profile" Icon={User}>Profile</NavLink>

              <div className="relative">
                <button
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                  onBlur={() => setTimeout(() => setIsSettingsOpen(false), 150)}
                  type="button"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors text-white/80 hover:text-white hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-white/50"
                  aria-expanded={isSettingsOpen}
                  aria-haspopup="true"
                >
                  <Settings size={16} />
                  <span>Settings</span>
                </button>

                {isSettingsOpen && (
                  <div
                    className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none py-1 z-40"
                    role="menu"
                    aria-orientation="vertical"
                    tabIndex="-1"
                  >
                    <DropdownLink to="/dashboard" Icon={UploadCloud} onClick={closeDropdown}>
                      Submissions
                    </DropdownLink>
                    <DropdownLink to="/bulk-add" Icon={DatabaseZap} onClick={closeDropdown}>
                      Bulk Add
                    </DropdownLink>
                  </div>
                )}
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors text-white/80 hover:text-white hover:bg-black/5"
                title={`Logged in as ${user?.handle || ''}`}
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

export default Navbar;