// src/pages/Lists/MyLists.jsx
import React, { useState, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { listService } from '@/services/listService';
import useAuthStore from '@/stores/useAuthStore';
import Button from "@/components/Button";
import * as Tabs from '@radix-ui/react-tabs';
import ErrorMessage from '@/components/UI/ErrorMessage';
import ListCard from '@/pages/Lists/ListCard'; // Path verified
import ListCardSkeleton from '@/pages/Lists/ListCardSkeleton'; // Path verified
import { Loader2, ListPlus, Heart } from "lucide-react";
import { Link } from 'react-router-dom';

// Define fetcher function outside component for stable reference
const fetchListsByType = async (fetchType) => {
    console.log(`[Fetcher] Fetching lists with type: ${fetchType} via service`);
    try {
        const params = fetchType === 'created' ? { createdByUser: true } : { followedByUser: true };
        // Ensure the service returns the necessary fields: id, name, description, saved_count, item_count, is_following, is_public, user_id, creator_handle
        const data = await listService.getLists(params);
        console.log(`[Fetcher] Fetched ${data?.length ?? 0} lists for type: ${fetchType}`);
        return Array.isArray(data) ? data : []; // Ensure array return
    } catch (error) {
        console.error(`[Fetcher] Error fetching ${fetchType} lists:`, error);
        throw new Error(error.message || `Failed to load ${fetchType} lists.`);
    }
};

const MyLists = () => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('created');
    // Select auth state separately - KEEP these, needed for renderListContent
    const isAuthenticated = useAuthStore(state => state.isAuthenticated);
    const user = useAuthStore(state => state.user);

    // --- React Query Hooks ---
    const {
        data: userLists = [],
        isLoading: isLoadingUser,
        isError: isErrorUser,
        error: errorUser,
        refetch: refetchUserLists
    } = useQuery({
        queryKey: ['userLists', 'created'], // Query key specific to user's created lists
        queryFn: () => fetchListsByType('created'),
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: true,
        placeholderData: [],
        enabled: isAuthenticated, // Only fetch if authenticated
    });

    const {
        data: followedLists = [],
        isLoading: isLoadingFollowed,
        isError: isErrorFollowed,
        error: errorFollowed,
        refetch: refetchFollowedLists
    } = useQuery({
        queryKey: ['userLists', 'followed'], // Query key specific to user's followed lists
        queryFn: () => fetchListsByType('followed'),
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: true,
        placeholderData: [],
        enabled: isAuthenticated, // Only fetch if authenticated
    });

    const handleTabChange = useCallback((value) => {
        setActiveTab(value);
        // Optionally prefetch other tab data on hover/focus
        // if (value === 'followed') {
        //    queryClient.prefetchQuery({ queryKey: ['userLists', 'followed'], queryFn: () => fetchListsByType('followed') });
        // } else {
        //    queryClient.prefetchQuery({ queryKey: ['userLists', 'created'], queryFn: () => fetchListsByType('created') });
        // }
    }, [queryClient]);

    // Render function callback - passes necessary props to ListCard
    const renderListContent = useCallback((allLists, isLoading, isError, error, type, refetchAction, authStatus, currentUser) => {
        if (!authStatus && (type === 'created' || type === 'followed')) {
             return <p className="text-gray-500 text-center py-10">Please log in to view your lists.</p>;
        }

        if (isLoading) {
            return (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 place-items-start">
                    {[...Array(5)].map((_, index) => <ListCardSkeleton key={`skel-${type}-${index}`} />)}
                </div>
            );
        }

        if (isError) {
             return ( <ErrorMessage message={error?.message || `Error loading ${type} lists.`} onRetry={refetchAction} isLoadingRetry={isLoading} containerClassName="mt-4" /> );
        }

        if (!allLists || allLists.length === 0) {
             const message = type === 'created'
                 ? "You haven't created any lists yet."
                 : "You aren't following any lists yet.";
             return ( <p className="text-gray-500 text-center py-10">{message}</p> );
        }

        return (
            <div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 place-items-start">
                    {allLists.map(list => {
                        // Pass all necessary props to ListCard
                        return (
                            <ListCard
                                key={`list-${type}-${list.id}`}
                                {...list} // Spread operator passes all properties from the list object
                                // is_following and user_id are expected to be on the list object from the API
                            />
                        );
                    })}
                </div>
            </div>
        );
    // Pass user and isAuthenticated as dependencies if they are used inside directly
    }, []);

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">My Lists</h1>
                 <Link to="/lists/new">
                     <Button variant="primary" size="sm" className="flex items-center gap-1.5">
                         <ListPlus size={16} /> Create New List
                     </Button>
                </Link>
            </div>

            <Tabs.Root value={activeTab} onValueChange={handleTabChange} className="mb-6">
                <Tabs.List className="flex border-b border-gray-200 mb-4">
                     <Tabs.Trigger value="created" className={`flex items-center gap-1.5 py-2 px-4 text-sm font-medium rounded-t-md focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:z-10 transition-colors ${activeTab === 'created' ? 'text-[#A78B71] border-b-2 border-[#A78B71]' : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'}`}>
                         <ListPlus size={14} /> Created ({isLoadingUser ? '...' : (userLists?.length ?? 0)})
                    </Tabs.Trigger>
                    <Tabs.Trigger value="followed" className={`flex items-center gap-1.5 py-2 px-4 text-sm font-medium rounded-t-md focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:z-10 transition-colors ${activeTab === 'followed' ? 'text-[#A78B71] border-b-2 border-[#A78B71]' : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'}`}>
                         <Heart size={14} /> Followed ({isLoadingFollowed ? '...' : (followedLists?.length ?? 0)})
                    </Tabs.Trigger>
                </Tabs.List>

                <Tabs.Content value="created" className="focus:outline-none pt-4">
                    {/* Pass auth state into render function */}
                    {renderListContent(userLists, isLoadingUser, isErrorUser, errorUser, 'created', refetchUserLists, isAuthenticated, user)}
                </Tabs.Content>
                <Tabs.Content value="followed" className="focus:outline-none pt-4">
                    {/* Pass auth state into render function */}
                    {renderListContent(followedLists, isLoadingFollowed, isErrorFollowed, errorFollowed, 'followed', refetchFollowedLists, isAuthenticated, user)}
                </Tabs.Content>
            </Tabs.Root>
        </div>
    );
};

export default MyLists;