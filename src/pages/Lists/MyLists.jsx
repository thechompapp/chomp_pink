/*
 * Filename: root/src/pages/Lists/MyLists.jsx
 * Description: Enhanced My Lists page displaying user's created and followed lists with search, sorting, and analytics.
 * Styled to match the app's design patterns from Trending page and other components.
 * Uses standardized UI components from the models system for consistency.
 */
import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
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

  // State management
  const [view, setView] = useState('created'); // 'created' or 'followed'
  const [sortMethod, setSortMethod] = useState('recent');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [selectedLists, setSelectedLists] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const limit = 12;

  // React Query for data fetching
  const { 
    data: queryResult, 
    isLoading, 
    isError, 
    error, 
    isFetching, 
    refetch 
  } = useQuery({
    queryKey: ['userLists', userId, { view, page, limit, searchTerm, sortMethod }],
    queryFn: () => listService.getUserLists({ 
      view, 
      page, 
      limit, 
      searchTerm,
      sortBy: sortMethod === 'recent' ? 'updated_at' : 
              sortMethod === 'name' ? 'name' :
              sortMethod === 'created' ? 'created_at' :
              sortMethod === 'items' ? 'item_count' :
              sortMethod === 'popular' ? 'follow_count' : 'updated_at',
      sortOrder: sortMethod === 'name' ? 'asc' : 'desc'
    }),
    placeholderData: (previousData) => previousData,
    enabled: !!isAuthenticated && !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Extract data with proper fallbacks
  const lists = useMemo(() => queryResult?.data || [], [queryResult?.data]);
  const pagination = queryResult?.pagination;
  const totalPages = pagination?.totalPages || 1;
  const totalCount = pagination?.total || lists.length;

  // Normalize list data to match UI component expectations
  const normalizedLists = useMemo(() => {
    return lists.map(list => {
      // Use the standardized card data normalizer
      const normalized = normalizeCardData[CardTypes.LIST]?.(list) || list;
      
      // Ensure required fields are present for UI consistency
      return {
        ...normalized,
        // Handle created vs followed logic
        created_by_user: list.user_id === userId || list.created_by_user === true,
        is_following: list.is_following || false,
        can_follow: list.user_id !== userId && !list.created_by_user,
        // Ensure display fields are present
        items_count: list.items_count || list.items?.length || 0,
        view_count: list.view_count || 0,
        follow_count: list.follow_count || 0,
        comment_count: list.comment_count || 0,
      };
    });
  }, [lists, userId]);

  // Filter lists by view (created vs followed)
  const viewFilteredLists = useMemo(() => {
    return normalizedLists.filter(list => {
      if (view === 'created') {
        return list.created_by_user || list.user_id === userId;
      } else {
        return list.is_following && !list.created_by_user && list.user_id !== userId;
      }
    });
  }, [normalizedLists, view, userId]);

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
          return (b.items_count || 0) - (a.items_count || 0);
        case 'popular':
          return (b.follow_count || 0) - (a.follow_count || 0);
        case 'recent':
        default:
          return new Date(b.updated_at || 0) - new Date(a.updated_at || 0);
      }
    });

    return processedLists;
  }, [viewFilteredLists, searchTerm, sortMethod]);

  // Calculate counts for toggle labels
  const createdCount = useMemo(() => 
    normalizedLists.filter(l => l.created_by_user || l.user_id === userId).length,
    [normalizedLists, userId]
  );
  
  const followedCount = useMemo(() => 
    normalizedLists.filter(l => l.is_following && !l.created_by_user && l.user_id !== userId).length,
    [normalizedLists, userId]
  );

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
    if (selectedLists.size === filteredAndSortedLists.length) {
      setSelectedLists(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedLists(new Set(filteredAndSortedLists.map(list => list.id)));
      setShowBulkActions(true);
    }
  }, [selectedLists.size, filteredAndSortedLists]);

  // Quick Add handler for ListCard component
  const handleQuickAdd = useCallback((listData) => {
    console.log('[MyLists] Quick add triggered for list:', listData);
    // Implement quick add functionality
  }, []);

  // Follow/Unfollow handlers for ListCard component
  const handleFollow = useCallback((listId) => {
    console.log('[MyLists] Follow triggered for list:', listId);
    // Implement follow functionality
  }, []);

  const handleUnfollow = useCallback((listId) => {
    console.log('[MyLists] Unfollow triggered for list:', listId);
    // Implement unfollow functionality
  }, []);

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
    <div className={`${CONTAINER.MAX_WIDTH} mx-auto ${CONTAINER.PADDING} ${CONTAINER.VERTICAL_SPACING}`}>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className={TYPOGRAPHY.PAGE_TITLE}>My Lists</h1>
          <p className="text-gray-600 mt-1">
            Manage your created lists and discover lists you're following
          </p>
        </div>
        
        {/* Quick Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="text-center">
            <div className="font-semibold text-lg text-gray-900">{filteredAndSortedLists.length}</div>
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
            
            <Button asChild size="sm">
              <Link to="/lists/new">
                <PlusCircle className="h-4 w-4 mr-1" />
                Create List
              </Link>
            </Button>
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
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                checked={selectedLists.size === filteredAndSortedLists.length}
                onChange={handleSelectAll}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-blue-900">
                {selectedLists.size} of {filteredAndSortedLists.length} lists selected
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
          {filteredAndSortedLists.length} result{filteredAndSortedLists.length !== 1 ? 's' : ''} 
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
      ) : filteredAndSortedLists.length > 0 ? (
        <div className={GRID_LAYOUTS.FULL_WIDTH}>
          {filteredAndSortedLists.map((list) => (
            <div key={list.id} className="relative">
              {/* Selection Checkbox for Bulk Operations */}
              {showBulkActions && (
                <div className="absolute top-2 left-2 z-10">
                  <input
                    type="checkbox"
                    checked={selectedLists.has(list.id)}
                    onChange={() => handleListSelect(list.id)}
                    className="rounded border-gray-300 bg-white shadow-md"
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
                <Button asChild>
                  <Link to="/lists/new">
                    <PlusCircle className="h-4 w-4 mr-1" />
                    Create Your First List
                  </Link>
                </Button>
              ) : (
                <Button asChild variant="outline">
                  <Link to="/trending">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    Explore Trending Lists
                  </Link>
                </Button>
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
  );
};

export default MyLists;