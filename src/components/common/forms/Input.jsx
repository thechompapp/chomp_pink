/**
 * Input Component
 * 
 * A standardized input component with built-in validation and error handling.
 * Supports various input types and states.
 */
import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import './Input.styles.css';

/**
 * Input Component
 * @param {Object} props - Component props
 * @param {string} props.id - Input ID
 * @param {string} props.name - Input name
 * @param {string} props.type - Input type
 * @param {string} props.label - Input label
 * @param {string} props.placeholder - Input placeholder
 * @param {string} props.value - Input value
 * @param {Function} props.onChange - Change handler
 * @param {Function} props.onBlur - Blur handler
 * @param {boolean} props.disabled - Whether the input is disabled
 * @param {boolean} props.readOnly - Whether the input is read-only
 * @param {boolean} props.required - Whether the input is required
 * @param {string} props.error - Error message
 * @param {string} props.helperText - Helper text
 * @param {string} props.className - Additional CSS class names
 * @param {Object} props.inputProps - Additional props for the input element
 * @param {Object} props.rest - Additional props for the container
 */
const Input = forwardRef(({
  id,
  name,
  type = 'text',
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  disabled = false,
  readOnly = false,
  required = false,
  error = '',
  helperText = '',
  className = '',
  inputProps = {},
  ...rest
}, ref) => {
  // Combine class names based on props
  const inputContainerClasses = classNames(
    'input-container',
    {
      'input-disabled': disabled,
      'input-readonly': readOnly,
      'input-error': error,
      'input-with-label': label
    },
    className
  );
  
  const inputClasses = classNames(
    'input-field',
    {
      'input-field-error': error
    },
    inputProps.className
  );
  
  // Generate a unique ID if not provided
  const inputId = id || `input-${name}-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <div className={inputContainerClasses} {...rest}>
      {label && (
        <label 
          htmlFor={inputId} 
          className="input-label"
        >
          {label}
          {required && <span className="input-required">*</span>}
        </label>
      )}
      
      <input
        ref={ref}
        id={inputId}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
        className={inputClasses}
        {...inputProps}
      />
      
      {error && (
        <div 
          id={`${inputId}-error`} 
          className="input-error-text"
          role="alert"
        >
          {error}
        </div>
      )}
      
      {!error && helperText && (
        <div 
          id={`${inputId}-helper`} 
          className="input-helper-text"
        >
          {helperText}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

Input.propTypes = {
  id: PropTypes.string,
  name: PropTypes.string.isRequired,
  type: PropTypes.oneOf([
    'text', 'password', 'email', 'number', 'tel', 'url', 
    'search', 'date', 'time', 'datetime-local', 'month', 'week'
  ]),
  label: PropTypes.string,
  placeholder: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  disabled: PropTypes.bool,
  readOnly: PropTypes.bool,
  required: PropTypes.bool,
  error: PropTypes.string,
  helperText: PropTypes.string,
  className: PropTypes.string,
  inputProps: PropTypes.object
};

export default Input;
