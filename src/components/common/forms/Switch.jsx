/**
 * Switch Component
 * 
 * A toggle switch component for boolean inputs.
 */
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Switch Component
 * @param {Object} props - Component props
 * @param {string} props.id - HTML ID for the input
 * @param {boolean} props.checked - Whether the switch is checked
 * @param {Function} props.onChange - Function called when the switch is toggled
 * @param {boolean} props.disabled - Whether the switch is disabled
 * @param {string} props.className - Additional CSS classes
 * @returns {React.ReactNode}
 */
const Switch = ({
  id,
  checked,
  onChange,
  disabled,
  className,
  ...rest
}) => {
  return (
    <label
      htmlFor={id}
      className={`relative inline-flex items-center cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="sr-only peer"
        {...rest}
      />
      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
    </label>
  );
};

Switch.propTypes = {
  id: PropTypes.string.isRequired,
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  className: PropTypes.string
};

Switch.defaultProps = {
  disabled: false,
  className: ''
};

export default Switch;
