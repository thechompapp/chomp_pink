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
    return (
      <div className="bg-primary text-primary-foreground p-4 fixed w-full top-0 z-50">
        Loading...
      </div>
    );
  }

  return (
    <nav className="bg-primary text-primary-foreground p-4 fixed w-full top-0 z-50 shadow-sm">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-primary-foreground hover:text-primary-foreground/90 transition-colors">
          DOOF
        </Link>

        <button
          className="md:hidden focus:outline-none text-primary-foreground hover:text-primary-foreground/90 transition-colors"
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div className="hidden md:flex space-x-6 items-center">
          <Link 
            to="/trending/restaurants" 
            className="text-primary-foreground hover:text-primary-foreground/90 transition-colors"
          >
            Trending
          </Link>
          <Link 
            to="/search" 
            className="text-primary-foreground hover:text-primary-foreground/90 transition-colors"
          >
            Search
          </Link>
          {isAuthenticated ? (
            <>
              <Link 
                to="/lists" 
                className="text-primary-foreground hover:text-primary-foreground/90 transition-colors"
              >
                Lists
              </Link>
              {isSuperuser && (
                <>
                  <Link 
                    to="/admin" 
                    className="text-primary-foreground hover:text-primary-foreground/90 transition-colors"
                  >
                    Admin
                  </Link>
                  <Link 
                    to="/bulk-add" 
                    className="text-primary-foreground hover:text-primary-foreground/90 transition-colors"
                  >
                    Bulk Add
                  </Link>
                </>
              )}
              <Link
                to="/profile"
                className="flex items-center text-primary-foreground hover:text-primary-foreground/90 transition-colors"
              >
                <User size={18} className="mr-2" />
                @{user?.username || 'user'}
                {isSuperuser && (
                  <CheckCircle size={16} className="ml-1 text-green-400" title="Verified Superuser" />
                )}
              </Link>
              <button
                onClick={handleLogout}
                className="text-primary-foreground hover:text-primary-foreground/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-foreground/20 rounded-sm px-2 py-1"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link 
                to="/login" 
                className="text-primary-foreground hover:text-primary-foreground/90 transition-colors"
              >
                Login
              </Link>
              <Link 
                to="/register" 
                className="text-primary-foreground hover:text-primary-foreground/90 transition-colors"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-primary border-t border-primary-foreground/10 shadow-lg">
          <div className="container mx-auto py-2">
            <Link
              to="/trending/restaurants"
              className="block py-2 px-4 text-primary-foreground hover:bg-primary-foreground/10 transition-colors"
              onClick={toggleMobileMenu}
            >
              Trending
            </Link>
            <Link
              to="/search"
              className="block py-2 px-4 text-primary-foreground hover:bg-primary-foreground/10 transition-colors"
              onClick={toggleMobileMenu}
            >
              Search
            </Link>
            {isAuthenticated ? (
              <>
                <Link
                  to="/lists"
                  className="block py-2 px-4 text-primary-foreground hover:bg-primary-foreground/10 transition-colors"
                  onClick={toggleMobileMenu}
                >
                  Lists
                </Link>
                {isSuperuser && (
                  <>
                    <Link
                      to="/admin"
                      className="block py-2 px-4 text-primary-foreground hover:bg-primary-foreground/10 transition-colors"
                      onClick={toggleMobileMenu}
                    >
                      Admin
                    </Link>
                    <Link
                      to="/bulk-add"
                      className="block py-2 px-4 text-primary-foreground hover:bg-primary-foreground/10 transition-colors"
                      onClick={toggleMobileMenu}
                    >
                      Bulk Add
                    </Link>
                  </>
                )}
                <Link
                  to="/profile"
                  className="block py-2 px-4 text-primary-foreground hover:bg-primary-foreground/10 transition-colors"
                  onClick={toggleMobileMenu}
                >
                  <div className="flex items-center">
                    <User size={18} className="mr-2" />
                    @{user?.username || 'user'}
                    {isSuperuser && (
                      <CheckCircle size={16} className="ml-1 text-green-400" title="Verified Superuser" />
                    )}
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left py-2 px-4 text-primary-foreground hover:bg-primary-foreground/10 transition-colors focus:outline-none"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block py-2 px-4 text-primary-foreground hover:bg-primary-foreground/10 transition-colors"
                  onClick={toggleMobileMenu}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="block py-2 px-4 text-primary-foreground hover:bg-primary-foreground/10 transition-colors"
                  onClick={toggleMobileMenu}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

// Export with memo to prevent rendering when parent re-renders
export default memo(Navbar);
