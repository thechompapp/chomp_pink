/* src/pages/AdminPanel/index.jsx */
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Tabs from '@radix-ui/react-tabs';
import apiClient from '@/services/apiClient'; // Use global import alias
import AdminTable from './AdminTable'; // Reusable table component
import AdminAnalyticsSummary from './AdminAnalyticsSummary'; // General stats component
import AdminEngagementAnalytics from './AdminEngagementAnalytics'; // Engagement stats component
import NeighborhoodsAdmin from './NeighborhoodsAdmin'; // Specific component for neighborhoods
import LoadingSpinner from '@/components/UI/LoadingSpinner'; // Use alias
import ErrorMessage from '@/components/UI/ErrorMessage'; // Use alias
import Button from '@/components/UI/Button'; // Use alias
import { Activity, BarChart, Database, FileText, Hash, List, Store, Utensils, User, Filter, Search, ChevronLeft, ChevronRight, Map } from 'lucide-react'; // Added Map

// --- Config ---
// Added 'neighborhoods' tab
const TAB_CONFIG = {
    analytics: { label: 'Analytics', Icon: BarChart },
    submissions: { label: 'Submissions', Icon: FileText },
    restaurants: { label: 'Restaurants', Icon: Store },
    dishes: { label: 'Dishes', Icon: Utensils },
    neighborhoods: { label: 'Neighborhoods', Icon: Map }, // Added Neighborhoods Tab
    lists: { label: 'Lists', Icon: List },
    hashtags: { label: 'Hashtags', Icon: Hash },
    users: { label: 'Users', Icon: User },
};
const DEFAULT_TAB = 'analytics';
const ANALYTICS_SUB_TABS = {
    summary: { label: 'Site Summary', Icon: BarChart },
    engagement: { label: 'Engagement Stats', Icon: Activity },
};
const DEFAULT_ANALYTICS_SUB_TAB = 'summary';
const LIST_TYPE_OPTIONS = ['all', 'mixed', 'restaurant', 'dish'];
const HASHTAG_CATEGORY_OPTIONS = ['all', 'cuisine', 'attributes', 'ingredients', 'location', 'meal', 'dietary'];
const PAGE_LIMIT_OPTIONS = [10, 25, 50, 100];
const DEBOUNCE_DELAY = 500;
const DEFAULT_PAGE_LIMIT = 25;
const SUBMISSION_STATUS_OPTIONS = ['pending', 'approved', 'rejected'];

// --- Fetcher Function ---
const fetchAdminData = async (type, page = 1, limit = DEFAULT_PAGE_LIMIT, sort = '', search = '', status = '', listType = '', hashtagCategory = '') => {
    // Neighborhoods data is fetched within its own component, so skip fetch here
    if (type === 'analytics' || type === 'neighborhoods') return null;

    console.log(`[AdminPanel] Fetching data for type: ${type}, page: ${page}, limit: ${limit}, sort: ${sort}, search: "${search}", status: "${status}", listType: "${listType}", hashtagCategory: "${hashtagCategory}"`);

    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (sort) params.append('sort', sort);
    if (search) params.append('search', search);
    if (type === 'submissions' && status) params.append('status', status);
    if (type === 'lists' && listType && listType !== 'all') params.append('list_type', listType);
    if (type === 'hashtags' && hashtagCategory && hashtagCategory !== 'all') params.append('hashtag_category', hashtagCategory);

    const endpoint = `/api/admin/${type}?${params.toString()}`;
    try {
        // Assuming apiClient wraps response in { data: ..., pagination: ... }
        const response = await apiClient(endpoint, `Admin Fetch ${type}`);
        // Validate structure - adjust based on actual apiClient response
        if (!response || typeof response !== 'object' || !Array.isArray(response.data) || typeof response.pagination !== 'object') {
            console.error(`[AdminPanel] Invalid response structure for ${type}:`, response);
            throw new Error(`Invalid response structure received from server for ${type}.`);
        }
        return response; // Return the full response object { data, pagination }
    } catch (error) {
        console.error(`[AdminPanel] Error fetching ${type}:`, error);
        // Rethrow or handle as needed
        throw new Error(error.message || `Failed to load ${type}`);
    }
};

// --- Debounce Hook ---
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
    return () => { clearTimeout(handler); };
  }, [value, delay]);
  return debouncedValue;
}

// --- Component ---
const AdminPanel = () => {
    const [activeTab, setActiveTab] = useState(DEFAULT_TAB);
    const [activeAnalyticsSubTab, setActiveAnalyticsSubTab] = useState(DEFAULT_ANALYTICS_SUB_TAB);
    const [sortState, setSortState] = useState({}); // Store sort as { [type]: 'column_direction' }
    const [listTypeFilter, setListTypeFilter] = useState('all');
    const [hashtagCategoryFilter, setHashtagCategoryFilter] = useState('all');
    const [submissionStatusFilter, setSubmissionStatusFilter] = useState('pending');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(DEFAULT_PAGE_LIMIT);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, DEBOUNCE_DELAY);
    const queryClient = useQueryClient(); // Get query client instance

    // Reset page to 1 when changing main tab, filters, limit or search term
    useEffect(() => {
        setPage(1);
    }, [activeTab, limit, debouncedSearchTerm, listTypeFilter, hashtagCategoryFilter, submissionStatusFilter]);

    // Reset analytics sub-tab when leaving the main analytics tab
     useEffect(() => {
         if (activeTab !== 'analytics') {
             setActiveAnalyticsSubTab(DEFAULT_ANALYTICS_SUB_TAB);
         }
     }, [activeTab]);

    // Current sort string for the active tab
    const currentSort = useMemo(() => sortState[activeTab] || '', [sortState, activeTab]);

    // Query key params - include all state that affects the query
    const queryKeyParams = useMemo(() => ({
        tab: activeTab,
        page,
        limit,
        sort: currentSort,
        search: debouncedSearchTerm,
        ...(activeTab === 'submissions' && { status: submissionStatusFilter }),
        ...(activeTab === 'lists' && { listType: listTypeFilter }),
        ...(activeTab === 'hashtags' && { hashtagCategory: hashtagCategoryFilter }),
    }), [activeTab, page, limit, currentSort, debouncedSearchTerm, submissionStatusFilter, listTypeFilter, hashtagCategoryFilter]);

    // React Query for fetching data for most tabs
    const {
        data: queryResult, // Contains { data: [], pagination: {} } on success
        isLoading,
        isError,
        error,
        refetch,
        isFetching, // Use isFetching for background refresh indication
    } = useQuery({
        queryKey: ['adminData', queryKeyParams],
        queryFn: () => fetchAdminData(
            activeTab, page, limit, currentSort, debouncedSearchTerm,
            activeTab === 'submissions' ? submissionStatusFilter : '',
            activeTab === 'lists' ? listTypeFilter : '',
            activeTab === 'hashtags' ? hashtagCategoryFilter : ''
         ),
        // Only enable for tabs that use this fetcher
        enabled: !!activeTab && activeTab !== 'analytics' && activeTab !== 'neighborhoods',
        placeholderData: { data: [], pagination: { total: 0, page: 1, limit: limit, totalPages: 0 } },
        keepPreviousData: true, // Useful for pagination/filtering UX
    });

    // Extract data and pagination safely
    const responseData = queryResult?.data || [];
    const pagination = queryResult?.pagination || { total: 0, page: 1, limit: limit, totalPages: 0 };

    // --- Handlers ---
     const handleSortChange = useCallback((type, column, direction) => {
        setSortState(prev => ({ ...prev, [type]: `${column}_${direction}` }));
        // No need to reset page here, useEffect dependency on currentSort handles it
    }, []); // Dependencies are stable

    // Callback to refresh data after mutations in AdminTable/NeighborhoodsAdmin
    const handleDataMutation = useCallback(() => {
        // Invalidate the query for the current tab to force refetch
         queryClient.invalidateQueries({ queryKey: ['adminData', queryKeyParams] });
         // If mutating neighborhoods, the NeighborhoodsAdmin component handles its own invalidation
    }, [queryClient, queryKeyParams]); // Include queryKeyParams dependency

    // Filter change handlers
    const handleListTypeFilterChange = useCallback((e) => { setListTypeFilter(e.target.value); }, []);
    const handleHashtagCategoryFilterChange = useCallback((e) => { setHashtagCategoryFilter(e.target.value); }, []);
    const handleSubmissionStatusFilterChange = useCallback((e) => { setSubmissionStatusFilter(e.target.value); }, []);
    const handleSearchChange = useCallback((event) => { setSearchTerm(event.target.value); }, []);
    const handleLimitChange = useCallback((event) => { setLimit(Number(event.target.value)); }, []);
    // Pagination handler - ensure page stays within bounds
    const handlePageChange = (newPage) => {
        const totalPages = pagination?.totalPages ?? 1;
        const validPage = Math.max(1, Math.min(newPage, totalPages)); // Clamp page number
        if (validPage !== page) {
            setPage(validPage);
        }
    };
    // --- End Handlers ---

    // --- Render Logic ---
    const renderContent = () => {
        switch (activeTab) {
            case 'analytics':
                return (
                    <div className="relative">
                        {/* Analytics Sub-Tabs */}
                        <div className="absolute top-0 right-0 flex space-x-1 mb-4 z-10">
                            {Object.entries(ANALYTICS_SUB_TABS).map(([subKey, { label, Icon }]) => (
                                <button
                                    key={subKey}
                                    onClick={() => setActiveAnalyticsSubTab(subKey)}
                                    className={`flex items-center gap-1 py-1 px-2.5 rounded-full text-xs font-medium focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-[#D1B399] transition-colors ${
                                        activeAnalyticsSubTab === subKey
                                        ? 'bg-[#A78B71] text-white shadow-sm'
                                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
                                    }`}
                                    aria-selected={activeAnalyticsSubTab === subKey}
                                >
                                    {Icon && <Icon size={13} />} {label}
                                </button>
                            ))}
                        </div>
                        {/* Render corresponding analytics component */}
                        <div className="pt-10"> {/* Padding to avoid overlap */}
                            {activeAnalyticsSubTab === 'summary' && <AdminAnalyticsSummary />}
                            {activeAnalyticsSubTab === 'engagement' && <AdminEngagementAnalytics />}
                        </div>
                    </div>
                );
            case 'neighborhoods':
                // Render the dedicated NeighborhoodsAdmin component
                return <NeighborhoodsAdmin />;
            // --- Default Case for Other Tabs (Render AdminTable) ---
            default:
                return (
                    <>
                        {/* Filter/Search Area */}
                        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-3 md:space-y-0 md:flex md:items-center md:justify-between gap-4">
                             {/* Filters Section */}
                            <div className='flex flex-wrap items-center gap-x-4 gap-y-2'>
                                <span className="text-sm font-medium text-gray-700 flex items-center gap-1 mr-2"><Filter size={14}/> Filters:</span>
                                {/* Submission Status Filter */}
                                {activeTab === 'submissions' && (
                                    <div className="flex items-center gap-1">
                                        <label htmlFor="sub-status-filter" className='text-xs text-gray-600 mr-1'>Status:</label>
                                        <select id="sub-status-filter" value={submissionStatusFilter} onChange={handleSubmissionStatusFilterChange}
                                            className="text-xs border-gray-300 rounded shadow-sm focus:border-[#A78B71] focus:ring-[#A78B71] py-1 pl-2 pr-6 bg-white">
                                            {SUBMISSION_STATUS_OPTIONS.map(option => (<option key={option} value={option} className='capitalize'>{option}</option>))}
                                        </select>
                                    </div>
                                )}
                                {/* List Type Filter */}
                                {activeTab === 'lists' && (
                                    <div className="flex items-center gap-1">
                                        <label htmlFor="list-type-filter" className='text-xs text-gray-600 mr-1'>Type:</label>
                                        <select id="list-type-filter" value={listTypeFilter} onChange={handleListTypeFilterChange}
                                            className="text-xs border-gray-300 rounded shadow-sm focus:border-[#A78B71] focus:ring-[#A78B71] py-1 pl-2 pr-6 bg-white">
                                            {LIST_TYPE_OPTIONS.map(option => (<option key={option} value={option} className='capitalize'>{option}</option>))}
                                        </select>
                                    </div>
                                )}
                                {/* Hashtag Category Filter */}
                                {activeTab === 'hashtags' && (
                                    <div className="flex items-center gap-1">
                                        <label htmlFor="hashtag-cat-filter" className='text-xs text-gray-600 mr-1'>Category:</label>
                                        <select id="hashtag-cat-filter" value={hashtagCategoryFilter} onChange={handleHashtagCategoryFilterChange}
                                            className="text-xs border-gray-300 rounded shadow-sm focus:border-[#A78B71] focus:ring-[#A78B71] py-1 pl-2 pr-6 bg-white">
                                            {HASHTAG_CATEGORY_OPTIONS.map(option => (<option key={option} value={option} className='capitalize'>{option}</option>))}
                                        </select>
                                    </div>
                                )}
                            </div>
                             {/* Search Input */}
                            <div className="relative flex-shrink-0 w-full md:w-64">
                                 <label htmlFor="adminSearch" className="sr-only">Search {activeTab}</label>
                                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                     <Search className="h-4 w-4 text-gray-400" aria-hidden="true" />
                                 </div>
                                 <input type="search" name="adminSearch" id="adminSearch" value={searchTerm} onChange={handleSearchChange}
                                     className="block w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-[#D1B399] focus:border-[#D1B399] sm:text-sm"
                                     placeholder={`Search ${activeTab}...`}
                                 />
                            </div>
                        </div>

                        {/* Loading/Error/Table Display */}
                        {/* Use isLoading for initial load spinner */}
                        {isLoading && !queryResult?.data && <LoadingSpinner message={`Loading ${TAB_CONFIG[activeTab]?.label}...`} />}
                        {/* Use isError for query errors */}
                        {isError && !isLoading && (
                            <ErrorMessage
                                message={error?.message || `Failed to load ${TAB_CONFIG[activeTab]?.label}.`}
                                onRetry={refetch}
                                isLoadingRetry={isFetching} // Use isFetching for retry button state
                                containerClassName="mt-4"
                            />
                        )}
                        {/* Render table only if not initial loading and no error */}
                        {!isLoading && !isError && (
                            <>
                                <AdminTable
                                    type={activeTab}
                                    data={responseData}
                                    sort={currentSort}
                                    onSortChange={handleSortChange}
                                    onDataMutated={handleDataMutation}
                                    isLoading={isFetching} // Pass isFetching for background loading indicator
                                    // Key added to potentially help React differentiate tables if needed
                                    // key={activeTab}
                                />
                                {/* Pagination Controls */}
                                {pagination && pagination.totalPages > 1 && (
                                     <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                                        <div>
                                              <label htmlFor="items-per-page" className="mr-2 text-xs">Items per page:</label>
                                              <select id="items-per-page" value={limit} onChange={handleLimitChange} disabled={isFetching}
                                                  className="text-xs border-gray-300 rounded shadow-sm focus:border-[#A78B71] focus:ring-[#A78B71] py-1 pl-2 pr-7 bg-white">
                                                  {PAGE_LIMIT_OPTIONS.map(opt => (<option key={opt} value={opt}>{opt}</option>))}
                                              </select>
                                        </div>
                                        <span className='text-xs'>
                                             Page {pagination.page} of {pagination.totalPages} ({pagination.total} items)
                                        </span>
                                        <div className='flex items-center gap-1'>
                                              <Button variant="tertiary" size="sm" onClick={() => handlePageChange(page - 1)} disabled={page <= 1 || isFetching} className="!px-2 !py-1" aria-label="Previous page">
                                                  <ChevronLeft size={16} /> Prev
                                              </Button>
                                              <Button variant="tertiary" size="sm" onClick={() => handlePageChange(page + 1)} disabled={page >= pagination.totalPages || isFetching} className="!px-2 !py-1" aria-label="Next page">
                                                  Next <ChevronRight size={16} />
                                              </Button>
                                        </div>
                                     </div>
                                 )}
                            </>
                        )}
                    </>
                );
        }
    };

    return (
        <div className="max-w-full mx-auto px-0 sm:px-2 md:px-4 py-6"> {/* Use max-w-full and minimal horizontal padding */}
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 px-4 sm:px-0">Admin Panel</h1> {/* Add padding back to title */}

            <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
                {/* Main Tabs */}
                <Tabs.List className="flex border-b border-gray-200 mb-6 overflow-x-auto no-scrollbar px-4 sm:px-0"> {/* Add padding back */}
                    {Object.entries(TAB_CONFIG).map(([key, { label, Icon }]) => (
                        <Tabs.Trigger
                            key={key}
                            value={key}
                            className={`flex items-center gap-1.5 py-2 px-4 text-sm font-medium rounded-t-md focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:z-10 whitespace-nowrap transition-colors ${
                                activeTab === key
                                ? 'text-[#A78B71] border-b-2 border-[#A78B71]'
                                : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
                            }`}
                        >
                            {Icon && <Icon size={16} />} {label}
                        </Tabs.Trigger>
                    ))}
                </Tabs.List>

                {/* Tab Content Area - Render based on activeTab */}
                 <div className="mt-4 px-4 sm:px-0"> {/* Add padding back */}
                     {renderContent()}
                 </div>

            </Tabs.Root>
        </div>
    );
};

export default AdminPanel;