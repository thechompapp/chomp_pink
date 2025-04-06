// src/layouts/Navbar.jsx
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '@/stores/useAuthStore';
import SearchBar from '@/components/UI/SearchBar';
import { Home, TrendingUp, List, LogIn, UserPlus, LogOut, Settings, ShieldCheck } from 'lucide-react'; // Removed PlusCircle

const NavLink = ({ to, children, Icon }) => {
    const location = useLocation();
    // Handle potential trailing slash issues if needed
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


const Navbar = () => {
  // --- Select only the primitive and stable logout function ---
  // We get the user object later only if needed inside conditional rendering
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const logout = useAuthStore(state => state.logout);
  // --- Avoid selecting user object or isAdmin function directly here ---

  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // --- Get user/admin status *inside* the conditional block ---
  // This selector runs less often than one at the top level
  const user = useAuthStore(state => state.user); // Get user only when rendering the authenticated part
  const showAdmin = user?.role === 'admin'; // Example: derive admin status here
  // -------------------------------------------------------------


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
              {showAdmin && <NavLink to="/admin" Icon={ShieldCheck}>Admin</NavLink>}
              <NavLink to="/dashboard" Icon={Settings}>Submissions</NavLink>

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

export default Navbar;