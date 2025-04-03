// src/pages/Lists/MyLists.jsx
// UPDATE: Use specific Zustand stores
import React, { useEffect, useState, useRef, useId } from 'react';
// Import specific stores needed
import useUserListStore from '@/stores/useUserListStore';
// import useUIStateStore from '@/stores/useUIStateStore'; // Potentially for global loading/error, but UserListStore has its own
import ListCard from '@/pages/Lists/ListCard'; // Use '@' alias
import * as Tabs from '@radix-ui/react-tabs';
import { Loader2, AlertTriangle } from 'lucide-react'; // Added AlertTriangle
import Button from '@/components/Button'; // Added Button for retry

const MyLists = () => {
  // Select state and actions from useUserListStore
  const userLists = useUserListStore(state => state.userLists);
  const followedLists = useUserListStore(state => state.followedLists);
  const fetchUserLists = useUserListStore(state => state.fetchUserLists);
  const fetchFollowedLists = useUserListStore(state => state.fetchFollowedLists);
  // Select loading/error states from the store
  const isLoadingUser = useUserListStore(state => state.isLoadingUser);
  const isLoadingFollowed = useUserListStore(state => state.isLoadingFollowed);
  const errorUser = useUserListStore(state => state.errorUser);
  const errorFollowed = useUserListStore(state => state.errorFollowed);

  // Refs to track if fetches have been attempted this mount
  const userFetchAttempted = useRef(false);
  const followedFetchAttempted = useRef(false);
  const instanceId = useId(); // For debugging logs

  useEffect(() => {
    console.log(`[MyLists ${instanceId}] useEffect RUNNING. userAttempted: ${userFetchAttempted.current}, followedAttempted: ${followedFetchAttempted.current}`);
    let isMounted = true;

    // Fetch User Lists only if not attempted and not already loading
    if (!userFetchAttempted.current && !isLoadingUser) {
        userFetchAttempted.current = true; // Mark attempt
        console.log(`[MyLists ${instanceId}] useEffect initiating fetchUserLists.`);
        fetchUserLists()
          .catch(error => {
              console.error(`[MyLists ${instanceId}] fetchUserLists failed:`, error);
              // Error state is set within the store action
              // Allow retry by resetting flag only if component still mounted
              if (isMounted) userFetchAttempted.current = false;
          })
          .finally(() => {
              // Loading state is set within the store action
              console.log(`[MyLists ${instanceId}] fetchUserLists finished.`);
          });
    } else {
         console.log(`[MyLists ${instanceId}] Skipping fetchUserLists (already attempted or loading).`);
    }

    // Fetch Followed Lists only if not attempted and not already loading
    if (!followedFetchAttempted.current && !isLoadingFollowed) {
        followedFetchAttempted.current = true; // Mark attempt
        console.log(`[MyLists ${instanceId}] useEffect initiating fetchFollowedLists.`);
        fetchFollowedLists()
          .catch(error => {
              console.error(`[MyLists ${instanceId}] fetchFollowedLists failed:`, error);
              // Error state is set within the store action
              if (isMounted) followedFetchAttempted.current = false;
          })
          .finally(() => {
              console.log(`[MyLists ${instanceId}] fetchFollowedLists finished.`);
          });
    } else {
        console.log(`[MyLists ${instanceId}] Skipping fetchFollowedLists (already attempted or loading).`);
    }

    return () => {
        console.log(`[MyLists ${instanceId}] useEffect CLEANUP.`);
        isMounted = false;
    };
  // Dependencies: fetch functions trigger the effect if they change (stable refs are fine)
  // isLoading flags prevent re-fetch while loading.
  }, [fetchUserLists, fetchFollowedLists, isLoadingUser, isLoadingFollowed]);


  // Render function for list content
  const renderListContent = (lists, isLoading, error, type, fetchAction) => {
    const fetchAttempted = (type === 'created' && userFetchAttempted.current) || (type === 'followed' && followedFetchAttempted.current);

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
    if (error) {
        return (
             <div className="text-center py-10 max-w-lg mx-auto px-4">
                 <AlertTriangle className="h-10 w-10 text-red-400 mx-auto mb-3" />
                 <p className="text-red-600 mb-4">Error loading {type} lists: {error}</p>
                 <Button onClick={() => {
                     // Reset attempt flag before retrying
                     if (type === 'created') userFetchAttempted.current = false;
                     else followedFetchAttempted.current = false;
                     fetchAction();
                 }} variant="primary" size="sm">Retry</Button>
             </div>
        );
    }

    // Ensure lists is an array before trying to map
    if (!Array.isArray(lists)) {
         // This case might indicate an issue with the store state or fetch response format
         console.error(`[MyLists renderListContent] Received non-array for ${type} lists:`, lists);
         return <p className="text-gray-500 text-center py-10">Error: Invalid list data format.</p>;
    }

    // Empty State (Fetch attempted but returned empty)
    if (lists.length === 0 && fetchAttempted) {
        return (
            <p className="text-gray-500 text-center py-10">
                You haven't {type === 'created' ? 'created any' : 'followed any'} lists yet.
            </p>
        );
    }

    // Fallback/Initial state before fetch completes but not loading/error
    if (lists.length === 0 && !fetchAttempted) {
         return <p className="text-gray-500 text-center py-10">Checking for lists...</p>;
    }

    // Success State - Render List Cards
    console.log(`[MyLists ${instanceId}] Rendering ${lists.length} ${type} lists.`);
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 place-items-start">
        {lists.map(list => {
            // Basic validation for list object and id before rendering card
            if (!list || typeof list.id === 'undefined') {
                console.warn(`[MyLists ${instanceId}] Skipping render for invalid list object in ${type} lists:`, list);
                return null;
            }
            return (
                <ListCard
                    key={`${type}-${list.id}`} // Add type prefix for potential key collisions if list appears in both tabs
                    {...list}
                    // Explicitly set is_following based on the tab type for clarity
                    // The ListCard itself might also check the store state for latest follow status
                    is_following={type === 'followed'}
                />
            );
        })}
      </div>
    );
  };

  // --- Main Component Render ---
  return (
    // Removed min-h-screen bg-gray-50 to allow parent layout control
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8"> {/* Reduced py-12 to py-8 */}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">My Lists</h1> {/* Reduced mb-8 to mb-6 */}
         <Tabs.Root defaultValue="created" className="mb-6"> {/* Reduced mb-8 to mb-6 */}
             <Tabs.List className="flex border-b border-gray-200 mb-4"> {/* Reduced mb-6 to mb-4 */}
                 <Tabs.Trigger
                     value="created"
                     className="py-2 px-4 -mb-px text-sm font-medium text-gray-500 hover:text-[#A78B71] focus:outline-none data-[state=active]:border-b-2 data-[state=active]:border-[#A78B71] data-[state=active]:text-[#A78B71]"
                 >
                     Created Lists ({Array.isArray(userLists) ? userLists.length : 0})
                 </Tabs.Trigger>
                 <Tabs.Trigger
                     value="followed"
                     className="py-2 px-4 -mb-px text-sm font-medium text-gray-500 hover:text-[#A78B71] focus:outline-none data-[state=active]:border-b-2 data-[state=active]:border-[#A78B71] data-[state=active]:text-[#A78B71]"
                 >
                     Followed Lists ({Array.isArray(followedLists) ? followedLists.length : 0})
                 </Tabs.Trigger>
             </Tabs.List>
             {/* Tab Content Panes */}
             <Tabs.Content value="created" className="focus:outline-none pt-4">
                {renderListContent(userLists, isLoadingUser, errorUser, 'created', fetchUserLists)}
             </Tabs.Content>
             <Tabs.Content value="followed" className="focus:outline-none pt-4">
               {renderListContent(followedLists, isLoadingFollowed, errorFollowed, 'followed', fetchFollowedLists)}
             </Tabs.Content>
         </Tabs.Root>
    </div>
  );
};

export default MyLists;