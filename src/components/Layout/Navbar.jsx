import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Home, TrendingUp, List, Moon, User } from "lucide-react";
import doofLogo from "../../assets/doof.svg";

const Navbar = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Navigation links with icons
  const navLinks = [
    { path: "/", name: "Home", icon: <Home size={20} /> },
    { path: "/trending", name: "Trending", icon: <TrendingUp size={20} /> },
    { path: "/lists", name: "My Lists", icon: <List size={20} /> },
    { path: "/night-planner", name: "Night Planner", icon: <Moon size={20} /> }
  ];

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      if (scrollPosition > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check if a path is active
  const isActive = (path) => location.pathname === path;

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white shadow-md' : 'bg-white/95 backdrop-blur-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center">
              {doofLogo ? (
                <img src={doofLogo} alt="Doof Logo" className="h-8 w-auto" />
              ) : (
                <span className="text-xl font-bold bg-gradient-to-r from-[#D1B399] to-[#D1B399]/70 text-transparent bg-clip-text">DOOF</span>
              )}
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors relative ${
                  isActive(link.path)
                    ? "text-[#D1B399]"
                    : "text-gray-600 hover:text-[#D1B399]"
                }`}
              >
                <span className="mr-2">{link.icon}</span>
                {link.name}
                {isActive(link.path) && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#D1B399] rounded-full"></span>
                )}
              </Link>
            ))}
          </div>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <Link 
              to="/profile" 
              className="p-2 text-gray-600 hover:text-[#D1B399] rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Profile"
            >
              <User size={20} />
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-600 hover:text-[#D1B399] rounded-full hover:bg-gray-100 transition-colors"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 animate-fadeIn">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                  isActive(link.path)
                    ? "bg-[#D1B399]/10 text-[#D1B399]"
                    : "text-gray-600 hover:bg-gray-50 hover:text-[#D1B399]"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="mr-3">{link.icon}</span>
                {link.name}
              </Link>
            ))}
            <Link
              to="/profile"
              className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-[#D1B399]"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="mr-3"><User size={20} /></span>
              Profile
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;