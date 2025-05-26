// src/components/AddToList/ConfirmationScreen.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { CheckCircle2, ExternalLink } from 'lucide-react';
import { logDebug } from '@/utils/logger';
import Button from '@/components/UI/Button';

/**
 * ConfirmationScreen Component
 * 
 * Shows success/error states after adding an item to a list or creating a list
 */
const ConfirmationScreen = ({
  item,
  selectedList,
  onClose,
  onViewList
}) => {
  return (
    <div className="text-center py-6">
      <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" aria-hidden="true" />
      <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-100">Success!</h3>
      
      {item && selectedList && (
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          "{item.name}" has been added to your list "{selectedList.name}".
        </p>
      )}
      
      {!item && selectedList && ( 
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          List "{selectedList.name}" is ready.
        </p>
      )}

      <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
        <Button 
          onClick={onClose} 
          variant="primary" 
          className="w-full sm:w-auto"
        >
          Done
        </Button>
        
        {selectedList && (
          <Button 
            onClick={() => {
              logDebug(`[ConfirmationScreen] Viewing list: /lists/${selectedList.id}`);
              if (onViewList) {
                onViewList(selectedList.id);
              }
            }} 
            variant="outline" 
            className="w-full sm:w-auto"
            aria-label={`View ${selectedList.name} list`}
          >
            View List <ExternalLink className="h-4 w-4 ml-1.5 opacity-70" aria-hidden="true" />
          </Button>
        )}
      </div>
    </div>
  );
};

ConfirmationScreen.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
  }),
  selectedList: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
  }),
  onClose: PropTypes.func.isRequired,
  onViewList: PropTypes.func
};

export default ConfirmationScreen;
