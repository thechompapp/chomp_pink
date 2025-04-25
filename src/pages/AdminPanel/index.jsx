// src/pages/AdminPanel/index.jsx
/* REFACTORED: Always render GenericAdminTableTab to ensure consistent hook calls */
/* FIXED: Removed problematic neighborhoods lookup query */
import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/adminService';
import { submissionService } from '@/services/submissionService.js';
import { filterService } from '@/services/filterService.js';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import ErrorMessage from '@/components/UI/ErrorMessage';
import AdminAnalyticsSummary from './AdminAnalyticsSummary';
import AdminEngagementAnalytics from './AdminEngagementAnalytics';
import GenericAdminTableTab from './GenericAdminTableTab';
import Button from '@/components/UI/Button';
import { Filter } from 'lucide-react';

// Fetch function (remains the same)
const fetchAllAdminData = async () => { /* ... */ try { console.log("[fetchAllAdminData] Starting fetch using Promise.allSettled..."); const results = await Promise.allSettled([ adminService.getAdminRestaurants(), adminService.getAdminDishes(), adminService.getAdminUsers(), adminService.getAdminCitiesSimple(), adminService.getAdminNeighborhoods(), adminService.getAdminHashtags(), adminService.getAdminData('restaurant_chains'), submissionService.getPendingSubmissions(), ]); console.log("[fetchAllAdminData] Promise.allSettled finished. Raw results:", results); const safeData = (result, dataType) => { if (result.status === 'rejected') { console.error(`[fetchAllAdminData] Failed to fetch ${dataType}:`, result.reason); return []; } const response = result.value; if (!response) { console.warn(`[fetchAllAdminData] Fulfilled promise for ${dataType} but value is null/undefined.`); return []; } if (Array.isArray(response)) return response; if (response && Array.isArray(response.data)) return response.data; if (response?.success === false) { console.warn(`[fetchAllAdminData] Fulfilled promise for ${dataType} but API reported failure:`, response.error || response.message); return []; } console.warn(`[fetchAllAdminData] Unexpected response structure for ${dataType}:`, response); return []; }; const processedData = { restaurants: safeData(results[0], 'restaurants'), dishes: safeData(results[1], 'dishes'), users: safeData(results[2], 'users'), cities: safeData(results[3], 'cities'), neighborhoods: safeData(results[4], 'neighborhoods'), hashtags: safeData(results[5], 'hashtags'), chains: safeData(results[6], 'chains'), submissions: safeData(results[7], 'submissions'), }; console.log("[fetchAllAdminData] Processed data:", processedData); return processedData; } catch (error) { console.error('Error in top-level fetchAllAdminData catch (should be rare):', error); return { restaurants: [], dishes: [], users: [], cities: [], neighborhoods: [], hashtags: [], chains: [], submissions: [] }; } };

// --- Admin Panel Component ---
const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('submissions');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch all main data
  const { data: allFetchedData, isLoading: isLoadingAllData, error: fetchAllError, refetch, isSuccess } = useQuery({ queryKey: ['allAdminData'], queryFn: fetchAllAdminData, staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false });
  // Fetch only cities lookup data needed globally
  const { data: citiesLookupData, isLoading: isLoadingCities } = useQuery({ queryKey: ['adminCitiesLookup'], queryFn: filterService.getCities, staleTime: Infinity });
  // *** REMOVED: Neighborhoods lookup query that was causing errors ***
  // const { data: neighborhoodsLookupData, isLoading: isLoadingNeighborhoods } = useQuery({ queryKey: ['adminNeighborhoodsLookup'], queryFn: filterService.getNeighborhoods, staleTime: Infinity });

  // Memoize lookup data
  const citiesLookup = useMemo(() => citiesLookupData || [], [citiesLookupData]);
  // *** Pass empty array for neighborhoods ***
  const neighborhoodsLookup = useMemo(() => [], []); // Default to empty array

  // Define columns (including submissions)
  const columns = useMemo(() => ({ /* ... unchanged column definitions ... */ restaurants: [ { accessor: 'id', header: 'ID', isEditable: false, isSortable: true }, { accessor: 'name', header: 'Name', isEditable: true, isSortable: true, isFilterable: true }, { accessor: 'city_name', header: 'City', isEditable: false, isSortable: true, isFilterable: true }, { accessor: 'neighborhood_name', header: 'Neighborhood', isEditable: false, isSortable: true, isFilterable: true }, { accessor: 'address', header: 'Address', isEditable: true, isSortable: true, isFilterable: true }, { accessor: 'google_place_id', header: 'Place ID', isEditable: true, isSortable: false, isFilterable: true }, { accessor: 'latitude', header: 'Lat', isEditable: true, isSortable: true, cellType: 'number' }, { accessor: 'longitude', header: 'Lon', isEditable: true, isSortable: true, cellType: 'number' }, { accessor: 'phone_number', header: 'Phone', isEditable: true, isSortable: false, isFilterable: true }, { accessor: 'website', header: 'Website', isEditable: true, isSortable: false, isFilterable: true, cellType: 'url' }, { accessor: 'instagram_handle', header: 'Instagram', isEditable: true, isSortable: false, isFilterable: true }, { accessor: 'created_at', header: 'Created', isEditable: false, isSortable: true, cellType: 'datetime' }, { accessor: 'updated_at', header: 'Updated', isEditable: false, isSortable: true, cellType: 'datetime' }, ], dishes: [ { accessor: 'id', header: 'ID', isEditable: false, isSortable: true }, { accessor: 'name', header: 'Name', isEditable: true, isSortable: true, isFilterable: true }, { accessor: 'description', header: 'Description', isEditable: true, isSortable: false, isFilterable: true, cellType: 'textarea' }, { accessor: 'restaurant_name', header: 'Restaurant', isEditable: false, isSortable: true, isFilterable: true }, { accessor: 'price', header: 'Price', isEditable: true, isSortable: true, cellType: 'number' }, { accessor: 'created_at', header: 'Created', isEditable: false, isSortable: true, cellType: 'datetime' }, { accessor: 'updated_at', header: 'Updated', isEditable: false, isSortable: true, cellType: 'datetime' }, ], users: [ { accessor: 'id', header: 'ID', isEditable: false, isSortable: true }, { accessor: 'username', header: 'Username', isEditable: true, isSortable: true, isFilterable: true }, { accessor: 'email', header: 'Email', isEditable: true, isSortable: true, isFilterable: true }, { accessor: 'account_type', header: 'Role', isEditable: true, isSortable: true, isFilterable: true, cellType: 'select', options: ['user', 'contributor', 'superuser'] }, { accessor: 'created_at', header: 'Created', isEditable: false, isSortable: true, cellType: 'datetime' }, ], cities: [ { accessor: 'id', header: 'ID', isEditable: false, isSortable: true }, { accessor: 'name', header: 'Name', isEditable: true, isSortable: true, isFilterable: true }, ], neighborhoods: [ { accessor: 'id', header: 'ID', isEditable: false, isSortable: true }, { accessor: 'name', header: 'Name', isEditable: true, isSortable: true, isFilterable: true }, { accessor: 'city_name', header: 'City', isEditable: false, isSortable: true, isFilterable: true }, ], hashtags: [ { accessor: 'id', header: 'ID', isEditable: false, isSortable: true }, { accessor: 'name', header: 'Name', isEditable: true, isSortable: true, isFilterable: true }, { accessor: 'category', header: 'Category', isEditable: true, isSortable: true, isFilterable: true, cellType: 'select', options: ['cuisine', 'amenity', 'vibe', 'other'] }, ], chains: [ { accessor: 'id', header: 'ID', isEditable: false, isSortable: true }, { accessor: 'name', header: 'Name', isEditable: true, isSortable: true, isFilterable: true }, { accessor: 'website', header: 'Website', isEditable: true, isSortable: false, isFilterable: true, cellType: 'url' }, ], submissions: [ { accessor: 'id', header: 'ID', sortable: true, editable: false, className: 'w-16 text-gray-500 dark:text-gray-400' }, { accessor: 'type', header: 'Type', sortable: true, editable: false, className: 'capitalize w-24' }, { accessor: 'name', header: 'Name', sortable: true, editable: false }, { accessor: 'location', header: 'Address / Location', sortable: true, editable: false, className: 'text-xs max-w-xs truncate', render: (val) => val || <span className="text-gray-400 italic">N/A</span> }, { accessor: 'city', header: 'City', sortable: true, editable: false, render: (val) => val || <span className="text-gray-400 italic">N/A</span> }, { accessor: 'neighborhood', header: 'Neighborhood', sortable: true, editable: false, render: (val) => val || <span className="text-gray-400 italic">N/A</span> }, { accessor: 'user_handle', header: 'Submitted By', sortable: true, editable: false, render: (val) => val ? `@${val}` : <span className="text-gray-400 italic">N/A</span> }, { accessor: 'restaurant_name', header: 'Restaurant (Dishes)', sortable: true, editable: false, render: (name, row) => { if (row.type === 'dish') { const restaurantId = Number(row.restaurant_id); if (!isNaN(restaurantId) && restaurantId > 0) { return <a href={`/restaurant/${restaurantId}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">{name || `ID: ${restaurantId}`}</a>; } return name || (row.restaurant_id ? `ID: ${row.restaurant_id}` : <span className="text-gray-400 italic">N/A</span>); } return <span className="text-gray-400 italic">-</span>; } }, { accessor: 'status', header: 'Status', sortable: true, editable: false, render: (status) => ( <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize inline-flex items-center gap-1 ${ status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' }`}> {status} </span> ) }, { accessor: 'created_at', header: 'Submitted', sortable: true, editable: false, render: (val) => val ? new Date(val).toLocaleDateString() : 'N/A' }, ] }), []);
  // Tab configuration
  const tabConfig = useMemo(() => ({ submissions: { label: 'Submissions', dataKey: 'submissions', columns: columns.submissions, addRowEnabled: false, deleteRowEnabled: true }, restaurants: { label: 'Restaurants', dataKey: 'restaurants', columns: columns.restaurants, addRowEnabled: true, deleteRowEnabled: true }, dishes: { label: 'Dishes', dataKey: 'dishes', columns: columns.dishes, addRowEnabled: true, deleteRowEnabled: true }, users: { label: 'Users', dataKey: 'users', columns: columns.users, addRowEnabled: true, deleteRowEnabled: true }, cities: { label: 'Cities', dataKey: 'cities', columns: columns.cities, addRowEnabled: true, deleteRowEnabled: true }, neighborhoods: { label: 'Neighborhoods', dataKey: 'neighborhoods', columns: columns.neighborhoods, addRowEnabled: true, deleteRowEnabled: true }, hashtags: { label: 'Hashtags', dataKey: 'hashtags', columns: columns.hashtags, addRowEnabled: true, deleteRowEnabled: true }, chains: { label: 'Chains', dataKey: 'chains', columns: columns.chains, addRowEnabled: true, deleteRowEnabled: true }, }), [columns]);

  const currentTabConfig = tabConfig[activeTab];
  const resourceType = currentTabConfig?.dataKey;
  const currentColumns = (resourceType && columns[resourceType]) ? columns[resourceType] : [];

  // Combined Loading State (excluding neighborhoods now)
  const isLoading = isLoadingAllData || isLoadingCities;
  if (isLoading) return <div className="flex justify-center items-center h-screen"><LoadingSpinner size="lg" message="Loading Admin Data..." /></div>;
  // Handle fetch error for main data or cities lookup
  if (fetchAllError) { const errorMessage = fetchAllError.message || 'An unexpected error occurred loading admin data.'; return <ErrorMessage message={errorMessage} onRetry={refetch} containerClassName="mt-6 p-4" />; }
  if (!allFetchedData || !citiesLookupData) return <ErrorMessage message="Admin data or city lookup is currently unavailable." onRetry={refetch} containerClassName="mt-6 p-4" />;

  // --- Render Panel ---
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 bg-background text-foreground min-h-screen">
      <h1 className="text-2xl md:text-3xl font-bold">Admin Panel</h1>
      {/* Tab Navigation */}
      <div className="border-b border-border"> <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs"> {Object.entries(tabConfig).map(([key, { label }]) => ( <button key={key} onClick={() => setActiveTab(key)} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm focus:outline-none ${ activeTab === key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border' }`} aria-current={activeTab === key ? 'page' : undefined} > {label} </button> ))} </nav> </div>
      {/* Filter Toggle */}
      {currentTabConfig && ( <div className="flex justify-end"> <Button variant="outline" size="sm" onClick={() => setShowFilters(prev => !prev)} aria-expanded={showFilters} className="flex items-center gap-1" > <Filter size={14} /> Filters </Button> </div> )}

      {/* Content Area: Render GenericAdminTableTab or specific component */}
      <div className="mt-4">
        {resourceType && currentColumns.length > 0 ? (
            <GenericAdminTableTab
                key={resourceType} // Key forces remount on tab change
                resourceType={resourceType}
                initialData={allFetchedData?.[resourceType] ?? []}
                columns={currentColumns}
                isLoading={isLoadingAllData} // Pass main data loading state
                refetchData={refetch}
                cities={citiesLookup} // Pass cities lookup
                neighborhoods={neighborhoodsLookup} // Pass memoized empty array
                showFilters={showFilters}
                addRowEnabled={currentTabConfig.addRowEnabled}
                deleteRowEnabled={currentTabConfig.deleteRowEnabled}
            />
        ) : currentTabConfig?.component ? (
             // Render specific non-table components (e.g., analytics)
             <currentTabConfig.component key={activeTab} initialData={allFetchedData} />
        ) : (
           // Fallback if no dataKey/columns or component for the tab
           <p className="text-muted-foreground">{`Content for ${currentTabConfig?.label || 'selected tab'} is not available or configured.`}</p>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;