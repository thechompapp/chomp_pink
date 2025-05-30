/*
 * Filename: root/src/pages/Lists/MyLists.jsx
 * Description: Component displaying the lists created or followed by the current user.
 * Refactored to use React Query instead of useUserListStore for data fetching.
 */
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/auth/AuthContext'; // To get current user ID // Migrated from useAuthStore
import { listService } from '@/services/listService'; // Using named import for API standardization
import ListCard from './ListCard'; // Use standard ListCard for consistency
import ListCardSkeleton from './ListCardSkeleton';
import ErrorMessage from '@/components/UI/ErrorMessage';
import Button from '@/components/UI/Button';
import { PlusCircle } from 'lucide-react';

const MyLists = () => {
    // Fix: Select each piece of state individually to avoid creating new objects
    // This prevents the infinite loop caused by creating new object references
    const { user: user } = useAuth();
    const { isAuthenticated: isAuthenticated } = useAuth();
    const userId = user?.id;

    const [view, setView] = useState('created'); // 'created' or 'followed'
    const [page, setPage] = useState(1);
    const limit = 12; // Or use a config value

    // --- React Query Data Fetching ---
    const { data: queryResult, isLoading, isError, error, isFetching, isPlaceholderData } = useQuery({
        // Query key includes user ID, view, page, and limit to ensure uniqueness and proper caching/refetching
        queryKey: ['userLists', userId, { view, page, limit }],
        // queryFn calls the service function to fetch data
        queryFn: () => listService.getUserLists({ view, page, limit }),
        // Keep previous data while fetching next page for smoother pagination
        placeholderData: (previousData) => previousData,
        // Only run the query if the user is authenticated and has an ID
        enabled: !!isAuthenticated && !!userId,
        // Optional: Set staleTime and cacheTime if needed
        // staleTime: 5 * 60 * 1000, // 5 minutes
        // cacheTime: 10 * 60 * 1000, // 10 minutes
    });
    // --- End React Query Data Fetching ---

    // Extract lists and pagination info from the query result
    const lists = queryResult?.data || [];
    const pagination = queryResult?.pagination;
    const totalPages = pagination?.totalPages || 1;

    const handleViewChange = (newView) => {
        if (newView !== view) {
            setView(newView);
            setPage(1); // Reset to page 1 when view changes
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
            setPage(newPage);
             // Optional: Scroll to top when page changes
             window.scrollTo(0, 0);
        }
    };

    if (!isAuthenticated) {
         // Or display a login prompt
        return <ErrorMessage message="Please log in to view your lists." />;
    }

    // Initial loading state (before any data is fetched)
    if (isLoading && !queryResult) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: limit }).map((_, index) => (
                    <ListCardSkeleton key={index} />
                ))}
            </div>
        );
    }

     // Error state
     if (isError) {
         // Use the standardized error message from apiClient interceptor
         return <ErrorMessage message={error?.message || 'Failed to load lists.'} />;
     }

    return (
        <div className="space-y-6">
             {/* View Toggles */}
             <div className="flex items-center justify-between mb-4">
                <div className="flex space-x-2 border border-gray-300 dark:border-gray-700 rounded-md p-1">
                    <Button
                        variant={view === 'created' ? 'solid' : 'ghost'}
                        onClick={() => handleViewChange('created')}
                        size="sm"
                    >
                        My Lists
                    </Button>
                    <Button
                        variant={view === 'followed' ? 'solid' : 'ghost'}
                        onClick={() => handleViewChange('followed')}
                        size="sm"
                    >
                        Followed Lists
                    </Button>
                </div>
                 <Button asChild variant="outline" size="sm">
                     <Link to="/lists/new">
                         <PlusCircle className="mr-2 h-4 w-4" /> Create New List
                     </Link>
                 </Button>
             </div>


            {/* Grid for Lists - show skeletons during refetch/placeholder */}
             {(isLoading || isFetching || lists.length > 0) ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(isLoading || (isFetching && isPlaceholderData)) ? ( // Show skeletons on initial load or when fetching new page data with placeholder
                        Array.from({ length: limit }).map((_, index) => <ListCardSkeleton key={`skel-${index}`} />)
                    ) : (
                         lists.map((list) => (
                            // Pass list data and potentially is_following status if available
                            <ListCard key={list.id} list={list} />
                        ))
                    )}
                </div>
             ) : (
                 // No lists found message
                 <div className="text-center py-10">
                     <p className="text-gray-600 dark:text-gray-400">
                         {view === 'created' ? "You haven't created any lists yet." : "You aren't following any lists yet."}
                     </p>
                      {view === 'created' && (
                           <Button asChild variant="link" className="mt-2">
                               <Link to="/lists/new">Create your first list!</Link>
                           </Button>
                      )}
                 </div>
             )}


            {/* Pagination Controls */}
             {pagination && totalPages > 1 && (
                 <div className="flex justify-center items-center space-x-2 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                     <Button
                         onClick={() => handlePageChange(page - 1)}
                         disabled={page <= 1}
                         variant="outline"
                         size="sm"
                     >
                         Previous
                     </Button>
                     <span className="text-sm text-gray-700 dark:text-gray-300">
                         Page {page} of {totalPages}
                     </span>
                     <Button
                         onClick={() => handlePageChange(page + 1)}
                         disabled={page >= totalPages || isPlaceholderData} // Disable next when showing placeholder
                         variant="outline"
                         size="sm"
                     >
                         Next
                     </Button>
                 </div>
             )}
        </div>
    );
};

export default MyLists;