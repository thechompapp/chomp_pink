/**
 * Icon Button Component
 * 
 * A button component that displays an icon with optional text.
 * Extends the base Button component with icon-specific styling.
 */
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Button from './Button';
import './IconButton.styles.css';

/**
 * Icon Button Component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.icon - Icon element to display
 * @param {string} props.iconPosition - Position of the icon (left, right)
 * @param {boolean} props.iconOnly - Whether to show only the icon
 * @param {string} props.tooltip - Tooltip text
 * @param {Object} props.rest - Additional props to pass to the Button component
 */
const IconButton = ({
  icon,
  iconPosition = 'left',
  iconOnly = false,
  tooltip = '',
  children,
  className = '',
  ...rest
}) => {
  // Combine class names based on props
  const buttonClasses = classNames(
    'icon-btn',
    `icon-${iconPosition}`,
    {
      'icon-only': iconOnly
    },
    className
  );
  
  return (
    <Button
      className={buttonClasses}
      title={tooltip || (iconOnly && typeof children === 'string' ? children : '')}
      aria-label={iconOnly && typeof children === 'string' ? children : undefined}
      {...rest}
    >
      {iconPosition === 'left' && (
        <span className="icon-container">{icon}</span>
      )}
      
      {!iconOnly && children && (
        <span className="icon-btn-text">{children}</span>
      )}
      
      {iconPosition === 'right' && (
        <span className="icon-container">{icon}</span>
      )}
    </Button>
  );
};

IconButton.propTypes = {
  icon: PropTypes.node.isRequired,
  iconPosition: PropTypes.oneOf(['left', 'right']),
  iconOnly: PropTypes.bool,
  tooltip: PropTypes.string,
  children: PropTypes.node,
  className: PropTypes.string
  // Other props are passed to Button component
};

export default IconButton;
