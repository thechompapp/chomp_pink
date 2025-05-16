import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';

const Label = ({ children, htmlFor, className = '', required = false }) => {
  return (
    <label
      htmlFor={htmlFor}
      className={`block text-sm font-medium text-gray-700 ${className}`}
    >
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
};

Label.propTypes = {
  children: PropTypes.node.isRequired,
  htmlFor: PropTypes.string,
  className: PropTypes.string,
  required: PropTypes.bool
};

Label.displayName = 'Label';

// Support both default and named exports
export default Label;
export { Label };
