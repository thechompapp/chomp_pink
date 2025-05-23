// src/layouts/Navbar.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/auth';
import { useAdminAuth } from '../hooks/useAdminAuth';
import Button from '../components/UI/Button';
import { logDebug, logInfo } from '../utils/logger';
import { debounce } from '../utils/helpers';
import offlineModeGuard from '../utils/offlineModeGuard';

// Constants
const SCROLL_THRESHOLD = 50;
const DEBOUNCE_DELAY = 100;

/**
 * Navbar Component
 * Uses the new authentication context for user state and logout functionality
 */
const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  
  // Use the new authentication context
  const { isAuthenticated, user, logout, isLoading } = useAuth();
  
  // Use the admin hook for permission checks
  const adminAuth = useAdminAuth();
  
  // Check if user has admin access
  const isAdmin = user && adminAuth.can('admin.access');
  
  /**
   * Toggle mobile menu
   */
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    // Close profile menu if open
    if (isProfileMenuOpen) setIsProfileMenuOpen(false);
  };
  
  /**
   * Toggle profile menu
   */
  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
    // Close mobile menu if open
    if (isMenuOpen) setIsMenuOpen(false);
  };
  
  /**
   * Close all menus
   */
  const closeMenus = useCallback(() => {
    setIsMenuOpen(false);
    setIsProfileMenuOpen(false);
  }, []);
  
  /**
   * Handle scroll events to update navbar styling
   */
  const handleScroll = useCallback(
    debounce(() => {
      if (window.scrollY > SCROLL_THRESHOLD) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    }, DEBOUNCE_DELAY),
    []
  );
  
  /**
   * Handle logout action
   */
  const handleLogout = async () => {
    logInfo('[Navbar] Logout initiated');
    
    try {
      await logout();
      
      // Clear offline mode flags after logout
      if (offlineModeGuard && typeof offlineModeGuard.clearOfflineModeFlags === 'function') {
        logDebug('[Navbar] Clearing offline mode flags after logout');
        offlineModeGuard.clearOfflineModeFlags();
      }
      
      // Close menus
      closeMenus();
      
      // Navigate to home page
      navigate('/');
      
      // Force UI refresh event
      window.dispatchEvent(new CustomEvent('forceUiRefresh', {
        detail: { timestamp: Date.now() }
      }));
    } catch (error) {
      console.error('[Navbar] Error during logout:', error);
    }
  };
  
  // Setup scroll event listener
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);
  
  // Close menus on route change
  useEffect(() => {
    closeMenus();
  }, [location.pathname, closeMenus]);
  
  // Render loading state during authentication check
  if (isLoading) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-card shadow-md h-16 flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-6 w-24 bg-muted rounded"></div>
        </div>
      </nav>
    );
  }
  
  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-card/95 backdrop-blur-sm shadow-md' : 'bg-card'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and main nav links */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center">
                <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                  D
                </div>
                <span className="ml-2 text-lg font-bold text-primary">Doof</span>
              </Link>
            </div>
            
            {/* Desktop navigation links */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-4 items-center">
              <Link
                to="/"
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  location.pathname === '/'
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Home
              </Link>
              <Link
                to="/search"
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  location.pathname === '/search'
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Search
              </Link>
              <Link
                to="/trending"
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  location.pathname === '/trending'
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Trending
              </Link>
              <Link
                to="/lists"
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  location.pathname === '/lists'
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Lists
              </Link>
              {isAuthenticated && (
                <Link
                  to="/my-lists"
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    location.pathname === '/my-lists'
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  My Lists
                </Link>
              )}
            </div>
          </div>
          
          {/* Right side - auth buttons or profile */}
          <div className="flex items-center">
            {isAuthenticated ? (
              <div className="ml-3 relative">
                <div>
                  <button
                    onClick={toggleProfileMenu}
                    className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    id="user-menu-button"
                    aria-expanded={isProfileMenuOpen}
                    aria-haspopup="true"
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  </button>
                </div>
                
                {/* Profile dropdown */}
                {isProfileMenuOpen && (
                  <div
                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-card ring-1 ring-black ring-opacity-5 focus:outline-none"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-menu-button"
                  >
                    <div className="py-1" role="none">
                      <div className="block px-4 py-2 text-sm text-muted-foreground border-b border-border">
                        Signed in as <span className="font-medium text-foreground">{user?.name || 'User'}</span>
                      </div>
                      
                      <Link
                        to="/my-lists"
                        className="block px-4 py-2 text-sm text-foreground hover:bg-muted"
                        role="menuitem"
                      >
                        My Lists
                      </Link>
                      
                      <Link
                        to="/my-submissions"
                        className="block px-4 py-2 text-sm text-foreground hover:bg-muted"
                        role="menuitem"
                      >
                        My Submissions
                      </Link>
                      
                      {isAdmin && (
                        <>
                          <Link
                            to="/admin"
                            className="block px-4 py-2 text-sm text-foreground hover:bg-muted"
                            role="menuitem"
                          >
                            Admin Panel
                          </Link>
                          <Link
                            to="/bulk-add"
                            className="block px-4 py-2 text-sm text-foreground hover:bg-muted"
                            role="menuitem"
                          >
                            Bulk Add
                          </Link>
                        </>
                      )}
                      
                      {process.env.NODE_ENV === 'development' && (
                        <Link
                          to="/auth-test"
                          className="block px-4 py-2 text-sm text-foreground hover:bg-muted"
                          role="menuitem"
                        >
                          Auth Test
                        </Link>
                      )}
                      
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10"
                        role="menuitem"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex space-x-2">
                <Link to="/login">
                  <Button variant="outline" size="sm">
                    Sign in
                  </Button>
                </Link>
                <Link to="/register" className="hidden sm:block">
                  <Button variant="primary" size="sm">
                    Register
                  </Button>
                </Link>
              </div>
            )}
            
            {/* Mobile menu button */}
            <div className="flex items-center sm:hidden ml-2">
              <button
                onClick={toggleMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
                aria-expanded={isMenuOpen}
              >
                <span className="sr-only">Open main menu</span>
                {isMenuOpen ? (
                  <svg
                    className="block h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                ) : (
                  <svg
                    className="block h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <Link
              to="/"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                location.pathname === '/'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              Home
            </Link>
            <Link
              to="/search"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                location.pathname === '/search'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              Search
            </Link>
            <Link
              to="/trending"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                location.pathname === '/trending'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              Trending
            </Link>
            <Link
              to="/lists"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                location.pathname === '/lists'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              Lists
            </Link>
            {isAuthenticated && (
              <>
                <Link
                  to="/my-lists"
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    location.pathname === '/my-lists'
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  My Lists
                </Link>
                <Link
                  to="/my-submissions"
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    location.pathname === '/my-submissions'
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  My Submissions
                </Link>
                {isAdmin && (
                  <>
                    <Link
                      to="/admin"
                      className={`block px-3 py-2 rounded-md text-base font-medium ${
                        location.pathname === '/admin'
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      Admin Panel
                    </Link>
                    <Link
                      to="/bulk-add"
                      className={`block px-3 py-2 rounded-md text-base font-medium ${
                        location.pathname === '/bulk-add'
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      Bulk Add
                    </Link>
                  </>
                )}
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-destructive hover:bg-destructive/10"
                >
                  Sign out
                </button>
              </>
            )}
            {!isAuthenticated && (
              <Link
                to="/register"
                className="block sm:hidden px-3 py-2 rounded-md text-base font-medium text-primary hover:bg-primary/10"
              >
                Register
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
