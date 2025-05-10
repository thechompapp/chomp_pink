/* src/pages/Lists/ListCard.jsx */
import React, { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { listService } from '@/services/listService';
import BaseCard from '@/components/UI/BaseCard';
import { engagementService } from '@/services/engagementService';
import ErrorMessage from '@/components/UI/ErrorMessage.jsx';
import Button from '@/components/UI/Button.jsx';
import { formatRelativeDate } from '@/utils/formatting';
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { logDebug } from '@/utils/logger';

// Simple list item display within the card
const ListItemDisplay = ({ item, listType }) => {
  if (!item || item.id == null) return null;
  let linkTo = '#';
  let secondaryText = '';
  if (item.item_type === 'restaurant') {
    linkTo = `/restaurants/${item.id}`;
    secondaryText = item.city || item.neighborhood || '';
  } else if (item.item_type === 'dish') {
    linkTo = `/dishes/${item.id}`;
    secondaryText = item.restaurant_name || '';
  }

  return (
    <li className="truncate py-0.5" title={item.name}>
      <Link to={linkTo} className="text-gray-700 hover:text-primary hover:underline text-xs">
        {item.name}
      </Link>
      {/* Optionally show secondary text like restaurant name for dish */}
      {/* {secondaryText && <span className="text-gray-500 text-xs ml-1">({secondaryText})</span>} */}
    </li>
  );
};

const ListCard = ({ list }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!list || list.id == null || !list.name) {
    logDebug('[ListCard] Invalid list prop:', list);
    return null;
  }
  
  // Memoize query configuration to avoid recreating objects on every render
  const queryConfig = useMemo(() => ({
    queryKey: ['listDetails', list.id],
    queryFn: () => listService.getListDetails(list.id),
    enabled: isExpanded,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    select: (response) => response?.data || { items: [] },
    placeholderData: { items: [] },
    refetchOnWindowFocus: false,
    retry: 1
  }), [list.id, isExpanded]);

  const { data: listDetails, isLoading, error } = useQuery(queryConfig);

  const items = listDetails?.items || [];
  const displayItems = items.slice(0, 5); // Always show only up to 5
  const hasMoreItems = (list.item_count || 0) > 5;

  // Memoize handlers to prevent recreation on each render
  const handleCardClick = useCallback(() => {
    engagementService.logEngagement({
      item_id: parseInt(String(list.id), 10),
      item_type: 'list',
      engagement_type: 'click',
    });
  }, [list.id]);

  // Optimized toggleExpand with engagement logging for expansion actions
  const toggleExpand = useCallback((e) => {
    e.stopPropagation(); // Prevent card link navigation
    e.preventDefault();
    
    // Log expansion/collapse as an engagement action
    const newExpandedState = !isExpanded;
    engagementService.logEngagement({
      item_id: parseInt(String(list.id), 10),
      item_type: 'list',
      engagement_type: newExpandedState ? 'expand' : 'collapse',
    });
    
    setIsExpanded(newExpandedState);
  }, [isExpanded, list.id]);

  const tags = Array.isArray(list.tags) ? list.tags : [];
  const updatedAt = list.updated_at ? new Date(list.updated_at) : new Date();
  const updatedText = formatRelativeDate(updatedAt) || 'Updated recently';

  return (
    <BaseCard
      linkTo={`/lists/${list.id}`}
      onClick={handleCardClick}
      // onQuickAdd={onQuickAdd} // Add back if needed
      quickAddLabel={`Add list ${list.name} to favorites`}
      className="w-full" // BaseCard provides h-56
      // showQuickAdd={!!onQuickAdd} // Add back if needed
      showQuickAdd={false} // Disable QuickAdd for now
    >
      {/* Main Content Area */}
      <div className="flex-grow min-h-0 overflow-hidden flex flex-col">
        <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-primary transition-colors flex-shrink-0">
          {list.name}
        </h3>
        <p className="text-xs text-gray-500 mb-1 flex-shrink-0">{list.item_count || 0} items</p>
        <p className="text-xs text-gray-500 mb-2 flex-shrink-0">{updatedText}</p>

        {/* Items List (takes remaining space, scrollable if expanded) */}
        <div className={`flex-grow min-h-0 overflow-y-auto no-scrollbar transition-all duration-300 ${isExpanded ? 'max-h-36' : 'max-h-20'}`}>
          {isLoading && isExpanded ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 size={16} className="animate-spin text-gray-400" />
            </div>
          ) : error && isExpanded ? (
            <p className="text-xs text-red-500 mt-1">Could not load items.</p>
          ) : displayItems.length > 0 ? (
            <ul className="text-xs space-y-0.5 list-inside list-disc marker:text-gray-300">
              {displayItems.map((item) => (
                <ListItemDisplay key={item.list_item_id} item={item} listType={list.list_type} />
              ))}
            </ul>
          ) : (
            !isExpanded && <p className="text-xs text-gray-400 italic mt-1">No items preview.</p>
          )}
          {/* Placeholder if expanded but no items */}
          {isExpanded && !isLoading && items.length === 0 && (
            <p className="text-xs text-gray-400 italic mt-1">This list is empty.</p>
          )}
        </div>
      </div>

      {/* Footer Area (Tags & Show More) */}
      <div className="mt-2 pt-2 border-t border-gray-100 flex-shrink-0">
        <AnimatePresence>
          {hasMoreItems && (
            <motion.div
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0.8 }}
            >
              <Button
                variant="link"
                size="sm"
                onClick={toggleExpand}
                className="!p-0 !h-auto text-xs text-primary hover:underline focus:outline-none focus:ring-0 mb-1.5 transition-colors duration-200"
                aria-expanded={isExpanded}
              >
                {isExpanded ? (
                  <><ChevronUp size={12} className="mr-0.5 transition-transform duration-200" /> Show Less</>
                ) : (
                  <><ChevronDown size={12} className="mr-0.5 transition-transform duration-200" /> Show All ({list.item_count})</>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag) => (
              <span key={tag} className="px-1.5 py-0.5 bg-gray-100 rounded-full text-[10px] text-gray-600 whitespace-nowrap">
                #{tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="px-1.5 py-0.5 bg-gray-100 rounded-full text-[10px] text-gray-600">
                +{tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </BaseCard>
  );
};

ListCard.propTypes = {
  list: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    item_count: PropTypes.number,
    list_type: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
    updated_at: PropTypes.string,
  }).isRequired,
  // onQuickAdd: PropTypes.func, // Add back if needed
};

export default React.memo(ListCard);