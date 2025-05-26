/**
 * Item Details Form Component
 * 
 * A form for adding details to an item before adding it to a list.
 */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { ExternalLink } from 'lucide-react';
import { logDebug } from '@/utils/logger';
import Input from '@/components/common/forms/Input';
import Button from '@/components/common/buttons/Button';
import Label from '@/components/common/forms/Label';
import Textarea from '@/components/common/forms/Textarea';

/**
 * Item Details Form Component
 * @param {Object} props - Component props
 * @param {Object} props.itemToAdd - Item data being added to a list
 * @param {Object} props.selectedList - The list the item is being added to
 * @param {Function} props.onSubmit - Function called when form is submitted
 * @param {Function} props.onCancel - Function called when form is cancelled
 * @param {boolean} props.isSubmitting - Whether the form is currently submitting
 * @returns {React.ReactNode}
 */
const ItemDetailsForm = ({
  itemToAdd,
  selectedList,
  onSubmit,
  onCancel,
  isSubmitting
}) => {
  // Form state
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState(0);
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    logDebug('[ItemDetailsForm] Submitting item details:', { notes, rating });
    
    // Call the onSubmit callback with the item details
    onSubmit({
      notes: notes.trim(),
      rating: rating || null
    });
  };
  
  // Get item type-specific details
  const getItemDetails = () => {
    if (!itemToAdd) return null;
    
    if (itemToAdd.type === 'restaurant') {
      return (
        <div className="text-sm">
          {itemToAdd.address && (
            <p className="text-gray-600">{itemToAdd.address}</p>
          )}
          {itemToAdd.cuisine && (
            <p className="text-gray-600">{itemToAdd.cuisine}</p>
          )}
        </div>
      );
    }
    
    if (itemToAdd.type === 'dish') {
      return (
        <div className="text-sm">
          {itemToAdd.restaurant && (
            <p className="text-gray-600">From: {itemToAdd.restaurant.name}</p>
          )}
          {itemToAdd.price && (
            <p className="text-gray-600">${itemToAdd.price.toFixed(2)}</p>
          )}
        </div>
      );
    }
    
    return null;
  };
  
  // Render external link if available
  const renderExternalLink = () => {
    if (!itemToAdd || !itemToAdd.url) return null;
    
    return (
      <a
        href={itemToAdd.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 inline-flex items-center text-sm"
      >
        View details
        <ExternalLink className="w-3 h-3 ml-1" />
      </a>
    );
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Item preview */}
      <div className="bg-gray-50 p-4 rounded-md">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium">{itemToAdd?.name}</h3>
            {getItemDetails()}
          </div>
          {renderExternalLink()}
        </div>
        
        <div className="mt-2 text-sm">
          <span className="text-gray-600">Adding to: </span>
          <span className="font-medium">{selectedList?.name}</span>
        </div>
      </div>
      
      {/* Notes field */}
      <div>
        <Label htmlFor="item-notes">Notes (Optional)</Label>
        <Textarea
          id="item-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes about this item..."
          className="w-full"
          rows={3}
        />
      </div>
      
      {/* Rating field */}
      <div>
        <Label htmlFor="item-rating">Rating (Optional)</Label>
        <div className="flex items-center space-x-2">
          <Input
            id="item-rating"
            type="number"
            min="0"
            max="5"
            step="0.5"
            value={rating || ''}
            onChange={(e) => setRating(parseFloat(e.target.value) || 0)}
            className="w-24"
          />
          <span className="text-gray-500">/ 5</span>
        </div>
      </div>
      
      {/* Form buttons */}
      <div className="flex justify-end space-x-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Back
        </Button>
        
        <Button
          type="submit"
          disabled={isSubmitting}
          loading={isSubmitting}
        >
          Add to List
        </Button>
      </div>
    </form>
  );
};

ItemDetailsForm.propTypes = {
  itemToAdd: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    type: PropTypes.string,
    name: PropTypes.string,
    url: PropTypes.string,
    address: PropTypes.string,
    cuisine: PropTypes.string,
    price: PropTypes.number,
    restaurant: PropTypes.shape({
      name: PropTypes.string
    })
  }).isRequired,
  selectedList: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string
  }).isRequired,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool
};

ItemDetailsForm.defaultProps = {
  isSubmitting: false
};

export default ItemDetailsForm;
