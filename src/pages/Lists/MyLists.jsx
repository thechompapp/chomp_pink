// src/pages/Lists/MyLists.jsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import ListCard from '@/pages/Lists/ListCard';
import * as Tabs from '@radix-ui/react-tabs';
// Import the new common components
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import ErrorMessage from '@/components/UI/ErrorMessage';
// Keep other imports
import Button from '@/components/Button'; // Button might be used by ErrorMessage implicitly or explicitly if needed
import { API_BASE_URL } from '@/config';
import useAuthStore from '@/stores/useAuthStore';

// Define Fetcher Functions (Keep existing fetchListsByType)
const fetchListsByType = async (fetchType) => {
    let queryParam = '';
    if (fetchType === 'created') {
        queryParam = 'createdByUser=true';
    } else if (fetchType === 'followed') {
        queryParam = 'followedByUser=true';
    } else {
        console.error(`[fetchListsByType] Invalid fetch type requested: ${fetchType}`);
        throw new Error(`Invalid fetch type: ${fetchType}`);
    }
    const url = `${API_BASE_URL}/api/lists?${queryParam}`;
    console.log(`[fetchListsByType] Fetching ${fetchType} lists from ${url}`);
    const token = useAuthStore.getState().token;
    // apiClient utility could be used here eventually, but keep direct fetch for now
    const headers = { /* ... headers ... */ };
    if (token) headers.Authorization = `Bearer ${token}`;
    try {
        const response = await fetch(url, { headers });
        if (!response.ok) {
             // Handle 401 explicitly if needed, otherwise throw generic
             if (response.status === 401) {
                useAuthStore.getState().logout(); // Logout on 401
                throw new Error('Authentication failed. Please log in again.');
             }
             let errorMsg = `Failed to fetch ${fetchType} lists (${response.status})`;
             try { const errData = await response.json(); errorMsg = errData.msg || errData.error || errData.message || errorMsg; } catch (e) { /* ignore */ }
             throw new Error(errorMsg);
        }
        const data = await response.json();
        if (!Array.isArray(data)) { throw new Error(`Invalid data format for ${fetchType} lists.`); }
        // Format data (Keep existing formatting)
        return data.map(list => ({ /* ...list mapping... */ })).filter(list => typeof list.id !== 'undefined' && list.id !== null);
    } catch (err) {
        console.error(`[fetchListsByType] Catch block error fetching ${fetchType} lists:`, err);
        throw err; // Re-throw the original error
    }
};

const MyLists = () => {
    console.log("[MyLists Component] Rendering...");
    // --- Fetch User Created Lists ---
    const {
        data: userLists = [], isLoading: isLoadingUser, isError: isErrorUser,
        error: errorUser, refetch: refetchUserLists
    } = useQuery({ queryKey: ['userLists', 'created'], queryFn: () => fetchListsByType('created') });

    // --- Fetch Followed Lists ---
    const {
        data: followedLists = [], isLoading: isLoadingFollowed, isError: isErrorFollowed,
        error: errorFollowed, refetch: refetchFollowedLists
    } = useQuery({ queryKey: ['userLists', 'followed'], queryFn: () => fetchListsByType('followed') });

    // Render function for list content (Updated)
    const renderListContent = (lists, isLoading, isError, error, type, refetchAction) => {
        console.log(`[MyLists renderListContent] Rendering tab: ${type}, isLoading: ${isLoading}, isError: ${isError}, lists count: ${Array.isArray(lists) ? lists.length : 'N/A'}`);

        // --- Use LoadingSpinner ---
        if (isLoading) {
            return <LoadingSpinner message={`Loading ${type === 'created' ? 'your' : 'followed'} lists...`} />;
        }

        // --- Use ErrorMessage ---
        if (isError) {
            // Don't show retry for auth errors as user is logged out
            const allowRetry = error?.message !== 'Authentication failed. Please log in again.';
            return (
                 <ErrorMessage
                    message={error?.message || 'Unknown error loading lists.'}
                    onRetry={allowRetry ? refetchAction : undefined} // Pass refetch only if retry allowed
                    isLoadingRetry={isLoading} // Pass loading state to disable retry button while loading
                 />
            );
        }

        // Invalid Data State (Keep existing check)
        if (!Array.isArray(lists)) {
             console.error(`[MyLists renderListContent] Received non-array for ${type} lists:`, lists);
             return <p className="text-gray-500 text-center py-10">Error: Invalid list data format.</p>;
        }
        // Empty State (Keep existing check)
        if (lists.length === 0) {
            return ( <p className="text-gray-500 text-center py-10"> You haven't {type === 'created' ? 'created any' : 'followed any'} lists yet. </p> );
        }
        // Success State - Render List Cards (Keep existing logic)
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 place-items-start">
            {lists.map(list => { /* ... list mapping ... */ })}
          </div>
        );
    };

    // --- Main Component Render (Keep existing structure) ---
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">My Lists</h1>
             <Tabs.Root defaultValue="created" className="mb-6">
                 <Tabs.List className="flex border-b border-gray-200 mb-4">
                     <Tabs.Trigger value="created" className="..."> Created Lists ({/* ...count logic... */}) </Tabs.Trigger>
                     <Tabs.Trigger value="followed" className="..."> Followed Lists ({/* ...count logic... */}) </Tabs.Trigger>
                 </Tabs.List>
                 {/* Tab Content Panes */}
                 <Tabs.Content value="created" className="focus:outline-none pt-4">
                    {renderListContent(userLists, isLoadingUser, isErrorUser, errorUser, 'created', refetchUserLists)}
                 </Tabs.Content>
                 <Tabs.Content value="followed" className="focus:outline-none pt-4">
                   {renderListContent(followedLists, isLoadingFollowed, isErrorFollowed, errorFollowed, 'followed', refetchFollowedLists)}
                 </Tabs.Content>
             </Tabs.Root>
        </div>
    );
};

export default MyLists;