// src/components/AddToListModal.jsx
// This file is now a wrapper around the refactored modular components
// for backward compatibility
import React from 'react';
import PropTypes from 'prop-types';
import { AddToListModalContainer } from '@/components/AddToList';

/**
 * AddToListModal Component
 * 
 * This is now a wrapper around the refactored modular components for backward compatibility.
 * The implementation has been moved to AddToListModalContainer.
 */
const AddToListModal = ({ isOpen, onClose, itemToAdd, onItemAdded }) => {
  return (
    <AddToListModalContainer
      isOpen={isOpen}
      onClose={onClose}
      itemToAdd={itemToAdd}
      onItemAdded={onItemAdded}
    />
  );

};

AddToListModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  itemToAdd: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
  }),
  onItemAdded: PropTypes.func,
};

export default AddToListModal;
