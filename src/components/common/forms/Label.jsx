/**
 * Label Component
 * 
 * A styled label component for form inputs.
 */
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Label Component
 * @param {Object} props - Component props
 * @param {string} props.htmlFor - ID of the input this label is for
 * @param {React.ReactNode} props.children - Label content
 * @param {boolean} props.required - Whether the associated input is required
 * @param {string} props.className - Additional CSS classes
 * @returns {React.ReactNode}
 */
const Label = ({
  htmlFor,
  children,
  required,
  className,
  ...rest
}) => {
  return (
    <label
      htmlFor={htmlFor}
      className={`block text-sm font-medium text-gray-700 mb-1 ${className}`}
      {...rest}
    >
      {children}
      {required && (
        <span className="text-red-500 ml-1">*</span>
      )}
    </label>
  );
};

Label.propTypes = {
  htmlFor: PropTypes.string,
  children: PropTypes.node.isRequired,
  required: PropTypes.bool,
  className: PropTypes.string
};

Label.defaultProps = {
  required: false,
  className: ''
};

export default Label;
