// src/layouts/Navbar.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAuth } from '../contexts/auth';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { useCreateList } from '../contexts/CreateListContext';
import Button from '../components/UI/Button';
import NotificationBell from '../components/NotificationBell';
import NotificationPanel from '../components/Notifications/NotificationPanel';
import { useNotificationStore } from '../stores/notificationStore';
import { logDebug, logInfo, logError } from '../utils/logger';
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
  const [isLoading, setIsLoading] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  
  // Use the new authentication context
  const { isAuthenticated, user, logout, isLoading: authLoading } = useAuth();
  
  // Use the admin hook for permission checks
  const adminAuth = useAdminAuth();
  
  // Use the create list context
  const { openCreateListModal } = useCreateList();
  
  // Use notification store for panel toggle
  const { isNotificationPanelOpen, toggleNotificationPanel } = useNotificationStore();
  
  // Check if user has admin access
  const isAdmin = user && adminAuth.hasAdminAccess;
  
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
   * Handle Create List button click
   */
  const handleCreateListClick = () => {
    logDebug('[Navbar] Create List button clicked');
    closeMenus(); // Close any open menus
    openCreateListModal();
  };
  
  /**
   * Handle notification bell click
   */
  const handleNotificationClick = () => {
    logDebug('[Navbar] Notification bell clicked');
    closeMenus(); // Close any open menus
    toggleNotificationPanel();
  };
  
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
    console.log('🚨 [Navbar] Logout initiated - DEBUGGING TOKEN CLEARING');
    logInfo('[Navbar] Logout initiated');
    
    try {
      // Log current tokens BEFORE logout
      const tokensBefore = {
        authToken: localStorage.getItem('auth-token'),
        token: localStorage.getItem('token'),
        userData: localStorage.getItem('userData'),
        authStorage: localStorage.getItem('auth-authentication-storage')
      };
      console.log('🔍 [Navbar] Tokens BEFORE logout:', tokensBefore);
      
      // Close all menus immediately
      closeMenus();
      
      // Show loading state briefly
      setIsLoading(true);
      
      // Perform logout
      console.log('🔄 [Navbar] Calling logout function...');
      const result = await logout();
      console.log('✅ [Navbar] Logout function completed:', result);
      
      // Log tokens AFTER logout function
      const tokensAfterLogout = {
        authToken: localStorage.getItem('auth-token'),
        token: localStorage.getItem('token'),
        userData: localStorage.getItem('userData'),
        authStorage: localStorage.getItem('auth-authentication-storage'),
        explicitLogout: localStorage.getItem('user_explicitly_logged_out')
      };
      console.log('🔍 [Navbar] Tokens AFTER logout function:', tokensAfterLogout);
      
      // FORCE CLEAR ALL TOKENS MANUALLY (as backup)
      console.log('🧹 [Navbar] Force clearing all tokens manually...');
      const allTokenKeys = [
        'auth-token', 'token', 'refreshToken', 'userData', 'current_user',
        'admin_api_key', 'admin_access_enabled', 'superuser_override',
        'auth-authentication-storage', 'auth-storage', 'auth_access_token',
        'auth_refresh_token', 'auth_token_expiry'
      ];
      
      allTokenKeys.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
      
      // Set explicit logout flag AFTER clearing tokens to ensure it persists
      localStorage.setItem('user_explicitly_logged_out', 'true');
      
      // Also set E2E testing mode flag to prevent auto-restoration
      localStorage.setItem('logout_in_progress', 'true');
      
      // Clear offline mode flags after logout
      if (offlineModeGuard && typeof offlineModeGuard.clearOfflineModeFlags === 'function') {
        logDebug('[Navbar] Clearing offline mode flags after logout');
        offlineModeGuard.clearOfflineModeFlags();
      }
      
      // Log tokens AFTER manual clearing
      const tokensAfterManualClear = {
        authToken: localStorage.getItem('auth-token'),
        token: localStorage.getItem('token'),
        userData: localStorage.getItem('userData'),
        authStorage: localStorage.getItem('auth-authentication-storage'),
        explicitLogout: localStorage.getItem('user_explicitly_logged_out')
      };
      console.log('🔍 [Navbar] Tokens AFTER manual clearing:', tokensAfterManualClear);
      
      // Force complete state refresh
      window.dispatchEvent(new CustomEvent('auth:logout_complete', {
        detail: { 
          source: 'navbar',
          timestamp: Date.now(),
          complete: true,
          manualClear: true
        }
      }));
      
      // Force UI refresh
      window.dispatchEvent(new CustomEvent('forceUiRefresh', {
        detail: { 
          source: 'navbar-logout',
          timestamp: Date.now() 
        }
      }));
      
      // Navigate to home page after a brief delay to ensure state is cleared
      setTimeout(() => {
        console.log('🏠 [Navbar] Navigating to home page...');
        navigate('/', { replace: true });
      }, 100);
      
      console.log('✅ [Navbar] Logout completed successfully');
      logInfo('[Navbar] Logout completed successfully');
      
    } catch (error) {
      console.error('❌ [Navbar] Error during logout:', error);
      logError('[Navbar] Error during logout:', error);
      
      // Even on error, force clear local state and navigate
      closeMenus();
      
      // Force clear critical tokens
      ['auth-token', 'token', 'auth-authentication-storage', 'userData'].forEach(key => {
        localStorage.removeItem(key);
      });
      
      // Set logout flag
      localStorage.setItem('user_explicitly_logged_out', 'true');
      
      // Navigate anyway
      navigate('/', { replace: true });
      
      // Force refresh as last resort
      setTimeout(() => {
        window.location.reload();
      }, 1000);
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
  if (authLoading) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-card shadow-md h-16 flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-6 w-24 bg-muted rounded"></div>
        </div>
      </nav>
    );
  }
  
  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'bg-white/95 dark:bg-black/95 backdrop-blur-sm shadow-sm' : 'bg-white dark:bg-black'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and main nav links */}
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/" className="flex items-center">
                  <img 
                    src="/images/dooflogo.png" 
                    alt="DOOF Logo" 
                    className="h-10 w-auto"
                  />
                </Link>
              </div>
              
              {/* Desktop navigation links */}
              <div className="hidden sm:ml-6 sm:flex sm:space-x-4 items-center">
                <Link
                  to="/"
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    location.pathname === '/'
                      ? 'text-black dark:text-white bg-gray-100 dark:bg-gray-800'
                      : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
                  }`}
                >
                  Home
                </Link>
                <Link
                  to="/trending"
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    location.pathname === '/trending'
                      ? 'text-black dark:text-white bg-gray-100 dark:bg-gray-800'
                      : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
                  }`}
                >
                  Trending
                </Link>
                {isAuthenticated && (
                  <Link
                    to="/my-lists"
                    className={`px-3 py-2 text-sm font-medium transition-colors ${
                      location.pathname === '/my-lists'
                        ? 'text-black dark:text-white bg-gray-100 dark:bg-gray-800'
                        : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    My Lists
                  </Link>
                )}
                
                {/* Create List Button - Desktop */}
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleCreateListClick}
                  className="ml-2 flex items-center"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Create List
                </Button>
              </div>
            </div>
            
            {/* Right side - auth buttons or profile */}
            <div className="flex items-center">
              {isAuthenticated ? (
                <div className="flex items-center space-x-2">
                  {/* Notification Bell */}
                  <NotificationBell onClick={handleNotificationClick} />
                  
                  {/* Profile Menu */}
                  <div className="ml-3 relative">
                    <div>
                      <button
                        onClick={toggleProfileMenu}
                        className="flex text-sm focus:outline-none focus:ring-0"
                        id="user-menu-button"
                        aria-expanded={isProfileMenuOpen}
                        aria-haspopup="true"
                      >
                        <span className="sr-only">Open user menu</span>
                        <div className="h-8 w-8 bg-black dark:bg-white text-white dark:text-black flex items-center justify-center transition-colors">
                          {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                      </button>
                    </div>
                    
                    {/* Profile dropdown */}
                    {isProfileMenuOpen && (
                      <div
                        className="origin-top-right absolute right-0 mt-2 w-48 bg-white dark:bg-black shadow-lg focus:outline-none"
                        role="menu"
                        aria-orientation="vertical"
                        aria-labelledby="user-menu-button"
                      >
                        <div className="py-1" role="none">
                          <div className="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                            Signed in as <span className="font-medium text-black dark:text-white">{user?.name || 'User'}</span>
                          </div>
                          
                          <Link
                            to="/profile"
                            className="block px-4 py-2 text-sm text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            role="menuitem"
                          >
                            Profile & Settings
                          </Link>
                          
                          <Link
                            to="/my-lists"
                            className="block px-4 py-2 text-sm text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            role="menuitem"
                          >
                            My Lists
                          </Link>
                          
                          <Link
                            to="/my-submissions"
                            className="block px-4 py-2 text-sm text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            role="menuitem"
                          >
                            My Submissions
                          </Link>
                          
                          {isAdmin && (
                            <>
                              <Link
                                to="/admin"
                                className="block px-4 py-2 text-sm text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                role="menuitem"
                              >
                                Admin Panel
                              </Link>
                            </>
                          )}
                          
                          {process.env.NODE_ENV === 'development' && (
                            <Link
                              to="/auth-test"
                              className="block px-4 py-2 text-sm text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                              role="menuitem"
                            >
                              Auth Test
                            </Link>
                          )}
                          
                          <button
                            onClick={handleLogout}
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            role="menuitem"
                            data-testid="logout-button"
                            id="logout-button"
                          >
                            Sign out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
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
                  className="inline-flex items-center justify-center p-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-0 transition-colors"
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
      </nav>
      
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
              to="/trending"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                location.pathname === '/trending'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              Trending
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
                
                {/* Create List Button - Mobile */}
                <button
                  onClick={handleCreateListClick}
                  className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-primary hover:bg-primary/10"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create List
                </button>
                
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
                
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-destructive hover:bg-destructive/10"
                  data-testid="mobile-logout-button"
                  id="mobile-logout-button"
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
      
      {/* Notification Panel */}
      <NotificationPanel />
    </>
  );
};

export default Navbar;
