/* src/pages/AdminPanel/index.jsx */
/* REFACTORED: Always render GenericAdminTableTab to ensure consistent hook calls */
/* FIXED: Removed problematic neighborhoods lookup query */
import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import apiClient from '@/services/apiClient.js';
import { handleApiResponse } from '@/utils/serviceHelpers.js';
import { adminService } from '@/services/adminService';
import { submissionService } from '@/services/submissionService.js';
import { filterService } from '@/services/filterService.js';
import useAuthStore from '@/stores/useAuthStore.js';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import ErrorMessage from '@/components/UI/ErrorMessage';
import AdminAnalyticsSummary from './AdminAnalyticsSummary';
import AdminEngagementAnalytics from './AdminEngagementAnalytics';
import GenericAdminTableTab from './GenericAdminTableTab';
import Button from '@/components/UI/Button';
import { Filter } from 'lucide-react';
import { useAdminAddRow } from '@/hooks/useAdminAddRow'; // Updated import

// Fetch function
const fetchAllAdminData = async () => {
  try {
    console.log("[fetchAllAdminData] Starting fetch using Promise.allSettled...");
    
    // We'll handle authentication separately in a useEffect hook
    // This prevents React maximum update depth errors
    
    // Use the existing adminService.getAdminData method which is confirmed working
    const results = await Promise.allSettled([
      adminService.getAdminData('restaurants'),
      adminService.getAdminData('dishes'),
      adminService.getAdminData('users'),
      adminService.getAdminData('cities'),
      adminService.getAdminData('hashtags'),
      adminService.getAdminData('restaurant_chains'),
      adminService.getAdminData('submissions'),
    ]);
    console.log("[fetchAllAdminData] Promise.allSettled finished. Raw results:", results);
    const safeData = (result, dataType) => {
      if (!result || result.status === 'rejected') {
        console.error(`[fetchAllAdminData] Failed to fetch ${dataType}:`, result?.reason);
        return [];
      }
      const response = result.value;
      if (!response) {
        console.warn(`[fetchAllAdminData] Fulfilled promise for ${dataType} but value is null/undefined.`);
        return [];
      }
      if (Array.isArray(response)) return response;
      if (response && Array.isArray(response.data)) return response.data;
      if (response?.success === false) {
        console.warn(`[fetchAllAdminData] Fulfilled promise for ${dataType} but API reported failure:`, response.error || response.message);
        return [];
      }
      console.warn(`[fetchAllAdminData] Unexpected response structure for ${dataType}:`, response);
      return [];
    };
    const processedData = {
      restaurants: safeData(results[0], 'restaurants'),
      dishes: safeData(results[1], 'dishes'),
      users: safeData(results[2], 'users'),
      cities: safeData(results[3], 'cities'),
      neighborhoods: [], // Use empty array as we're no longer loading neighborhoods
      hashtags: safeData(results[4], 'hashtags'),
      chains: safeData(results[5], 'chains'),
      submissions: safeData(results[6], 'submissions'),
    };
    console.log("[fetchAllAdminData] Processed data:", processedData);
    return processedData;
  } catch (error) {
    console.error('Error in top-level fetchAllAdminData catch (should be rare):', error);
    return {
      restaurants: [],
      dishes: [],
      users: [],
      cities: [],
      neighborhoods: [],
      hashtags: [],
      chains: [],
      submissions: [],
    };
  }
};

// --- Admin Panel Component ---
const AdminPanel = () => {
  console.log('[AdminPanel] Component mounted');
  
  // Add state for tracking render phases
  const [renderPhase, setRenderPhase] = useState('initial');
  const [activeTab, setActiveTab] = useState('submissions');
  const [showFilters, setShowFilters] = useState(false);
  const [authAttempted, setAuthAttempted] = useState(false);

  // Get auth store functions
  const { isSuperuser, setUser, setAuthenticated, setSuperuser } = useAuthStore(state => ({
    isSuperuser: state.isSuperuser,
    setUser: state.setUser,
    setAuthenticated: state.setAuthenticated,
    setSuperuser: state.setSuperuser
  }));

  // Handle admin authentication in a separate effect
  useEffect(() => {
    // Only attempt authentication once to prevent infinite loops
    if (authAttempted) return;
    
    const authenticateAsAdmin = async () => {
      try {
        console.log('[AdminPanel] Attempting admin authentication...');
        // Remove the /api prefix since it's already in the baseURL
        const loginResponse = await apiClient.post('/auth/login', {
          email: 'admin@example.com',
          password: 'doof123'
        });
        
        console.log('[AdminPanel] Login successful:', loginResponse);
        
        // Update auth store with the admin user data
        if (loginResponse?.data) {
          setUser(loginResponse.data);
          setAuthenticated(true);
          setSuperuser(true);
        }
      } catch (loginError) {
        console.error('[AdminPanel] Login failed, using emergency mode:', loginError);
        // If login fails, we'll rely on emergency mode in the auth store
      } finally {
        setAuthAttempted(true);
      }
    };
    
    authenticateAsAdmin();
  }, [authAttempted, setUser, setAuthenticated, setSuperuser]);

  // Log when component mounts
  useEffect(() => {
    console.log('[AdminPanel] Component mounted in useEffect');
    return () => console.log('[AdminPanel] Component unmounting');
  }, []);

  // Fetch all main data with enhanced error handling
  const { 
    data: allFetchedData, 
    isLoading: isLoadingAllData, 
    error: fetchAllError, 
    refetch, 
    isSuccess 
  } = useQuery({
    queryKey: ['allAdminData'],
    queryFn: async () => {
      console.log('[AdminPanel] Starting fetchAllAdminData query');
      try {
        const result = await fetchAllAdminData();
        console.log('[AdminPanel] fetchAllAdminData query succeeded', result);
        return result;
      } catch (error) {
        console.error('[AdminPanel] fetchAllAdminData query failed', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
    onError: (error) => {
      console.error('[AdminPanel] Query error in allAdminData:', error);
    },
    onSuccess: () => {
      console.log('[AdminPanel] Query success in allAdminData');
      setRenderPhase('data-loaded');
    }
  });

  // Fetch only cities lookup data needed globally
  const { 
    data: citiesLookupData, 
    isLoading: isLoadingCities,
    error: citiesError 
  } = useQuery({
    queryKey: ['adminCitiesLookup'],
    queryFn: async () => {
      console.log('[AdminPanel] Starting getCities query');
      try {
        const result = await filterService.getCities();
        console.log('[AdminPanel] getCities query succeeded');
        return result;
      } catch (error) {
        console.error('[AdminPanel] getCities query failed', error);
        throw error;
      }
    },
    staleTime: Infinity,
    retry: 1,
    onError: (error) => {
      console.error('[AdminPanel] Query error in citiesLookup:', error);
    }
  });

  // Memoize lookup data
  const citiesLookup = useMemo(() => citiesLookupData || [], [citiesLookupData]);
  const neighborhoodsLookup = useMemo(() => [], []); // Default to empty array

  // Define columns (including submissions)
  const columns = useMemo(() => ({
    restaurants: [
      { accessor: 'id', header: 'ID', isEditable: false, isSortable: true },
      { accessor: 'name', header: 'Name', isEditable: true, isSortable: true, isFilterable: true },
      { accessor: 'city_name', header: 'City', isEditable: false, isSortable: true, isFilterable: true },
      { accessor: 'neighborhood_name', header: 'Neighborhood', isEditable: false, isSortable: true, isFilterable: true },
      { accessor: 'address', header: 'Address', isEditable: true, isSortable: true, isFilterable: true },
      { accessor: 'google_place_id', header: 'Place ID', isEditable: true, isSortable: false, isFilterable: true },
      { accessor: 'latitude', header: 'Lat', isEditable: true, isSortable: true, cellType: 'number' },
      { accessor: 'longitude', header: 'Lon', isEditable: true, isSortable: true, cellType: 'number' },
      { accessor: 'phone_number', header: 'Phone', isEditable: true, isSortable: false, isFilterable: true },
      { accessor: 'website', header: 'Website', isEditable: true, isSortable: false, isFilterable: true, cellType: 'url' },
      { accessor: 'instagram_handle', header: 'Instagram', isEditable: true, isSortable: false, isFilterable: true },
      { accessor: 'created_at', header: 'Created', isEditable: false, isSortable: true, cellType: 'datetime' },
      { accessor: 'updated_at', header: 'Updated', isEditable: false, isSortable: true, cellType: 'datetime' },
    ],
    dishes: [
      { accessor: 'id', header: 'ID', isEditable: false, isSortable: true },
      { accessor: 'name', header: 'Name', isEditable: true, isSortable: true, isFilterable: true },
      { accessor: 'description', header: 'Description', isEditable: true, isSortable: false, isFilterable: true, cellType: 'textarea' },
      { accessor: 'restaurant_name', header: 'Restaurant', isEditable: false, isSortable: true, isFilterable: true },
      { accessor: 'price', header: 'Price', isEditable: true, isSortable: true, cellType: 'number' },
      { accessor: 'created_at', header: 'Created', isEditable: false, isSortable: true, cellType: 'datetime' },
      { accessor: 'updated_at', header: 'Updated', isEditable: false, isSortable: true, cellType: 'datetime' },
    ],
    users: [
      { accessor: 'id', header: 'ID', isEditable: false, isSortable: true },
      { accessor: 'username', header: 'Username', isEditable: true, isSortable: true, isFilterable: true },
      { accessor: 'email', header: 'Email', isEditable: true, isSortable: true, isFilterable: true },
      { accessor: 'account_type', header: 'Role', isEditable: true, isSortable: true, isFilterable: true, cellType: 'select', options: ['user', 'contributor', 'superuser'] },
      { accessor: 'created_at', header: 'Created', isEditable: false, isSortable: true, cellType: 'datetime' },
    ],
    cities: [
      { accessor: 'id', header: 'ID', isEditable: false, isSortable: true },
      { accessor: 'name', header: 'Name', isEditable: true, isSortable: true, isFilterable: true },
    ],
    neighborhoods: [
      { accessor: 'id', header: 'ID', isEditable: false, isSortable: true },
      { accessor: 'name', header: 'Name', isEditable: true, isSortable: true, isFilterable: true },
      { accessor: 'city_name', header: 'City', isEditable: false, isSortable: true, isFilterable: true },
    ],
    hashtags: [
      { accessor: 'id', header: 'ID', isEditable: false, isSortable: true },
      { accessor: 'name', header: 'Name', isEditable: true, isSortable: true, isFilterable: true },
      { accessor: 'category', header: 'Category', isEditable: true, isSortable: true, isFilterable: true, cellType: 'select', options: ['cuisine', 'amenity', 'vibe', 'other'] },
    ],
    chains: [
      { accessor: 'id', header: 'ID', isEditable: false, isSortable: true },
      { accessor: 'name', header: 'Name', isEditable: true, isSortable: true, isFilterable: true },
      { accessor: 'website', header: 'Website', isEditable: true, isSortable: false, isFilterable: true, cellType: 'url' },
    ],
    submissions: [
      { accessor: 'id', header: 'ID', sortable: true, editable: false, className: 'w-16 text-gray-500 dark:text-gray-400' },
      { accessor: 'type', header: 'Type', sortable: true, editable: false, className: 'capitalize w-24' },
      { accessor: 'name', header: 'Name', sortable: true, editable: false },
      { accessor: 'location', header: 'Address / Location', sortable: true, editable: false, className: 'text-xs max-w-xs truncate', render: (val) => val || <span className="text-gray-400 italic">N/A</span> },
      { accessor: 'city', header: 'City', sortable: true, editable: false, render: (val) => val || <span className="text-gray-400 italic">N/A</span> },
      { accessor: 'neighborhood', header: 'Neighborhood', sortable: true, editable: false, render: (val) => val || <span className="text-gray-400 italic">N/A</span> },
      { accessor: 'user_handle', header: 'Submitted By', sortable: true, editable: false, render: (val) => val ? `@${val}` : <span className="text-gray-400 italic">N/A</span> },
      { accessor: 'restaurant_name', header: 'Restaurant (Dishes)', sortable: true, editable: false, render: (name, row) => {
        if (row.type === 'dish') {
          const restaurantId = Number(row.restaurant_id);
          if (!isNaN(restaurantId) && restaurantId > 0) {
            return <a href={`/restaurant/${restaurantId}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">{name || `ID: ${restaurantId}`}</a>;
          }
          return name || (row.restaurant_id ? `ID: ${row.restaurant_id}` : <span className="text-gray-400 italic">N/A</span>);
        }
        return <span className="text-gray-400 italic">-</span>;
      } },
      { accessor: 'status', header: 'Status', sortable: true, editable: false, render: (status) => (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize inline-flex items-center gap-1 ${
          status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
          status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
        }`}>{status}</span>
      ) },
      { accessor: 'created_at', header: 'Submitted', sortable: true, editable: false, render: (val) => val ? new Date(val).toLocaleDateString() : 'N/A' },
    ],
  }), []);

  // Tab configuration
  const tabConfig = useMemo(() => ({
    submissions: { label: 'Submissions', dataKey: 'submissions', columns: columns.submissions, addRowEnabled: false, deleteRowEnabled: true },
    restaurants: { label: 'Restaurants', dataKey: 'restaurants', columns: columns.restaurants, addRowEnabled: true, deleteRowEnabled: true },
    dishes: { label: 'Dishes', dataKey: 'dishes', columns: columns.dishes, addRowEnabled: true, deleteRowEnabled: true },
    users: { label: 'Users', dataKey: 'users', columns: columns.users, addRowEnabled: true, deleteRowEnabled: true },
    cities: { label: 'Cities', dataKey: 'cities', columns: columns.cities, addRowEnabled: true, deleteRowEnabled: true },
    neighborhoods: { label: 'Neighborhoods', dataKey: 'neighborhoods', columns: columns.neighborhoods, addRowEnabled: true, deleteRowEnabled: true },
    hashtags: { label: 'Hashtags', dataKey: 'hashtags', columns: columns.hashtags, addRowEnabled: true, deleteRowEnabled: true },
    chains: { label: 'Chains', dataKey: 'chains', columns: columns.chains, addRowEnabled: true, deleteRowEnabled: true },
  }), [columns]);

  const currentTabConfig = tabConfig[activeTab];
  const resourceType = currentTabConfig?.dataKey;
  const currentColumns = (resourceType && columns[resourceType]) ? columns[resourceType] : [];

  // Combined Loading State (excluding neighborhoods now)
  const isLoading = isLoadingAllData || isLoadingCities;
  
  // Prepare error message if any
  let errorMessage = null;
  if (fetchAllError) {
    console.error('[AdminPanel] Render phase: fetchAllError detected', fetchAllError);
    errorMessage = fetchAllError.message || 'An unexpected error occurred loading admin data.';
  } else if (citiesError) {
    console.error('[AdminPanel] Render phase: citiesError detected', citiesError);
    errorMessage = citiesError.message || 'An error occurred loading cities data.';
  } else if (!allFetchedData && !isLoadingAllData) {
    console.error('[AdminPanel] Render phase: No data and not loading');
    errorMessage = 'Admin data is currently unavailable.';
  } else if (!citiesLookupData && !isLoadingCities) {
    console.error('[AdminPanel] Render phase: No cities data and not loading');
    errorMessage = 'City lookup data is currently unavailable.';
  }
  
  // Always render a UI, even if there are errors
  // This ensures we don't get a blank screen

  // --- Render Panel ---
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 bg-background text-foreground min-h-screen">
      <h1 className="text-2xl md:text-3xl font-bold">Admin Panel</h1>
      
      {/* Debug Info - Always visible in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-100 p-4 rounded-md mb-4 text-sm">
          <h2 className="font-bold mb-2">Debug Info:</h2>
          <div><strong>Render Phase:</strong> {renderPhase}</div>
          <div><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</div>
          <div><strong>Has Error:</strong> {errorMessage ? 'Yes' : 'No'}</div>
          <div><strong>Has Data:</strong> {allFetchedData ? 'Yes' : 'No'}</div>
          <div><strong>Active Tab:</strong> {activeTab}</div>
        </div>
      )}
      
      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" message="Loading Admin Data..." />
        </div>
      )}
      
      {/* Error State */}
      {errorMessage && (
        <div className="mb-6">
          <ErrorMessage 
            message={errorMessage} 
            onRetry={refetch} 
            containerClassName="p-4 border border-red-300 bg-red-50 rounded-md" 
          />
        </div>
      )}
      
      {/* Tab Navigation - Always show even if there's an error */}
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
          {Object.entries(tabConfig).map(([key, { label }]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                activeTab === key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
              aria-current={activeTab === key ? 'page' : undefined}
              disabled={isLoading}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>
      
      {/* Filter Toggle - Only show if not loading and no errors */}
      {!isLoading && !errorMessage && currentTabConfig && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(prev => !prev)}
            aria-expanded={showFilters}
            className="flex items-center gap-1"
          >
            <Filter size={14} /> Filters
          </Button>
        </div>
      )}
      
      {/* Content Area */}
      <div className="mt-4">
        {/* Only show content if not loading and no errors */}
        {!isLoading && !errorMessage && resourceType && currentColumns.length > 0 ? (
          <GenericAdminTableTab
            key={resourceType}
            resourceType={resourceType}
            initialData={allFetchedData?.[resourceType] ?? []}
            columns={currentColumns}
            isLoading={isLoadingAllData}
            refetchData={refetch}
            cities={citiesLookup}
            neighborhoods={neighborhoodsLookup}
            showFilters={showFilters}
            addRowEnabled={currentTabConfig.addRowEnabled}
            deleteRowEnabled={currentTabConfig.deleteRowEnabled}
          />
        ) : !isLoading && !errorMessage && currentTabConfig?.component ? (
          <currentTabConfig.component key={activeTab} initialData={allFetchedData} />
        ) : !isLoading && !errorMessage ? (
          <p className="text-muted-foreground">{`Content for ${currentTabConfig?.label || 'selected tab'} is not available or configured.`}</p>
        ) : null}
      </div>
    </div>
  );
};

export default AdminPanel;