/* src/pages/AdminPanel/index.jsx */
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Tabs from '@radix-ui/react-tabs';
import apiClient from '@/services/apiClient'; // Use global import alias
import AdminTable from './AdminTable';
import AdminAnalyticsSummary from './AdminAnalyticsSummary';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import ErrorMessage from '@/components/UI/ErrorMessage';
import Button from '@/components/Button';
import { BarChart, Database, FileText, Hash, List, Store, Utensils, User, Filter, Search, ChevronLeft, ChevronRight } from 'lucide-react'; // Added Search & pagination icons

// --- Config (Moved outside component) ---
const TAB_CONFIG = {
    analytics: { label: 'Analytics', Icon: BarChart },
    submissions: { label: 'Submissions', Icon: FileText },
    restaurants: { label: 'Restaurants', Icon: Store },
    dishes: { label: 'Dishes', Icon: Utensils },
    lists: { label: 'Lists', Icon: List },
    hashtags: { label: 'Hashtags', Icon: Hash },
    users: { label: 'Users', Icon: User },
};
const DEFAULT_TAB = 'analytics';
const LIST_TYPE_OPTIONS = ['all', 'mixed', 'restaurant', 'dish'];
const HASHTAG_CATEGORY_OPTIONS = ['all', 'cuisine', 'attributes', 'ingredients', 'location', 'meal', 'dietary'];
const PAGE_LIMIT_OPTIONS = [10, 25, 50, 100];
const DEBOUNCE_DELAY = 500; // milliseconds for search debounce
const DEFAULT_PAGE_LIMIT = 25; // Moved definition here
const SUBMISSION_STATUS_OPTIONS = ['pending', 'approved', 'rejected']; // Added for consistency

// --- Fetcher Function (MODIFIED) ---
// Now accepts pagination, sort, search, and status parameters
const fetchAdminData = async (type, page = 1, limit = DEFAULT_PAGE_LIMIT, sort = '', search = '', status = '', listType = '', hashtagCategory = '') => {
    console.log(`[AdminPanel] Fetching data for type: ${type}, page: ${page}, limit: ${limit}, sort: ${sort}, search: "${search}", status: "${status}", listType: "${listType}", hashtagCategory: "${hashtagCategory}"`);
    if (type === 'analytics') return null; // Analytics has its own component/fetcher

    // Build query string dynamically
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
        // Expecting { data: [], pagination: { total, page, limit, totalPages } }
        const response = await apiClient(endpoint, `Admin Fetch ${type}`);
        console.log(`[AdminPanel] Received response for type: ${type}`, response);
        // Basic validation of response structure
        if (!response || !Array.isArray(response.data) || !response.pagination) {
            console.error(`[AdminPanel] Invalid response structure for ${type}:`, response);
            throw new Error(`Invalid response structure received from server for ${type}.`);
        }
        return response; // Return the whole object { data, pagination }
    } catch (error) {
        console.error(`[AdminPanel] Error fetching ${type}:`, error);
        throw new Error(error.message || `Failed to load ${type}`);
    }
};

// Debounce Hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

const AdminPanel = () => {
    const [activeTab, setActiveTab] = useState(DEFAULT_TAB);
    // State for sorting (remains the same)
    const [sortState, setSortState] = useState({});
    // State for filters (remains the same)
    const [listTypeFilter, setListTypeFilter] = useState('all');
    const [hashtagCategoryFilter, setHashtagCategoryFilter] = useState('all');
    const [submissionStatusFilter, setSubmissionStatusFilter] = useState('pending'); // For submissions tab

    // --- State for Pagination and Search (Using DEFAULT_PAGE_LIMIT defined above) ---
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(DEFAULT_PAGE_LIMIT); // Now uses the constant defined outside
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, DEBOUNCE_DELAY);

    // Reset page to 1 when changing tab, filters, limit or search term
    useEffect(() => {
        setPage(1);
    }, [activeTab, limit, debouncedSearchTerm, listTypeFilter, hashtagCategoryFilter, submissionStatusFilter]);

    // --- React Query Setup (MODIFIED) ---
    const currentSort = useMemo(() => sortState[activeTab] || '', [sortState, activeTab]);

    const queryKeyParams = useMemo(() => ({
        tab: activeTab,
        page,
        limit,
        sort: currentSort,
        search: debouncedSearchTerm,
        // Include filters relevant to the current tab
        ...(activeTab === 'submissions' && { status: submissionStatusFilter }),
        ...(activeTab === 'lists' && { listType: listTypeFilter }),
        ...(activeTab === 'hashtags' && { hashtagCategory: hashtagCategoryFilter }),
    }), [activeTab, page, limit, currentSort, debouncedSearchTerm, submissionStatusFilter, listTypeFilter, hashtagCategoryFilter]);


    const {
        data: queryResult, // Rename to avoid conflict with 'data' property inside
        isLoading,
        isError,
        error,
        refetch,
        isFetching, // Use isFetching for loading indicators during refetches/pagination
    } = useQuery({
        // Query key now includes pagination, sort, and search params
        queryKey: ['adminData', queryKeyParams],
        queryFn: () => fetchAdminData(
            activeTab,
            page,
            limit,
            currentSort,
            debouncedSearchTerm,
            activeTab === 'submissions' ? submissionStatusFilter : '',
            activeTab === 'lists' ? listTypeFilter : '',
            activeTab === 'hashtags' ? hashtagCategoryFilter : ''
         ),
        enabled: !!activeTab && activeTab !== 'analytics',
        placeholderData: { data: [], pagination: { total: 0, page: 1, limit: limit, totalPages: 0 } }, // Keep previous data while loading new
        keepPreviousData: true, // Important for smooth pagination UX
    });

    // Extract data and pagination info from queryResult
    const responseData = queryResult?.data || [];
    const pagination = queryResult?.pagination || { total: 0, page: 1, limit: limit, totalPages: 0 };

    // --- Handlers (MODIFIED where needed) ---
    const handleSortChange = useCallback((type, column, direction) => {
        setSortState(prev => ({ ...prev, [type]: `${column}_${direction}` }));
        // No need to setPage(1) here, useEffect handles it
    }, []);

    const handleDataMutation = useCallback(() => {
        // Refetch the *current* page after mutation
        refetch();
    }, [refetch]);

    const handleListTypeFilterChange = useCallback((newFilter) => {
        setListTypeFilter(newFilter);
         // Reset page when filter changes
        // setPage(1); // Handled by useEffect
    }, []);

    const handleHashtagCategoryFilterChange = useCallback((newFilter) => {
        setHashtagCategoryFilter(newFilter);
        // setPage(1); // Handled by useEffect
    }, []);

    const handleSubmissionStatusFilterChange = useCallback((newStatus) => {
        setSubmissionStatusFilter(newStatus);
       // setPage(1); // Handled by useEffect
    }, []);

    const handleSearchChange = useCallback((event) => {
        setSearchTerm(event.target.value);
         // Reset page immediately on typing? Or wait for debounce? Debounce seems better.
         // setPage(1); // Handled by useEffect dependency on debouncedSearchTerm
    }, []);

    // --- Pagination Handlers ---
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setPage(newPage);
        }
    };

    const handleLimitChange = (event) => {
        setLimit(Number(event.target.value));
        // setPage(1); // Handled by useEffect
    };


    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Admin Panel</h1>

            <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
                <Tabs.List className="flex border-b border-gray-200 mb-6 overflow-x-auto no-scrollbar"> {/* Added no-scrollbar */}
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
                            {Icon && <Icon size={16} />}
                            {label}
                        </Tabs.Trigger>
                    ))}
                </Tabs.List>

                 {/* --- Filter & Search Area (Combined) --- */}
                 {activeTab !== 'analytics' && (
                     <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-3 md:space-y-0 md:flex md:items-center md:justify-between gap-4">
                         {/* Filters Section */}
                         <div className='flex flex-wrap items-center gap-x-4 gap-y-2'>
                            <span className="text-sm font-medium text-gray-700 flex items-center gap-1 mr-2"><Filter size={14}/> Filters:</span>
                            {/* Submission Status Filter */}
                            {activeTab === 'submissions' && (
                                <div className="flex items-center gap-1">
                                    <label htmlFor="sub-status-filter" className='text-xs text-gray-600 mr-1'>Status:</label>
                                    <select
                                        id="sub-status-filter"
                                        value={submissionStatusFilter}
                                        onChange={(e) => handleSubmissionStatusFilterChange(e.target.value)}
                                        className="text-xs border-gray-300 rounded shadow-sm focus:border-[#A78B71] focus:ring-[#A78B71] py-1 pl-2 pr-6"
                                    >
                                        {SUBMISSION_STATUS_OPTIONS.map(option => (
                                             <option key={option} value={option} className='capitalize'>{option}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            {/* List Type Filter */}
                            {activeTab === 'lists' && (
                                <div className="flex items-center gap-1">
                                     <label htmlFor="list-type-filter" className='text-xs text-gray-600 mr-1'>Type:</label>
                                    <select
                                        id="list-type-filter"
                                        value={listTypeFilter}
                                        onChange={(e) => handleListTypeFilterChange(e.target.value)}
                                         className="text-xs border-gray-300 rounded shadow-sm focus:border-[#A78B71] focus:ring-[#A78B71] py-1 pl-2 pr-6"
                                     >
                                         {LIST_TYPE_OPTIONS.map(option => (
                                             <option key={option} value={option} className='capitalize'>{option}</option>
                                         ))}
                                     </select>
                                </div>
                            )}
                            {/* Hashtag Category Filter */}
                            {activeTab === 'hashtags' && (
                                 <div className="flex items-center gap-1">
                                     <label htmlFor="hashtag-cat-filter" className='text-xs text-gray-600 mr-1'>Category:</label>
                                     <select
                                         id="hashtag-cat-filter"
                                         value={hashtagCategoryFilter}
                                         onChange={(e) => handleHashtagCategoryFilterChange(e.target.value)}
                                         className="text-xs border-gray-300 rounded shadow-sm focus:border-[#A78B71] focus:ring-[#A78B71] py-1 pl-2 pr-6"
                                     >
                                         {HASHTAG_CATEGORY_OPTIONS.map(option => (
                                              <option key={option} value={option} className='capitalize'>{option}</option>
                                         ))}
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
                             <input
                                 type="search"
                                 name="adminSearch"
                                 id="adminSearch"
                                 className="block w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-[#D1B399] focus:border-[#D1B399] sm:text-sm"
                                 placeholder={`Search ${activeTab}...`}
                                 value={searchTerm}
                                 onChange={handleSearchChange}
                             />
                         </div>
                     </div>
                 )}
                 {/* --- End Filter & Search Area --- */}


                {/* Render Content Based on Active Tab */}
                {Object.keys(TAB_CONFIG).map((key) => (
                    <Tabs.Content key={key} value={key} className="focus:outline-none pt-2">
                        {activeTab === 'analytics' && key === 'analytics' && (
                            <AdminAnalyticsSummary />
                        )}
                        {activeTab !== 'analytics' && activeTab === key && (
                            <>
                                {/* Show spinner only on initial load when no data exists */}
                                {isLoading && !queryResult?.data?.length && <LoadingSpinner message={`Loading ${TAB_CONFIG[key]?.label}...`} />}

                                {isError && !isLoading && ( // Show error only if not loading initial data
                                    <ErrorMessage
                                        message={error?.message || `Failed to load ${TAB_CONFIG[key]?.label}.`}
                                        onRetry={refetch}
                                        isLoadingRetry={isFetching} // Use isFetching for retry spinner
                                        containerClassName="mt-4"
                                    />
                                )}

                                {!isError && ( // Render table even if refetching or data is empty initially
                                    <>
                                        <AdminTable
                                            type={key}
                                            // Pass only the data array to the table
                                            data={responseData}
                                            sort={currentSort}
                                            onSortChange={handleSortChange}
                                            onDataMutated={handleDataMutation}
                                            isLoading={isFetching} // Pass fetching state for potential overlay/indicator
                                        />
                                         {/* --- Pagination Controls --- */}
                                         {pagination && pagination.totalPages > 1 && (
                                             <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                                                 {/* Limit Selector */}
                                                 <div>
                                                      <label htmlFor="items-per-page" className="mr-2 text-xs">Items per page:</label>
                                                      <select
                                                          id="items-per-page"
                                                          value={limit}
                                                          onChange={handleLimitChange}
                                                          className="text-xs border-gray-300 rounded shadow-sm focus:border-[#A78B71] focus:ring-[#A78B71] py-1 pl-2 pr-7"
                                                          disabled={isFetching}
                                                      >
                                                          {PAGE_LIMIT_OPTIONS.map(opt => (
                                                              <option key={opt} value={opt}>{opt}</option>
                                                          ))}
                                                      </select>
                                                 </div>
                                                 {/* Page Info */}
                                                 <span className='text-xs'>
                                                     Page {pagination.page} of {pagination.totalPages} ({pagination.total} items)
                                                 </span>
                                                  {/* Prev/Next Buttons */}
                                                 <div className='flex items-center gap-1'>
                                                      <Button
                                                          variant="tertiary"
                                                          size="sm"
                                                          onClick={() => handlePageChange(page - 1)}
                                                          disabled={page <= 1 || isFetching}
                                                          className="!px-2 !py-1"
                                                          aria-label="Previous page"
                                                      >
                                                          <ChevronLeft size={16} />
                                                          Prev
                                                      </Button>
                                                      <Button
                                                          variant="tertiary"
                                                          size="sm"
                                                          onClick={() => handlePageChange(page + 1)}
                                                          disabled={page >= pagination.totalPages || isFetching}
                                                          className="!px-2 !py-1"
                                                          aria-label="Next page"
                                                       >
                                                          Next
                                                          <ChevronRight size={16} />
                                                      </Button>
                                                 </div>
                                             </div>
                                         )}
                                         {/* --- End Pagination Controls --- */}
                                     </>
                                )}
                            </>
                        )}
                    </Tabs.Content>
                ))}
            </Tabs.Root>
        </div>
    );
};

export default AdminPanel;