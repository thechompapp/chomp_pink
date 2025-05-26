/**
 * Spinner Component
 * 
 * A versatile loading spinner with different sizes and variants.
 * Used to indicate loading states throughout the application.
 */
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import './Spinner.styles.css';

/**
 * Spinner Component
 * @param {Object} props - Component props
 * @param {string} props.size - Spinner size (sm, md, lg)
 * @param {string} props.variant - Spinner variant (primary, secondary, light)
 * @param {string} props.label - Accessibility label for the spinner
 * @param {boolean} props.fullPage - Whether the spinner should take up the full page
 * @param {string} props.className - Additional CSS class names
 * @param {Object} props.rest - Additional props for the spinner element
 */
const Spinner = ({
  size = 'md',
  variant = 'primary',
  label = 'Loading...',
  fullPage = false,
  className = '',
  ...rest
}) => {
  // Combine class names based on props
  const spinnerClasses = classNames(
    'spinner',
    `spinner-${size}`,
    `spinner-${variant}`,
    className
  );
  
  // If fullPage is true, render the spinner in a full-page container
  if (fullPage) {
    return (
      <div className="spinner-fullpage">
        <div className={spinnerClasses} role="status" aria-label={label} {...rest}>
          <span className="spinner-sr-only">{label}</span>
        </div>
      </div>
    );
  }
  
  // Otherwise, render just the spinner
  return (
    <div className={spinnerClasses} role="status" aria-label={label} {...rest}>
      <span className="spinner-sr-only">{label}</span>
    </div>
  );
};

Spinner.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  variant: PropTypes.oneOf(['primary', 'secondary', 'light']),
  label: PropTypes.string,
  fullPage: PropTypes.bool,
  className: PropTypes.string
};

export default Spinner;
