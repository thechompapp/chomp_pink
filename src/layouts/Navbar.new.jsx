/* src/layouts/Navbar.jsx */
import React, { useState, useCallback, useMemo, memo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, User } from 'lucide-react';
import { useAuth } from '@/contexts/auth';
import { useAdminAuth } from '@/hooks/auth';
import { logInfo, logDebug } from '@/utils/logger';
import { DesktopAdminNavbarLinks, MobileAdminNavbarLinks, AdminBadge } from '@/components/AdminNavbarLinks';

/**
 * Navbar Component
 * Uses the new authentication context for auth state and operations
 */
const Navbar = () => {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    logout,
    isSuperuser,
    superuserStatusReady,
    isOffline
  } = useAuth();
  
  const { isAdmin } = useAdminAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // For forcing re-renders

  /**
   * Listen for UI refresh requests
   */
  useEffect(() => {
    const handleForceRefresh = () => {
      try {
        logDebug('[Navbar] Force UI refresh event received');
        setRefreshKey(prev => prev + 1);
      } catch (error) {
        logDebug('[Navbar] Error handling force refresh event:', error);
      }
    };
    
    // Add window event listener
    if (typeof window !== 'undefined') {
      window.addEventListener('forceUiRefresh', handleForceRefresh);
    }
    
    // Clean up on unmount
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('forceUiRefresh', handleForceRefresh);
      }
    };
  }, []);

  /**
   * Handle logout action
   */
  const handleLogout = useCallback(async () => {
    try {
      await logout();
      setIsMobileMenuOpen(false);
      navigate('/login');
    } catch (error) {
      logDebug('[Navbar] Error during logout:', error);
    }
  }, [logout, navigate]);

  /**
   * Toggle mobile menu
   */
  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

  // Show simplified navbar during loading
  if (isLoading && !isAuthenticated && !user) {
    return (
      <div className="bg-primary text-primary-foreground p-4 fixed w-full top-0 z-50">
        Loading...
      </div>
    );
  }

  return (
    <div className="bg-primary text-primary-foreground p-4 fixed w-full top-0 z-50">
      <div className="flex justify-between items-center">
        {/* Logo and brand */}
        <div className="flex items-center">
          <Link to="/" className="text-2xl font-bold text-primary-foreground">
            FoodApp
          </Link>
          
          {/* Offline indicator */}
          {isOffline && (
            <span className="ml-2 text-xs bg-yellow-500 text-yellow-900 px-2 py-1 rounded-full">
              Offline
            </span>
          )}
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex space-x-4 items-center">
          <Link 
            to="/" 
            className="text-primary-foreground hover:text-primary-foreground/90 transition-colors"
          >
            Home
          </Link>
          {isAuthenticated ? (
            <>
              <Link 
                to="/lists" 
                className="text-primary-foreground hover:text-primary-foreground/90 transition-colors"
              >
                Lists
              </Link>
              
              <Link 
                to="/my-lists" 
                className="text-primary-foreground hover:text-primary-foreground/90 transition-colors"
              >
                My Lists
              </Link>
              
              {/* Admin links */}
              {isAdmin && (
                <Link 
                  to="/admin" 
                  className="text-primary-foreground hover:text-primary-foreground/90 transition-colors"
                >
                  Admin
                </Link>
              )}
              
              <Link
                to="/profile"
                className="flex items-center text-primary-foreground hover:text-primary-foreground/90 transition-colors"
              >
                <User size={18} className="mr-2" />
                {user?.name || 'User'}
                {isSuperuser && (
                  <span className="ml-2 text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                    Admin
                  </span>
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
                Sign In
              </Link>
              <Link 
                to="/register" 
                className="bg-white text-primary hover:bg-white/90 px-4 py-2 rounded-md transition-colors"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden">
          <button
            onClick={toggleMobileMenu}
            className="text-primary-foreground focus:outline-none focus:ring-2 focus:ring-primary-foreground/20 rounded-sm p-1"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden mt-4 space-y-2">
          <Link 
            to="/" 
            className="block text-primary-foreground hover:text-primary-foreground/90 transition-colors py-2"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Home
          </Link>
          {isAuthenticated ? (
            <>
              <Link 
                to="/lists" 
                className="block text-primary-foreground hover:text-primary-foreground/90 transition-colors py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Lists
              </Link>
              
              <Link 
                to="/my-lists" 
                className="block text-primary-foreground hover:text-primary-foreground/90 transition-colors py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                My Lists
              </Link>
              
              {/* Admin links */}
              {isAdmin && (
                <Link 
                  to="/admin" 
                  className="block text-primary-foreground hover:text-primary-foreground/90 transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Admin
                </Link>
              )}
              
              <Link
                to="/profile"
                className="flex items-center text-primary-foreground hover:text-primary-foreground/90 transition-colors py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <User size={18} className="mr-2" />
                {user?.name || 'User'}
                {isSuperuser && (
                  <span className="ml-2 text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                    Admin
                  </span>
                )}
              </Link>
              
              <button
                onClick={handleLogout}
                className="block w-full text-left text-primary-foreground hover:text-primary-foreground/90 transition-colors py-2"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link 
                to="/login" 
                className="block text-primary-foreground hover:text-primary-foreground/90 transition-colors py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link 
                to="/register" 
                className="block text-primary-foreground hover:text-primary-foreground/90 transition-colors py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default memo(Navbar);
