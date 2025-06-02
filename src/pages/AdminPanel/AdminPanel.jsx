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

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, BarChart3, Settings, Eye, Globe, Users, Utensils, MapPin, Hash, Building2, FileText, List } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { enhancedAdminService } from '@/services/enhancedAdminService';
import { EnhancedAdminTable } from '@/components/AdminPanel/EnhancedAdminTable';
import { AdminAnalyticsDashboard } from '@/components/AdminPanel/AdminAnalyticsDashboard';
import { BulkOperationsPanel } from '@/components/AdminPanel/BulkOperationsPanel';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AdminAuthSetup } from '@/utils/adminAuthSetup';
import { logInfo, logWarn, logError } from '@/utils/logger';
import ChainManagement from '../Admin/ChainManagement';
import LocationsTab from '@/components/AdminPanel/LocationsTab';
import apiClient from '@/services/apiClient.js';
import LoadingSpinner from '@/components/UI/LoadingSpinner.jsx';
import ErrorMessage from '@/components/UI/ErrorMessage.jsx';
import PaginationControls from '@/components/AdminPanel/PaginationControls.jsx';
import AdminAnalyticsSummary from '@/pages/AdminPanel/AdminAnalyticsSummary.jsx';

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
    icon: Utensils,
    description: 'Manage restaurant listings with bulk operations'
  },
  dishes: { 
    label: 'Dishes', 
    key: 'dishes', 
    enhanced: true, 
    icon: Hash,
    description: 'Manage dish catalog with advanced editing'
  },
  users: { 
    label: 'Users', 
    key: 'users', 
    enhanced: true, 
    icon: Users,
    description: 'User management and permissions'
  },
  cities: { 
    label: 'Cities', 
    key: 'cities', 
    enhanced: true, 
    icon: Globe,
    description: 'City management with location hierarchy'
  },
  neighborhoods: { 
    label: 'Neighborhoods', 
    key: 'neighborhoods', 
    enhanced: true, 
    icon: MapPin,
    description: 'Neighborhood and location management'
  },
  hashtags: { 
    label: 'Hashtags', 
    key: 'hashtags', 
    enhanced: true, 
    icon: Hash,
    description: 'Tag management and organization'
  },
  restaurant_chains: { 
    label: 'Chains', 
    key: 'restaurant_chains', 
    enhanced: true, 
    icon: Building2,
    description: 'Restaurant chain management'
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
    icon: FileText,
    description: 'User submission review and approval'
  },
  lists: { 
    label: 'Lists', 
    key: 'lists', 
    enhanced: true, 
    icon: List,
    description: 'User list management and moderation'
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
 * Fetch function for admin data
 */
const fetchAdminData = async (endpoints) => {
  const results = {};
  
  // Fetch data for each endpoint
  await Promise.all(
    endpoints.map(async (endpoint) => {
      try {
        const response = await apiClient.get(`/admin/${endpoint}`);
        if (response?.data?.success && response?.data?.data) {
          results[endpoint] = response.data.data;
        } else {
          console.warn(`No data received for ${endpoint}:`, response);
          results[endpoint] = [];
        }
      } catch (error) {
        console.error(`Error fetching ${endpoint}:`, error);
        results[endpoint] = [];
      }
    })
  );
  
  return results;
};

/**
 * Fetch function for admin stats
 */
const fetchAdminStats = async () => {
  try {
    const response = await apiClient.get('/admin/stats');
    if (response?.data?.success && response?.data?.data) {
      return response.data.data;
    }
    return {};
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return {};
  }
};

/**
 * Enhanced Admin Panel Component
 */
const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('restaurants');
  const [selectedBulkResource, setSelectedBulkResource] = useState(null);
  const [pageSettings, setPageSettings] = useState({
    restaurants: { page: 1, pageSize: 25 },
    dishes: { page: 1, pageSize: 25 },
    users: { page: 1, pageSize: 25 },
    cities: { page: 1, pageSize: 25 },
    neighborhoods: { page: 1, pageSize: 25 },
    hashtags: { page: 1, pageSize: 25 },
    restaurant_chains: { page: 1, pageSize: 25 },
    submissions: { page: 1, pageSize: 25 },
    lists: { page: 1, pageSize: 25 }
  });
  
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  
  // Tab initialization from URL
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && TAB_CONFIG[tabFromUrl]) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);
  
  // Fetch all admin data
  const { 
    data: adminData = {}, 
    isLoading: dataLoading, 
    error, 
    isFetching 
  } = useQuery({
    queryKey: ['adminData'],
    queryFn: () => fetchAdminData(Object.keys(TAB_CONFIG).filter(key => !['analytics', 'bulk_operations', 'chain_management', 'locations'].includes(key))),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
  
  // Fetch admin stats
  const { 
    data: adminStats = {}, 
    isLoading: statsLoading,
    error: statsError 
  } = useQuery({
    queryKey: ['adminStats'],
    queryFn: fetchAdminStats,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  });
  
  // Performance optimizations
  const tabConfig = useMemo(() => TAB_CONFIG, []);
  
  // Update tab effect
  useEffect(() => {
    logInfo(`[EnhancedAdminPanel] Active tab changed to: ${activeTab}`);
  }, [activeTab]);
  
  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    // Update URL params to persist tab state
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('tab', newTab);
    setSearchParams(newSearchParams, { replace: true });
    logInfo(`[AdminPanel] Tab changed to: ${newTab}`);
  };
  
  const handlePageChange = (tab, newPage) => {
    setPageSettings(prev => ({
      ...prev,
      [tab]: { ...prev[tab], page: newPage }
    }));
  };
  
  const handlePageSizeChange = (tab, newPageSize) => {
    setPageSettings(prev => ({
      ...prev,
      [tab]: { page: 1, pageSize: newPageSize }
    }));
  };
  
  // Get data for current tab with pagination applied
  const getCurrentDataForTab = (tabKey) => {
    const data = adminData[tabKey] || [];
    const { page, pageSize } = pageSettings[tabKey] || { page: 1, pageSize: 25 };
    
    if (pageSize === -1) {
      return data; // Return all data
    }
    
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return data.slice(startIndex, endIndex);
  };
  
  const handleOperationComplete = () => {
    queryClient.invalidateQueries(['adminData']);
    queryClient.invalidateQueries(['adminStats']);
  };
  
  const isEnhanced = TAB_CONFIG[activeTab]?.enhanced || false;
  
  // Early return for data loading
  if (dataLoading && !adminData) {
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
  if (error) {
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
              onClick={() => queryClient.invalidateQueries(['adminData'])}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  const currentData = getCurrentDataForTab(activeTab);
  const cities = adminData?.cities || [];
  const neighborhoods = adminData?.neighborhoods || [];
  
  // Render tab content
  const renderTabContent = () => {
    const currentData = getCurrentDataForTab(activeTab);
    const allTabData = adminData[activeTab] || [];
    const tabPageSettings = pageSettings[activeTab] || { page: 1, pageSize: 25 };
    
    // Enhanced tabs with pagination
    if (['restaurants', 'dishes', 'users', 'cities', 'neighborhoods', 'hashtags', 'restaurant_chains', 'submissions', 'lists'].includes(activeTab)) {
      return (
        <div className="space-y-6">
          {/* Enhanced Admin Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <EnhancedAdminTable
              resourceType={activeTab}
              initialData={currentData}
              cities={adminData.cities || []}
              neighborhoods={adminData.neighborhoods || []}
              pageSize={tabPageSettings.pageSize === -1 ? allTabData.length : tabPageSettings.pageSize}
              enableInlineEditing={true}
              enableBulkOperations={true}
              enableSelection={true}
              enableCreate={true}
              onGlobalRefresh={() => queryClient.invalidateQueries(['adminData'])}
              className="shadow-lg"
            />
            
            {/* Pagination Controls */}
            <PaginationControls
              currentPage={tabPageSettings.page}
              totalItems={allTabData.length}
              pageSize={tabPageSettings.pageSize}
              onPageChange={(newPage) => handlePageChange(activeTab, newPage)}
              onPageSizeChange={(newPageSize) => handlePageSizeChange(activeTab, newPageSize)}
              showPageSizeSelector={true}
              showPageInfo={true}
              showNavigation={true}
            />
          </div>
        </div>
      );
    }
    
    // Special case for locations tab
    if (activeTab === 'locations') {
      return (
        <div className="space-y-6">
          <LocationsTab 
            onOperationComplete={handleOperationComplete}
            adminData={adminData}
          />
        </div>
      );
    }
    
    // Special case for chain management
    if (activeTab === 'chain_management') {
      return (
        <div className="space-y-6">
          <ChainManagement 
            initialData={adminData?.restaurant_chains || []}
            onDataChange={handleOperationComplete}
          />
        </div>
      );
    }
    
    // Special case for analytics
    if (activeTab === 'analytics') {
      return (
        <div className="space-y-6">
          <AdminAnalyticsSummary adminData={adminData} />
        </div>
      );
    }
    
    // Special case for bulk operations
    if (activeTab === 'bulk_operations') {
      return (
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Universal Bulk Operations</h3>
            <p className="text-blue-700 text-sm">
              Perform bulk operations across all data types. Select a resource type below to get started.
            </p>
          </div>
          
          {/* Resource Type Selector */}
          <div className="bg-white rounded-lg border p-4">
            <h4 className="font-medium text-gray-900 mb-3">Select Resource Type</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {Object.entries({
                restaurants: { label: 'Restaurants', icon: '🍽️', count: adminStats?.restaurants || 0 },
                dishes: { label: 'Dishes', icon: '🍝', count: adminStats?.dishes || 0 },
                users: { label: 'Users', icon: '👥', count: adminStats?.users || 0 },
                locations: { label: 'Locations', icon: '📍', count: adminStats?.locations || 0 },
                lists: { label: 'Lists', icon: '📋', count: adminStats?.lists || 0 },
                hashtags: { label: 'Hashtags', icon: '#️⃣', count: adminStats?.hashtags || 0 },
                restaurant_chains: { label: 'Chains', icon: '🏢', count: adminStats?.restaurant_chains || 0 },
                submissions: { label: 'Submissions', icon: '📝', count: adminStats?.submissions || 0 }
              }).map(([key, { label, icon, count }]) => (
                <button
                  key={key}
                  onClick={() => setSelectedBulkResource(key)}
                  className={cn(
                    "p-3 rounded-lg border text-left transition-all",
                    selectedBulkResource === key
                      ? "border-blue-500 bg-blue-50 text-blue-900"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{icon}</span>
                      <span className="font-medium text-sm">{label}</span>
                    </div>
                    <span className="text-xs text-gray-500">{count}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Bulk Operations Panel */}
          {selectedBulkResource && (
            <BulkOperationsPanel 
              resourceType={selectedBulkResource}
              selectedRows={new Set()} // For now, no pre-selected rows
              adminData={adminData}
              onOperationComplete={handleOperationComplete}
            />
          )}
          
          {!selectedBulkResource && (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <div className="text-gray-400 text-6xl mb-4">⚡</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Ready for Bulk Operations</h3>
              <p className="text-gray-600">Select a resource type above to start performing bulk operations</p>
            </div>
          )}
        </div>
      );
    }
    
    // Default fallback
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Tab content not implemented yet</p>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Enhanced Admin Panel</h1>
          <p className="text-gray-600 mt-2 text-lg">
            Fully enhanced admin interface with real-time editing, analytics, and bulk operations across all data types
          </p>
          
          {/* Enhancement indicators */}
          <div className="mt-4 flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Current tab:</span>
              <span className={cn(
                "px-3 py-1 rounded-full text-sm font-medium",
                isEnhanced 
                  ? "bg-green-100 text-green-800 border border-green-200" 
                  : "bg-gray-100 text-gray-800 border border-gray-200"
              )}>
                {isEnhanced ? 'Enhanced' : 'Legacy'}
              </span>
            </div>
            
            {isEnhanced && (
              <div className="flex items-center space-x-2 text-sm text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Live features active</span>
              </div>
            )}
            
            {isFetching && (
              <div className="flex items-center space-x-2 text-sm text-blue-600">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>Syncing data...</span>
              </div>
            )}
          </div>
        </div>
        
        {/* System Overview */}
        <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Overview</h3>
          {statsLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner message="Loading statistics..." />
            </div>
          ) : statsError ? (
            <div className="text-center py-8">
              <ErrorMessage 
                message="Failed to load statistics" 
                onRetry={() => queryClient.invalidateQueries(['adminStats'])}
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-3xl font-bold text-blue-600">{adminStats?.restaurants || 0}</p>
                <p className="text-sm text-gray-600 mt-1">Restaurants</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-3xl font-bold text-green-600">{adminStats?.users || 0}</p>
                <p className="text-sm text-gray-600 mt-1">Users</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-3xl font-bold text-purple-600">{adminStats?.dishes || 0}</p>
                <p className="text-sm text-gray-600 mt-1">Dishes</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-3xl font-bold text-yellow-600">{adminStats?.lists || 0}</p>
                <p className="text-sm text-gray-600 mt-1">Lists</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-3xl font-bold text-orange-600">{adminStats?.locations || 0}</p>
                <p className="text-sm text-gray-600 mt-1">Locations</p>
              </div>
            </div>
          )}
          
          {/* Additional stats row */}
          {!statsLoading && !statsError && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6 pt-6 border-t border-gray-200">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-600">{adminStats?.cities || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Cities</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-600">{adminStats?.neighborhoods || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Neighborhoods</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-600">{adminStats?.hashtags || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Hashtags</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-600">{adminStats?.submissions || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Submissions</p>
              </div>
            </div>
          )}
          
          {/* Last updated info */}
          {adminStats?.lastUpdated && (
            <div className="mt-4 text-center text-xs text-gray-500">
              Last updated: {new Date(adminStats.lastUpdated).toLocaleString()}
            </div>
          )}
        </div>
        
        {/* Tab Navigation - Modern Button Style */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
            <nav className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {Object.entries(TAB_CONFIG).map(([key, { label, enhanced, icon: Icon, description }]) => (
                <button
                  key={key}
                  onClick={() => handleTabChange(key)}
                  className={cn(
                    'relative p-4 rounded-lg font-medium text-sm transition-all duration-200',
                    'flex flex-col items-center space-y-2 group min-h-[80px]',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                    activeTab === key
                      ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-gray-200',
                    'border transition-transform'
                  )}
                  aria-current={activeTab === key ? 'page' : undefined}
                  title={description}
                >
                  {/* Icon */}
                  <div className={cn(
                    'p-2 rounded-lg transition-colors',
                    activeTab === key 
                      ? 'bg-blue-500' 
                      : 'bg-gray-100 group-hover:bg-gray-200'
                  )}>
                    <Icon className={cn(
                      'w-5 h-5',
                      activeTab === key ? 'text-white' : 'text-gray-600'
                    )} />
                  </div>
                  
                  {/* Label */}
                  <span className="text-center leading-tight">{label}</span>
                  
                  {/* Enhanced indicator */}
                  {enhanced && (
                    <div className="absolute top-2 right-2">
                      <span className={cn(
                        "w-2 h-2 rounded-full",
                        activeTab === key ? "bg-green-300" : "bg-green-500"
                      )} title="Enhanced with new features" />
                    </div>
                  )}
                  
                  {/* Loading indicator */}
                  {isFetching && activeTab === key && (
                    <div className="absolute bottom-2 right-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
                    </div>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>
        
        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 min-h-[600px]">
          <div className="p-6">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel; 