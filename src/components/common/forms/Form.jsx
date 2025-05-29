/**
 * Form Component
 * 
 * A standardized form component with built-in validation and submission handling.
 * Provides a consistent interface for all forms in the application.
 */
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import './Form.styles.css';

/**
 * Form Component
 * @param {Object} props - Component props
 * @param {Function} props.onSubmit - Form submission handler
 * @param {React.ReactNode} props.children - Form content
 * @param {boolean} props.disabled - Whether the form is disabled
 * @param {string} props.className - Additional CSS class names
 * @param {Object} props.rest - Additional props for the form element
 */
const Form = ({
  onSubmit,
  children,
  disabled = false,
  className = '',
  ...rest
}) => {
  // Handle form submission
  const handleSubmit = (event) => {
    event.preventDefault();
    
    if (!disabled && onSubmit) {
      onSubmit(event);
    }
  };
  
  // Combine class names based on props
  const formClasses = classNames(
    'form',
    {
      'form-disabled': disabled
    },
    className
  );
  
  return (
    <form
      className={formClasses}
      onSubmit={handleSubmit}
      noValidate
      aria-label="Form"
      {...rest}
    >
      {children}
    </form>
  );
};

Form.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  disabled: PropTypes.bool,
  className: PropTypes.string
};

export default Form;
