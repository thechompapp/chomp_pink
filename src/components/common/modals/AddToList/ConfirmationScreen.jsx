/**
 * Confirmation Screen Component
 * 
 * Displays a confirmation message after an item has been added to a list.
 */
import React from 'react';
import PropTypes from 'prop-types';
import { CheckCircle2, ExternalLink } from 'lucide-react';
import Button from '@/components/common/buttons/Button';

/**
 * Confirmation Screen Component
 * @param {Object} props - Component props
 * @param {Object} props.itemAdded - Item that was added to the list
 * @param {Object} props.listAdded - List the item was added to
 * @param {Function} props.onClose - Function called when the confirmation is closed
 * @param {Function} props.onViewList - Function called when the user wants to view the list
 * @returns {React.ReactNode}
 */
const ConfirmationScreen = ({
  itemAdded,
  listAdded,
  onClose,
  onViewList
}) => {
  // Get item type-specific message
  const getItemTypeMessage = () => {
    if (!itemAdded) return 'Item';
    
    switch (itemAdded.type) {
      case 'restaurant':
        return 'Restaurant';
      case 'dish':
        return 'Dish';
      default:
        return 'Item';
    }
  };
  
  return (
    <div className="text-center space-y-4 py-4">
      <div className="flex justify-center">
        <div className="bg-green-100 p-3 rounded-full">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-medium">Success!</h3>
        <p className="text-gray-600 mt-1">
          {getItemTypeMessage()} <span className="font-medium">{itemAdded?.name}</span> has been added to your list <span className="font-medium">{listAdded?.name}</span>.
        </p>
      </div>
      
      <div className="pt-4 space-y-3">
        <Button
          onClick={onViewList}
          className="w-full"
        >
          View List
          <ExternalLink className="w-4 h-4 ml-2" />
        </Button>
        
        <Button
          onClick={onClose}
          variant="outline"
          className="w-full"
        >
          Close
        </Button>
      </div>
    </div>
  );
};

ConfirmationScreen.propTypes = {
  itemAdded: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    type: PropTypes.string,
    name: PropTypes.string
  }),
  listAdded: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string
  }),
  onClose: PropTypes.func.isRequired,
  onViewList: PropTypes.func.isRequired
};

export default ConfirmationScreen;
