// src/pages/Lists/MyLists.jsx
import React from 'react'; // Removed useEffect, useState, useRef, useId
import { useQuery } from '@tanstack/react-query'; // *** IMPORT useQuery ***
import ListCard from '@/pages/Lists/ListCard'; // Use '@' alias
import * as Tabs from '@radix-ui/react-tabs';
import { Loader2, AlertTriangle } from 'lucide-react';
import Button from '@/components/Button';
import { API_BASE_URL } from '@/config'; // Import base URL
import useAuthStore from '@/stores/useAuthStore'; // *** IMPORT useAuthStore ***

// *** Define Fetcher Functions ***
// Helper to fetch lists based on query param
const fetchListsByType = async (fetchType) => {
    let queryParam = '';
    if (fetchType === 'created') {
        queryParam = 'createdByUser=true';
    } else if (fetchType === 'followed') {
        queryParam = 'followedByUser=true';
    } else {
        throw new Error(`Invalid fetch type: ${fetchType}`);
    }

    const url = `${API_BASE_URL}/api/lists?${queryParam}`;
    console.log(`[fetchListsByType] Fetching ${fetchType} lists from ${url}`);

    // *** FIX: Get token and add Authorization header ***
    const token = useAuthStore.getState().token;
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
    };
    // Log headers for debugging (optional, remove Authorization value in production logs)
    const loggedHeaders = { ...headers };
    if (loggedHeaders.Authorization) loggedHeaders.Authorization = 'Bearer [REDACTED]';
    console.log(`[fetchListsByType] Request Headers:`, loggedHeaders);
    // *** END FIX ***

    try {
        // *** FIX: Pass headers to fetch call ***
        const response = await fetch(url, { headers });

        if (!response.ok) {
            let errorMsg = `Failed to fetch ${fetchType} lists (${response.status})`;
            try {
                const errData = await response.json();
                // Prefer specific backend error messages if available
                errorMsg = errData.msg || errData.error || errData.message || errorMsg;
            } catch (e) { /* ignore if response wasn't JSON */ }
            console.error(`[fetchListsByType] API Error Status ${response.status}: ${errorMsg}`);
            throw new Error(errorMsg); // Throw the specific error message
        }
        const data = await response.json();
        if (!Array.isArray(data)) {
            console.error(`[fetchListsByType] Invalid data format received for ${fetchType} lists:`, data);
            throw new Error(`Invalid data format for ${fetchType} lists.`);
        }
        console.log(`[fetchListsByType] Successfully fetched ${data.length} ${fetchType} lists.`);
        // Format data immediately (ensure tags/booleans/counts are correct)
        return data.map(list => ({
            ...list,
            id: list.id,
            // Map backend 'city_name' to frontend 'city' if needed elsewhere, keep both for clarity here
            city: list.city_name,
            city_name: list.city_name,
            is_following: list.is_following ?? false,
            is_public: list.is_public ?? true,
            created_by_user: list.created_by_user ?? false,
            tags: Array.isArray(list.tags) ? list.tags : [],
            // Use item_count directly from backend if available, otherwise default to 0
            item_count: list.item_count || 0,
        })).filter(list => typeof list.id !== 'undefined' && list.id !== null);

    } catch (err) {
        console.error(`[fetchListsByType] Error fetching ${fetchType} lists:`, err);
        // Re-throw the specific error message
        throw new Error(err.message || `Could not load ${fetchType} lists.`);
    }
};

const MyLists = () => {
    // --- Fetch User Created Lists with React Query ---
    const {
        data: userLists = [], // Default to empty array
        isLoading: isLoadingUser,
        isError: isErrorUser,
        error: errorUser,
        refetch: refetchUserLists // Function to refetch
    } = useQuery({
        queryKey: ['userLists', 'created'], // Unique key for created lists
        queryFn: () => fetchListsByType('created'),
        // staleTime: 1000 * 60 * 5, // 5 minutes (optional)
    });

    // --- Fetch Followed Lists with React Query ---
    const {
        data: followedLists = [], // Default to empty array
        isLoading: isLoadingFollowed,
        isError: isErrorFollowed,
        error: errorFollowed,
        refetch: refetchFollowedLists // Function to refetch
    } = useQuery({
        queryKey: ['userLists', 'followed'], // Unique key for followed lists
        queryFn: () => fetchListsByType('followed'),
        // staleTime: 1000 * 60 * 5, // 5 minutes (optional)
    });
    // --- End React Query Fetches ---

    // Render function for list content (uses query states)
    const renderListContent = (lists, isLoading, isError, error, type, refetchAction) => {
        // Loading State
        if (isLoading) {
            return (
                <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin mr-2 text-gray-500"/>
                    <p className="text-gray-500">Loading {type === 'created' ? 'your' : 'followed'} lists...</p>
                </div>
            );
        }

        // Error State
        if (isError) {
            return (
                 <div className="text-center py-10 max-w-lg mx-auto px-4">
                     <AlertTriangle className="h-10 w-10 text-red-400 mx-auto mb-3" />
                     {/* Display the specific error message */}
                     <p className="text-red-600 mb-4">Error loading {type} lists: {error?.message || 'Unknown error'}</p>
                     <Button onClick={() => refetchAction()} variant="primary" size="sm" disabled={isLoading}>Retry</Button>
                 </div>
            );
        }

        // Ensure lists is an array
        if (!Array.isArray(lists)) {
             console.error(`[MyLists renderListContent] Received non-array for ${type} lists:`, lists);
             return <p className="text-gray-500 text-center py-10">Error: Invalid list data format.</p>;
        }

        // Empty State
        if (lists.length === 0) {
            return (
                <p className="text-gray-500 text-center py-10">
                    You haven't {type === 'created' ? 'created any' : 'followed any'} lists yet.
                </p>
            );
        }

        // Success State - Render List Cards
        console.log(`[MyLists] Rendering ${lists.length} ${type} lists.`);
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 place-items-start">
            {lists.map(list => {
                if (!list || typeof list.id === 'undefined') {
                    console.warn(`[MyLists] Skipping render for invalid list object in ${type} lists:`, list);
                    return null;
                }
                return <ListCard key={`${type}-${list.id}`} {...list} />;
            })}
          </div>
        );
    };

    // --- Main Component Render ---
    // (JSX structure remains the same)
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">My Lists</h1>
             <Tabs.Root defaultValue="created" className="mb-6">
                 <Tabs.List className="flex border-b border-gray-200 mb-4">
                     <Tabs.Trigger
                         value="created"
                         className="py-2 px-4 -mb-px text-sm font-medium text-gray-500 hover:text-[#A78B71] focus:outline-none data-[state=active]:border-b-2 data-[state=active]:border-[#A78B71] data-[state=active]:text-[#A78B71]"
                     >
                         Created Lists ({isLoadingUser ? '...' : userLists.length})
                     </Tabs.Trigger>
                     <Tabs.Trigger
                         value="followed"
                         className="py-2 px-4 -mb-px text-sm font-medium text-gray-500 hover:text-[#A78B71] focus:outline-none data-[state=active]:border-b-2 data-[state=active]:border-[#A78B71] data-[state=active]:text-[#A78B71]"
                     >
                         Followed Lists ({isLoadingFollowed ? '...' : followedLists.length})
                     </Tabs.Trigger>
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