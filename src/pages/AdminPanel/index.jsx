/* src/pages/AdminPanel/index.jsx */
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Tabs from '@radix-ui/react-tabs';
import apiClient from '@/services/apiClient';
import { adminService } from '@/services/adminService';
import AdminTable from './AdminTable.jsx';
import AdminAnalyticsSummary from './AdminAnalyticsSummary.jsx';
import AdminEngagementAnalytics from './AdminEngagementAnalytics.jsx';
import LoadingSpinner from '@/components/UI/LoadingSpinner.jsx';
import ErrorMessage from '@/components/UI/ErrorMessage.jsx';
import Button from '@/components/UI/Button.jsx';
import Input from '@/components/UI/Input.jsx';
import Select from '@/components/UI/Select.jsx';
import { Activity, BarChart, Database, FileText, Hash, List, Store, Utensils, User, Filter, Search, ChevronLeft, ChevronRight, Map } from 'lucide-react';

// --- Config (Keep as before) ---
const TAB_CONFIG = { analytics: { label: 'Analytics', Icon: BarChart }, submissions: { label: 'Submissions', Icon: FileText }, restaurants: { label: 'Restaurants', Icon: Store }, dishes: { label: 'Dishes', Icon: Utensils }, neighborhoods: { label: 'Neighborhoods', Icon: Map }, lists: { label: 'Lists', Icon: List }, hashtags: { label: 'Hashtags', Icon: Hash }, users: { label: 'Users', Icon: User }, };
const DEFAULT_TAB = 'analytics';
const LIST_TYPE_OPTIONS = ['all', 'restaurant', 'dish'];
const HASHTAG_CATEGORY_OPTIONS = ['all', 'cuisine', 'attributes', 'ingredients', 'location', 'meal', 'dietary'];
const PAGE_LIMIT_OPTIONS = [10, 25, 50, 100];
const DEBOUNCE_DELAY = 500;
const DEFAULT_PAGE_LIMIT = 25;
const SUBMISSION_STATUS_OPTIONS = ['pending', 'approved', 'rejected'];

// --- Debounce Hook (Keep as before) ---
function useDebounce(value, delay) { const [debouncedValue, setDebouncedValue] = useState(value); useEffect(() => { const handler = setTimeout(() => { setDebouncedValue(value); }, delay); return () => { clearTimeout(handler); }; }, [value, delay]); return debouncedValue; }

// --- Component ---
const AdminPanel = () => {
  console.log('[AdminPanel] Component function starting execution...'); // Existing log

  const [activeTab, setActiveTab] = useState(DEFAULT_TAB);
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState('summary');
  const [sortState, setSortState] = useState({});
  const [listTypeFilter, setListTypeFilter] = useState('all');
  const [hashtagCategoryFilter, setHashtagCategoryFilter] = useState('all');
  const [submissionStatusFilter, setSubmissionStatusFilter] = useState('pending');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_LIMIT);
  const [searchTerm, setSearchTerm] = useState('');
  const [neighborhoodCityFilter, setNeighborhoodCityFilter] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, DEBOUNCE_DELAY);
  const queryClient = useQueryClient();

  // Fetch cities (Keep as before)
  const { data: citiesData, isLoading: isLoadingCities, error: citiesError } = useQuery({ queryKey: ['adminCitiesSimple'], queryFn: async () => { const response = await adminService.getAdminCitiesSimple(); return (response?.success && Array.isArray(response.data)) ? response.data : []; }, staleTime: 600000, placeholderData: [], });
  const cities = useMemo(() => citiesData || [], [citiesData]);

  // Reset page (Keep as before)
  useEffect(() => { setPage(1); }, [activeTab, limit, debouncedSearchTerm, listTypeFilter, hashtagCategoryFilter, submissionStatusFilter, neighborhoodCityFilter]);

  const currentSort = useMemo(() => sortState[activeTab] || '', [sortState, activeTab]);

  // Query Key Params (Keep as before)
  const queryKeyParams = useMemo(() => { /* ... same logic ... */ const params = { tab: activeTab, page, limit, sort: currentSort, search: debouncedSearchTerm, ...(activeTab === 'submissions' && submissionStatusFilter && { status: submissionStatusFilter }), ...(activeTab === 'lists' && listTypeFilter !== 'all' && { listType: listTypeFilter }), ...(activeTab === 'hashtags' && hashtagCategoryFilter !== 'all' && { hashtagCategory: hashtagCategoryFilter }), ...((activeTab === 'neighborhoods' || activeTab === 'restaurants') && neighborhoodCityFilter && { cityId: Number(neighborhoodCityFilter) }), }; if (params.search === '') delete params.search; return params; }, [ activeTab, page, limit, currentSort, debouncedSearchTerm, submissionStatusFilter, listTypeFilter, hashtagCategoryFilter, neighborhoodCityFilter ]);

  // Fetch data for the active tab
  const { data: queryResult, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['adminData', queryKeyParams],
    queryFn: () => adminService.getAdminData(activeTab, queryKeyParams),
    enabled: !!activeTab && activeTab !== 'analytics', // Only enable for table tabs
    placeholderData: { success: true, data: [], pagination: { total: 0, page: 1, limit, totalPages: 0 } },
    keepPreviousData: true, // Keep previous data while loading new page/filters
  });

  // Extract data and pagination
  // ** Important: Ensure responseData is always an array **
  const responseData = useMemo(() => (queryResult?.success && Array.isArray(queryResult.data)) ? queryResult.data : [], [queryResult]);
  const pagination = useMemo(() => queryResult?.pagination || { total: 0, page: 1, limit, totalPages: 0 }, [queryResult, limit]);

  // --- Handlers (Keep as before) ---
  const handleSortChange = useCallback((type, column, direction) => { setSortState((prev) => ({ ...prev, [type]: `${column}_${direction}` })); }, []);
  const handleDataMutation = useCallback(() => { queryClient.invalidateQueries({ queryKey: ['adminData', queryKeyParams] }); if (['neighborhoods'].includes(activeTab)) queryClient.invalidateQueries({ queryKey: ['adminCitiesSimple'] }); if (activeTab === 'hashtags') queryClient.invalidateQueries({ queryKey: ['filterCuisines'] }); }, [queryClient, queryKeyParams, activeTab]);
  const handleListTypeFilterChange = useCallback((e) => { setListTypeFilter(e.target.value); }, []);
  const handleHashtagCategoryFilterChange = useCallback((e) => { setHashtagCategoryFilter(e.target.value); }, []);
  const handleSubmissionStatusFilterChange = useCallback((e) => { setSubmissionStatusFilter(e.target.value); }, []);
  const handleSearchChange = useCallback((event) => { setSearchTerm(event.target.value); }, []);
  const handleLimitChange = useCallback((event) => { setLimit(Number(event.target.value)); }, []);
  const handleCityFilterChange = useCallback((event) => { setNeighborhoodCityFilter(event.target.value); }, []);
  const handlePageChange = useCallback((newPage) => { const totalPages = pagination?.totalPages ?? 1; const validPage = Math.max(1, Math.min(newPage, totalPages)); if (validPage !== page) setPage(validPage); }, [page, pagination?.totalPages]);

  // --- Render Tab Content ---
  const renderTabContent = useCallback((tab) => {
    try {
      if (tab === 'analytics') { /* ... Analytics rendering ... */
         return (
          <Tabs.Root value={activeAnalyticsTab} onValueChange={setActiveAnalyticsTab} defaultValue="summary">
            <Tabs.List className="flex justify-end border-b border-gray-200 mb-4">
              <Tabs.Trigger value="summary" className={`ml-2 py-1 px-3 text-xs font-medium rounded-md focus:outline-none focus:ring-1 focus:ring-inset focus:ring-[#D1B399] transition-colors ${ activeAnalyticsTab === 'summary' ? 'bg-[#A78B71]/10 text-[#A78B71]' : 'text-gray-500 hover:bg-gray-100' }`}>Summary</Tabs.Trigger>
              <Tabs.Trigger value="engagement" className={`ml-2 py-1 px-3 text-xs font-medium rounded-md focus:outline-none focus:ring-1 focus:ring-inset focus:ring-[#D1B399] transition-colors ${ activeAnalyticsTab === 'engagement' ? 'bg-[#A78B71]/10 text-[#A78B71]' : 'text-gray-500 hover:bg-gray-100' }`}>Engagement</Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content value="summary" className="focus:outline-none"><AdminAnalyticsSummary /></Tabs.Content>
            <Tabs.Content value="engagement" className="focus:outline-none"><AdminEngagementAnalytics /></Tabs.Content>
          </Tabs.Root>
        );
      }

      // Default: Render Table, Filters, Pagination for non-analytics tabs
      return (
        <>
          {/* Filter Section (Keep as before) */}
           <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-3 md:space-y-0 md:flex md:items-center md:justify-between gap-4">
             {/* ... filters based on tab ... */}
             <div className="flex flex-wrap items-center gap-x-4 gap-y-2"> <span className="text-sm font-medium text-gray-700 flex items-center gap-1 mr-2"><Filter size={14} /> Filters:</span> {tab === 'submissions' && ( <div className="flex items-center gap-1"> <label htmlFor="submission-status-filter" className="text-xs text-gray-600 mr-1">Status:</label> <Select id="submission-status-filter" value={submissionStatusFilter} onChange={handleSubmissionStatusFilterChange} className="text-xs py-1 pl-2 pr-7"> {SUBMISSION_STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>)} </Select> </div> )} {tab === 'lists' && ( <div className="flex items-center gap-1"> <label htmlFor="list-type-filter" className="text-xs text-gray-600 mr-1">Type:</label> <Select id="list-type-filter" value={listTypeFilter} onChange={handleListTypeFilterChange} className="text-xs py-1 pl-2 pr-7"> {LIST_TYPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>)} </Select> </div> )} {tab === 'hashtags' && ( <div className="flex items-center gap-1"> <label htmlFor="hashtag-category-filter" className="text-xs text-gray-600 mr-1">Category:</label> <Select id="hashtag-category-filter" value={hashtagCategoryFilter} onChange={handleHashtagCategoryFilterChange} className="text-xs py-1 pl-2 pr-7"> {HASHTAG_CATEGORY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>)} </Select> </div> )} {(tab === 'neighborhoods' || tab === 'restaurants') && ( <div className="flex items-center gap-1"> <label htmlFor="city-filter" className="text-xs text-gray-600 mr-1">City:</label> <Select id="city-filter" value={neighborhoodCityFilter} onChange={handleCityFilterChange} disabled={isLoadingCities || !!citiesError || !cities?.length} className="text-xs py-1 pl-2 pr-7"> <option value="">All Cities</option> {isLoadingCities && <option disabled>Loading...</option>} {citiesError && <option disabled>Error loading cities</option>} {!isLoadingCities && !citiesError && cities.length > 0 ? ( cities.map((city) => ( <option key={city.id} value={city.id}>{city.name}</option> )) ) : (!isLoadingCities && <option disabled>No cities found</option>)} </Select> </div> )} </div>
             <div className="relative flex-shrink-0 w-full md:w-64"> <label htmlFor="adminSearch" className="sr-only">Search {tab}</label> <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-4 w-4 text-gray-400" /></div> <Input type="search" name="adminSearch" id="adminSearch" value={searchTerm} onChange={handleSearchChange} className="pl-9" placeholder={`Search ${tab}...`}/> </div>
          </div>

          {/* ** MODIFIED: Conditional Rendering for Table Area ** */}
          {isLoading && !isFetching && <LoadingSpinner message={`Loading ${TAB_CONFIG[tab]?.label}...`} /> }
          {isError && <ErrorMessage message={error?.message || `Failed to load ${TAB_CONFIG[tab]?.label}.`} onRetry={refetch} isLoadingRetry={isFetching} containerClassName="mt-4" />}

          {/* ** Render AdminTable only when not initial loading, no error, and responseData is an array ** */}
          {!isLoading && !isError && Array.isArray(responseData) && (
              <AdminTable
                  data={responseData} // Pass the validated data
                  type={activeTab}
                  sort={currentSort}
                  onSortChange={handleSortChange}
                  onDataMutated={handleDataMutation}
                  isLoading={isFetching} // Indicate background fetching
                  cities={cities || []}
                  citiesError={citiesError?.message || null}
              />
          )}

          {/* Pagination Controls (Render only if data is loaded successfully) */}
          {!isLoading && !isError && pagination && pagination.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                  {/* ... pagination controls ... */}
                   <div> <label htmlFor="items-per-page" className="mr-2 text-xs">Items:</label> <Select id="items-per-page" value={limit} onChange={handleLimitChange} disabled={isFetching} className="text-xs py-1 pl-2 pr-7"> {PAGE_LIMIT_OPTIONS.map((opt) => (<option key={opt} value={opt}>{opt}</option>))} </Select> </div>
                   <span className="text-xs">Page {pagination.page} of {pagination.totalPages} ({pagination.total} items)</span>
                   <div className="flex items-center gap-1"> <Button variant="tertiary" size="sm" onClick={() => handlePageChange(page - 1)} disabled={page <= 1 || isFetching} className="!px-2 !py-1" aria-label="Previous Page"><ChevronLeft size={16} /> Prev</Button> <Button variant="tertiary" size="sm" onClick={() => handlePageChange(page + 1)} disabled={page >= pagination.totalPages || isFetching} className="!px-2 !py-1" aria-label="Next Page">Next <ChevronRight size={16} /></Button> </div>
              </div>
          )}
          {/* End Conditional Rendering */}
        </>
      );
    } catch (err) {
      console.error(`[AdminPanel] Error rendering tab ${tab}:`, err);
      return ( <ErrorMessage message={`Failed to render ${TAB_CONFIG[tab]?.label}. Please try refreshing.`} /> );
    }
  }, [ activeTab, activeAnalyticsTab, submissionStatusFilter, listTypeFilter, hashtagCategoryFilter, neighborhoodCityFilter, isLoadingCities, citiesError, cities, searchTerm, isLoading, isError, error, isFetching, responseData, currentSort, limit, pagination, handleSortChange, handleDataMutation, handleSubmissionStatusFilterChange, handleListTypeFilterChange, handleHashtagCategoryFilterChange, handleSearchChange, handleLimitChange, handleCityFilterChange, handlePageChange, refetch ]);

  // --- Main Render ---
  console.log('[AdminPanel] Before rendering main div...'); // Existing log
  return (
    <div className="max-w-full mx-auto px-0 sm:px-2 md:px-4 py-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 px-4 sm:px-0">Admin Panel</h1>
      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List className="flex border-b border-gray-200 mb-6 overflow-x-auto no-scrollbar px-4 sm:px-0">
          {Object.entries(TAB_CONFIG).map(([key, { label, Icon }]) => (
            <Tabs.Trigger key={key} value={key} className={`flex items-center gap-1.5 py-2 px-4 text-sm font-medium rounded-t-md focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:z-10 whitespace-nowrap transition-colors ${ activeTab === key ? 'text-[#A78B71] border-b-2 border-[#A78B71]' : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent' }`} > {Icon && <Icon size={16} />} {label} </Tabs.Trigger>
          ))}
        </Tabs.List>
        <div className="mt-4 px-4 sm:px-0">
             {renderTabContent(activeTab)}
         </div>
      </Tabs.Root>
    </div>
  );
};

export default AdminPanel;