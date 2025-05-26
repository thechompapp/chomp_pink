/**
 * List Selector Component
 * 
 * A component for selecting lists to add items to.
 * Includes search functionality and the ability to create new lists.
 */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@tanstack/react-query';
import { PlusIcon as PlusHeroIcon } from '@heroicons/react/24/outline';
import { AlertCircle } from 'lucide-react';
import { listService } from '@/services/list';
import { logDebug, logError } from '@/utils/logger';
import Input from '@/components/common/forms/Input';
import Button from '@/components/common/buttons/Button';

// Query keys for React Query
const QUERY_KEYS = {
  USER_LISTS: 'userLists'
};

/**
 * List Selector Component
 * @param {Object} props - Component props
 * @param {string} props.userId - User ID to fetch lists for
 * @param {Function} props.onListSelect - Function called when a list is selected
 * @param {Function} props.onCreateNewList - Function called when user wants to create a new list
 * @param {string} props.itemType - Type of item being added ('restaurant', 'dish', or 'custom')
 * @param {Object} props.itemToAdd - Item data being added to a list
 * @returns {React.ReactNode}
 */
const ListSelector = ({
  userId,
  onListSelect,
  onCreateNewList,
  itemType,
  itemToAdd
}) => {
  // State for search term
  const [searchTerm, setSearchTerm] = useState('');
  
  // Fetch user lists with React Query
  const {
    data: userListsData,
    isLoading: isLoadingLists,
    error: userListsError
  } = useQuery(
    [QUERY_KEYS.USER_LISTS, userId],
    () => listService.getUserLists(userId, { limit: 50 }),
    {
      enabled: !!userId,
      staleTime: 30000, // 30 seconds
      onError: (error) => {
        logError('[ListSelector] Error fetching user lists:', error);
      }
    }
  );
  
  // Filter lists based on search term and item type
  const filteredLists = React.useMemo(() => {
    if (!userListsData?.data) return [];
    
    let lists = userListsData.data;
    
    // Filter by search term if provided
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      lists = lists.filter(list => 
        list.name.toLowerCase().includes(lowerSearchTerm) ||
        (list.description && list.description.toLowerCase().includes(lowerSearchTerm))
      );
    }
    
    // Filter by item type compatibility
    if (itemType === 'restaurant') {
      lists = lists.filter(list => 
        list.listType === 'restaurants' || list.listType === 'mixed'
      );
    } else if (itemType === 'dish') {
      lists = lists.filter(list => 
        list.listType === 'dishes' || list.listType === 'mixed'
      );
    }
    
    return lists;
  }, [userListsData?.data, searchTerm, itemType]);
  
  // Check if item already exists in a list
  const listContainsItem = (list) => {
    if (!itemToAdd || !itemToAdd.id) return false;
    
    const itemId = itemToAdd.id;
    const itemType = itemToAdd.type;
    
    // Check if list has items property and it's an array
    if (!list.items || !Array.isArray(list.items)) return false;
    
    return list.items.some(item => {
      if (itemType === 'restaurant' && item.restaurant_id === itemId) return true;
      if (itemType === 'dish' && item.dish_id === itemId) return true;
      return false;
    });
  };
  
  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // Handle list selection
  const handleListSelect = (list) => {
    onListSelect(list);
  };
  
  // Handle create new list button click
  const handleCreateNewList = () => {
    onCreateNewList();
  };
  
  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="relative">
        <Input
          type="text"
          placeholder="Search your lists..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full"
        />
      </div>
      
      {/* Error message */}
      {userListsError && (
        <div className="flex items-center p-3 text-red-700 bg-red-100 rounded-md">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>Failed to load your lists. Please try again.</span>
        </div>
      )}
      
      {/* Lists container */}
      <div className="max-h-60 overflow-y-auto border rounded-md divide-y">
        {isLoadingLists ? (
          <div className="p-4 text-center text-gray-500">Loading your lists...</div>
        ) : filteredLists.length > 0 ? (
          filteredLists.map(list => (
            <div
              key={list.id}
              className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                listContainsItem(list) ? 'bg-blue-50' : ''
              }`}
              onClick={() => handleListSelect(list)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">{list.name}</h3>
                  {list.description && (
                    <p className="text-sm text-gray-500 truncate">{list.description}</p>
                  )}
                </div>
                {listContainsItem(list) && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    Already added
                  </span>
                )}
              </div>
              <div className="mt-1 flex items-center text-xs text-gray-500">
                <span>{list.items?.length || 0} items</span>
                <span className="mx-2">•</span>
                <span>{list.isPublic ? 'Public' : 'Private'}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-gray-500">
            {searchTerm
              ? 'No lists match your search'
              : 'You don\'t have any lists yet'}
          </div>
        )}
      </div>
      
      {/* Create new list button */}
      <Button
        onClick={handleCreateNewList}
        variant="outline"
        className="w-full"
      >
        <PlusHeroIcon className="w-5 h-5 mr-2" />
        Create New List
      </Button>
    </div>
  );
};

ListSelector.propTypes = {
  userId: PropTypes.string.isRequired,
  onListSelect: PropTypes.func.isRequired,
  onCreateNewList: PropTypes.func.isRequired,
  itemType: PropTypes.oneOf(['restaurant', 'dish', 'custom']).isRequired,
  itemToAdd: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    type: PropTypes.string,
    name: PropTypes.string
  }).isRequired
};

export default ListSelector;
