// src/components/UI/BaseCard.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import useAuthStore from '@/stores/useAuthStore';

// Extract the Plus icon to its own component for better reusability
const PlusIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="16" 
    height="16" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

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
  showHoverEffect = true,
  showQuickAdd = true,
  ...domProps // Only spread DOM-safe props
}) => {
  const { isAuthenticated } = useAuthStore();
  
  // Simplified conditional to determine if quick add button should be shown
  const shouldShowQuickAdd = Boolean(onQuickAdd && showQuickAdd && isAuthenticated);
  
  // Define QuickAddButton as a memoized component to reduce rerenders
  const QuickAddButton = React.useMemo(() => {
    if (!shouldShowQuickAdd) return null;
    
    return (
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
        <PlusIcon />
      </button>
    );
  }, [shouldShowQuickAdd, quickAddLabel, onQuickAdd]);
  
  // Card content is the same regardless of whether we're using a Link or div
  const cardContent = (
    <>
      {children}
      {QuickAddButton}
    </>
  );

  // Classes that apply to both Link and div wrappers
  const wrapperClassName = "group";
  const cardClassName = cn(
    "bg-white rounded-lg border border-black p-4 flex flex-col h-full overflow-hidden relative",
    className
  );

  // Render as Link if linkTo is provided, otherwise as div
  if (linkTo) {
    return (
      <Link 
        to={linkTo} 
        onClick={onClick} 
        className={`block ${wrapperClassName}`} 
        {...domProps}
      >
        <div className={cardClassName}>{cardContent}</div>
      </Link>
    );
  }
  
  return (
    <div 
      onClick={onClick} 
      className={wrapperClassName} 
      {...domProps}
    >
      <div className={cardClassName}>{cardContent}</div>
    </div>
  );
};

// Explicitly define prop types for documentation and validation
BaseCardComponent.propTypes = {
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

// React.memo maintains the propTypes from the wrapped component
BaseCard.propTypes = BaseCardComponent.propTypes;

export default BaseCard;