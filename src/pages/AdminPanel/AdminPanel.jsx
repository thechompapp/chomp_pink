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
 * Flattens the hierarchical location data into a single lookup object.
 * @param {Array} hierarchy - The hierarchical location data from the API.
 * @returns {Object} A flat object mapping location ID to location name.
 */
const flattenLocations = (hierarchy) => {
  const flatMap = {};
  const recurse = (nodes) => {
    if (!nodes || !Array.isArray(nodes)) return;
    nodes.forEach(node => {
      flatMap[node.id] = node.name;
      if (node.children && node.children.length > 0) {
        recurse(node.children);
      }
    });
  };
  recurse(hierarchy);
  return flatMap;
};

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
  locations: { 
    label: 'Locations', 
    key: 'locations', 
    enhanced: true, 
    icon: Globe,
    description: 'Unified city, borough, and neighborhood management'
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
  console.log('[AdminPanel] Starting to fetch admin data for endpoints:', endpoints);
  const results = {};
  const timeoutDuration = 10000; // 10 second timeout per endpoint
  
  // Create a timeout wrapper for each endpoint
  const fetchWithTimeout = async (endpoint) => {
    return Promise.race([
      (async () => {
        try {
          console.log(`[AdminPanel] Fetching data for ${endpoint}...`);
          const response = await apiClient.get(`/admin/${endpoint}`);
          console.log(`[AdminPanel] Response for ${endpoint}:`, response?.status, response?.data?.success);
          
          if (response?.data?.success && response?.data?.data) {
            console.log(`[AdminPanel] Successfully fetched ${response.data.data.length} items for ${endpoint}`);
            return { endpoint, data: response.data.data, success: true };
          } else {
            console.warn(`[AdminPanel] No data received for ${endpoint}:`, response?.data);
            return { endpoint, data: [], success: true };
          }
        } catch (error) {
          console.error(`[AdminPanel] Error fetching ${endpoint}:`, error.message);
          return { endpoint, data: [], success: false, error: error.message };
        }
      })(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Timeout fetching ${endpoint}`)), timeoutDuration)
      )
    ]);
  };
  
  // Fetch data for each endpoint with timeout
  try {
    const fetchPromises = endpoints.map(endpoint => fetchWithTimeout(endpoint));
    const responses = await Promise.allSettled(fetchPromises);
    
    responses.forEach((response, index) => {
      const endpoint = endpoints[index];
      if (response.status === 'fulfilled') {
        results[endpoint] = response.value.data;
        if (!response.value.success) {
          console.warn(`[AdminPanel] ${endpoint} fetch failed:`, response.value.error);
        }
      } else {
        console.error(`[AdminPanel] Promise rejected for ${endpoint}:`, response.reason);
        results[endpoint] = [];
      }
    });
    
    console.log('[AdminPanel] Admin data fetch completed:', Object.keys(results));
    return results;
  } catch (error) {
    console.error('[AdminPanel] Error in fetchAdminData:', error);
    // Return partial results if available
    return results;
  }
};

/**
 * Fetch function for admin stats
 */
const fetchAdminStats = async () => {
  try {
    console.log('[AdminPanel] Fetching admin stats...');
    const response = await apiClient.get('/admin/stats');
    console.log('[AdminPanel] Stats response:', {
      status: response?.status,
      success: response?.data?.success,
      dataKeys: response?.data?.data ? Object.keys(response.data.data) : 'no data',
      fullData: response?.data
    });
    
    if (response?.data?.success && response?.data?.data) {
      console.log('[AdminPanel] Stats data:', response.data.data);
      return response.data.data;
    }
    
    console.warn('[AdminPanel] No valid stats data received:', response?.data);
    return {};
  } catch (error) {
    console.error('[AdminPanel] Error fetching admin stats:', error);
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
    locations: { page: 1, pageSize: 25 },
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
  
  // Fetch all neighborhood data for lookups
  const { data: neighborhoods, isLoading: neighborhoodsLoading } = useQuery({
    queryKey: ['allNeighborhoods'],
    queryFn: () => enhancedAdminService.fetchAllNeighborhoods(),
    staleTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
  });

  const flattenedNeighborhoods = useMemo(() => {
    if (neighborhoods) {
      return flattenLocations(neighborhoods);
    }
    return {};
  }, [neighborhoods]);
  
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
  if (dataLoading && (!adminData || Object.keys(adminData).length === 0)) {
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
  
  // Render tab content
  const renderTabContent = () => {
    const currentData = getCurrentDataForTab(activeTab);
    const currentPageSettings = pageSettings[activeTab] || { page: 1, pageSize: 25 };

    if (activeTab === 'analytics') {
      return <AdminAnalyticsDashboard stats={adminStats} />;
    }
    
    if (activeTab === 'bulk_operations') {
      return <BulkOperationsPanel onResourceSelect={setSelectedBulkResource} />;
    }
    
    if (activeTab === 'chain_management') {
      return <ChainManagement />;
    }

    if (activeTab === 'locations') {
      return <LocationsTab />;
    }

    if (dataLoading || neighborhoodsLoading) {
      return <LoadingSpinner />;
    }
    
    if (error) {
      return <ErrorMessage message={error.message} />;
    }
    
    if (!currentData) {
      return <div>No data available for {activeTab}.</div>;
    }

    return (
      <>
        <EnhancedAdminTable
          key={activeTab} // Use key to re-mount component on tab change
          resourceType={activeTab}
          initialData={currentData}
          cities={adminData.cities || []}
          neighborhoods={flattenedNeighborhoods}
          onRefresh={() => queryClient.invalidateQueries(['adminData'])}
          onGlobalRefresh={() => queryClient.invalidateQueries()}
        />
        <PaginationControls
          currentPage={currentPageSettings.page}
          pageSize={currentPageSettings.pageSize}
          totalCount={currentData.length}
          onPageChange={(newPage) => handlePageChange(activeTab, newPage)}
          onPageSizeChange={(newPageSize) => handlePageSizeChange(activeTab, newPageSize)}
        />
      </>
    );
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 max-w-7xl navbar-spacing">
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
                <p className="text-3xl font-bold text-blue-600">{adminStats?.restaurants || adminStats?.counts?.restaurants || 0}</p>
                <p className="text-sm text-gray-600 mt-1">Restaurants</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-3xl font-bold text-green-600">{adminStats?.users || adminStats?.counts?.users || 0}</p>
                <p className="text-sm text-gray-600 mt-1">Users</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-3xl font-bold text-purple-600">{adminStats?.dishes || adminStats?.counts?.dishes || 0}</p>
                <p className="text-sm text-gray-600 mt-1">Dishes</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-3xl font-bold text-yellow-600">{adminStats?.lists || adminStats?.counts?.lists || 0}</p>
                <p className="text-sm text-gray-600 mt-1">Lists</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-3xl font-bold text-orange-600">{adminStats?.locations || adminStats?.counts?.locations || ((adminStats?.cities || adminStats?.counts?.cities || 0) + (adminStats?.neighborhoods || adminStats?.counts?.neighborhoods || 0))}</p>
                <p className="text-sm text-gray-600 mt-1">Locations</p>
              </div>
            </div>
          )}
          
          {/* Additional stats row */}
          {!statsLoading && !statsError && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6 pt-6 border-t border-gray-200">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-600">{adminStats?.hashtags || adminStats?.counts?.hashtags || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Hashtags</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-600">{adminStats?.submissions || adminStats?.counts?.submissions || 0}</p>
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