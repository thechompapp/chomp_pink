import { useEffect, useState } from 'react';

const Navbar = () => {
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem('is_admin') === 'true');
  
  useEffect(() => {
    const checkAdminStatus = () => {
      setIsAdmin(localStorage.getItem('is_admin') === 'true');
    };
    
    window.addEventListener('storage', checkAdminStatus);
    const interval = setInterval(checkAdminStatus, 1000); // Check every second for changes
    
    return () => {
      window.removeEventListener('storage', checkAdminStatus);
      clearInterval(interval);
    };
  }, []);
  
  // ... existing code ...
  // Use isAdmin in rendering admin features
  // Example: {isAdmin && <AdminMenu />}
  // ... existing code ...
};

export default Navbar; 