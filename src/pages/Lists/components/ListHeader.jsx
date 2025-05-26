/**
 * ListHeader Component
 * 
 * Displays the header section of a list detail page, including title, description,
 * and action buttons.
 * Extracted from ListDetail.jsx to improve separation of concerns.
 */
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon, PencilIcon } from '@heroicons/react/24/solid';
import { formatRelativeDate } from '@/utils/formatting';
import Button from '@/components/UI/Button';
import FollowButton from '@/components/FollowButton';

/**
 * ListHeader Component
 * @param {Object} props - Component props
 * @returns {JSX.Element} Rendered component
 */
const ListHeader = ({
  list,
  canEdit,
  isAuthenticated,
  onEdit
}) => {
  if (!list) return null;
  
  return (
    <div className="mb-6">
      {/* Back button */}
      <Link
        to="/lists"
        className="inline-flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mb-4"
      >
        <ArrowLeftIcon className="h-4 w-4 mr-1" />
        <span>Back to Lists</span>
      </Link>
      
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          {/* List title and creation date */}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {list.name}
          </h1>
          
          {/* List metadata */}
          <div className="flex flex-wrap items-center text-sm text-gray-500 dark:text-gray-400 mb-3 gap-2">
            <span>Created by {list.username || 'Anonymous'}</span>
            <span className="hidden md:inline">•</span>
            <span>{formatRelativeDate(list.created_at)}</span>
            {list.is_public !== undefined && (
              <>
                <span className="hidden md:inline">•</span>
                <span>{list.is_public ? 'Public' : 'Private'}</span>
              </>
            )}
          </div>
          
          {/* List description */}
          {list.description && (
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              {list.description}
            </p>
          )}
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center gap-2 self-start">
          {/* Edit button (only for list owner) */}
          {canEdit && (
            <Button
              onClick={onEdit}
              variant="outline"
              className="flex items-center gap-1"
            >
              <PencilIcon className="h-4 w-4" />
              <span>Edit</span>
            </Button>
          )}
          
          {/* Follow button (only for authenticated users who don't own the list) */}
          {isAuthenticated && !canEdit && (
            <FollowButton listId={list.id} />
          )}
        </div>
      </div>
    </div>
  );
};

ListHeader.propTypes = {
  list: PropTypes.object,
  canEdit: PropTypes.bool,
  isAuthenticated: PropTypes.bool,
  onEdit: PropTypes.func
};

export default ListHeader;
