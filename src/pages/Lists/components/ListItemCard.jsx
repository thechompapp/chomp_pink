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
  
  // Determine if this is a restaurant or dish using the backend-provided semantic fields
  const isRestaurant = !!item.restaurant_id && item.item_type === 'restaurant';
  const isDish = !!item.dish_id && item.item_type === 'dish';
  
  // Get the appropriate name and ID for links
  const name = item.restaurant_name || item.dish_name || item.name || 'Unnamed Item';
  const id = item.restaurant_id || item.dish_id || item.item_id;
  const linkPath = isRestaurant ? `/restaurants/${item.restaurant_id}` : 
                   isDish ? `/dishes/${item.dish_id}` : '#';
  
  // Get address/location info with multiple fallbacks
  const address = item.address || item.location;
  const city = item.city_name || item.city;
  const fullLocation = [address, city].filter(Boolean).join(', ');
  
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
          
          {/* Item type badge */}
          <div className="flex items-center gap-2 mt-1">
            <span className={`px-2 py-1 text-xs rounded-full ${
              isRestaurant ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
              isDish ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
              'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
            }`}>
              {isRestaurant ? 'Restaurant' : isDish ? 'Dish' : item.item_type || 'Item'}
            </span>
            
            {/* Show parent restaurant for dishes */}
            {isDish && item.restaurant_name && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                from {item.restaurant_name}
              </span>
            )}
          </div>
          
          {/* Item details */}
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 space-y-1">
            {/* Cuisine for restaurants */}
            {isRestaurant && item.cuisine && (
              <div>{item.cuisine}</div>
            )}
            
            {/* Description for dishes */}
            {isDish && item.description && (
              <div>{item.description}</div>
            )}
            
            {/* Location */}
            {fullLocation && (
              <div className="flex items-center gap-1">
                <MapPin size={14} />
                <span>{fullLocation}</span>
              </div>
            )}
            
            {/* Item notes */}
            {item.notes && (
              <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded border-l-2 border-gray-300 dark:border-gray-500">
                <p className="italic">{item.notes}</p>
              </div>
            )}
            
            {/* Legacy note field for compatibility */}
            {!item.notes && item.note && (
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
              onClick={() => onQuickAdd(item)}
              variant="outline"
              size="sm"
            >
              Add to My List
            </Button>
          )}
          
          {/* Edit note button (for owners) */}
          {canEdit && onEditNote && (
            <Button
              onClick={() => onEditNote(item)}
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
              onClick={() => onDelete(item)}
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
