/**
 * ListItemsContainer Component
 * 
 * Manages the display and sorting of list items.
 * Extracted from ListDetail.jsx to improve separation of concerns.
 */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { ChevronDown } from 'lucide-react';
import { ArrowUpIcon, ArrowDownIcon, PlusIcon } from '@heroicons/react/24/solid';
import ListItemCard from './ListItemCard';
import Button from '@/components/UI/Button';

/**
 * ListItemsContainer Component
 * @param {Object} props - Component props
 * @returns {JSX.Element} Rendered component
 */
const ListItemsContainer = ({
  items = [],
  canEdit = false,
  onQuickAdd,
  onEditNote,
  onDeleteItem
}) => {
  const [sortOrder, setSortOrder] = useState('default');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  
  console.log(`[ListItemsContainer] Received items:`, items);
  console.log(`[ListItemsContainer] Items type:`, typeof items);
  console.log(`[ListItemsContainer] Items is array:`, Array.isArray(items));
  console.log(`[ListItemsContainer] Items length:`, items?.length);
  
  // Toggle sort menu
  const toggleSortMenu = () => {
    setSortMenuOpen(!sortMenuOpen);
  };

  // Set sort order
  const changeSortOrder = (order) => {
    setSortOrder(order);
    setSortMenuOpen(false);
  };
  
  // Apply sorting to items
  const sortedItems = React.useMemo(() => {
    if (!items || !Array.isArray(items)) return [];
    
    let sortedItems = [...items];
    
    switch (sortOrder) {
      case 'az':
        return sortedItems.sort((a, b) => {
          const nameA = (a.restaurant_name || a.dish_name || '').toLowerCase();
          const nameB = (b.restaurant_name || b.dish_name || '').toLowerCase();
          return nameA.localeCompare(nameB);
        });
      case 'za':
        return sortedItems.sort((a, b) => {
          const nameA = (a.restaurant_name || a.dish_name || '').toLowerCase();
          const nameB = (b.restaurant_name || b.dish_name || '').toLowerCase();
          return nameB.localeCompare(nameA);
        });
      // Could implement distance sorting with geolocation
      case 'distance':
        console.info('Distance sorting requested - would require geolocation');
        return sortedItems;
      default:
        return sortedItems;
    }
  }, [items, sortOrder]);
  
  return (
    <div>
      {/* List actions */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Items ({sortedItems.length})
        </h2>
        
        <div className="flex items-center gap-2">
          {/* Sort dropdown */}
          <div className="relative">
            <button
              onClick={toggleSortMenu}
              className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <span>Sort</span>
              <ChevronDown size={16} className={sortMenuOpen ? "transform rotate-180" : ""} />
            </button>
            
            {sortMenuOpen && (
              <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                <ul className="py-1">
                  <li>
                    <button
                      onClick={() => changeSortOrder('default')}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Default
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => changeSortOrder('az')}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <ArrowUpIcon className="h-4 w-4 mr-2" />
                      A to Z
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => changeSortOrder('za')}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <ArrowDownIcon className="h-4 w-4 mr-2" />
                      Z to A
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
          
          {/* Add item button */}
          <Button
            onClick={() => {}}
            className="flex items-center gap-1"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Add Item</span>
          </Button>
        </div>
      </div>
      
      {/* List items */}
      {sortedItems.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">This list is empty.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedItems.map((item) => (
            <ListItemCard
              key={item.list_item_id}
              item={item}
              canEdit={canEdit}
              onQuickAdd={() => onQuickAdd && onQuickAdd(item)}
              onEditNote={() => onEditNote && onEditNote(item)}
              onDelete={() => onDeleteItem && onDeleteItem(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

ListItemsContainer.propTypes = {
  items: PropTypes.array,
  canEdit: PropTypes.bool,
  onQuickAdd: PropTypes.func,
  onEditNote: PropTypes.func,
  onDeleteItem: PropTypes.func
};

export default ListItemsContainer;
