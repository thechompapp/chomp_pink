// src/components/UI/BaseCard.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import useAuthStore from '@/stores/useAuthStore';

/**
 * Base card component with optional linking and quick add functionality
 * Provides consistent card styling with optional link wrapping and quick add button
 */
const BaseCardComponent = ({
  children,
  className,
  linkTo,
  onClick,
  onQuickAdd,
  quickAddLabel = 'Quick Add',
  showHoverEffect = true, // Consumed but not directly used in JSX
  showQuickAdd,
  ...props // Collect remaining props for the root element
}) => {
  const { isAuthenticated } = useAuthStore();
  
  // Extract non-DOM props to prevent React warnings
  const domSafeProps = { ...props };
  
  // Determine if quick add button should be shown
  const shouldShowQuickAdd = onQuickAdd && showQuickAdd !== false && isAuthenticated;
  
  // Define the card content structure
  const cardContent = (
    <div
      className={cn(
        "bg-white rounded-lg border border-black p-4 flex flex-col h-full overflow-hidden relative",
        className
      )}
    >
      {children}
      
      {shouldShowQuickAdd && (
        <button
          onClick={(e) => {
            e.preventDefault(); // Prevent link navigation if card is linked
            e.stopPropagation(); // Prevent card onClick if defined
            onQuickAdd();
          }}
          aria-label={quickAddLabel}
          title={quickAddLabel}
          className="absolute top-1 right-1 p-1 text-black bg-white rounded-full border border-black"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
      )}
    </div>
  );

  // Render as Link if linkTo is provided, otherwise as div
  return linkTo ? (
    <Link to={linkTo} onClick={onClick} {...domSafeProps} className="block group">
      {cardContent}
    </Link>
  ) : (
    <div onClick={onClick} {...domSafeProps} className="group">
      {cardContent}
    </div>
  );
};

// Explicitly define prop types for documentation and validation
BaseCard.propTypes = {
  /** Content to render inside the card */
  children: PropTypes.node,
  /** Additional CSS classes to apply to the card */
  className: PropTypes.string,
  /** URL to navigate to when the card is clicked (renders as Link) */
  linkTo: PropTypes.string,
  /** Function to call when the card is clicked */
  onClick: PropTypes.func,
  /** Function to call when the quick add button is clicked */
  onQuickAdd: PropTypes.func,
  /** Accessible label for the quick add button */
  quickAddLabel: PropTypes.string,
  /** Whether to show hover effects (consumed but not directly used) */
  showHoverEffect: PropTypes.bool,
  /** Whether to show the quick add button (if onQuickAdd is provided) */
  showQuickAdd: PropTypes.bool
};

// Wrap the component with React.memo for performance optimization
const BaseCard = React.memo(BaseCardComponent);

// Explicitly define prop types for documentation and validation
BaseCard.propTypes = {
  /** Content to render inside the card */
  children: PropTypes.node,
  /** Additional CSS classes to apply to the card */
  className: PropTypes.string,
  /** URL to navigate to when the card is clicked (renders as Link) */
  linkTo: PropTypes.string,
  /** Function to call when the card is clicked */
  onClick: PropTypes.func,
  /** Function to call when the quick add button is clicked */
  onQuickAdd: PropTypes.func,
  /** Accessible label for the quick add button */
  quickAddLabel: PropTypes.string,
  /** Whether to show hover effects (consumed but not directly used) */
  showHoverEffect: PropTypes.bool,
  /** Whether to show the quick add button (if onQuickAdd is provided) */
  showQuickAdd: PropTypes.bool
};

export default BaseCard;