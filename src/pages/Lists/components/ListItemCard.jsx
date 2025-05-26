/**
 * ListItemCard Component
 * 
 * Displays a single item in a list with actions.
 * Extracted from ListDetail.jsx to improve separation of concerns.
 */
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/solid';
import { MapPin } from 'lucide-react';
import Button from '@/components/UI/Button';

/**
 * ListItemCard Component
 * @param {Object} props - Component props
 * @returns {JSX.Element} Rendered component
 */
const ListItemCard = ({
  item,
  canEdit = false,
  onQuickAdd,
  onEditNote,
  onDelete
}) => {
  if (!item) return null;
  
  // Determine if this is a restaurant or dish
  const isRestaurant = !!item.restaurant_id;
  const isDish = !!item.dish_id;
  
  // Get the appropriate name and ID for links
  const name = item.restaurant_name || item.dish_name || 'Unnamed Item';
  const id = item.restaurant_id || item.dish_id;
  const linkPath = isRestaurant ? `/restaurants/${id}` : isDish ? `/dishes/${id}` : '#';
  
  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          {/* Item name with link */}
          <Link
            to={linkPath}
            className="text-lg font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
          >
            {name}
          </Link>
          
          {/* Item details */}
          <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {item.address && (
              <div className="flex items-center gap-1 mt-1">
                <MapPin size={14} />
                <span>{item.address}</span>
              </div>
            )}
            
            {/* Item note */}
            {item.note && (
              <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded border-l-2 border-gray-300 dark:border-gray-500">
                <p className="italic">{item.note}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Item actions */}
        <div className="flex items-center gap-2 self-start">
          {/* Quick add button (for non-owners) */}
          {!canEdit && onQuickAdd && (
            <Button
              onClick={onQuickAdd}
              variant="outline"
              size="sm"
            >
              Add to My List
            </Button>
          )}
          
          {/* Edit note button (for owners) */}
          {canEdit && onEditNote && (
            <Button
              onClick={onEditNote}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <PencilIcon className="h-3 w-3" />
              <span>Edit Note</span>
            </Button>
          )}
          
          {/* Delete button (for owners) */}
          {canEdit && onDelete && (
            <Button
              onClick={onDelete}
              variant="outline"
              size="sm"
              className="flex items-center gap-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 border-red-200 hover:border-red-300 dark:border-red-800 dark:hover:border-red-700"
            >
              <TrashIcon className="h-3 w-3" />
              <span>Remove</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

ListItemCard.propTypes = {
  item: PropTypes.object.isRequired,
  canEdit: PropTypes.bool,
  onQuickAdd: PropTypes.func,
  onEditNote: PropTypes.func,
  onDelete: PropTypes.func
};

export default ListItemCard;
