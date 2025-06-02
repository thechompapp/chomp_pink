// src/components/AddToList/ListSelector.jsx
import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';
import { listService } from '@/services/listService';
import { logDebug } from '@/utils/logger';
import Input from '@/components/UI/Input';
import Label from '@/components/UI/Label';
import Button from '@/components/UI/Button';

// Query key constants
const QUERY_KEYS = {
  USER_LISTS: 'userLists'
};

/**
 * ListSelector Component
 * 
 * Handles list selection and searching functionality for the AddToListModal
 */
const ListSelector = ({
  userId,
  searchTerm,
  onSearchChange,
  selectedListId,
  onListSelect,
  onCreateNewClick,
  isAuthenticated
}) => {
  const queryClient = useQueryClient();

  // Fetch user lists with React Query
  const { 
    data: userListsData, 
    isLoading: isLoadingUserLists,
    isError: isUserListsError
  } = useQuery({
    queryKey: [QUERY_KEYS.USER_LISTS, userId],
    queryFn: () => listService.getUserLists(userId), 
    enabled: isAuthenticated && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    select: (data) => data?.data || [],
    retry: 2
  });

  // Derived state with memoization for performance
  const userLists = useMemo(() => userListsData || [], [userListsData]);

  // Filter lists based on search term
  const filteredLists = useMemo(() => {
    if (!searchTerm) return userLists;
    const searchTermLower = searchTerm.toLowerCase();
    return userLists.filter((list) =>
      list.name.toLowerCase().includes(searchTermLower)
    );
  }, [userLists, searchTerm]);

  return (
    <div className="list-selector">
      {/* List search */}
      <div className="mb-4">
        <Label htmlFor="list-search">Search your lists or create new</Label>
        <Input
          id="list-search"
          type="text"
          placeholder="Type to search lists..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full"
          aria-label="Search your lists"
        />
      </div>

      {/* Loading state */}
      {isLoadingUserLists && (
        <div className="text-sm text-gray-500 py-4 text-center" role="status" aria-live="polite">
          <div className="animate-pulse flex justify-center items-center space-x-2">
            <div className="h-2 w-2 bg-primary-500 rounded-full"></div>
            <div className="h-2 w-2 bg-primary-500 rounded-full"></div>
            <div className="h-2 w-2 bg-primary-500 rounded-full"></div>
          </div>
          <p className="mt-2">Loading your lists...</p>
        </div>
      )}

      {/* Error state */}
      {isUserListsError && (
        <div className="text-sm text-red-500 py-4 text-center">
          <p>Failed to load your lists. Please try again.</p>
          <Button 
            onClick={() => queryClient.refetchQueries([QUERY_KEYS.USER_LISTS, userId])} 
            variant="outline" 
            size="sm" 
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      )}

      {/* List selection */}
      {!isLoadingUserLists && (
        <div 
          className="max-h-64 overflow-y-auto mb-6 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm" 
          role="listbox"
          aria-label="Your lists"
        >
          {filteredLists.length > 0 ? (
            filteredLists.map((list) => (
              <div
                key={list.id}
                onClick={() => onListSelect(list.id)}
                onKeyDown={(e) => e.key === 'Enter' && onListSelect(list.id)}
                role="option"
                aria-selected={selectedListId === list.id}
                tabIndex={0}
                className={`p-4 cursor-pointer transition-all duration-200 ${
                  selectedListId === list.id 
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-400' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 last:border-b-0'
                }`}
              >
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{list.name}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {list.item_count ?? 0} items · {list.is_public ? 'Public' : 'Private'}
                </p>
              </div>
            ))
          ) : (
            <div className="p-6 text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-2">
                {searchTerm ? 'No matching lists found.' : 'No lists found.'}
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                {searchTerm ? 'Try a different search term or create a new list.' : 'Create your first list to get started!'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Create list button */}
      <Button 
        onClick={onCreateNewClick} 
        variant="primary" 
        className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Create New List
      </Button>
    </div>
  );
};

ListSelector.propTypes = {
  userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  searchTerm: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  selectedListId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onListSelect: PropTypes.func.isRequired,
  onCreateNewClick: PropTypes.func.isRequired,
  isAuthenticated: PropTypes.bool.isRequired
};

export default ListSelector;
