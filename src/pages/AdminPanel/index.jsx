/* src/pages/AdminPanel/index.jsx */
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Tabs from '@radix-ui/react-tabs';
import apiClient from '@/services/apiClient'; // Use global import alias
import AdminTable from './AdminTable';
import AdminAnalyticsSummary from './AdminAnalyticsSummary'; // General stats component
import AdminEngagementAnalytics from './AdminEngagementAnalytics'; // New Engagement stats component
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import ErrorMessage from '@/components/UI/ErrorMessage';
import Button from '@/components/Button';
import { Activity, BarChart, Database, FileText, Hash, List, Store, Utensils, User, Filter, Search, ChevronLeft, ChevronRight } from 'lucide-react';

// --- Config ---
// Main Tabs
const TAB_CONFIG = {
    analytics: { label: 'Analytics', Icon: BarChart },
    submissions: { label: 'Submissions', Icon: FileText },
    restaurants: { label: 'Restaurants', Icon: Store },
    dishes: { label: 'Dishes', Icon: Utensils },
    lists: { label: 'Lists', Icon: List },
    hashtags: { label: 'Hashtags', Icon: Hash },
    users: { label: 'Users', Icon: User },
};
const DEFAULT_TAB = 'analytics'; // Default main tab
// Analytics Sub-Tabs
const ANALYTICS_SUB_TABS = {
    summary: { label: 'Site Summary', Icon: BarChart },
    engagement: { label: 'Engagement Stats', Icon: Activity },
};
const DEFAULT_ANALYTICS_SUB_TAB = 'summary';
// Other constants remain the same
const LIST_TYPE_OPTIONS = ['all', 'mixed', 'restaurant', 'dish'];
const HASHTAG_CATEGORY_OPTIONS = ['all', 'cuisine', 'attributes', 'ingredients', 'location', 'meal', 'dietary'];
const PAGE_LIMIT_OPTIONS = [10, 25, 50, 100];
const DEBOUNCE_DELAY = 500;
const DEFAULT_PAGE_LIMIT = 25;
const SUBMISSION_STATUS_OPTIONS = ['pending', 'approved', 'rejected'];

// --- Fetcher Function (Keep as is) ---
const fetchAdminData = async (type, page = 1, limit = DEFAULT_PAGE_LIMIT, sort = '', search = '', status = '', listType = '', hashtagCategory = '') => {
    console.log(`[AdminPanel] Fetching data for type: ${type}, page: ${page}, limit: ${limit}, sort: ${sort}, search: "${search}", status: "${status}", listType: "${listType}", hashtagCategory: "${hashtagCategory}"`);
    if (type === 'analytics') return null; // Analytics tab doesn't fetch list data directly anymore

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
        const response = await apiClient(endpoint, `Admin Fetch ${type}`);
        if (!response || !Array.isArray(response.data) || !response.pagination) {
            console.error(`[AdminPanel] Invalid response structure for ${type}:`, response);
            throw new Error(`Invalid response structure received from server for ${type}.`);
        }
        return response;
    } catch (error) {
        console.error(`[AdminPanel] Error fetching ${type}:`, error);
        throw new Error(error.message || `Failed to load ${type}`);
    }
};

// --- Debounce Hook (Keep as is) ---
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
    const [activeAnalyticsSubTab, setActiveAnalyticsSubTab] = useState(DEFAULT_ANALYTICS_SUB_TAB); // New state for analytics sub-tab
    const [sortState, setSortState] = useState({});
    const [listTypeFilter, setListTypeFilter] = useState('all');
    const [hashtagCategoryFilter, setHashtagCategoryFilter] = useState('all');
    const [submissionStatusFilter, setSubmissionStatusFilter] = useState('pending');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(DEFAULT_PAGE_LIMIT);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, DEBOUNCE_DELAY);

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


    const currentSort = useMemo(() => sortState[activeTab] || '', [sortState, activeTab]);

    // Update query key params to reflect current filters for the active tab
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

    const {
        data: queryResult,
        isLoading,
        isError,
        error,
        refetch,
        isFetching,
    } = useQuery({
        queryKey: ['adminData', queryKeyParams],
        queryFn: () => fetchAdminData(
            activeTab, page, limit, currentSort, debouncedSearchTerm,
            activeTab === 'submissions' ? submissionStatusFilter : '',
            activeTab === 'lists' ? listTypeFilter : '',
            activeTab === 'hashtags' ? hashtagCategoryFilter : ''
         ),
        enabled: !!activeTab && activeTab !== 'analytics', // Only enable for non-analytics tabs
        placeholderData: { data: [], pagination: { total: 0, page: 1, limit: limit, totalPages: 0 } },
        keepPreviousData: true,
    });

    const responseData = queryResult?.data || [];
    const pagination = queryResult?.pagination || { total: 0, page: 1, limit: limit, totalPages: 0 };

    // --- Handlers (Keep existing ones, modify if needed) ---
     const handleSortChange = useCallback((type, column, direction) => {
        setSortState(prev => ({ ...prev, [type]: `${column}_${direction}` }));
    }, []);

    const handleDataMutation = useCallback(() => {
        refetch();
    }, [refetch]);

    const handleListTypeFilterChange = useCallback((newFilter) => { setListTypeFilter(newFilter); }, []);
    const handleHashtagCategoryFilterChange = useCallback((newFilter) => { setHashtagCategoryFilter(newFilter); }, []);
    const handleSubmissionStatusFilterChange = useCallback((newStatus) => { setSubmissionStatusFilter(newStatus); }, []);
    const handleSearchChange = useCallback((event) => { setSearchTerm(event.target.value); }, []);
    const handlePageChange = (newPage) => { if (newPage >= 1 && newPage <= pagination.totalPages) { setPage(newPage); } };
    const handleLimitChange = (event) => { setLimit(Number(event.target.value)); };
    // --- End Handlers ---

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Admin Panel</h1>

            <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
                {/* Main Tabs */}
                <Tabs.List className="flex border-b border-gray-200 mb-6 overflow-x-auto no-scrollbar"> {/* Increased mb */}
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

                {/* --- NO Sub-Tabs Here --- */}

                {/* Tab Content Area */}
                {Object.keys(TAB_CONFIG).map((key) => (
                    <Tabs.Content key={key} value={key} className="focus:outline-none">
                        {/* --- Analytics Tab Content --- */}
                        {key === 'analytics' && activeTab === 'analytics' && (
                             <div className="relative"> {/* Added relative positioning */}
                                {/* Analytics Sub-Tabs - Positioned within the content area */}
                                <div className="absolute top-0 right-0 flex space-x-1 mb-4 z-10"> {/* Positioned top-right */}
                                    {Object.entries(ANALYTICS_SUB_TABS).map(([subKey, { label, Icon }]) => (
                                         <button
                                             key={subKey}
                                             onClick={() => setActiveAnalyticsSubTab(subKey)}
                                             // DIFFERENT STYLING for sub-tabs (Pill-like)
                                             className={`flex items-center gap-1 py-1 px-2.5 rounded-full text-xs font-medium focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-[#D1B399] transition-colors ${
                                                 activeAnalyticsSubTab === subKey
                                                 ? 'bg-[#A78B71] text-white shadow-sm' // Active state
                                                 : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300' // Inactive state
                                             }`}
                                             aria-selected={activeAnalyticsSubTab === subKey}
                                          >
                                             {Icon && <Icon size={13} />} {label}
                                         </button>
                                    ))}
                                </div>

                                {/* Render corresponding analytics component with padding-top */}
                                <div className="pt-10"> {/* Added padding-top to prevent overlap */}
                                    {activeAnalyticsSubTab === 'summary' && <AdminAnalyticsSummary />}
                                    {activeAnalyticsSubTab === 'engagement' && <AdminEngagementAnalytics />}
                                </div>
                             </div>
                        )}

                        {/* --- Other Tabs Content (Table View) --- */}
                        {key !== 'analytics' && activeTab === key && (
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
                                                <select id="sub-status-filter" value={submissionStatusFilter} onChange={(e) => handleSubmissionStatusFilterChange(e.target.value)}
                                                    className="text-xs border-gray-300 rounded shadow-sm focus:border-[#A78B71] focus:ring-[#A78B71] py-1 pl-2 pr-6">
                                                    {SUBMISSION_STATUS_OPTIONS.map(option => (<option key={option} value={option} className='capitalize'>{option}</option>))}
                                                </select>
                                            </div>
                                        )}
                                        {/* List Type Filter */}
                                        {activeTab === 'lists' && (
                                            <div className="flex items-center gap-1">
                                                <label htmlFor="list-type-filter" className='text-xs text-gray-600 mr-1'>Type:</label>
                                                <select id="list-type-filter" value={listTypeFilter} onChange={(e) => handleListTypeFilterChange(e.target.value)}
                                                    className="text-xs border-gray-300 rounded shadow-sm focus:border-[#A78B71] focus:ring-[#A78B71] py-1 pl-2 pr-6">
                                                    {LIST_TYPE_OPTIONS.map(option => (<option key={option} value={option} className='capitalize'>{option}</option>))}
                                                </select>
                                            </div>
                                        )}
                                        {/* Hashtag Category Filter */}
                                        {activeTab === 'hashtags' && (
                                            <div className="flex items-center gap-1">
                                                <label htmlFor="hashtag-cat-filter" className='text-xs text-gray-600 mr-1'>Category:</label>
                                                <select id="hashtag-cat-filter" value={hashtagCategoryFilter} onChange={(e) => handleHashtagCategoryFilterChange(e.target.value)}
                                                    className="text-xs border-gray-300 rounded shadow-sm focus:border-[#A78B71] focus:ring-[#A78B71] py-1 pl-2 pr-6">
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
                                {isLoading && !queryResult?.data?.length && <LoadingSpinner message={`Loading ${TAB_CONFIG[key]?.label}...`} />}
                                {isError && !isLoading && (
                                    <ErrorMessage
                                        message={error?.message || `Failed to load ${TAB_CONFIG[key]?.label}.`}
                                        onRetry={refetch}
                                        isLoadingRetry={isFetching}
                                        containerClassName="mt-4"
                                    />
                                )}
                                {!isError && (
                                    <>
                                        <AdminTable
                                            type={key}
                                            data={responseData}
                                            sort={currentSort}
                                            onSortChange={handleSortChange}
                                            onDataMutated={handleDataMutation}
                                            isLoading={isFetching}
                                        />
                                        {/* Pagination Controls */}
                                        {pagination && pagination.totalPages > 1 && (
                                             <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                                                <div>
                                                      <label htmlFor="items-per-page" className="mr-2 text-xs">Items per page:</label>
                                                      <select id="items-per-page" value={limit} onChange={handleLimitChange} disabled={isFetching}
                                                          className="text-xs border-gray-300 rounded shadow-sm focus:border-[#A78B71] focus:ring-[#A78B71] py-1 pl-2 pr-7">
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
                        )}
                    </Tabs.Content>
                ))}
            </Tabs.Root>
        </div>
    );
};

export default AdminPanel;