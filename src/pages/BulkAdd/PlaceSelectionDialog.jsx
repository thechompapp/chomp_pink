import React from 'react';
import PropTypes from 'prop-types';
import './PlaceSelectionDialog.css';

/**
 * Renders star rating based on rating value
 * @param {number} rating - Rating value (0-5)
 * @returns {JSX.Element} - Star rating display
 */
const StarRating = ({ rating }) => {
  if (!rating) return null;
  
  // Round to nearest half star
  const roundedRating = Math.round(rating * 2) / 2;
  const fullStars = Math.floor(roundedRating);
  const halfStar = roundedRating % 1 !== 0;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
  
  return (
    <div className="star-rating">
      {[...Array(fullStars)].map((_, i) => (
        <span key={`full-${i}`} className="star full-star">★</span>
      ))}
      {halfStar && <span className="star half-star">★</span>}
      {[...Array(emptyStars)].map((_, i) => (
        <span key={`empty-${i}`} className="star empty-star">☆</span>
      ))}
      <span className="rating-value">{rating.toFixed(1)}</span>
      {rating && <span className="rating-count">({rating})</span>}
    </div>
  );
};

/**
 * Renders price level indicator
 * @param {number} priceLevel - Price level (1-4)
 * @returns {JSX.Element} - Price level display
 */
const PriceLevel = ({ priceLevel }) => {
  if (!priceLevel) return null;
  
  const symbols = Array(priceLevel).fill('$').join('');
  
  return <span className="price-level">{symbols}</span>;
};

/**
 * Enhanced dialog component for selecting a place from multiple options
 * with rich context for better decision making
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
      <div className="place-selection-dialog enhanced">
        <div className="place-selection-dialog-header">
          <h2>Select a Place for "{restaurantName}"</h2>
          <p>Multiple places were found. Please select the correct one:</p>
        </div>
        
        <div className="place-selection-dialog-options">
          {options.map((option) => (
            <button
              key={option.placeId}
              className="place-selection-option enhanced"
              onClick={() => onSelect(option.placeId)}
            >
              <div className="option-content">
                {option.photoUrl && (
                  <div className="option-image">
                    <img src={option.photoUrl} alt={option.mainText} />
                  </div>
                )}
                
                <div className="option-details">
                  <div className="option-header">
                    <div className="place-selection-option-main">{option.mainText}</div>
                    <div className="option-meta">
                      <StarRating rating={option.rating} />
                      <PriceLevel priceLevel={option.priceLevel} />
                      {option.userRatingsTotal > 0 && (
                        <span className="review-count">{option.userRatingsTotal} reviews</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="place-selection-option-address">
                    {option.formattedAddress || option.secondaryText}
                  </div>
                  
                  {(option.neighborhood || option.zipcode) && (
                    <div className="place-selection-option-neighborhood">
                      {option.neighborhood && <span>{option.neighborhood}</span>}
                      {option.zipcode && <span>ZIP: {option.zipcode}</span>}
                    </div>
                  )}
                </div>
              </div>
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
      formattedAddress: PropTypes.string,
      rating: PropTypes.number,
      userRatingsTotal: PropTypes.number,
      priceLevel: PropTypes.number,
      neighborhood: PropTypes.string,
      zipcode: PropTypes.string,
      photoUrl: PropTypes.string
    })
  ).isRequired,
  onSelect: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  restaurantName: PropTypes.string.isRequired
};

StarRating.propTypes = {
  rating: PropTypes.number
};

PriceLevel.propTypes = {
  priceLevel: PropTypes.number
};

export default PlaceSelectionDialog;
