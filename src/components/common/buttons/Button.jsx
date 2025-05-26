/**
 * Button Component
 * 
 * A standardized button component with various variants and sizes.
 * Supports different visual styles and loading states.
 */
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import './Button.styles.css';

/**
 * Button Component
 * @param {Object} props - Component props
 * @param {string} props.variant - Button variant (primary, secondary, outline, text)
 * @param {string} props.size - Button size (sm, md, lg)
 * @param {boolean} props.fullWidth - Whether the button should take full width
 * @param {boolean} props.isLoading - Whether the button is in loading state
 * @param {boolean} props.disabled - Whether the button is disabled
 * @param {React.ReactNode} props.children - Button content
 * @param {string} props.className - Additional CSS class names
 * @param {Function} props.onClick - Click handler
 * @param {string} props.type - Button type (button, submit, reset)
 * @param {Object} props.rest - Additional props to pass to the button element
 */
const Button = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  disabled = false,
  children,
  className = '',
  onClick,
  type = 'button',
  ...rest
}) => {
  // Combine class names based on props
  const buttonClasses = classNames(
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    {
      'btn-full-width': fullWidth,
      'btn-loading': isLoading,
      'btn-disabled': disabled
    },
    className
  );
  
  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading ? (
        <div className="btn-loading-indicator">
          <span className="btn-loading-spinner"></span>
          <span className="btn-loading-text">{children}</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
};

Button.propTypes = {
  variant: PropTypes.oneOf(['primary', 'secondary', 'outline', 'text', 'danger', 'success']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  fullWidth: PropTypes.bool,
  isLoading: PropTypes.bool,
  disabled: PropTypes.bool,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  onClick: PropTypes.func,
  type: PropTypes.oneOf(['button', 'submit', 'reset'])
};

export default Button;
