// src/pages/AdminPanel/index.jsx
// No changes needed here, the import path `./AdminTable` is now correct.
import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as Tabs from '@radix-ui/react-tabs';
import apiClient from '@/services/apiClient'; // Use alias
import AdminTable from './AdminTable'; // This import should now work
import AdminAnalyticsSummary from './AdminAnalyticsSummary'; // Import the new component
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import ErrorMessage from '@/components/UI/ErrorMessage'; // Import ErrorMessage
import { BarChart, Database, FileText, Hash, List, Store, Utensils, User } from 'lucide-react'; // Added User icon

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

// --- Fetcher Function ---
const fetchAdminData = async (type, sort = '') => {
    console.log(`[AdminPanel] Fetching data for type: ${type}, sort: ${sort}`);
    if (type === 'analytics') return null; // Analytics has its own component fetching data
    const endpoint = `/api/admin/${type}${sort ? `?sort=${sort}` : ''}`;
    try {
        const data = await apiClient(endpoint, `Admin Fetch ${type}`);
        console.log(`[AdminPanel] Received ${Array.isArray(data) ? data.length : 'invalid'} items for type: ${type}`);
        return Array.isArray(data) ? data : []; // Ensure array is returned
    } catch (error) {
        console.error(`[AdminPanel] Error fetching ${type}:`, error);
        // Rethrow the error so useQuery can handle it
        throw new Error(error.message || `Failed to load ${type}`);
    }
};

const AdminPanel = () => {
    const [activeTab, setActiveTab] = useState(DEFAULT_TAB);
    const [sortState, setSortState] = useState({}); // { type: 'column_direction' }

    const currentSort = useMemo(() => sortState[activeTab] || '', [sortState, activeTab]);

    const {
        data,
        isLoading,
        isError,
        error, // Keep the error object
        refetch,
    } = useQuery({
        queryKey: ['adminData', activeTab, currentSort],
        queryFn: () => fetchAdminData(activeTab, currentSort),
        enabled: !!activeTab && activeTab !== 'analytics', // Only fetch if tab is active and not analytics
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: true,
        placeholderData: [], // Keep placeholder for non-analytics tabs
    });

    const handleSortChange = useCallback((type, column, direction) => {
        setSortState(prev => ({ ...prev, [type]: `${column}_${direction}` }));
    }, []);

    const handleDataMutation = useCallback(() => {
        // Refetch data for the current tab after a mutation (approve, reject, update, delete)
        refetch();
    }, [refetch]);

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

                {/* Render Content Based on Active Tab */}
                {Object.keys(TAB_CONFIG).map((key) => (
                    <Tabs.Content key={key} value={key} className="focus:outline-none">
                        {activeTab === 'analytics' && key === 'analytics' && (
                            <AdminAnalyticsSummary />
                        )}
                        {activeTab !== 'analytics' && activeTab === key && (
                            <>
                                {isLoading && <LoadingSpinner message={`Loading ${TAB_CONFIG[key]?.label}...`} />}

                                {/* *** ADDED ERROR HANDLING HERE *** */}
                                {isError && !isLoading && (
                                    <ErrorMessage
                                        message={error?.message || `Failed to load ${TAB_CONFIG[key]?.label}.`}
                                        onRetry={refetch}
                                        isLoadingRetry={isLoading} // Use the query's loading state for retry button
                                        containerClassName="mt-4"
                                    />
                                )}
                                {/* *** END ERROR HANDLING *** */}

                                {!isLoading && !isError && (
                                    <AdminTable
                                        type={key}
                                        data={data || []} // Pass data (or empty array)
                                        sort={currentSort}
                                        onSortChange={handleSortChange}
                                        onDataMutated={handleDataMutation} // Pass mutation callback
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