/**
 * Enhanced Admin Panel Demo
 * 
 * Demonstrates the new enhanced admin panel functionality with:
 * - Improved data fetching and population
 * - Real-time inline editing
 * - Field-specific validation
 * - Better error handling
 * - Performance optimizations
 * - Analytics dashboard
 * - Bulk operations
 */

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, BarChart3, Settings, Eye } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { enhancedAdminService } from '@/services/enhancedAdminService';
import { EnhancedAdminTable } from '@/components/AdminPanel/EnhancedAdminTable';
import { AdminAnalyticsDashboard } from '@/components/AdminPanel/AdminAnalyticsDashboard';
import { BulkOperationsPanel } from '@/components/AdminPanel/BulkOperationsPanel';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAuth } from '@/contexts/auth';
import { useNavigate } from 'react-router-dom';

/**
 * Tab configuration for admin panel
 */
const TAB_CONFIG = {
  analytics: { 
    label: 'Analytics', 
    key: 'analytics', 
    enhanced: true, 
    icon: BarChart3,
    description: 'Performance metrics and insights'
  },
  restaurants: { 
    label: 'Restaurants', 
    key: 'restaurants', 
    enhanced: true, 
    icon: Settings,
    description: 'Manage restaurant data with real-time editing'
  },
  bulk_operations: {
    label: 'Bulk Operations',
    key: 'bulk_operations',
    enhanced: true,
    icon: Settings,
    description: 'Import, export, and batch operations'
  },
  dishes: { 
    label: 'Dishes', 
    key: 'dishes', 
    enhanced: false, 
    icon: Eye,
    description: 'Legacy dishes management'
  },
  users: { 
    label: 'Users', 
    key: 'users', 
    enhanced: false, 
    icon: Eye,
    description: 'Legacy users management'
  },
  cities: { 
    label: 'Cities', 
    key: 'cities', 
    enhanced: false, 
    icon: Eye,
    description: 'Legacy cities management'
  },
  neighborhoods: { 
    label: 'Neighborhoods', 
    key: 'neighborhoods', 
    enhanced: false, 
    icon: Eye,
    description: 'Legacy neighborhoods management'
  },
  hashtags: { 
    label: 'Hashtags', 
    key: 'hashtags', 
    enhanced: false, 
    icon: Eye,
    description: 'Legacy hashtags management'
  },
  restaurant_chains: { 
    label: 'Restaurant Chains', 
    key: 'restaurant_chains', 
    enhanced: false, 
    icon: Eye,
    description: 'Legacy chains management'
  },
  submissions: { 
    label: 'Submissions', 
    key: 'submissions', 
    enhanced: false, 
    icon: Eye,
    description: 'Legacy submissions management'
  }
};

/**
 * Enhanced Admin Panel Demo Component
 */
const EnhancedAdminPanelDemo = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const adminAuth = useAdminAuth();
  const [activeTab, setActiveTab] = useState('analytics');
  const [isInitializing, setIsInitializing] = useState(true);
  const [selectedResourceType, setSelectedResourceType] = useState('restaurants');
  
  // Authentication verification
  useEffect(() => {
    const verifyAuth = async () => {
      console.log('[EnhancedAdminPanelDemo] Auth verification:', {
        isLoading,
        isAuthenticated,
        adminAuthReady: adminAuth.isReady,
        hasAdminAccess: adminAuth.hasAdminAccess,
        isDevelopment: adminAuth.isDevelopment,
        adminOverrideApplied: adminAuth.adminOverrideApplied
      });
      
      if (isLoading || !adminAuth.isReady) {
        console.log('[EnhancedAdminPanelDemo] Still loading, waiting...');
        return;
      }
      
      if (!isAuthenticated) {
        console.log('[EnhancedAdminPanelDemo] Not authenticated, redirecting to login');
        navigate('/login', { 
          state: { 
            from: '/admin-enhanced', 
            message: 'You must be logged in to access the admin panel' 
          } 
        });
        return;
      }
      
      if (!adminAuth.hasAdminAccess) {
        console.log('[EnhancedAdminPanelDemo] No admin access, redirecting to home');
        toast.error('You do not have permission to access the admin panel');
        navigate('/');
        return;
      }
      
      console.log('[EnhancedAdminPanelDemo] Auth verification passed, initializing panel');
      setIsInitializing(false);
    };
    
    verifyAuth();
  }, [isAuthenticated, adminAuth.hasAdminAccess, adminAuth.isReady, adminAuth.isDevelopment, isLoading, navigate]);
  
  // Fetch all admin data
  const {
    data: adminData,
    error,
    refetch,
    isFetching,
    isError
  } = useQuery({
    queryKey: ['enhancedAdminData'],
    queryFn: enhancedAdminService.fetchAllAdminData,
    enabled: !isInitializing,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
    onSuccess: (data) => {
      console.log('[EnhancedAdminPanelDemo] Admin data fetched successfully');
      toast.success('Admin data loaded successfully');
    },
    onError: (error) => {
      console.error('[EnhancedAdminPanelDemo] Error fetching admin data:', error);
      toast.error(`Failed to load admin data: ${error.message}`);
    }
  });
  
  // Show loading state
  if (isInitializing || isLoading || !adminAuth.isReady) {
    return (
      <div className="admin-panel-loading">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">Loading Enhanced Admin Panel</h2>
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }
  
  // Show error state
  if (isError) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" aria-hidden="true" />
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">
                Something went wrong in the Enhanced Admin Panel
              </h3>
              <div className="mt-2 text-sm text-red-700 space-y-2">
                <p>
                  <span className="font-medium">Error:</span>{' '}
                  {error?.message || 'An unknown error occurred.'}
                </p>
                <button
                  onClick={() => refetch()}
                  className="mt-2 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Get current data for active tab
  const currentData = adminData?.[selectedResourceType] || [];
  const cities = adminData?.cities || [];
  const neighborhoods = adminData?.neighborhoods || [];
  const isEnhanced = TAB_CONFIG[activeTab]?.enhanced;
  
  // Handle operation complete callback
  const handleOperationComplete = () => {
    refetch(); // Refresh data after operations
  };
  
  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'analytics':
        return (
          <AdminAnalyticsDashboard 
            adminData={adminData || {}}
          />
        );
        
      case 'bulk_operations':
        return (
          <div className="space-y-6">
            {/* Resource Type Selector */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Select Resource Type</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['restaurants', 'dishes', 'users', 'cities'].map(resourceType => (
                  <button
                    key={resourceType}
                    onClick={() => setSelectedResourceType(resourceType)}
                    className={cn(
                      "p-3 text-sm font-medium rounded-lg border transition-colors",
                      selectedResourceType === resourceType
                        ? "bg-blue-50 border-blue-200 text-blue-700"
                        : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    {resourceType.charAt(0).toUpperCase() + resourceType.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Bulk Operations Panel */}
            <BulkOperationsPanel
              resourceType={selectedResourceType}
              selectedRows={new Set()} // This would come from table selection
              onOperationComplete={handleOperationComplete}
              adminData={adminData || {}}
            />
          </div>
        );
        
      case 'restaurants':
        return (
          <div className="space-y-6">
            {/* Enhanced Features Notice */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Enhanced Features Active</h3>
                  <div className="mt-1 text-sm text-blue-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Real-time inline editing with auto-save</li>
                      <li>Advanced field validation and error feedback</li>
                      <li>Optimized data fetching with caching</li>
                      <li>Bulk operations with row selection</li>
                      <li>Advanced sorting and filtering</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Enhanced Admin Table */}
            <EnhancedAdminTable
              resourceType="restaurants"
              initialData={currentData}
              cities={cities}
              neighborhoods={neighborhoods}
              pageSize={25}
              enableInlineEditing={true}
              enableBulkOperations={true}
              enableSelection={true}
              enableCreate={true}
              className="shadow-lg"
            />
          </div>
        );
        
      default:
        // Legacy tables for other resource types
        const legacyData = adminData?.[activeTab] || [];
        return (
          <div className="space-y-6">
            {/* Legacy Notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <Eye className="w-5 h-5 text-yellow-600 mt-0.5" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Legacy View</h3>
                  <p className="mt-1 text-sm text-yellow-700">
                    This tab shows the legacy implementation. Enhanced features are available in the Restaurants tab.
                    <span className="block mt-1 font-medium">
                      Enhanced features: Analytics, Bulk Operations, and Real-time Editing
                    </span>
                  </p>
                </div>
              </div>
            </div>
            
            {/* Simple data display for legacy tabs */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  {TAB_CONFIG[activeTab]?.label || activeTab} Data
                </h3>
                
                {legacyData.length > 0 ? (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-4">
                      Showing {legacyData.length} {activeTab} records (read-only view)
                    </p>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            {Object.keys(legacyData[0] || {}).slice(0, 5).map(key => (
                              <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {key.replace(/_/g, ' ')}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {legacyData.slice(0, 10).map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              {Object.values(item).slice(0, 5).map((value, cellIndex) => (
                                <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {value?.toString() || 'N/A'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {legacyData.length > 10 && (
                      <p className="text-xs text-gray-500 mt-2">
                        Showing first 10 of {legacyData.length} records
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No {activeTab} data available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
    }
  };
  
  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Enhanced Admin Panel</h1>
        <p className="text-gray-600 mt-1">
          Advanced admin interface with analytics, bulk operations, and real-time editing capabilities
        </p>
        
        {/* Enhancement indicators */}
        <div className="mt-3 flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Current tab:</span>
            <span className={cn(
              "px-2 py-1 rounded text-xs font-medium",
              isEnhanced 
                ? "bg-green-100 text-green-800" 
                : "bg-gray-100 text-gray-800"
            )}>
              {isEnhanced ? 'Enhanced' : 'Legacy'}
            </span>
          </div>
          
          {isEnhanced && (
            <div className="flex items-center space-x-1 text-xs text-green-600">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live features active</span>
            </div>
          )}
          
          {isFetching && (
            <div className="flex items-center space-x-1 text-xs text-blue-600">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
              <span>Syncing data...</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-6 overflow-x-auto pb-px -mb-px">
          {Object.entries(TAB_CONFIG).map(([key, { label, enhanced, icon: Icon, description }]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                'py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap relative',
                activeTab === key
                  ? 'border-blue-500 text-blue-600 font-semibold'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                'transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:ring-offset-2 focus:rounded-sm',
                'flex items-center space-x-2 group'
              )}
              aria-current={activeTab === key ? 'page' : undefined}
              title={description}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
              {enhanced && (
                <span className="w-2 h-2 bg-green-500 rounded-full" title="Enhanced with new features" />
              )}
              {isFetching && activeTab === key && (
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
              )}
            </button>
          ))}
        </nav>
      </div>
      
      {/* Tab Content */}
      <div className="tab-content">
        {renderTabContent()}
      </div>
      
      {/* Footer Stats */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-blue-600">{adminData?.restaurants?.length || 0}</p>
            <p className="text-sm text-gray-600">Restaurants</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{adminData?.users?.length || 0}</p>
            <p className="text-sm text-gray-600">Users</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-600">{adminData?.dishes?.length || 0}</p>
            <p className="text-sm text-gray-600">Dishes</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-600">{adminData?.cities?.length || 0}</p>
            <p className="text-sm text-gray-600">Cities</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAdminPanelDemo; 