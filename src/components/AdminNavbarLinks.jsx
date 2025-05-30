/**
 * AdminNavbarLinks Component
 * 
 * Renders the admin navigation links when the user has admin access.
 * Uses the useAdminAuth hook to ensure proper loading states and prevent flickering.
 */

import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';

/**
 * Placeholder component shown during initial loading
 * Maintains the same dimensions as the actual links to prevent layout shift
 */
const AdminNavbarPlaceholder = () => (
  <div className="admin-links-placeholder" aria-hidden="true">
    <div className="admin-link-placeholder w-16 h-4 bg-primary-foreground/10 rounded animate-pulse mx-2"></div>
    <div className="admin-link-placeholder w-20 h-4 bg-primary-foreground/10 rounded animate-pulse mx-2"></div>
  </div>
);

/**
 * Desktop admin navbar links component
 */
const DesktopAdminNavbarLinks = memo(() => {
  const { isReady, hasAdminAccess, isSuperuser, canManageContent } = useAdminAuth();
  
  // Show placeholder during loading to prevent layout shift
  if (!isReady) {
    return <AdminNavbarPlaceholder />;
  }
  
  // Don't render anything if user doesn't have admin access
  if (!hasAdminAccess) {
    return null;
  }
  
  return (
    <>
      <Link 
        to="/admin" 
        className="text-primary-foreground hover:text-primary-foreground/90 transition-colors"
      >
        Admin Panel
        {isSuperuser && (
          <CheckCircle size={14} className="ml-1 inline text-green-400" title="Verified Superuser" />
        )}
      </Link>
    </>
  );
});

/**
 * Mobile admin navbar links component
 */
const MobileAdminNavbarLinks = memo(({ onItemClick }) => {
  const { isReady, hasAdminAccess, isSuperuser, canManageContent } = useAdminAuth();
  
  // Show placeholder during loading to prevent layout shift
  if (!isReady) {
    return <AdminNavbarPlaceholder />;
  }
  
  // Don't render anything if user doesn't have admin access
  if (!hasAdminAccess) {
    return null;
  }
  
  return (
    <>
      <Link
        to="/admin"
        className="block py-2 px-4 text-primary-foreground hover:bg-primary-foreground/10 transition-colors"
        onClick={onItemClick}
      >
        Admin Panel
        {isSuperuser && (
          <CheckCircle size={14} className="ml-1 inline text-green-400" title="Verified Superuser" />
        )}
      </Link>
    </>
  );
});

/**
 * Admin Badge component for user profile
 */
const AdminBadge = memo(() => {
  const { isReady, isSuperuser } = useAdminAuth();
  
  if (!isReady || !isSuperuser) {
    return null;
  }
  
  return (
    <CheckCircle size={16} className="ml-1 text-green-400" title="Verified Superuser" />
  );
});

// Export individual components
export { 
  DesktopAdminNavbarLinks, 
  MobileAdminNavbarLinks,
  AdminBadge
};

// Default export for direct use
const AdminNavbarLinks = {
  Desktop: DesktopAdminNavbarLinks,
  Mobile: MobileAdminNavbarLinks,
  Badge: AdminBadge
};

export default AdminNavbarLinks; 