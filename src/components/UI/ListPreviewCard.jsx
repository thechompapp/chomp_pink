// src/components/UI/ListPreviewCard.jsx
import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { PlusIcon } from '@heroicons/react/24/solid';
import { Star, ChevronUp, ChevronDown, MessageSquare } from 'lucide-react';
import EnhancedListModal from '@/components/modals/EnhancedListModal';
import { useQuickAdd } from '@/contexts/QuickAddContext';
import { useAuth } from '@/contexts/auth/AuthContext'; // Migrated from useAuthStore
import { formatRelativeDate } from '@/utils/formatters';
import Button from '@/components/UI/Button';
import ErrorMessage from '@/components/UI/ErrorMessage';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import BaseCard from './BaseCard';
import useListInteractions from '@/hooks/useListInteractions';
import useListItems from '@/hooks/useListItems';

// Sub-component for displaying a single item in the preview
const PreviewListItem = ({ item }) => (
  <li className="flex items-center justify-between py-1.5 text-xs text-gray-600 dark:text-gray-300 group">
    <span className="truncate pr-2" title={item.name}>{item.name || `Item`}</span>
    {item.notes && (
      <MessageSquare size={12} className="text-gray-400 dark:text-gray-500 flex-shrink-0" title={`Notes: ${item.notes}`} />
    )}
  </li>
);

PreviewListItem.propTypes = {
  item: PropTypes.shape({
    list_item_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    notes: PropTypes.string,
  }).isRequired,
};

function ListPreviewCard({ list, className = '' }) {
  const { openQuickAdd } = useQuickAdd();
  const { isAuthenticated  } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false); // Enhanced modal state
  const PREVIEW_LIMIT = 3;

  // Use the shared list interactions hook
  const {
    listId,
    isOwnList,
    followStatus,
    isProcessingFollow,
    handleListClick,
    handleToggleFollow
  } = useListInteractions(list, {
    onListClick: (id) => setIsModalOpen(true) // Open enhanced modal
  });

  // Use the shared list items hook
  const {
    items: itemsToShow,
    isLoading,
    error,
    isExpanded,
    toggleExpand,
    hasMoreThanPreview
  } = useListItems(listId, {
    previewLimit: PREVIEW_LIMIT
  });

  // Handler for quick add button
  const handleQuickAddToListClick = (e) => {
    e.stopPropagation(); // Prevent card click
    if (!listId) return;
    openQuickAdd({ defaultListId: listId, defaultListName: list?.name });
  };

  // This is the CRITICAL part for display consistency:
  // Always use list.item_count from the prop for the main display.
  // The backend and cache invalidation are responsible for this prop being up-to-date.
  const displayedItemCount = list?.item_count ?? 0;
  
  if (!list) {
    // Optional: Render a skeleton or a placeholder if list is null
    return <div className={`p-4 border rounded-lg shadow-sm animate-pulse bg-gray-200 ${className}`}>Loading list...</div>;
  }

  return (
    <BaseCard
      onClick={handleListClick}
      className={`flex flex-col bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow duration-200 rounded-xl overflow-hidden ${className}`}
      aria-label={`View details for list: ${list.name}`}
    >
      {/* Header Section */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-start gap-2">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white line-clamp-2 flex-grow" title={list.name}>
            {list.name}
          </h3>
          {isAuthenticated && !isOwnList && (
            <Button
              variant="icon"
              size="sm"
              onClick={handleToggleFollow}
              className={`flex-shrink-0 rounded-full p-1.5 ${followStatus ? 'bg-primary-500 text-white hover:bg-primary-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
              title={followStatus ? 'Unfollow list' : 'Follow list'}
              isLoading={isProcessingFollow}
              aria-pressed={followStatus}
            >
              <Star size={14} className={followStatus ? 'fill-current' : ''} />
            </Button>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {displayedItemCount} {displayedItemCount === 1 ? 'item' : 'items'} 
          {list.updated_at && ` · Updated ${formatRelativeDate(list.updated_at)}`}
        </p>
        {list.description && (
          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2" title={list.description}>
            {list.description}
          </p>
        )}
      </div>

      {/* Items Preview/Expanded Section */}
      <div className="px-4 py-3 flex-grow min-h-[80px]"> {/* Ensure minimum height */}
        {isLoading && <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>}
        {!isLoading && error && <ErrorMessage message="Could not load items." />}
        
        {(itemsToShow.length > 0) ? (
          <ul className="space-y-1">
            {itemsToShow.map((item) => (
              <PreviewListItem key={item.list_item_id || item.id || `item-${Math.random()}`} item={item} />
            ))}
          </ul>
        ) : (
          !isLoading && <p className="text-xs text-gray-400 dark:text-gray-500 italic text-center py-2">This list is currently empty.</p>
        )}
      </div>

      {/* Footer Section */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
        <div className="flex justify-between items-center">
          <Button
            variant="ghost"
            size="xs"
            onClick={toggleExpand}
            className="text-primary dark:text-primary-400 hover:underline"
            aria-expanded={isExpanded}
          >
            {isExpanded ? (
              <><ChevronUp size={14} className="mr-1" />Show Less</>
            ) : (
              <>
                {hasMoreThanPreview ? `Show All (${displayedItemCount})` : (itemsToShow.length > 0 ? 'View Items' : 'View List')}
                <ChevronDown size={14} className="ml-1" />
              </>
            )}
          </Button>
          {isAuthenticated && (
            <Button
              variant="icon"
              size="sm"
              onClick={handleQuickAddToListClick}
              className="text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary-400 rounded-full p-1.5"
              title="Quickly add an item to this list"
            >
              <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          )}
        </div>
      </div>
    </BaseCard>
    
    {/* Enhanced List Modal */}
    <EnhancedListModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      list={list}
      onShare={(listData) => {
        // Handle sharing functionality
        console.log('Sharing list:', listData);
      }}
    />
  );
}

ListPreviewCard.propTypes = {
  list: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    description: PropTypes.string,
    updated_at: PropTypes.string,
    creator_username: PropTypes.string,
    user_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    item_count: PropTypes.number
  }),
  className: PropTypes.string
};

export default React.memo(ListPreviewCard);
