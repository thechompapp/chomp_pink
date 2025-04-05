// src/pages/Lists/MyLists.jsx
import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import ListCard from '@/pages/Lists/ListCard'; // Path was correct
import * as Tabs from '@radix-ui/react-tabs';
import ErrorMessage from '@/components/UI/ErrorMessage';
import Button from '@/components/Button';
import apiClient from '@/utils/apiClient';
import ListCardSkeleton from '@/pages/Lists/ListCardSkeleton'; // <<< CORRECTED PATH
import { Loader2 } from 'lucide-react';

const ITEMS_PER_PAGE = 9;

// Fetcher function (remains the same)
const fetchListsByType = async (fetchType) => { /* ... */ };

const MyLists = () => {
    // Hooks, state, callbacks (remain the same)
    const [visibleCounts, setVisibleCounts] = useState({ created: ITEMS_PER_PAGE, followed: ITEMS_PER_PAGE });
    const [activeTab, setActiveTab] = useState('created');
    const { data: userLists = [], isLoading: isLoadingUser, isError: isErrorUser, error: errorUser, refetch: refetchUserLists } = useQuery({ queryKey: ['userLists', 'created'], queryFn: () => fetchListsByType('created'), staleTime: 5 * 60 * 1000 });
    const { data: followedLists = [], isLoading: isLoadingFollowed, isError: isErrorFollowed, error: errorFollowed, refetch: refetchFollowedLists } = useQuery({ queryKey: ['userLists', 'followed'], queryFn: () => fetchListsByType('followed'), staleTime: 5 * 60 * 1000 });
    const visibleUserLists = useMemo(() => userLists.slice(0, visibleCounts.created), [userLists, visibleCounts.created]);
    const visibleFollowedLists = useMemo(() => followedLists.slice(0, visibleCounts.followed), [followedLists, visibleCounts.followed]);
    const handleLoadMore = useCallback((type) => { /* ... */ }, []);
    const handleTabChange = useCallback((value) => { /* ... */ }, []);

    // Ensure renderListContent uses the corrected ListCardSkeleton import
    const renderListContent = useCallback((allLists, visibleLists, isLoading, isError, error, type, refetchAction) => {
        if (isLoading) {
            return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 place-items-start">
                    {/* Ensure ListCardSkeleton (correctly imported) is used */}
                    {[...Array(ITEMS_PER_PAGE)].map((_, index) => <ListCardSkeleton key={`skel-${type}-${index}`} />)}
                </div>
            );
        }
        // ... rest of renderListContent remains the same ...
         if (isError) { const allowRetry = error?.message !== 'Session expired or invalid. Please log in again.'; return ( <ErrorMessage message={error?.message || `Error loading ${type} lists.`} onRetry={allowRetry ? refetchAction : undefined} isLoadingRetry={isLoading} /> ); }
         if (!allLists || allLists.length === 0) { return ( <p className="text-gray-500 text-center py-10"> You haven't {type === 'created' ? 'created any' : 'followed any'} lists yet. </p> ); }
         if (!Array.isArray(allLists)) { console.error(`[MyLists renderListContent] Invalid data format for ${type} lists:`, allLists); return <ErrorMessage message={`Error: Invalid list data format for ${type} lists.`} />; }
         const canLoadMore = visibleLists.length < allLists.length;
         return ( <div> <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 place-items-start"> {visibleLists.map(list => ( <ListCard key={`list-${type}-${list.id}`} {...list} /> ))} </div> {canLoadMore && ( <div className="text-center mt-6"> <Button variant="primary" onClick={() => handleLoadMore(type)} disabled={ (type === 'created' && isLoadingUser) || (type === 'followed' && isLoadingFollowed) } > {(type === 'created' && isLoadingUser) || (type === 'followed' && isLoadingFollowed) ? <Loader2 className="animate-spin h-5 w-5" /> : 'Load More' } </Button> </div> )} </div> );
    }, [handleLoadMore, isLoadingUser, isLoadingFollowed]);

    // Main render (remains the same)
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8">
            {/* ... Title, Tabs.Root, Tabs.List ... */}
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">My Lists</h1>
             <Tabs.Root value={activeTab} onValueChange={handleTabChange} className="mb-6">
                 <Tabs.List className="flex border-b border-gray-200 mb-4">
                      <Tabs.Trigger value="created" className="py-2 px-4 text-sm font-medium text-gray-500 data-[state=active]:text-[#A78B71] data-[state=active]:border-b-2 data-[state=active]:border-[#A78B71] focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:z-10 transition-colors"> Created Lists ({isLoadingUser ? '...' : userLists.length}) </Tabs.Trigger>
                      <Tabs.Trigger value="followed" className="py-2 px-4 text-sm font-medium text-gray-500 data-[state=active]:text-[#A78B71] data-[state=active]:border-b-2 data-[state=active]:border-[#A78B71] focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:z-10 transition-colors"> Followed Lists ({isLoadingFollowed ? '...' : followedLists.length}) </Tabs.Trigger>
                 </Tabs.List>
                 <Tabs.Content value="created" className="focus:outline-none pt-4">
                    {renderListContent(userLists, visibleUserLists, isLoadingUser, isErrorUser, errorUser, 'created', refetchUserLists)}
                 </Tabs.Content>
                 <Tabs.Content value="followed" className="focus:outline-none pt-4">
                   {renderListContent(followedLists, visibleFollowedLists, isLoadingFollowed, isErrorFollowed, errorFollowed, 'followed', refetchFollowedLists)}
                 </Tabs.Content>
             </Tabs.Root>
        </div>
    );
};

export default MyLists;