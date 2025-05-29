import React from 'react';
import { useAuth } from '../contexts/auth';
import { useAdminAuth } from '../hooks/useAdminAuth';

const AdminAuthDebug = () => {
  const auth = useAuth();
  const adminAuth = useAdminAuth();

  const authToken = localStorage.getItem('authToken');
  const adminFlags = {
    adminAccessEnabled: localStorage.getItem('admin_access_enabled'),
    superuserOverride: localStorage.getItem('superuser_override'),
    adminApiKey: localStorage.getItem('admin_api_key'),
    forceOnline: localStorage.getItem('force_online')
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Admin Authentication Debug</h1>
      
      <div className="space-y-6">
        {/* Auth Context State */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-3 text-blue-800">Auth Context State</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>isAuthenticated:</strong> 
              <span className={auth.isAuthenticated ? 'text-green-600' : 'text-red-600'}>
                {' '}{String(auth.isAuthenticated)}
              </span>
            </div>
            <div>
              <strong>isLoading:</strong> 
              <span className={auth.isLoading ? 'text-yellow-600' : 'text-green-600'}>
                {' '}{String(auth.isLoading)}
              </span>
            </div>
            <div>
              <strong>user:</strong> 
              <span className="text-gray-700">
                {' '}{auth.user ? JSON.stringify(auth.user, null, 2) : 'null'}
              </span>
            </div>
            <div>
              <strong>isSuperuser:</strong> 
              <span className={auth.isSuperuser ? 'text-green-600' : 'text-red-600'}>
                {' '}{String(auth.isSuperuser)}
              </span>
            </div>
          </div>
        </div>

        {/* Admin Auth Hook State */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-3 text-green-800">Admin Auth Hook State</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>isAdmin:</strong> 
              <span className={adminAuth.isAdmin ? 'text-green-600' : 'text-red-600'}>
                {' '}{String(adminAuth.isAdmin)}
              </span>
            </div>
            <div>
              <strong>hasAdminAccess:</strong> 
              <span className={adminAuth.hasAdminAccess ? 'text-green-600' : 'text-red-600'}>
                {' '}{String(adminAuth.hasAdminAccess)}
              </span>
            </div>
            <div>
              <strong>isReady:</strong> 
              <span className={adminAuth.isReady ? 'text-green-600' : 'text-red-600'}>
                {' '}{String(adminAuth.isReady)}
              </span>
            </div>
            <div>
              <strong>isDevelopment:</strong> 
              <span className={adminAuth.isDevelopment ? 'text-green-600' : 'text-red-600'}>
                {' '}{String(adminAuth.isDevelopment)}
              </span>
            </div>
            <div>
              <strong>adminOverrideApplied:</strong> 
              <span className={adminAuth.adminOverrideApplied ? 'text-green-600' : 'text-red-600'}>
                {' '}{String(adminAuth.adminOverrideApplied)}
              </span>
            </div>
            <div>
              <strong>canManageUsers:</strong> 
              <span className={adminAuth.canManageUsers ? 'text-green-600' : 'text-red-600'}>
                {' '}{String(adminAuth.canManageUsers)}
              </span>
            </div>
          </div>
        </div>

        {/* LocalStorage Flags */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-3 text-yellow-800">LocalStorage Flags</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>authToken:</strong> 
              <span className={authToken ? 'text-green-600' : 'text-red-600'}>
                {' '}{authToken ? 'Present' : 'Missing'}
              </span>
            </div>
            <div>
              <strong>admin_access_enabled:</strong> 
              <span className={adminFlags.adminAccessEnabled === 'true' ? 'text-green-600' : 'text-red-600'}>
                {' '}{adminFlags.adminAccessEnabled || 'not set'}
              </span>
            </div>
            <div>
              <strong>superuser_override:</strong> 
              <span className={adminFlags.superuserOverride === 'true' ? 'text-green-600' : 'text-red-600'}>
                {' '}{adminFlags.superuserOverride || 'not set'}
              </span>
            </div>
            <div>
              <strong>admin_api_key:</strong> 
              <span className={adminFlags.adminApiKey ? 'text-green-600' : 'text-red-600'}>
                {' '}{adminFlags.adminApiKey ? 'Present' : 'Missing'}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">Debug Actions</h2>
          <div className="space-x-4">
            <button
              onClick={() => {
                localStorage.setItem('admin_access_enabled', 'true');
                localStorage.setItem('superuser_override', 'true');
                localStorage.setItem('admin_api_key', 'doof-admin-secret-key-dev');
                localStorage.setItem('force_online', 'true');
                window.location.reload();
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Force Admin Access
            </button>
            
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Clear All Storage
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Refresh Page
            </button>
          </div>
        </div>

        {/* Test Links */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-3 text-purple-800">Test Links</h2>
          <div className="space-x-4">
            <a
              href="/login"
              className="inline-block px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Go to Login
            </a>
            
            <a
              href="/admin"
              className="inline-block px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Try Regular Admin
            </a>
            
            <a
              href="/admin-enhanced"
              className="inline-block px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Try Enhanced Admin
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAuthDebug; 