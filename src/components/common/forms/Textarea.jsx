/**
 * Textarea Component
 * 
 * A styled textarea component for multi-line text input.
 */
import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { AlertCircle } from 'lucide-react';

/**
 * Textarea Component
 * @param {Object} props - Component props
 * @param {string} props.id - HTML ID for the textarea
 * @param {string} props.value - Current value of the textarea
 * @param {Function} props.onChange - Function called when the value changes
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.className - Additional CSS classes
 * @param {number} props.rows - Number of rows to display
 * @param {boolean} props.disabled - Whether the textarea is disabled
 * @param {string} props.error - Error message to display
 * @returns {React.ReactNode}
 */
const Textarea = forwardRef(({
  id,
  value,
  onChange,
  placeholder,
  className,
  rows,
  disabled,
  error,
  ...rest
}, ref) => {
  // Base classes for the textarea
  const baseClasses = 'block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-white focus:border-white sm:text-sm';
  
  // Determine classes based on error state and disabled state
  const textareaClasses = `
    ${baseClasses}
    ${error ? 'border-red-300 text-red-900 placeholder-red-300' : 'border-gray-300 placeholder-gray-400'}
    ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
    ${className}
  `;
  
  return (
    <div>
      <textarea
        id={id}
        ref={ref}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={textareaClasses}
        rows={rows}
        disabled={disabled}
        {...rest}
      />
      
      {error && (
        <div className="mt-1 text-sm text-red-600 flex items-center">
          <AlertCircle className="w-4 h-4 mr-1" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

Textarea.propTypes = {
  id: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  rows: PropTypes.number,
  disabled: PropTypes.bool,
  error: PropTypes.string
};

Textarea.defaultProps = {
  rows: 3,
  disabled: false,
  className: ''
};

export default Textarea;
