/* src/pages/AdminPanel/index.jsx */
/* REFACTORED: Always render GenericAdminTableTab to ensure consistent hook calls */
/* FIXED: Removed problematic neighborhoods lookup query */
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
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
import { Filter, Trash2, AlertTriangle } from 'lucide-react';
import { useAdminAddRow } from '@/hooks/useAdminAddRow'; // Updated import
import { cn } from '@/lib/utils';
import { ConfirmationDialog } from '@/components/UI/ConfirmationDialog';
import { toast } from 'react-hot-toast';
import { dataCleanupService } from '@/services/dataCleanupService.js';
import DataCleanupModal from '@/components/DataCleanupModal';
import { useAdminStore } from '@/stores/useAdminStore.js';

// Move this outside the component to avoid recreation
const fetchAllAdminData = async () => {
  try {
    console.log("[fetchAllAdminData] Starting fetch using Promise.allSettled...");
    
    // Use the existing adminService.getAdminData method which is confirmed working
    const results = await Promise.allSettled([
      adminService.getAdminData('restaurants'),
      adminService.getAdminData('dishes'),
      adminService.getAdminData('users'),
      adminService.getAdminData('cities'),
      adminService.getAdminData('neighborhoods'),
      adminService.getAdminData('hashtags'),
      adminService.getAdminData('restaurant_chains'),
      adminService.getAdminData('submissions'),
    ]);
    
    console.log("[fetchAllAdminData] Promise.allSettled finished.");
    
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
    
    return {
      restaurants: safeData(results[0], 'restaurants'),
      dishes: safeData(results[1], 'dishes'),
      users: safeData(results[2], 'users'),
      cities: safeData(results[3], 'cities'),
      neighborhoods: safeData(results[4], 'neighborhoods'),
      hashtags: safeData(results[5], 'hashtags'),
      chains: safeData(results[6], 'chains'),
      submissions: safeData(results[7], 'submissions'),
    };
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

// Define static columns outside of component to prevent recreation
const ADMIN_COLUMNS = {
  cleanup: [
    { accessor: 'id', header: 'ID', isEditable: false, isSortable: true },
    { accessor: 'field', header: 'Field', isEditable: false, isSortable: true },
    { accessor: 'name', header: 'Change', isEditable: false, isSortable: true },
    { accessor: 'category', header: 'Category', isEditable: false, isSortable: true },
    { accessor: 'currentValue', header: 'Current Value', isEditable: false, isSortable: false, 
      render: (value) => (
        <div className="max-w-xs truncate">
          {value || <span className="text-muted-foreground italic">Empty</span>}
        </div>
      )
    },
    { accessor: 'proposedValue', header: 'Proposed Value', isEditable: false, isSortable: false,
      render: (value) => (
        <div className="max-w-xs truncate">
          {value || <span className="text-muted-foreground italic">Empty</span>}
        </div>
      )
    },
    { accessor: 'actions', header: 'Actions', isEditable: false, isSortable: false,
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handleApproveChange(row.id)}>
            <Check size={14} className="mr-1" /> Apply
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleRejectChange(row.id)}>
            <X size={14} className="mr-1" /> Skip
          </Button>
        </div>
      )
    },
  ],
  restaurants: [
    { accessor: 'id', header: 'ID', isEditable: false, isSortable: true },
    { accessor: 'name', header: 'Name', isEditable: true, isSortable: true, isFilterable: true },
    { accessor: 'city_id', header: 'City', isEditable: true, isSortable: true, isFilterable: true, cellType: 'city_select' },
    { accessor: 'neighborhood_id', header: 'Neighborhood', isEditable: true, isSortable: true, isFilterable: true, cellType: 'neighborhood_select' },
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
    { accessor: 'id', header: 'ID', isSortable: true, isEditable: false, className: 'w-16 text-gray-500 dark:text-gray-400' },
    { accessor: 'type', header: 'Type', isSortable: true, isEditable: false, className: 'capitalize w-24' },
    { accessor: 'name', header: 'Name', isSortable: true, isEditable: false },
    { accessor: 'location', header: 'Address / Location', isSortable: true, isEditable: false, className: 'text-xs max-w-xs truncate', render: (val) => val || <span className="text-gray-400 italic">N/A</span> },
    { accessor: 'city', header: 'City', isSortable: true, isEditable: false, render: (val) => val || <span className="text-gray-400 italic">N/A</span> },
    { accessor: 'neighborhood', header: 'Neighborhood', isSortable: true, isEditable: false, render: (val) => val || <span className="text-gray-400 italic">N/A</span> },
    { accessor: 'user_handle', header: 'Submitted By', isSortable: true, isEditable: false, render: (val) => val ? `@${val}` : <span className="text-gray-400 italic">N/A</span> },
    { accessor: 'restaurant_name', header: 'Restaurant (Dishes)', isSortable: true, isEditable: false, render: (name, row) => {
      if (row.type === 'dish') {
        const restaurantId = Number(row.restaurant_id);
        if (!isNaN(restaurantId) && restaurantId > 0) {
          return <a href={`/restaurant/${restaurantId}`} target="_blank" rel="noopener noreferrer" className="text-gray-700 dark:text-gray-300 hover:underline">{name || `ID: ${restaurantId}`}</a>;
        }
        return name || (row.restaurant_id ? `ID: ${row.restaurant_id}` : <span className="text-gray-400 italic">N/A</span>);
      }
      return <span className="text-gray-400 italic">-</span>;
    } },
    { accessor: 'status', header: 'Status', isSortable: true, isEditable: false, render: (status) => (
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize inline-flex items-center gap-1 ${
        status === 'approved' ? 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200' :
        status === 'rejected' ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' :
        'bg-gray-50 text-gray-500 dark:bg-gray-800/50 dark:text-gray-400'
      }`}>{status}</span>
    ) },
    { accessor: 'created_at', header: 'Submitted', isSortable: true, isEditable: false, render: (val) => val ? new Date(val).toLocaleDateString() : 'N/A' },
  ],
};

// Define static tab configuration outside component
const TAB_CONFIG = {
  submissions: { label: 'Submissions', dataKey: 'submissions', addRowEnabled: false, deleteRowEnabled: true },
  restaurants: { label: 'Restaurants', dataKey: 'restaurants', addRowEnabled: true, deleteRowEnabled: true },
  dishes: { label: 'Dishes', dataKey: 'dishes', addRowEnabled: true, deleteRowEnabled: true },
  users: { label: 'Users', dataKey: 'users', addRowEnabled: true, deleteRowEnabled: true },
  cities: { label: 'Cities', dataKey: 'cities', addRowEnabled: true, deleteRowEnabled: true },
  neighborhoods: { label: 'Neighborhoods', dataKey: 'neighborhoods', addRowEnabled: true, deleteRowEnabled: true },
  hashtags: { label: 'Hashtags', dataKey: 'hashtags', addRowEnabled: true, deleteRowEnabled: true },
  chains: { label: 'Chains', dataKey: 'chains', addRowEnabled: true, deleteRowEnabled: true },
  cleanup: { label: 'Data Cleanup', dataKey: 'cleanup', addRowEnabled: false, deleteRowEnabled: false },
};

// Create a memoized AdminTable component
const MemoizedGenericAdminTableTab = React.memo(GenericAdminTableTab);

// Add cleanup configurations for each resource type
const CLEANUP_CONFIG = {
  restaurants: {
    title: "Clean Restaurant Data",
    description: "This will clean up restaurant data by:",
    actions: [
      "Removing duplicate entries",
      "Fixing malformed phone numbers",
      "Standardizing address formats",
      "Validating and fixing website URLs",
      "Removing orphaned records (no dishes)",
    ],
    warning: "This action cannot be undone. Please backup your data first.",
  },
  dishes: {
    title: "Clean Dish Data",
    description: "This will clean up dish data by:",
    actions: [
      "Removing duplicate entries",
      "Fixing price formats",
      "Standardizing dish names",
      "Removing dishes with invalid restaurant references",
      "Merging similar dishes",
    ],
    warning: "This action cannot be undone. Please backup your data first.",
  },
  users: {
    title: "Clean User Data",
    description: "This will clean up user data by:",
    actions: [
      "Removing duplicate accounts",
      "Fixing malformed email addresses",
      "Standardizing usernames",
      "Removing inactive accounts",
      "Fixing role assignments",
    ],
    warning: "This action cannot be undone. Please backup your data first.",
  },
  submissions: {
    title: "Clean Submission Data",
    description: "This will clean up submission data by:",
    actions: [
      "Removing duplicate submissions",
      "Fixing malformed submission data",
      "Removing spam submissions",
      "Merging related submissions",
      "Archiving old submissions",
    ],
    warning: "This action cannot be undone. Please backup your data first.",
  },
  // ... add other resource types ...
};

// Add the cleanup button component
const CleanupButton = ({ resourceType, onCleanup }) => {
  const [showDialog, setShowDialog] = useState(false);
  const config = CLEANUP_CONFIG[resourceType] || {
    title: `Clean ${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)} Data`,
    description: `This will analyze and clean up ${resourceType} data.`,
    actions: [
      "Analyzing data for inconsistencies",
      "Identifying potential improvements",
      "Preparing cleanup recommendations"
    ],
    warning: "This action cannot be undone. Please backup your data first."
  };

  const handleClick = () => {
    console.log('[CleanupButton] Button clicked for:', resourceType);
    setShowDialog(true);
  };

  const handleConfirm = () => {
    console.log('[CleanupButton] Confirming cleanup for:', resourceType);
    onCleanup();
    setShowDialog(false);
  };

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        onClick={handleClick}
        className="flex items-center gap-1"
      >
        <Trash2 size={14} /> Clean Data
      </Button>

      <ConfirmationDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        onConfirm={handleConfirm}
        title={config.title}
        description={config.description}
      >
        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-md">
            <h4 className="font-medium mb-2">Actions to be performed:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {config.actions.map((action, index) => (
                <li key={index}>{action}</li>
              ))}
            </ul>
          </div>
          
          <div className="flex items-start gap-2 text-yellow-600 dark:text-yellow-400">
            <AlertTriangle size={16} className="mt-0.5" />
            <p className="text-sm">{config.warning}</p>
          </div>
        </div>
      </ConfirmationDialog>
    </>
  );
};

// Main AdminPanel Component
const AdminPanel = () => {
  // Use refs for values that should not trigger re-renders
  const authAttemptedRef = useRef(false);
  const initialRenderRef = useRef(true);
  
  // Basic UI state
  const [activeTab, setActiveTab] = useState('submissions');
  const [showFilters, setShowFilters] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isCleanupModalOpen, setIsCleanupModalOpen] = useState(false);
  const [cleanupChanges, setCleanupChanges] = useState([]);
  const [selectedResourceType, setSelectedResourceType] = useState(null);
  const [isDataCleanupMode, setIsDataCleanupMode] = useState(false);

  // Use admin store instead of local state
  const { 
    users: usersData, 
    dishes: dishesData, 
    restaurants: restaurantsData,
    cities: citiesData,
    neighborhoods: neighborhoodsData,
    hashtags: hashtagsData,
    restaurantChains: chainsData,
    submissions: submissionsData,
    setAdminData
  } = useAdminStore();
  
  // Get auth store functions
  const { setUser, setAuthenticated, setSuperuser } = useAuthStore();

  
  // Only attempt authentication once if needed
  useEffect(() => {
    if (authAttemptedRef.current) return;
    
    const checkAuthStatus = async () => {
      try {
        console.log('[AdminPanel] Checking authentication status...');
        const authStatus = await apiClient.get('/auth/status');
        
        if (!authStatus?.data?.isAuthenticated) {
          console.log('[AdminPanel] User not authenticated');
        } else {
          console.log('[AdminPanel] User is authenticated, user:', authStatus?.data?.user);
        }
      } catch (error) {
        console.error('[AdminPanel] Error checking auth status:', error);
      }
    };
    
    authAttemptedRef.current = true;
    checkAuthStatus();
  }, []);

  // Stable callback for refetching data
  const handleRefetch = useCallback(async () => {
    console.log('[AdminPanel] Refetching data');
    setIsLoading(true);
    try {
      await fetchAllAdminData();
    } catch (error) {
      console.error('[AdminPanel] Error refetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch all data when component mounts
  const fetchAllAdminData = async () => {
    try {
      console.log("[fetchAllAdminData] Starting fetch using Promise.allSettled...");
      
      // First fetch cities and neighborhoods
      const [citiesResponse, neighborhoodsResponse] = await Promise.all([
        filterService.getCities(),
        filterService.getNeighborhoodsByCity(1) // Get neighborhoods for city ID 1 (default)
      ]);

      if (citiesResponse?.data?.data) {
        setAdminData('cities', citiesResponse.data.data);
        console.log(`[AdminPanel] Fetched ${citiesResponse.data.data.length} cities`);
      }

      if (neighborhoodsResponse && Array.isArray(neighborhoodsResponse)) {
        setAdminData('neighborhoods', neighborhoodsResponse);
        console.log(`[AdminPanel] Fetched ${neighborhoodsResponse.length} neighborhoods`);
      }
      
      // Then fetch all other admin data
      const results = await Promise.allSettled([
        adminService.getAdminUsers(),
        adminService.getAdminDishes(),
        adminService.getAdminRestaurants(),
        adminService.getAdminHashtags(),
        adminService.getAdminData('restaurant_chains'),
        adminService.getAdminData('submissions')
      ]);

      // Process results and update state
      const dataTypes = ['users', 'dishes', 'restaurants', 'hashtags', 'restaurantChains', 'submissions'];

      results.forEach((result, index) => {
        const key = dataTypes[index];
        if (result.status === 'fulfilled') {
          // Handle different response structures
          let data = [];
          
          if (result.value?.data?.data) {
            // Standard response with nested data.data
            data = result.value.data.data;
            console.log(`[AdminPanel] Fetched ${data.length} ${key} total`);
          } else if (result.value?.data) {
            // Response with just data property
            data = result.value.data;
            console.log(`[AdminPanel] Fetched ${data.length} ${key} total`);
          } else if (Array.isArray(result.value)) {
            // Direct array response
            data = result.value;
            console.log(`[AdminPanel] Fetched ${data.length} ${key} total`);
          } else {
            console.error(`[AdminPanel] Unexpected response format for ${key}:`, result.value);
          }
          
          // Update the admin store
          setAdminData(key, data);
        } else {
          console.error(`[AdminPanel] Failed to fetch ${key}:`, result.reason);
        }
      });
      
      // Debug log to verify data was updated in store
      setTimeout(() => {
        const storeSnapshot = useAdminStore.getState();
        console.log('[AdminPanel] Store state after updates:', {
          users: storeSnapshot.users?.length || 0,
          dishes: storeSnapshot.dishes?.length || 0,
          restaurants: storeSnapshot.restaurants?.length || 0,
          cities: storeSnapshot.cities?.length || 0,
          neighborhoods: storeSnapshot.neighborhoods?.length || 0,
          hashtags: storeSnapshot.hashtags?.length || 0,
          restaurantChains: storeSnapshot.restaurantChains?.length || 0,
          submissions: storeSnapshot.submissions?.length || 0
        });
      }, 100);
    } catch (error) {
      console.error('[AdminPanel] Error fetching data:', error);
      throw error; // Re-throw to be caught by the caller
    }
  };

  // Initial data fetch
  useEffect(() => {
    handleRefetch();
  }, [handleRefetch]);

  // Create stable references for the current tab's data
  const currentTabConfig = useMemo(() => TAB_CONFIG[activeTab] || TAB_CONFIG.submissions, [activeTab]);
  const currentResourceType = useMemo(() => currentTabConfig.dataKey, [currentTabConfig]);
  const currentColumns = useMemo(() => ADMIN_COLUMNS[currentResourceType] || [], [currentResourceType]);
  
  // Get the current data based on the active tab
  const currentData = useMemo(() => {
    let data = [];
    switch (currentResourceType) {
      case 'users': data = usersData; break;
      case 'dishes': data = dishesData; break;
      case 'restaurants': data = restaurantsData; break;
      case 'cities': data = citiesData; break;
      case 'neighborhoods': data = neighborhoodsData; break;
      case 'hashtags': data = hashtagsData; break;
      case 'chains': data = chainsData; break;
      case 'submissions': data = submissionsData; break;
      case 'cleanup': data = cleanupChanges; break;
      default: data = []; break;
    }
    
    // Debug output
    console.log(`[AdminPanel] currentData for type ${currentResourceType}:`, {
      length: data?.length || 0,
      isArray: Array.isArray(data),
      sample: Array.isArray(data) && data.length > 0 ? data.slice(0, 2) : null
    });
    
    return data;
  }, [
    currentResourceType,
    usersData,
    dishesData,
    restaurantsData,
    citiesData,
    neighborhoodsData,
    hashtagsData,
    chainsData,
    submissionsData,
    cleanupChanges
  ]);

  // Function to create cleanup table data from changes
  const createCleanupTableData = useCallback((changes) => {
    if (!changes || !Array.isArray(changes) || changes.length === 0) {
      console.warn('[AdminPanel] No changes to display in cleanup mode');
      return [];
    }
    
    console.log('[AdminPanel] Creating cleanup table data from changes:', changes);
    
    return changes.map(change => ({
      id: change.id || `change-${Math.random().toString(36).substr(2, 9)}`,
      resourceType: 'cleanup', // Special resource type for cleanup
      field: change.field || 'unknown',
      type: change.type || 'update',
      name: change.title || `Update ${change.field || 'field'}`,
      category: change.category || 'Other',
      currentValue: change.currentValue || '',
      proposedValue: change.proposedValue || '',
      impact: change.impact || 'Data quality improvement',
      confidence: change.confidence || 0.8
    }));
  }, []);
  
  // Define handleApproveChanges and handleRejectChanges first
  const handleApproveChanges = useCallback(async (changeIds) => {
    try {
      setIsLoading(true);
      await dataCleanupService.applyChanges(selectedResourceType, changeIds);
      toast.success('Changes applied successfully');
      setIsCleanupModalOpen(false);
      setIsDataCleanupMode(false);
      
      // Switch back to the original tab if we're in cleanup tab
      if (activeTab === 'cleanup') {
        setActiveTab(selectedResourceType || 'restaurants');
        console.log(`[AdminPanel] Switching back from cleanup tab to:`, selectedResourceType || 'restaurants');
      }
      
      // Refetch data to show updated values
      handleRefetch();
    } catch (error) {
      console.error('[AdminPanel] Error applying changes:', error);
      toast.error(error.response?.data?.message || 'Failed to apply changes');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, selectedResourceType, handleRefetch]);
  
  const handleRejectChanges = useCallback(async (changeIds) => {
    try {
      setIsLoading(true);
      await dataCleanupService.rejectChanges(selectedResourceType, changeIds);
      toast.success('Changes rejected');
      
      // If all changes have been rejected, close the modal and switch back
      const remainingChanges = cleanupChanges.filter(change => !changeIds.includes(change.id));
      if (remainingChanges.length === 0) {
        setIsCleanupModalOpen(false);
        setIsDataCleanupMode(false);
        
        // Switch back to the original tab if we're in cleanup tab
        if (activeTab === 'cleanup') {
          setActiveTab(selectedResourceType || 'restaurants');
        }
      } else {
        // Update the cleanup changes state
        setCleanupChanges(remainingChanges);
        
        // Update the cleanup data
        const updatedCleanupData = createCleanupTableData(remainingChanges);
        setAdminData('cleanup', updatedCleanupData);
      }
    } catch (error) {
      console.error('[AdminPanel] Error rejecting changes:', error);
      toast.error(error.response?.data?.message || 'Failed to reject changes');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, selectedResourceType, cleanupChanges, createCleanupTableData, setAdminData]);
  
  // Handle approving a single change
  const handleApproveChange = useCallback((changeId) => {
    console.log('[AdminPanel] Approving change:', changeId);
    handleApproveChanges([changeId]);
  }, [handleApproveChanges]);
  
  // Handle rejecting a single change
  const handleRejectChange = useCallback((changeId) => {
    console.log('[AdminPanel] Rejecting change:', changeId);
    handleRejectChanges([changeId]);
  }, [handleRejectChanges]);
  
  // Add cleanup handler with debug logging
  const handleCleanup = useCallback(async () => {
    console.log('[AdminPanel] Starting cleanup for:', currentResourceType);
    try {
      setIsLoading(true);
      setSelectedResourceType(currentResourceType);
      
      console.log('[AdminPanel] Calling analyzeData for:', currentResourceType);
      const response = await dataCleanupService.analyzeData(currentResourceType);
      
      // Handle both possible response formats for backward compatibility
      const changes = response?.changes || response?.data || [];
      console.log(`[AdminPanel] Received ${changes.length} changes for ${currentResourceType}:`, changes);
      
      if (!Array.isArray(changes) || changes.length === 0) {
        toast.info('No data issues found to clean up.');
        setIsLoading(false);
        return;
      }
      
      // Format the changes for UI display
      const formattedChanges = dataCleanupService.formatChanges(changes);
      console.log('[AdminPanel] Formatted changes:', formattedChanges);
      
      if (!formattedChanges || formattedChanges.length === 0) {
        toast.info('No valid changes to display.');
        setIsLoading(false);
        return;
      }
      
      // Create cleanup table data and temporarily add to allData
      const cleanupData = createCleanupTableData(formattedChanges);
      console.log('[AdminPanel] Created cleanup table data:', cleanupData);
      
      // Store the original tab to return to later
      const originalTab = activeTab;
      
      // Set cleanup mode before opening modal
      setIsDataCleanupMode(true);
      setCleanupChanges(formattedChanges);
      
      // Update the cleanup data in the store
      setAdminData('cleanup', cleanupData);
      
      // Switch to the cleanup tab to display the data
      if (activeTab !== 'cleanup') {
        setActiveTab('cleanup');
      }
      
      // Open the modal
      setIsCleanupModalOpen(true);
      
      // Debug log for troubleshooting
      console.log('[AdminPanel] Cleanup mode enabled:', true);
      console.log('[AdminPanel] Modal opened:', true);
      console.log('[AdminPanel] Active tab switched to cleanup from:', originalTab);
      console.log('[AdminPanel] Updated cleanup data:', cleanupData);
    } catch (error) {
      console.error('[AdminPanel] Error analyzing data:', error);
      toast.error(error.response?.data?.message || 'Failed to analyze data for cleanup');
      setIsDataCleanupMode(false);
    } finally {
      setIsLoading(false);
    }
  }, [currentResourceType, createCleanupTableData, activeTab, setAdminData]);

  // Combined loading state
  const isLoadingCombined = isLoading;
  
  // Combined error message
  const errorMessage = null;

  // Log initial render and return cleanup
  useEffect(() => {
    if (initialRenderRef.current) {
      console.log('[AdminPanel] Initial render');
      initialRenderRef.current = false;
    }
    return () => console.log('[AdminPanel] Component unmounting');
  }, []);

  // Render the admin panel
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 bg-background text-foreground min-h-screen">
      <h1 className="text-2xl md:text-3xl font-bold">Admin Panel</h1>
      
      {/* Debug Info - Only visible in development */}
      {process.env.NODE_ENV === 'development' && false && (
        <div className="bg-muted p-4 rounded-md mb-4 text-sm">
          <h2 className="font-bold mb-2">Debug Info:</h2>
          <div><strong>Loading:</strong> {isLoadingCombined ? 'Yes' : 'No'}</div>
          <div><strong>Has Error:</strong> {errorMessage ? 'Yes' : 'No'}</div>
          <div><strong>Has Data:</strong> {restaurantsData ? 'Yes' : 'No'}</div>
          <div><strong>Active Tab:</strong> {activeTab}</div>
        </div>
      )}
      
      {/* Loading State */}
      {isLoadingCombined && (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" message="Loading Admin Data..." />
        </div>
      )}
      
      {/* Error State */}
      {errorMessage && (
        <div className="mb-6">
          <ErrorMessage 
            message={errorMessage} 
            onRetry={handleRefetch} 
            containerClassName="p-4 border border-destructive bg-destructive/10 rounded-md" 
          />
        </div>
      )}
      
      {/* Tab Navigation */}
      <div className="border-b border-border">
        <nav className="flex space-x-8" aria-label="Admin Panel Tabs">
          {Object.entries(TAB_CONFIG).map(([key, { label }]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                "py-4 px-1 border-b-2 font-medium text-sm",
                activeTab === key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>
      
      {/* Filter Toggle and Cleanup Button */}
      {!isLoadingCombined && !errorMessage && (
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold">{currentTabConfig.label}</h2>
          <div className="flex items-center gap-2">
            <CleanupButton 
              resourceType={currentResourceType}
              onCleanup={handleCleanup}
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowFilters(prev => !prev)}
              aria-expanded={showFilters}
              className="flex items-center gap-1"
            >
              <Filter size={14} /> {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
          </div>
        </div>
      )}
      
      {/* Content Area */}
      {!isLoadingCombined && !errorMessage && (
        <div className="mt-4">
          <MemoizedGenericAdminTableTab
            key={currentResourceType}
            resourceType={currentResourceType}
            initialData={currentData}
            columns={currentColumns}
            isLoading={isLoading}
            error={errorMessage}
            onRetry={handleRefetch}
            cities={citiesData}
            neighborhoods={neighborhoodsData}
            showFilters={showFilters}
            addRowEnabled={currentTabConfig.addRowEnabled}
            deleteRowEnabled={currentTabConfig.deleteRowEnabled}
            isDataCleanup={isDataCleanupMode}
          />
        </div>
      )}

      {/* Data Cleanup Modal */}
      <DataCleanupModal
        isOpen={isCleanupModalOpen}
        onClose={() => {
          setIsCleanupModalOpen(false);
          setIsDataCleanupMode(false);
          
          // Switch back to the original tab if we're in cleanup tab
          if (activeTab === 'cleanup') {
            setActiveTab(selectedResourceType || 'restaurants');
            console.log(`[AdminPanel] Switching back from cleanup tab to:`, selectedResourceType || 'restaurants');
          }
        }}
        changes={cleanupChanges}
        onApprove={handleApproveChanges}
        onReject={handleRejectChanges}
        onApproveAll={() => handleApproveChanges(cleanupChanges.map(change => change.id))}
        onRejectAll={() => handleRejectChanges(cleanupChanges.map(change => change.id))}
        resourceType={selectedResourceType}
      />
    </div>
  );
};

export default AdminPanel;
