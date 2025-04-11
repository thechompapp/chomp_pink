// src/components/UI/Select.jsx
import React from 'react';

const Select = React.forwardRef(
  ({ label, id, name, className = '', error, children, ...props }, ref) => {
    const baseClasses = "block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:border-[#D1B399] sm:text-sm rounded-md disabled:opacity-60 disabled:bg-gray-50 bg-white"; // Added bg-white
    const errorClasses = error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : '';

    return (
      <div>
        {label && (
          <label htmlFor={id || name} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <select
          id={id || name}
          name={name}
          ref={ref}
          className={`${baseClasses} ${errorClasses} ${className}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${id || name}-error` : undefined}
          {...props}
        >
          {children}
        </select>
        {error && (
          <p id={`${id || name}-error`} className="mt-1 text-xs text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select'; // Add display name

export default Select;