import React from 'react';
import PropTypes from 'prop-types';
import AddToListModal from '@/components/AddToListModal';

/**
 * QuickAddModal Component
 * 
 * A wrapper around AddToListModal specifically for quick add functionality.
 * This provides a consistent interface for the QuickAdd context.
 */
const QuickAddModal = ({ isOpen, onClose, itemToAdd, onItemAdded }) => {
  return (
    <AddToListModal
      isOpen={isOpen}
      onClose={onClose}
      itemToAdd={itemToAdd}
      onItemAdded={onItemAdded}
    />
  );
};

QuickAddModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  itemToAdd: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    type: PropTypes.string,
    description: PropTypes.string,
    restaurant_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    dish_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
  onItemAdded: PropTypes.func,
};

export default QuickAddModal; 