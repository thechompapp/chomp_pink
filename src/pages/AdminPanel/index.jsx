// src/pages/AdminPanel/index.jsx
import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as Tabs from '@radix-ui/react-tabs';
import apiClient from '@/services/apiClient'; // Use alias
import AdminTable from './AdminTable';
import AdminAnalyticsSummary from './AdminAnalyticsSummary';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import ErrorMessage from '@/components/UI/ErrorMessage';
import Button from '@/components/Button';
import { BarChart, Database, FileText, Hash, List, Store, Utensils, User, Filter, Search } from 'lucide-react'; // Added Search icon

// --- Config ---
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
const HASHTAG_CATEGORY_OPTIONS = ['all', 'cuisine', 'attributes', 'ingredients', 'location', 'meal', 'dietary']; // Add more as needed

// --- Fetcher Function ---
const fetchAdminData = async (type, sort = '') => {
    console.log(`[AdminPanel] Fetching data for type: ${type}, sort: ${sort}`);
    if (type === 'analytics') return null;
    const endpoint = `/api/admin/${type}${sort ? `?sort=${sort}` : ''}`;
    try {
        const data = await apiClient(endpoint, `Admin Fetch ${type}`);
        console.log(`[AdminPanel] Received ${Array.isArray(data) ? data.length : 'invalid'} items for type: ${type}`);
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error(`[AdminPanel] Error fetching ${type}:`, error);
        throw new Error(error.message || `Failed to load ${type}`);
    }
};

const AdminPanel = () => {
    const [activeTab, setActiveTab] = useState(DEFAULT_TAB);
    const [sortState, setSortState] = useState({});
    const [listTypeFilter, setListTypeFilter] = useState('all');
    const [hashtagCategoryFilter, setHashtagCategoryFilter] = useState('all');
    // --- State for Search Term ---
    const [searchTerm, setSearchTerm] = useState('');

    const currentSort = useMemo(() => sortState[activeTab] || '', [sortState, activeTab]);

    const {
        data,
        isLoading,
        isError,
        error,
        refetch,
    } = useQuery({
        // Include filters in queryKey IF filtering was server-side
        // queryKey: ['adminData', activeTab, currentSort, listTypeFilter, hashtagCategoryFilter, searchTerm],
        queryKey: ['adminData', activeTab, currentSort], // Keep key simple for client-side filtering
        queryFn: () => fetchAdminData(activeTab, currentSort),
        enabled: !!activeTab && activeTab !== 'analytics',
        staleTime: 60 * 1000,
        refetchOnWindowFocus: true,
        placeholderData: [],
    });

    const handleSortChange = useCallback((type, column, direction) => {
        setSortState(prev => ({ ...prev, [type]: `${column}_${direction}` }));
    }, []);

    const handleDataMutation = useCallback(() => {
        refetch();
    }, [refetch]);

    const handleListTypeFilterChange = useCallback((newFilter) => {
        setListTypeFilter(newFilter);
    }, []);

    const handleHashtagCategoryFilterChange = useCallback((newFilter) => {
        setHashtagCategoryFilter(newFilter);
    }, []);

    // --- Handler for Search Input ---
    const handleSearchChange = useCallback((event) => {
        setSearchTerm(event.target.value);
    }, []);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Admin Panel</h1>

            <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
                <Tabs.List className="flex border-b border-gray-200 mb-6 overflow-x-auto">
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

                 {/* --- Filter & Search Area --- */}
                 {activeTab !== 'analytics' && (
                     <div className="mb-4 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4">
                         {/* Filters */}
                         <div className='flex flex-wrap items-center gap-x-4 gap-y-2'>
                            {activeTab === 'lists' && (
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-medium text-gray-700 flex items-center gap-1"><Filter size={14}/> Type:</span>
                                    {LIST_TYPE_OPTIONS.map(option => (
                                        <Button
                                            key={option}
                                            variant={listTypeFilter === option ? 'primary' : 'tertiary'}
                                            size="sm"
                                            onClick={() => handleListTypeFilterChange(option)}
                                            className="capitalize !px-3 !py-1"
                                            aria-pressed={listTypeFilter === option}
                                        >
                                            {option}
                                        </Button>
                                    ))}
                                </div>
                            )}
                            {activeTab === 'hashtags' && (
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-medium text-gray-700 flex items-center gap-1"><Filter size={14}/> Category:</span>
                                    {HASHTAG_CATEGORY_OPTIONS.map(option => (
                                        <Button
                                            key={option}
                                            variant={hashtagCategoryFilter === option ? 'primary' : 'tertiary'}
                                            size="sm"
                                            onClick={() => handleHashtagCategoryFilterChange(option)}
                                            className="capitalize !px-3 !py-1"
                                            aria-pressed={hashtagCategoryFilter === option}
                                        >
                                            {option}
                                        </Button>
                                    ))}
                                </div>
                            )}
                         </div>

                         {/* Search Input */}
                         <div className="relative sm:w-64">
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
                    <Tabs.Content key={key} value={key} className="focus:outline-none pt-2"> {/* Added pt-2 */}
                        {activeTab === 'analytics' && key === 'analytics' && (
                            <AdminAnalyticsSummary />
                        )}
                        {activeTab !== 'analytics' && activeTab === key && (
                            <>
                                {isLoading && <LoadingSpinner message={`Loading ${TAB_CONFIG[key]?.label}...`} />}

                                {isError && !isLoading && (
                                    <ErrorMessage
                                        message={error?.message || `Failed to load ${TAB_CONFIG[key]?.label}.`}
                                        onRetry={refetch}
                                        isLoadingRetry={isLoading}
                                        containerClassName="mt-4"
                                    />
                                )}

                                {!isLoading && !isError && (
                                    <AdminTable
                                        type={key}
                                        data={data || []}
                                        sort={currentSort}
                                        onSortChange={handleSortChange}
                                        onDataMutated={handleDataMutation}
                                        listTypeFilter={key === 'lists' ? listTypeFilter : undefined}
                                        hashtagCategoryFilter={key === 'hashtags' ? hashtagCategoryFilter : undefined}
                                        // --- Pass search term ---
                                        searchTerm={searchTerm}
                                    />
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