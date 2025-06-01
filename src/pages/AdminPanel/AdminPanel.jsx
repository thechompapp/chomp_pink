/**
 * Enhanced Admin Panel
 * 
 * The main admin panel providing:
 * - Improved data fetching and population
 * - Real-time inline editing
 * - Field-specific validation
 * - Better error handling
 * - Performance optimizations
 * - Analytics dashboard
 * - Bulk operations including restaurant bulk add
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, BarChart3, Settings, Eye } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { enhancedAdminService } from '@/services/enhancedAdminService';
import { EnhancedAdminTable } from '@/components/AdminPanel/EnhancedAdminTable';
import { AdminAnalyticsDashboard } from '@/components/AdminPanel/AdminAnalyticsDashboard';
import { BulkOperationsPanel } from '@/components/AdminPanel/BulkOperationsPanel';
import { useNavigate } from 'react-router-dom';
import { AdminAuthSetup } from '@/utils/adminAuthSetup';
import { logInfo, logWarn, logError } from '@/utils/logger';
import ChainManagement from '../Admin/ChainManagement';

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
  dishes: { 
    label: 'Dishes', 
    key: 'dishes', 
    enhanced: true, 
    icon: Settings,
    description: 'Manage dishes data with real-time editing'
  },
  users: { 
    label: 'Users', 
    key: 'users', 
    enhanced: true, 
    icon: Settings,
    description: 'Manage users data with real-time editing'
  },
  cities: { 
    label: 'Cities', 
    key: 'cities', 
    enhanced: true, 
    icon: Settings,
    description: 'Manage cities data with real-time editing'
  },
  neighborhoods: { 
    label: 'Neighborhoods', 
    key: 'neighborhoods', 
    enhanced: true, 
    icon: Settings,
    description: 'Manage neighborhoods data with real-time editing'
  },
  hashtags: { 
    label: 'Hashtags', 
    key: 'hashtags', 
    enhanced: true, 
    icon: Settings,
    description: 'Manage hashtags data with real-time editing'
  },
  restaurant_chains: { 
    label: 'Restaurant Chains', 
    key: 'restaurant_chains', 
    enhanced: true, 
    icon: Settings,
    description: 'Manage restaurant chains data with real-time editing'
  },
  chain_management: {
    label: 'Chain Management',
    key: 'chain_management',
    enhanced: true,
    icon: BarChart3,
    description: 'AI-powered chain detection and management tools'
  },
  submissions: { 
    label: 'Submissions', 
    key: 'submissions', 
    enhanced: true, 
    icon: Settings,
    description: 'Manage submissions data with real-time editing'
  },
  bulk_operations: {
    label: 'Bulk Operations',
    key: 'bulk_operations',
    enhanced: true,
    icon: Settings,
    description: 'Import, export, and batch operations'
  }
};

/**
 * Enhanced Admin Panel Component
 */
const AdminPanel = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('analytics');
  const [isInitializing, setIsInitializing] = useState(false);
  const [selectedResourceType, setSelectedResourceType] = useState('restaurants');
  
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
    enabled: true,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
    onSuccess: (data) => {
      logInfo('[EnhancedAdminPanel] Admin data fetched successfully');
      toast.success('Admin data loaded successfully');
    },
    onError: (error) => {
      logError('[EnhancedAdminPanel] Error fetching admin data:', error);
      toast.error(`Failed to load admin data: ${error.message}`);
    }
  });
  
  // Performance optimizations
  const tabConfig = useMemo(() => TAB_CONFIG, []);
  
  // Update tab effect
  useEffect(() => {
    logInfo(`[EnhancedAdminPanel] Active tab changed to: ${activeTab}`);
  }, [activeTab]);
  
  // Early return for data loading
  if (isFetching && !adminData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading admin data...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Error state
  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <AlertTriangle className="h-12 w-12 text-red-500" />
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Error Loading Admin Data
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {error?.message || 'Failed to load admin data'}
            </p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Get current data for active tab
  const getCurrentDataForTab = (tabKey) => {
    // For bulk operations, use the selectedResourceType
    if (tabKey === 'bulk_operations') {
      return adminData?.[selectedResourceType] || [];
    }
    // For analytics, we don't need current data
    if (tabKey === 'analytics') {
      return [];
    }
    // For all other tabs, use the tab key as the data source
    return adminData?.[tabKey] || [];
  };
  
  const currentData = getCurrentDataForTab(activeTab);
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
                      <li>Google Places modal for restaurant information lookup</li>
                      <li>Automatic zip code to neighborhood lookup</li>
                      <li>Auto-setting of city and neighborhood fields</li>
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
              onGlobalRefresh={refetch}
              className="shadow-lg"
            />
          </div>
        );

      case 'dishes':
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
              resourceType="dishes"
              initialData={currentData}
              cities={cities}
              neighborhoods={neighborhoods}
              pageSize={25}
              enableInlineEditing={true}
              enableBulkOperations={true}
              enableSelection={true}
              enableCreate={true}
              onGlobalRefresh={refetch}
              className="shadow-lg"
            />
          </div>
        );

      case 'users':
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
              resourceType="users"
              initialData={currentData}
              cities={cities}
              neighborhoods={neighborhoods}
              pageSize={25}
              enableInlineEditing={true}
              enableBulkOperations={true}
              enableSelection={true}
              enableCreate={true}
              onGlobalRefresh={refetch}
              className="shadow-lg"
            />
          </div>
        );

      case 'cities':
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
              resourceType="cities"
              initialData={currentData}
              cities={cities}
              neighborhoods={neighborhoods}
              pageSize={25}
              enableInlineEditing={true}
              enableBulkOperations={true}
              enableSelection={true}
              enableCreate={true}
              onGlobalRefresh={refetch}
              className="shadow-lg"
            />
          </div>
        );

      case 'neighborhoods':
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
              resourceType="neighborhoods"
              initialData={currentData}
              cities={cities}
              neighborhoods={neighborhoods}
              pageSize={25}
              enableInlineEditing={true}
              enableBulkOperations={true}
              enableSelection={true}
              enableCreate={true}
              onGlobalRefresh={refetch}
              className="shadow-lg"
            />
          </div>
        );

      case 'hashtags':
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
              resourceType="hashtags"
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

      case 'restaurant_chains':
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
              resourceType="restaurant_chains"
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

      case 'chain_management':
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
                      <li>AI-powered chain detection and management tools</li>
                      <li>Automatic restaurant name similarity analysis</li>
                      <li>Intelligent chain creation suggestions</li>
                      <li>Confidence scoring for chain matches</li>
                      <li>Comprehensive chain statistics and analytics</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Chain Management Component */}
            <ChainManagement />
          </div>
        );

      case 'submissions':
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
              resourceType="submissions"
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
        return (
          <div className="text-center py-12">
            <p className="text-gray-500">Tab not implemented yet</p>
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
          Fully enhanced admin interface with real-time editing, analytics, and bulk operations across all data types
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

export default AdminPanel; 