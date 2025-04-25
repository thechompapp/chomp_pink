/* src/layouts/Navbar.jsx */
import React, { useState, useEffect, useRef, useCallback, memo } from 'react'; // Removed useMemo
import { Link, NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '@/stores/useAuthStore';
import { useUIStateStore } from '@/stores/useUIStateStore'; // Keep if SearchBar uses it
import Button from '@/components/UI/Button';
import SearchBar from '@/components/UI/SearchBar';
import { logEngagement } from '@/utils/logEngagement';
import {
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  // Cog6ToothIcon, // Not used
  ListBulletIcon,
  ArrowUpOnSquareIcon,
  UserPlusIcon,
  ArrowLeftOnRectangleIcon,
  // HomeIcon, // Not used
  // ArrowTrendingUpIcon as TrendingUpIcon, // Not used
  ShieldCheckIcon,
  PlusCircleIcon, // For Bulk Add
  XMarkIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';

const Navbar = memo(() => {
    const navigate = useNavigate();
    // Use specific selectors
    const isAuthenticated = useAuthStore(state => state.isAuthenticated);
    const user = useAuthStore(state => state.user);
    const isSuperuser = useAuthStore(state => state.isSuperuser()); // Use the selector function
    const logout = useAuthStore(state => state.logout);
    const { setSearchQuery } = useUIStateStore.getState(); // Keep if SearchBar needs it

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const profileMenuRef = useRef(null);

    const handleLogout = useCallback(() => {
        logEngagement('button_click', 'logout');
        logout();
        setIsProfileMenuOpen(false);
        setIsMobileMenuOpen(false);
        navigate('/');
    }, [logout, navigate]);

    const handleSearch = useCallback((query) => {
        // Removed check for typeof setSearchQuery as getState ensures it exists if store is initialized
        setSearchQuery(query);
        if (query.trim()) {
            logEngagement('search_submit', 'navbar', { query: query });
            navigate(`/search?q=${encodeURIComponent(query)}`);
            setIsMobileMenuOpen(false); // Close mobile menu on search
        }
    }, [setSearchQuery, navigate]); // Added setSearchQuery back as dependency

    // Close profile menu on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
                setIsProfileMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []); // Correct

    // NavLink styling using theme colors
    const navLinkClass = ({ isActive }) =>
        `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            isActive
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        }`;

    const mobileNavLinkClass = ({ isActive }) =>
        `block px-3 py-2 rounded-md text-base font-medium transition-colors ${
            isActive
                ? 'bg-accent text-accent-foreground'
                : 'text-foreground hover:bg-accent hover:text-accent-foreground'
        }`;

    // Profile dropdown link styling
    const profileMenuLinkClass = "block px-4 py-2 text-sm text-foreground hover:bg-accent w-full text-left flex items-center space-x-2";

    // Function to close both menus
    const closeMenus = useCallback(() => {
        setIsProfileMenuOpen(false);
        setIsMobileMenuOpen(false);
    }, []);

    return (
        <nav className="bg-card shadow-sm sticky top-0 z-40 border-b border-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    {/* Left side: Logo and Links */}
                    <div className="flex items-center">
                        <Link to="/" className="flex-shrink-0 flex items-center mr-4">
                            <span className="text-2xl font-bold text-primary">DOOF</span>
                        </Link>
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-2 items-center">
                            <NavLink to="/" className={navLinkClass} end>Home</NavLink>
                            <NavLink to="/trending" className={navLinkClass}>Trending</NavLink>
                            <NavLink to="/lists" className={navLinkClass}>Lists</NavLink>
                        </div>
                    </div>

                    {/* Center/Right side: Search and Auth */}
                    <div className="flex items-center">
                         <div className="hidden sm:flex flex-1 items-center justify-center px-2 lg:ml-6 lg:justify-end mr-4">
                            <div className="max-w-lg w-full lg:max-w-xs">
                                <SearchBar onSearch={handleSearch} />
                            </div>
                        </div>

                         <div className="hidden sm:flex sm:items-center">
                            {isAuthenticated ? (
                                <div className="relative" ref={profileMenuRef}>
                                    <button
                                        onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                        className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ring-offset-card"
                                        id="user-menu-button" aria-expanded={isProfileMenuOpen} aria-haspopup="true"
                                    >
                                        <span className="sr-only">Open user menu</span>
                                        <span className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
                                            {user?.username?.charAt(0).toUpperCase() ?? <UserCircleIcon className="h-6 w-6"/>}
                                        </span>
                                    </button>
                                    {isProfileMenuOpen && (
                                        <div
                                            className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-card ring-1 ring-black ring-opacity-5 focus:outline-none border border-border"
                                            role="menu" aria-orientation="vertical" aria-labelledby="user-menu-button" tabIndex="-1"
                                        >
                                            <span className="block px-4 py-2 text-xs text-muted-foreground truncate">Signed in as {user?.username}</span>
                                            <div className="border-t border-border my-1"></div>
                                            <Link to="/profile/me" className={profileMenuLinkClass} role="menuitem" tabIndex="-1" onClick={closeMenus}><UserCircleIcon className="h-4 w-4 text-muted-foreground"/> Profile</Link>
                                            <Link to="/lists" className={profileMenuLinkClass} role="menuitem" tabIndex="-1" onClick={closeMenus}><ListBulletIcon className="h-4 w-4 text-muted-foreground"/> My Lists</Link>
                                            <Link to="/my-submissions" className={profileMenuLinkClass} role="menuitem" tabIndex="-1" onClick={closeMenus}><ArrowUpOnSquareIcon className="h-4 w-4 text-muted-foreground"/> My Submissions</Link>
                                            {/* Superuser Links */}
                                            {isSuperuser && ( // Use the selector result here
                                                <>
                                                    <div className="border-t border-border my-1"></div>
                                                    <Link to="/admin" className={profileMenuLinkClass} role="menuitem" tabIndex="-1" onClick={closeMenus}><ShieldCheckIcon className="h-4 w-4 text-muted-foreground"/> Admin Panel</Link>
                                                    {/* === FIX: Added Bulk Add link === */}
                                                    <Link to="/admin/bulk-add" className={profileMenuLinkClass} role="menuitem" tabIndex="-1" onClick={closeMenus}><PlusCircleIcon className="h-4 w-4 text-muted-foreground"/> Bulk Add</Link>
                                                    {/* === End Fix === */}
                                                </>
                                            )}
                                            <div className="border-t border-border my-1"></div>
                                            <button onClick={handleLogout} className={profileMenuLinkClass} role="menuitem" tabIndex="-1">
                                                <ArrowRightOnRectangleIcon className="h-4 w-4 text-muted-foreground"/>
                                                Logout
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex space-x-2">
                                    <Link to="/login">
                                        <Button variant="ghost" size="sm">Login</Button>
                                    </Link>
                                    <Link to="/register">
                                        <Button variant="secondary" size="sm">Sign Up</Button>
                                    </Link>
                                </div>
                            )}
                        </div>

                         <div className="ml-2 flex items-center sm:hidden">
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="inline-flex items-center justify-center p-2 rounded-md text-muted-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
                                aria-controls="mobile-menu" aria-expanded={isMobileMenuOpen}
                            >
                                <span className="sr-only">Open main menu</span>
                                {isMobileMenuOpen ? (
                                    <XMarkIcon className="block h-6 w-6" aria-hidden="true"/>
                                ) : (
                                    <Bars3Icon className="block h-6 w-6" aria-hidden="true"/>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {isMobileMenuOpen && (
                <div className="sm:hidden absolute top-16 left-0 right-0 bg-card shadow-lg z-50 border-b border-border" id="mobile-menu">
                    <div className="px-2 pt-2 pb-3 space-y-1">
                        <div className="px-2 mb-2">
                            <SearchBar onSearch={handleSearch} />
                        </div>

                        <NavLink to="/" className={mobileNavLinkClass} end onClick={closeMenus}>Home</NavLink>
                        <NavLink to="/trending" className={mobileNavLinkClass} onClick={closeMenus}>Trending</NavLink>
                        <NavLink to="/lists" className={mobileNavLinkClass} onClick={closeMenus}>Lists</NavLink>

                        <div className="border-t border-border pt-4 mt-3 pb-3">
                            {isAuthenticated ? (
                                <>
                                    <div className="flex items-center px-4">
                                        <div className="flex-shrink-0">
                                            <span className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
                                                {user?.username?.charAt(0).toUpperCase() ?? 'U'}
                                            </span>
                                        </div>
                                        <div className="ml-3">
                                            <div className="text-base font-medium text-foreground">{user?.username}</div>
                                            <div className="text-sm font-medium text-muted-foreground">{user?.email}</div>
                                        </div>
                                    </div>
                                    <div className="mt-3 px-2 space-y-1">
                                        <Link to="/profile/me" className={mobileNavLinkClass} onClick={closeMenus}>
                                            <UserCircleIcon className="h-5 w-5 inline-block mr-2 text-muted-foreground"/> Profile
                                        </Link>
                                        <Link to="/lists" className={mobileNavLinkClass} onClick={closeMenus}>
                                            <ListBulletIcon className="h-5 w-5 inline-block mr-2 text-muted-foreground"/> My Lists
                                        </Link>
                                        <Link to="/my-submissions" className={mobileNavLinkClass} onClick={closeMenus}>
                                            <ArrowUpOnSquareIcon className="h-5 w-5 inline-block mr-2 text-muted-foreground"/> My Submissions
                                        </Link>
                                        {/* Superuser Mobile Links */}
                                        {isSuperuser && ( // Use the specific selector here
                                             <>
                                                <div className="border-t border-border my-1 mx-2"></div>
                                                <Link to="/admin" className={mobileNavLinkClass} onClick={closeMenus}>
                                                    <ShieldCheckIcon className="h-5 w-5 inline-block mr-2 text-muted-foreground"/> Admin Panel
                                                </Link>
                                                {/* === FIX: Added Bulk Add link === */}
                                                <Link to="/admin/bulk-add" className={mobileNavLinkClass} onClick={closeMenus}>
                                                    <PlusCircleIcon className="h-5 w-5 inline-block mr-2 text-muted-foreground"/> Bulk Add
                                                </Link>
                                                {/* === End Fix === */}
                                             </>
                                        )}
                                         <div className="border-t border-border my-1 mx-2"></div>
                                        <button onClick={handleLogout} className={`${mobileNavLinkClass} w-full text-left flex items-center`}>
                                            <ArrowRightOnRectangleIcon className="h-5 w-5 inline-block mr-2 text-muted-foreground"/> Logout
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="px-2 space-y-1">
                                    <Link to="/login" className={mobileNavLinkClass} onClick={closeMenus}>
                                        <ArrowLeftOnRectangleIcon className="h-5 w-5 inline-block mr-2 text-muted-foreground"/> Login
                                    </Link>
                                    <Link to="/register" className={mobileNavLinkClass} onClick={closeMenus}>
                                        <UserPlusIcon className="h-5 w-5 inline-block mr-2 text-muted-foreground"/> Sign Up
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
});

Navbar.displayName = 'Navbar';

export default Navbar;