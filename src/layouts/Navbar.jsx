/* src/layouts/Navbar.jsx */
import React, { useState, useCallback, useMemo, memo, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '@/stores/useAuthStore';
import { Menu, X, User, CheckCircle } from 'lucide-react';
import { logDebug, logInfo } from '@/utils/logger';
import { syncAdminAuthWithStore } from '@/utils/adminAuth';

// Ensure auth bypass and admin access are enabled in development to fix flickering and admin features
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Set all required flags for admin access
  window.localStorage.setItem('bypass_auth_check', 'true');
  window.localStorage.setItem('admin_api_key', 'doof-admin-secret-key-dev');
  window.localStorage.setItem('superuser_override', 'true');
  window.localStorage.setItem('admin_access_enabled', 'true');
  
  // Clear the explicit logout flag to ensure admin features are available
  window.localStorage.removeItem('user_explicitly_logged_out');
}

// Simple component that won't flicker
const Navbar = () => {
  // Get all auth values at once to prevent flickering
  const auth = useAuthStore();
  const { isAuthenticated, user, logout, isLoading } = auth;
  
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [, forceUpdate] = useState({});
  const initialSyncRef = useRef(false);

  // Immediate sync on mount to ensure admin authentication is properly set
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && isAuthenticated) {
      logInfo('[Navbar] Initial auth sync on mount');
      // Sync and immediately update if changes were made
      const syncResult = syncAdminAuthWithStore(useAuthStore);
      
      // Force update immediately to ensure UI reflects admin status
      initialSyncRef.current = true;
      forceUpdate({});
      
      // Log the result for debugging
      logDebug(`[Navbar] Initial admin sync ${syncResult ? 'changed auth state' : 'no changes needed'}`);
    }
  }, [isAuthenticated]);

  // Add effect to listen for auth state changes and force a re-render
  useEffect(() => {
    // Subscribe to auth store changes with a more specific selector
    // This ensures we capture all relevant state changes
    const unsubscribe = useAuthStore.subscribe(
      (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        isSuperuser: state.isSuperuser,
        accountType: state.user?.account_type,
        role: state.user?.role,
        permissions: state.user?.permissions
      }),
      (newState, oldState) => {
        // Log the state change for debugging
        logDebug('[Navbar] Auth state change detected:', {
          oldState: {
            isAuthenticated: oldState.isAuthenticated,
            isSuperuser: oldState.isSuperuser,
            accountType: oldState.accountType
          },
          newState: {
            isAuthenticated: newState.isAuthenticated,
            isSuperuser: newState.isSuperuser,
            accountType: newState.accountType
          }
        });
        
        // Check if any relevant auth state has changed
        if (newState.isAuthenticated !== oldState.isAuthenticated ||
            newState.isSuperuser !== oldState.isSuperuser ||
            newState.accountType !== oldState.accountType ||
            newState.role !== oldState.role ||
            JSON.stringify(newState.permissions) !== JSON.stringify(oldState.permissions)) {
          
          logInfo('[Navbar] Relevant auth state changed, forcing immediate re-render');
          
          // Sync admin auth after auth state changes (especially after login)
          // but only if not already a superuser to prevent loops
          if (newState.isAuthenticated && 
              (!newState.isSuperuser && 
               (newState.accountType === 'superuser' || 
                newState.role === 'admin' || 
                (newState.permissions && 
                 (newState.permissions.includes('admin') || 
                  newState.permissions.includes('superuser')))))) {
            
            logInfo('[Navbar] Admin user detected but isSuperuser flag not set, syncing admin authentication');
            syncAdminAuthWithStore(useAuthStore);
          }
          
          // Force an immediate re-render
          forceUpdate({});
        }
      }
    );
    
    // Listen for the custom adminLoginComplete event
    const handleAdminLogin = (event) => {
      logInfo('[Navbar] Received adminLoginComplete event, forcing update');
      // Force sync admin auth and immediately update UI
      syncAdminAuthWithStore(useAuthStore);
      // Force an immediate re-render
      forceUpdate({});
    };
    
    // Listen for the custom adminLogoutComplete event
    const handleAdminLogout = (event) => {
      logInfo('[Navbar] Received adminLogoutComplete event, ensuring admin features are hidden');
      // Force an immediate re-render
      forceUpdate({});
    };
    
    window.addEventListener('adminLoginComplete', handleAdminLogin);
    window.addEventListener('adminLogoutComplete', handleAdminLogout);
    
    return () => {
      unsubscribe();
      window.removeEventListener('adminLoginComplete', handleAdminLogin);
      window.removeEventListener('adminLogoutComplete', handleAdminLogout);
    };
  }, []);

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
    // Log the current auth state for debugging
    logDebug('[Navbar] Checking superuser status:', { 
      isAuthenticated, 
      accountType: user?.account_type, 
      isSuperuser: auth.isSuperuser,
      isDev: process.env.NODE_ENV === 'development',
      hasAdminAccess: localStorage.getItem('admin_access_enabled') === 'true'
    });
    
    // In development mode, always enable superuser features if authenticated
    if (process.env.NODE_ENV === 'development' && isAuthenticated) {
      // Check localStorage flags as well to ensure consistency
      if (localStorage.getItem('superuser_override') === 'true' || 
          localStorage.getItem('admin_access_enabled') === 'true') {
        return true;
      }
    }
    
    // Check all possible indicators of superuser status
    return user?.account_type === 'superuser' || 
           auth.isSuperuser || 
           user?.role === 'admin' || 
           (user?.permissions && 
            (user.permissions.includes('admin') || user.permissions.includes('superuser')));
  }, [user, auth.isSuperuser, isAuthenticated]);

  // Force a re-check when isSuperuser changes
  useEffect(() => {
    if (isSuperuser && process.env.NODE_ENV === 'development') {
      logInfo('[Navbar] Superuser status changed, syncing admin auth');
      syncAdminAuthWithStore(useAuthStore);
    }
  }, [isSuperuser]);

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
