/* src/layouts/Navbar.jsx */
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '@/stores/useAuthStore';
import { Menu, X } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout, isLoading } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Ensure correct access to account_type
  const isSuperuser = user?.account_type === 'superuser';

  console.log('[Navbar] Auth state:', { isAuthenticated, user, isLoading, isSuperuser });

  if (isLoading) {
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

export default Navbar;