// src/pages/Lists/MyLists.jsx
import React, { useState, useMemo } from 'react'; // Added useState
import { useQuery } from '@tanstack/react-query';
import ListCard from '@/pages/Lists/ListCard';
import * as Tabs from '@radix-ui/react-tabs';
import ErrorMessage from '@/components/UI/ErrorMessage';
import Button from '@/components/Button';
// import { API_BASE_URL } from '@/config'; // Not directly used here
// import useAuthStore from '@/stores/useAuthStore'; // Not directly used here
import apiClient from '@/utils/apiClient';
import ListCardSkeleton from './ListCardSkeleton';
import { Loader2 } from 'lucide-react'; // For Load More button

const ITEMS_PER_PAGE = 9; // Number of items to show per "page"

// Fetcher function remains the same
const fetchListsByType = async (fetchType) => {
    let queryParam = '';
    if (fetchType === 'created') {
        queryParam = 'createdByUser=true';
    } else if (fetchType === 'followed') {
        queryParam = 'followedByUser=true';
    } else {
        throw new Error(`Invalid fetch type: ${fetchType}`);
    }
    const endpoint = `/api/lists?${queryParam}`;
    try {
        const data = await apiClient(endpoint, `Workspace ${fetchType} Lists`) || [];
        if (!Array.isArray(data)) { throw new Error(`Invalid data format for ${fetchType} lists.`); }
        // Format data
        return data.map(list => ({
            ...list,
            city: list.city_name,
            is_following: list.is_following ?? false,
            is_public: list.is_public ?? true,
            created_by_user: list.created_by_user ?? false,
            tags: Array.isArray(list.tags) ? list.tags : [],
            item_count: list.item_count || 0,
            id: list.id
         })).filter(list => typeof list.id !== 'undefined' && list.id !== null);
    } catch (err) {
        console.error(`[fetchListsByType] Catch block error fetching ${fetchType} lists:`, err);
        if (err.message !== 'Session expired or invalid. Please log in again.') {
             throw err;
        }
        return [];
    }
};

const MyLists = () => {
    // State for pagination
    const [visibleCounts, setVisibleCounts] = useState({ created: ITEMS_PER_PAGE, followed: ITEMS_PER_PAGE });

    // Fetch User Created Lists
    const {
        data: userLists = [], isLoading: isLoadingUser, isError: isErrorUser,
        error: errorUser, refetch: refetchUserLists
    } = useQuery({ queryKey: ['userLists', 'created'], queryFn: () => fetchListsByType('created') });

    // Fetch Followed Lists
    const {
        data: followedLists = [], isLoading: isLoadingFollowed, isError: isErrorFollowed,
        error: errorFollowed, refetch: refetchFollowedLists
    } = useQuery({ queryKey: ['userLists', 'followed'], queryFn: () => fetchListsByType('followed') });

    // Memoize the slices of lists to display
    const visibleUserLists = useMemo(() => userLists.slice(0, visibleCounts.created), [userLists, visibleCounts.created]);
    const visibleFollowedLists = useMemo(() => followedLists.slice(0, visibleCounts.followed), [followedLists, visibleCounts.followed]);

    // Handler for Load More button
    const handleLoadMore = (type) => {
        setVisibleCounts(prev => ({
            ...prev,
            [type]: prev[type] + ITEMS_PER_PAGE
        }));
    };

    // Render function for list content
    const renderListContent = (allLists, visibleLists, isLoading, isError, error, type, refetchAction) => {

        if (isLoading) {
            return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 place-items-start">
                    {[...Array(ITEMS_PER_PAGE)].map((_, index) => <ListCardSkeleton key={`skel-${type}-${index}`} />)}
                </div>
            );
        }

        if (isError) {
            const allowRetry = error?.message !== 'Authentication failed. Please log in again.';
            return ( <ErrorMessage message={error?.message || 'Unknown error loading lists.'} onRetry={allowRetry ? refetchAction : undefined} isLoadingRetry={isLoading} /> );
        }

        if (!Array.isArray(allLists)) {
             return <p className="text-gray-500 text-center py-10">Error: Invalid list data format.</p>;
        }
        if (allLists.length === 0) {
            return ( <p className="text-gray-500 text-center py-10"> You haven't {type === 'created' ? 'created any' : 'followed any'} lists yet. </p> );
        }

        const canLoadMore = visibleLists.length < allLists.length;

        return (
          <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 place-items-start">
                {/* Render only the visible subset */}
                {visibleLists.map(list => (
                     <ListCard key={list.id} {...list} />
                ))}
              </div>
              {/* Load More Button */}
              {canLoadMore && (
                  <div className="text-center mt-6">
                      <Button
                          variant="primary"
                          onClick={() => handleLoadMore(type)}
                          disabled={isLoading} // Disable if a fetch is somehow still loading?
                      >
                         Load More
                      </Button>
                  </div>
              )}
          </div>
        );
    };

    // --- Main Component Render ---
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">My Lists</h1>
             <Tabs.Root defaultValue="created" className="mb-6" onValueChange={() => setVisibleCounts({ created: ITEMS_PER_PAGE, followed: ITEMS_PER_PAGE })}> {/* Reset counts on tab change */}
                 <Tabs.List className="flex border-b border-gray-200 mb-4">
                     <Tabs.Trigger value="created" className="py-2 px-4 text-sm font-medium text-gray-500 data-[state=active]:text-[#A78B71] data-[state=active]:border-b-2 data-[state=active]:border-[#A78B71] focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:z-10 transition-colors">
                         Created Lists ({isLoadingUser ? '...' : userLists.length})
                     </Tabs.Trigger>
                     <Tabs.Trigger value="followed" className="py-2 px-4 text-sm font-medium text-gray-500 data-[state=active]:text-[#A78B71] data-[state=active]:border-b-2 data-[state=active]:border-[#A78B71] focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:z-10 transition-colors">
                         Followed Lists ({isLoadingFollowed ? '...' : followedLists.length})
                     </Tabs.Trigger>
                 </Tabs.List>
                 {/* Tab Content Panes */}
                 <Tabs.Content value="created" className="focus:outline-none pt-4">
                    {/* Pass both allLists and visibleLists */}
                    {renderListContent(userLists, visibleUserLists, isLoadingUser, isErrorUser, errorUser, 'created', refetchUserLists)}
                 </Tabs.Content>
                 <Tabs.Content value="followed" className="focus:outline-none pt-4">
                   {/* Pass both allLists and visibleLists */}
                   {renderListContent(followedLists, visibleFollowedLists, isLoadingFollowed, isErrorFollowed, errorFollowed, 'followed', refetchFollowedLists)}
                 </Tabs.Content>
             </Tabs.Root>
        </div>
    );
};

export default MyLists;