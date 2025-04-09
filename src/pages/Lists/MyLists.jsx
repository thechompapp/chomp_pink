/* src/pages/Lists/MyLists.jsx */
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { listService } from '@/services/listService';
import useAuthStore from '@/stores/useAuthStore';
import Button from "@/components/Button";
import * as Tabs from '@radix-ui/react-tabs';
import ListCard from '@/pages/Lists/ListCard';
import ListCardSkeleton from '@/pages/Lists/ListCardSkeleton';
import QueryResultDisplay from '@/components/QueryResultDisplay';
import { ListPlus, Heart } from "lucide-react";
import { Link, useNavigate } from 'react-router-dom';

const MyLists = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('created');
    const isAuthenticated = useAuthStore(state => state.isAuthenticated);

    // Common options including initialData
    const commonQueryOptions = useMemo(() => ({
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: true,
        enabled: isAuthenticated,
        // Provide initialData as an empty array to prevent undefined state
        initialData: [],
        placeholderData: [], // Keep placeholder as well if desired
    }), [isAuthenticated]);

    const userListsQuery = useQuery({
        queryKey: ['userLists', 'created'],
        queryFn: async () => {
            try {
                const lists = await listService.getLists({ createdByUser: true });
                return Array.isArray(lists) ? lists : [];
            } catch (error) {
                console.error("Error fetching created lists:", error);
                return []; // Return empty array on error
            }
        },
        ...commonQueryOptions // Spread common options including initialData
    });

    const followedListsQuery = useQuery({
        queryKey: ['userLists', 'followed'],
        queryFn: async () => {
            try {
                const lists = await listService.getLists({ followedByUser: true });
                 return Array.isArray(lists) ? lists : [];
            } catch (error) {
                console.error("Error fetching followed lists:", error);
                return []; // Return empty array on error
            }
        },
        ...commonQueryOptions // Spread common options including initialData
    });

    // Pre-fetching logic
    useEffect(() => {
        const prefetchOtherTab = async (otherQueryKey, otherQueryFn) => {
             await queryClient.prefetchQuery({
                queryKey: otherQueryKey,
                queryFn: async () => {
                    try { return await otherQueryFn() || []; } catch { return []; }
                },
                staleTime: 1000 * 60,
             });
        };

        if (activeTab === 'created' && userListsQuery.isSuccess && userListsQuery.data) {
             prefetchOtherTab(
                ['userLists', 'followed'],
                () => listService.getLists({ followedByUser: true })
             );
        } else if (activeTab === 'followed' && followedListsQuery.isSuccess && followedListsQuery.data) {
             prefetchOtherTab(
                ['userLists', 'created'],
                () => listService.getLists({ createdByUser: true })
             );
        }
    // Intentionally excluding query data from dependencies to avoid excessive prefetching
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [queryClient, userListsQuery.isSuccess, followedListsQuery.isSuccess, activeTab]);


    const handleTabChange = useCallback((value) => { setActiveTab(value); }, []);

    const renderListGrid = useCallback((lists) => (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 place-items-start">
            {/* Ensure lists is an array before mapping */}
            {Array.isArray(lists) && lists.map(list => (
                list ? <ListCard key={`list-<span class="math-inline">\{activeTab\}\-</span>{list.id}`} {...list} /> : null
            ))}
        </div>
    ), [activeTab]);

    const LoadingComponent = useMemo(() => (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 place-items-start">
            {[...Array(5)].map((_, index) => <ListCardSkeleton key={`skel-<span class="math-inline">\{activeTab\}\-</span>{index}`} />)}
        </div>
    ), [activeTab]);


    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">My Lists</h1>
                {isAuthenticated && (
                     <Link to="/lists/new">
                         <Button variant="primary" size="sm" className="flex items-center gap-1.5">
                             <ListPlus size={16} /> Create New List
                         </Button>
                     </Link>
                )}
            </div>

            {!isAuthenticated ? (
                 <p className="text-gray-500 text-center py-10 border border-dashed rounded-lg bg-gray-50">
                    Please{' '}
                    <Link to="/login" className="text-[#A78B71] hover:underline font-medium">log in</Link>
                    {' '}to view or create lists.
                 </p>
            ) : (
                 <Tabs.Root value={activeTab} onValueChange={handleTabChange} className="mb-6">
                    <Tabs.List className="flex border-b border-gray-200 mb-4">
                        <Tabs.Trigger
                            value="created"
                            className={`flex items-center gap-1.5 py-2 px-4 text-sm font-medium rounded-t-md focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:z-10 transition-colors ${activeTab === 'created' ? 'text-[#A78B71] border-b-2 border-[#A78B71]' : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'}`}
                        >
                            <ListPlus size={14} /> Created ({userListsQuery.isSuccess ? (userListsQuery.data?.length ?? 0) : '...'})
                        </Tabs.Trigger>
                        <Tabs.Trigger
                            value="followed"
                             className={`flex items-center gap-1.5 py-2 px-4 text-sm font-medium rounded-t-md focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:z-10 transition-colors ${activeTab === 'followed' ? 'text-[#A78B71] border-b-2 border-[#A78B71]' : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'}`}
                         >
                            <Heart size={14} /> Followed ({followedListsQuery.isSuccess ? (followedListsQuery.data?.length ?? 0) : '...'})
                        </Tabs.Trigger>
                    </Tabs.List>

                    <Tabs.Content value="created" className="focus:outline-none pt-4 min-h-[200px]">
                        <QueryResultDisplay
                            queryResult={userListsQuery}
                            loadingMessage="Loading your lists..."
                            errorMessagePrefix="Error loading created lists"
                            noDataMessage="You haven't created any lists yet."
                            LoadingComponent={LoadingComponent}
                            isDataEmpty={(data) => !data || data.length === 0}
                        >
                            {renderListGrid}
                        </QueryResultDisplay>
                    </Tabs.Content>
                    <Tabs.Content value="followed" className="focus:outline-none pt-4 min-h-[200px]">
                        <QueryResultDisplay
                            queryResult={followedListsQuery}
                            loadingMessage="Loading followed lists..."
                            errorMessagePrefix="Error loading followed lists"
                            noDataMessage="You aren't following any lists yet."
                             LoadingComponent={LoadingComponent}
                             isDataEmpty={(data) => !data || data.length === 0}
                         >
                             {renderListGrid}
                        </QueryResultDisplay>
                    </Tabs.Content>
                 </Tabs.Root>
            )}
        </div>
    );
};

export default MyLists;