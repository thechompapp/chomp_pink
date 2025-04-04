// src/pages/Lists/MyLists.jsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import ListCard from '@/pages/Lists/ListCard';
import * as Tabs from '@radix-ui/react-tabs';
import { Loader2, AlertTriangle } from 'lucide-react';
import Button from '@/components/Button';
import { API_BASE_URL } from '@/config';
import useAuthStore from '@/stores/useAuthStore';

// Define Fetcher Functions
const fetchListsByType = async (fetchType) => {
    let queryParam = '';
    if (fetchType === 'created') {
        queryParam = 'createdByUser=true';
    } else if (fetchType === 'followed') {
        queryParam = 'followedByUser=true';
    } else {
        // Added basic validation
        console.error(`[fetchListsByType] Invalid fetch type requested: ${fetchType}`);
        throw new Error(`Invalid fetch type: ${fetchType}`);
    }

    const url = `${API_BASE_URL}/api/lists?${queryParam}`;
    console.log(`[fetchListsByType] Fetching ${fetchType} lists from ${url}`);

    // Get token and prepare headers
    const token = useAuthStore.getState().token;
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
    };
    // Log headers (optional, ensure token is redacted in production)
    const loggedHeaders = { ...headers };
    if (loggedHeaders.Authorization) loggedHeaders.Authorization = 'Bearer [REDACTED]';
    console.log(`[fetchListsByType] Request Headers:`, loggedHeaders);

    try {
        // *** FIX: Add { headers } object to fetch options ***
        const response = await fetch(url, { headers }); // Pass headers here!
        // *** END FIX ***

        if (!response.ok) {
            let errorMsg = `Failed to fetch ${fetchType} lists (${response.status})`;
            try {
                const errData = await response.json();
                errorMsg = errData.msg || errData.error || errData.message || errorMsg;
            } catch (e) { /* ignore if response wasn't JSON */ }
            console.error(`[fetchListsByType] API Error Status ${response.status}: ${errorMsg}`);
            // Provide more context for 401 errors
            if (response.status === 401) {
                 errorMsg = `Authentication failed. Please ensure you are logged in (${response.status}).`;
            }
            throw new Error(errorMsg);
        }
        const data = await response.json();
        if (!Array.isArray(data)) {
            console.error(`[fetchListsByType] Invalid data format received for ${fetchType} lists:`, data);
            throw new Error(`Invalid data format for ${fetchType} lists.`);
        }
        console.log(`[fetchListsByType] Successfully fetched ${data.length} ${fetchType} lists.`);
        // Format data immediately
        return data.map(list => ({
            ...list,
            id: list.id,
            city: list.city_name,
            is_following: list.is_following ?? false,
            is_public: list.is_public ?? true,
            created_by_user: list.created_by_user ?? false,
            tags: Array.isArray(list.tags) ? list.tags : [],
            item_count: list.item_count || 0,
        })).filter(list => typeof list.id !== 'undefined' && list.id !== null);

    } catch (err) {
        console.error(`[fetchListsByType] Catch block error fetching ${fetchType} lists:`, err);
        // Rethrow specific message
        throw new Error(err.message || `Could not load ${fetchType} lists.`);
    }
};

const MyLists = () => {
    // *** ADD Log: Confirm component rendering ***
    console.log("[MyLists Component] Rendering...");
    // --- Fetch User Created Lists with React Query ---
    const {
        data: userLists = [],
        isLoading: isLoadingUser,
        isError: isErrorUser,
        error: errorUser,
        refetch: refetchUserLists
    } = useQuery({
        queryKey: ['userLists', 'created'],
        queryFn: () => fetchListsByType('created'),
        // Keep query enabled even if userLists is initially empty
        // staleTime: 1000 * 60 * 1, // Example: Refetch after 1 min
    });

    // --- Fetch Followed Lists with React Query ---
    const {
        data: followedLists = [],
        isLoading: isLoadingFollowed,
        isError: isErrorFollowed,
        error: errorFollowed,
        refetch: refetchFollowedLists
    } = useQuery({
        queryKey: ['userLists', 'followed'],
        queryFn: () => fetchListsByType('followed'),
         // Keep query enabled even if followedLists is initially empty
        // staleTime: 1000 * 60 * 1, // Example: Refetch after 1 min
    });

    // *** ADD Log: Log query states ***
    console.log("[MyLists Component] Query States:", {
        isLoadingUser, isErrorUser, userListsCount: userLists.length, errorUserMsg: errorUser?.message,
        isLoadingFollowed, isErrorFollowed, followedListsCount: followedLists.length, errorFollowedMsg: errorFollowed?.message
    });

    // Render function for list content
    const renderListContent = (lists, isLoading, isError, error, type, refetchAction) => {
        console.log(`[MyLists renderListContent] Rendering tab: ${type}, isLoading: ${isLoading}, isError: ${isError}, lists count: ${Array.isArray(lists) ? lists.length : 'N/A'}`);
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
                     <p className="text-red-600 mb-4">Error loading {type} lists: {error?.message || 'Unknown error'}</p>
                     <Button onClick={() => refetchAction()} variant="primary" size="sm" disabled={isLoading}>Retry</Button>
                 </div>
            );
        }
        // Invalid Data State
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
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 place-items-start">
            {lists.map(list => {
                if (!list || typeof list.id === 'undefined') {
                    console.warn(`[MyLists] Skipping render for invalid list object in ${type} lists:`, list);
                    return null;
                }
                // Ensure is_following prop is passed correctly
                return <ListCard key={`${type}-${list.id}`} {...list} is_following={list.is_following} />;
            })}
          </div>
        );
    };

    // --- Main Component Render ---
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">My Lists</h1>
             <Tabs.Root defaultValue="created" className="mb-6">
                 <Tabs.List className="flex border-b border-gray-200 mb-4">
                     <Tabs.Trigger
                         value="created"
                         className="py-2 px-4 -mb-px text-sm font-medium text-gray-500 hover:text-[#A78B71] focus:outline-none data-[state=active]:border-b-2 data-[state=active]:border-[#A78B71] data-[state=active]:text-[#A78B71]"
                     >
                         {/* Show count only if not loading and no error */}
                         Created Lists ({isLoadingUser || isErrorUser ? '...' : userLists.length})
                     </Tabs.Trigger>
                     <Tabs.Trigger
                         value="followed"
                         className="py-2 px-4 -mb-px text-sm font-medium text-gray-500 hover:text-[#A78B71] focus:outline-none data-[state=active]:border-b-2 data-[state=active]:border-[#A78B71] data-[state=active]:text-[#A78B71]"
                     >
                         {/* Show count only if not loading and no error */}
                         Followed Lists ({isLoadingFollowed || isErrorFollowed ? '...' : followedLists.length})
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