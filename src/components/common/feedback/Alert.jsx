/**
 * Alert Component
 * 
 * A standardized alert component for displaying feedback messages.
 * Supports different variants for different types of messages.
 */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import './Alert.styles.css';

/**
 * Alert Component
 * @param {Object} props - Component props
 * @param {string} props.variant - Alert variant (info, success, warning, error)
 * @param {string} props.title - Alert title
 * @param {React.ReactNode} props.children - Alert content
 * @param {boolean} props.dismissible - Whether the alert can be dismissed
 * @param {Function} props.onDismiss - Callback when alert is dismissed
 * @param {string} props.className - Additional CSS class names
 * @param {Object} props.rest - Additional props for the alert element
 */
const Alert = ({
  variant = 'info',
  title,
  children,
  dismissible = false,
  onDismiss,
  className = '',
  ...rest
}) => {
  const [dismissed, setDismissed] = useState(false);
  
  // Handle alert dismissal
  const handleDismiss = () => {
    setDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
  };
  
  // Don't render if dismissed
  if (dismissed) {
    return null;
  }
  
  // Combine class names based on props
  const alertClasses = classNames(
    'alert',
    `alert-${variant}`,
    className
  );
  
  // Get appropriate icon based on variant
  const getIcon = () => {
    switch (variant) {
      case 'success':
        return (
          <svg className="alert-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="alert-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
          </svg>
        );
      case 'error':
        return (
          <svg className="alert-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg className="alert-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
          </svg>
        );
    }
  };
  
  return (
    <div 
      className={alertClasses} 
      role="alert"
      {...rest}
    >
      <div className="alert-content">
        <div className="alert-icon-container">
          {getIcon()}
        </div>
        
        <div className="alert-message">
          {title && <div className="alert-title">{title}</div>}
          {children}
        </div>
      </div>
      
      {dismissible && (
        <button 
          type="button" 
          className="alert-dismiss" 
          onClick={handleDismiss}
          aria-label="Dismiss"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
      )}
    </div>
  );
};

Alert.propTypes = {
  variant: PropTypes.oneOf(['info', 'success', 'warning', 'error']),
  title: PropTypes.string,
  children: PropTypes.node.isRequired,
  dismissible: PropTypes.bool,
  onDismiss: PropTypes.func,
  className: PropTypes.string
};

export default Alert;
