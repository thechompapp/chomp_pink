import React from 'react';
import PropTypes from 'prop-types';
import './PlaceSelectionDialog.css';

/**
 * Dialog component for selecting a place from multiple options
 * @param {Object} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
const PlaceSelectionDialog = ({ 
  isOpen, 
  options, 
  onSelect, 
  onCancel, 
  restaurantName 
}) => {
  if (!isOpen) return null;

  return (
    <div className="place-selection-dialog-overlay">
      <div className="place-selection-dialog">
        <div className="place-selection-dialog-header">
          <h2>Select a Place for "{restaurantName}"</h2>
          <p>Multiple places were found. Please select the correct one:</p>
        </div>
        
        <div className="place-selection-dialog-options">
          {options.map((option) => (
            <button
              key={option.placeId}
              className="place-selection-option"
              onClick={() => onSelect(option.placeId)}
            >
              <div className="place-selection-option-main">{option.mainText}</div>
              <div className="place-selection-option-secondary">{option.secondaryText}</div>
            </button>
          ))}
        </div>
        
        <div className="place-selection-dialog-footer">
          <button className="place-selection-cancel-btn" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

PlaceSelectionDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      placeId: PropTypes.string.isRequired,
      mainText: PropTypes.string.isRequired,
      secondaryText: PropTypes.string,
      description: PropTypes.string
    })
  ).isRequired,
  onSelect: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  restaurantName: PropTypes.string.isRequired
};

export default PlaceSelectionDialog;
