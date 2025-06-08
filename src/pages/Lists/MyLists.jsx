/*
 * Filename: root/src/pages/Lists/MyLists.jsx
 * Description: Enhanced My Lists page displaying user's created and followed lists with search, sorting, and analytics.
 * Styled to match the app's design patterns from Trending page and other components.
 * Uses standardized UI components from the models system for consistency.
 */
import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  PlusCircle, 
  Search, 
  Filter, 
  SortAsc, 
  Calendar, 
  Users, 
  Hash,
  TrendingUp,
  Eye,
  Star,
  Clock,
  Download,
  Share2,
  Edit,
  Trash2,
  X
} from 'lucide-react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { listService } from '@/services/listService';
// Use standardized UI components from the models system
import { ListCard } from '@/components/UI';
import ListCardSkeleton from '@/components/UI/ListCardSkeleton';
import ErrorMessage from '@/components/UI/ErrorMessage';
import Button from '@/components/UI/Button';
import ToggleSwitch from '@/components/UI/ToggleSwitch';
import { GRID_LAYOUTS, CONTAINER, TYPOGRAPHY } from '@/utils/layoutConstants';
import { normalizeCardData, CardTypes } from '@/models/cardModels';

// Sort options configuration
const SORT_OPTIONS = [
  { id: "recent", label: "Recently Updated", Icon: Clock },
  { id: "name", label: "Name A-Z", Icon: SortAsc },
  { id: "created", label: "Date Created", Icon: Calendar },
  { id: "items", label: "Item Count", Icon: Hash },
  { id: "popular", label: "Most Followed", Icon: Users },
];

const MyLists = () => {
  const { user, isAuthenticated } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();

  // State management
  const [view, setView] = useState('created'); // 'created' or 'followed'
  const [sortMethod, setSortMethod] = useState('recent');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [selectedLists, setSelectedLists] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const limit = 12;

  // React Query for current view's data
  const { 
    data: queryResult, 
    isLoading, 
    isError, 
    error, 
    isFetching, 
    refetch 
  } = useQuery({
    queryKey: ['userLists', userId, { view, page, limit, searchTerm, sortMethod }],
    queryFn: () => {
      // For the My Lists page, we need to get user-specific lists
      // The backend should handle authentication properly
      return listService.getUserLists({ 
        view, 
        page, 
        limit, 
        searchTerm,
        sortBy: sortMethod === 'recent' ? 'updated_at' : 
                sortMethod === 'name' ? 'name' :
                sortMethod === 'created' ? 'created_at' :
                sortMethod === 'items' ? 'item_count' :
                sortMethod === 'popular' ? 'follow_count' : 'updated_at',
        sortOrder: sortMethod === 'name' ? 'asc' : 'desc',
        // Add explicit user context - this should make the backend filter by authenticated user
        includePrivate: true, // Include private lists for My Lists page
        createdByUser: view === 'created' ? true : undefined,
        followedByUser: view === 'followed' ? true : undefined
      });
    },
    placeholderData: (previousData) => previousData,
    enabled: !!isAuthenticated && !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Separate queries for counts - these get the total counts regardless of current view
  const { data: createdCountData } = useQuery({
    queryKey: ['userListsCount', userId, 'created'],
    queryFn: () => listService.getUserLists({ 
      view: 'created', 
      page: 1, 
      limit: 1, // Only need count, not actual data
      includePrivate: true,
      createdByUser: true 
    }),
    enabled: !!isAuthenticated && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes - counts don't change as frequently
    select: (data) => data?.pagination?.total || 0
  });

  const { data: followedCountData } = useQuery({
    queryKey: ['userListsCount', userId, 'followed'],
    queryFn: () => listService.getUserLists({ 
      view: 'followed', 
      page: 1, 
      limit: 1, // Only need count, not actual data
      followedByUser: true 
    }),
    enabled: !!isAuthenticated && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes - counts don't change as frequently
    select: (data) => data?.pagination?.total || 0
  });

  // Use the counts from separate queries
  const createdCount = createdCountData || 0;
  const followedCount = followedCountData || 0;

  // Extract data with proper fallbacks
  const lists = useMemo(() => {
    const result = queryResult?.data || [];
    return result;
  }, [queryResult?.data]);
  
  const pagination = queryResult?.pagination;
  const totalPages = pagination?.totalPages || 1;
  const totalCount = pagination?.total || lists.length;

  // Normalize lists with consistent structure
  const normalizedLists = useMemo(() => {
    return lists.map(list => {
      const normalized = {
        ...list,
        // Normalize common fields
        id: list.id,
        name: list.name || 'Untitled List',
        description: list.description || '',
        type: list.type || list.list_type || 'restaurant',
        list_type: list.list_type || list.type || 'restaurant',
        created_at: list.created_at,
        updated_at: list.updated_at,
        // Normalize counts
        item_count: list.item_count || list.items_count || list.items?.length || 0,
        saved_count: list.saved_count || list.follow_count || 0,
        view_count: list.view_count || 0,
        // Normalize user fields
        user_id: list.user_id,
        creator_handle: list.creator_handle || list.owner_username,
        owner_username: list.owner_username || list.creator_handle,
        // Normalize status fields
        is_public: list.is_public !== false,
        tags: Array.isArray(list.tags) ? list.tags : [],
        items: Array.isArray(list.items) ? list.items : [],
      };

      // For My Lists page, trust the backend filtering
      // If a list appears in the response, it should be shown
      const result = {
        ...normalized,
        // Handle created vs followed logic - if it's in the API response for this view, show it
        created_by_user: view === 'created' ? true : list.created_by_user || (list.user_id === userId),
        is_following: view === 'followed' ? true : (list.is_following || false),
        can_follow: list.user_id !== userId && !list.created_by_user,
        // Ensure display fields are present
        items_count: list.item_count || list.items?.length || 0,
        view_count: list.view_count || 0,
        follow_count: list.follow_count || 0,
        comment_count: list.comment_count || 0,
      };
      
      return result;
    });
  }, [lists, userId, view]);

  // For My Lists, trust the backend filtering - don't re-filter on frontend
  const viewFilteredLists = useMemo(() => {
    // Since we're passing view-specific parameters to the API,
    // trust that the backend is returning the correct lists
    return normalizedLists;
  }, [normalizedLists]);

  // Filter and sort lists client-side for immediate feedback
  const filteredAndSortedLists = useMemo(() => {
    let processedLists = [...viewFilteredLists];

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      processedLists = processedLists.filter(list => 
        list.name?.toLowerCase().includes(searchLower) ||
        list.description?.toLowerCase().includes(searchLower) ||
        list.list_type?.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    processedLists.sort((a, b) => {
      switch (sortMethod) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'created':
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        case 'items':
          return (b.item_count || 0) - (a.item_count || 0);
        case 'popular':
          return (b.follow_count || 0) - (a.follow_count || 0);
        case 'recent':
        default:
          return new Date(b.updated_at || 0) - new Date(a.updated_at || 0);
      }
    });

    return processedLists;
  }, [viewFilteredLists, searchTerm, sortMethod]);

  // Event handlers
  const handleViewChange = useCallback((newView) => {
    if (newView !== view) {
      setView(newView);
      setPage(1);
      setSearchTerm('');
      setSelectedLists(new Set());
    }
  }, [view]);

  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
    setPage(1);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
    setPage(1);
  }, []);

  const handleSortChange = useCallback((newSort) => {
    setSortMethod(newSort);
    setPage(1);
  }, []);

  const handlePageChange = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [page, totalPages]);

  const handleListSelect = useCallback((listId) => {
    const newSelected = new Set(selectedLists);
    if (newSelected.has(listId)) {
      newSelected.delete(listId);
    } else {
      newSelected.add(listId);
    }
    setSelectedLists(newSelected);
    setShowBulkActions(newSelected.size > 0);
  }, [selectedLists]);

  const handleSelectAll = useCallback(() => {
    if (selectedLists.size === viewFilteredLists.length) {
      setSelectedLists(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedLists(new Set(viewFilteredLists.map(list => list.id)));
      setShowBulkActions(true);
    }
  }, [selectedLists.size, viewFilteredLists]);

  // Quick Add handler for ListCard component
  const handleQuickAdd = useCallback((listData) => {
    console.log('[MyLists] Quick add triggered for list:', listData);
    // Implement quick add functionality
  }, []);

  // Follow/Unfollow handlers for ListCard component
  const handleFollow = useCallback(async (listId) => {
    console.log('[MyLists] Follow triggered for list:', listId);
    try {
      await listService.followList(listId);
      // Invalidate both current view and count queries
      queryClient.invalidateQueries({ queryKey: ['userLists', userId] });
      queryClient.invalidateQueries({ queryKey: ['userListsCount', userId, 'followed'] });
      // Also invalidate created count in case the user was viewing their own list
      queryClient.invalidateQueries({ queryKey: ['userListsCount', userId, 'created'] });
    } catch (error) {
      console.error('[MyLists] Error following list:', error);
    }
  }, [queryClient, userId]);

  const handleUnfollow = useCallback(async (listId) => {
    console.log('[MyLists] Unfollow triggered for list:', listId);
    try {
      await listService.unfollowList(listId);
      // Invalidate both current view and count queries
      queryClient.invalidateQueries({ queryKey: ['userLists', userId] });
      queryClient.invalidateQueries({ queryKey: ['userListsCount', userId, 'followed'] });
      // Also invalidate created count in case the user was viewing their own list
      queryClient.invalidateQueries({ queryKey: ['userListsCount', userId, 'created'] });
    } catch (error) {
      console.error('[MyLists] Error unfollowing list:', error);
    }
  }, [queryClient, userId]);

  // Loading state
  if (isLoading && !queryResult) {
    return (
      <div className={`${CONTAINER.MAX_WIDTH} mx-auto ${CONTAINER.PADDING} ${CONTAINER.VERTICAL_SPACING}`}>
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded mb-4 animate-pulse"></div>
          <div className="h-12 bg-gray-200 rounded mb-4 animate-pulse"></div>
        </div>
        <div className={GRID_LAYOUTS.FULL_WIDTH}>
          {Array.from({ length: limit }).map((_, index) => (
            <ListCardSkeleton key={`skeleton-${index}`} />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className={`${CONTAINER.MAX_WIDTH} mx-auto ${CONTAINER.PADDING} ${CONTAINER.VERTICAL_SPACING}`}>
        <ErrorMessage 
          message={error?.message || 'Failed to load your lists.'} 
          onRetry={refetch}
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className={`${CONTAINER.MAX_WIDTH} mx-auto ${CONTAINER.PADDING} ${CONTAINER.VERTICAL_SPACING}`}>
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className={`${TYPOGRAPHY.PAGE_TITLE} text-black`}>My Lists</h1>
            <p className="text-gray-600 mt-1">
              Manage your created lists and discover lists you're following
            </p>
          </div>
          
          {/* Quick Stats */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="text-center">
              <div className="font-semibold text-lg text-gray-900">{viewFilteredLists.length}</div>
              <div>{view === 'created' ? 'Created' : 'Following'}</div>
            </div>
          </div>
        </div>

        {/* Controls Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 space-y-4">
          {/* View Toggle and Create Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <ToggleSwitch
              options={[
                { value: 'created', label: `Created Lists (${createdCount})` },
                { value: 'followed', label: `Following Lists (${followedCount})` }
              ]}
              selected={view}
              onChange={handleViewChange}
            />
            
            <div className="flex items-center gap-2">
              {selectedLists.size > 0 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSelectedLists(new Set());
                    setShowBulkActions(false);
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear ({selectedLists.size})
                </Button>
              )}
              
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              
              <Link to="/lists/new">
                <Button size="sm">
                  <PlusCircle className="h-4 w-4 mr-1" />
                  Create List
                </Button>
              </Link>
            </div>
          </div>

          {/* Search and Sort */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={`Search your ${view} lists...`}
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
              />
              {searchTerm && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Sort Options */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-600 whitespace-nowrap">Sort by:</span>
              {SORT_OPTIONS.map(({ id, label, Icon }) => (
                <Button
                  key={id}
                  variant={sortMethod === id ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => handleSortChange(id)}
                  className="flex items-center gap-1"
                >
                  <Icon className="h-3 w-3" />
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* Bulk Actions */}
          {showBulkActions && (
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-md border border-blue-200">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedLists.size === viewFilteredLists.length}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-blue-900">
                  {selectedLists.size} of {viewFilteredLists.length} lists selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-1" />
                  Share
                </Button>
                {view === 'created' && (
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Search Results Info */}
        {searchTerm && (
          <div className="mb-4 text-sm text-gray-600">
            {viewFilteredLists.length} result{viewFilteredLists.length !== 1 ? 's' : ''} 
            {' '}found for "{searchTerm}"
          </div>
        )}

        {/* Lists Grid */}
        {isFetching && !lists.length ? (
          <div className={GRID_LAYOUTS.FULL_WIDTH}>
            {Array.from({ length: limit }).map((_, index) => (
              <ListCardSkeleton key={`loading-${index}`} />
            ))}
          </div>
        ) : viewFilteredLists.length > 0 ? (
          <div className={GRID_LAYOUTS.FULL_WIDTH}>
            {viewFilteredLists.map((list) => (
              <div key={list.id} className="relative">
                {/* Selection Checkbox for Bulk Operations */}
                {showBulkActions && (
                  <div className="absolute top-2 left-2 z-10">
                    <input
                      type="checkbox"
                      checked={selectedLists.has(list.id)}
                      onChange={() => handleListSelect(list.id)}
                      className="rounded border-gray-300"
                    />
                  </div>
                )}
                
                {/* Use the standardized ListCard from UI components */}
                <ListCard 
                  {...list}
                  onQuickAdd={() => handleQuickAdd(list)}
                  onFollow={() => handleFollow(list.id)}
                  onUnfollow={() => handleUnfollow(list.id)}
                  className={showBulkActions ? 'ml-6' : ''}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="mb-4">
              {searchTerm ? (
                <Filter className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              ) : (
                <PlusCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              )}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm 
                ? 'No matching lists found'
                : view === 'created' 
                  ? "You haven't created any lists yet" 
                  : "You aren't following any lists yet"
              }
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm 
                ? 'Try adjusting your search terms or filters'
                : view === 'created' 
                  ? 'Create your first list to get started organizing your favorite places' 
                  : 'Discover and follow lists from other food lovers'
              }
            </p>
            {!searchTerm && (
              <div className="flex justify-center gap-3">
                {view === 'created' ? (
                  <Link to="/lists/new">
                    <Button>
                      <PlusCircle className="h-4 w-4 mr-1" />
                      Create Your First List
                    </Button>
                  </Link>
                ) : (
                  <Link to="/trending">
                    <Button variant="outline">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      Explore Trending Lists
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {pagination && totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8 pt-6 border-t border-gray-200">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1 || isFetching}
            >
              Previous
            </Button>
            
            <div className="flex items-center gap-1">
              {[...Array(Math.min(totalPages, 5))].map((_, index) => {
                const pageNum = index + 1;
                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    disabled={isFetching}
                    className="w-8 h-8 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages || isFetching}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyLists;