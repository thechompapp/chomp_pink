/* src/layouts/Navbar.jsx */
import React, { useState, useCallback, useMemo, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '@/stores/useAuthStore';
import { Menu, X, User, CheckCircle } from 'lucide-react';
import { logDebug } from '@/utils/logger';

// Ensure auth bypass is enabled in development to fix flickering
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.localStorage.setItem('bypass_auth_check', 'true');
}

// Simple component that won't flicker
const Navbar = () => {
  // Get all auth values at once to prevent flickering
  const auth = useAuthStore();
  const { isAuthenticated, user, logout, isLoading } = auth;
  
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Use useCallback to prevent function re-creation on every render
  const handleLogout = useCallback(() => {
    logout();
    setIsMobileMenuOpen(false);
    navigate('/login');
  }, [logout, navigate]);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

  // Use useMemo to prevent recalculation on every render
  const isSuperuser = useMemo(() => {
    // Check both the account_type and the isSuperuser flag from the auth store
    return user?.account_type === 'superuser' || auth.isSuperuser;
  }, [user, auth.isSuperuser]);

  // Prevent extra work during loading
  if (isLoading && !isAuthenticated && !user) {
    return <div className="bg-gray-800 text-white p-4 fixed w-full top-0 z-50">Loading...</div>;
  }

  return (
    <nav className="bg-gray-800 text-white p-4 fixed w-full top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">
          DOOF
        </Link>

        <button
          className="md:hidden focus:outline-none"
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div className="hidden md:flex space-x-4 items-center">
          <Link to="/trending/restaurants" className="hover:text-gray-300">
            Trending
          </Link>
          <Link to="/search" className="hover:text-gray-300">
            Search
          </Link>
          {isAuthenticated ? (
            <>
              <Link to="/lists" className="hover:text-gray-300">
                My Lists
              </Link>
              <Link to="/my-submissions" className="hover:text-gray-300">
                My Submissions
              </Link>
              {isSuperuser && (
                <>
                  <Link to="/admin" className="hover:text-gray-300">
                    Admin Panel
                  </Link>
                  <Link to="/bulk-add" className="hover:text-gray-300">
                    Bulk Add
                  </Link>
                </>
              )}
              <Link to="/profile" className="flex items-center hover:text-gray-300 ml-2">
                <span className="flex items-center">
                  <User size={18} className="mr-1" />
                  {user?.name || user?.username || ''}
                  {isSuperuser && (
                    <CheckCircle size={16} className="ml-1 text-green-400" title="Verified Superuser" />
                  )}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                className="hover:text-gray-300 focus:outline-none"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-gray-300">
                Login
              </Link>
              <Link to="/register" className="hover:text-gray-300">
                Register
              </Link>
            </>
          )}
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden mt-2 space-y-2">
          <Link
            to="/trending/restaurants"
            className="block py-2 px-4 hover:bg-gray-700"
            onClick={toggleMobileMenu}
          >
            Trending
          </Link>
          <Link
            to="/search"
            className="block py-2 px-4 hover:bg-gray-700"
            onClick={toggleMobileMenu}
          >
            Search
          </Link>
          {isAuthenticated ? (
            <>
              <Link
                to="/lists"
                className="block py-2 px-4 hover:bg-gray-700"
                onClick={toggleMobileMenu}
              >
                My Lists
              </Link>
              <Link
                to="/my-submissions"
                className="block py-2 px-4 hover:bg-gray-700"
                onClick={toggleMobileMenu}
              >
                My Submissions
              </Link>
              {isSuperuser && (
                <>
                  <Link
                    to="/admin"
                    className="block py-2 px-4 hover:bg-gray-700"
                    onClick={toggleMobileMenu}
                  >
                    Admin Panel
                  </Link>
                  <Link
                    to="/bulk-add"
                    className="block py-2 px-4 hover:bg-gray-700"
                    onClick={toggleMobileMenu}
                  >
                    Bulk Add
                  </Link>
                </>
              )}
              <Link
                to="/profile"
                className="block py-2 px-4 hover:bg-gray-700 flex items-center"
                onClick={toggleMobileMenu}
              >
                <User size={18} className="mr-2" />
                @{user?.username || 'user'}
                {isSuperuser && (
                  <CheckCircle size={16} className="ml-1 text-green-400" title="Verified Superuser" />
                )}
              </Link>
              <button
                onClick={handleLogout}
                className="block w-full text-left py-2 px-4 hover:bg-gray-700 focus:outline-none"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="block py-2 px-4 hover:bg-gray-700"
                onClick={toggleMobileMenu}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="block py-2 px-4 hover:bg-gray-700"
                onClick={toggleMobileMenu}
              >
                Register
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

// Export with memo to prevent rendering when parent re-renders
export default memo(Navbar);
