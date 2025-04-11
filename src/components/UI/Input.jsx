// src/components/UI/Input.jsx
import React from 'react';

const Input = React.forwardRef(
  ({ label, id, name, type = 'text', className = '', error, ...props }, ref) => {
    const baseClasses = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:border-[#D1B399] sm:text-sm disabled:opacity-60 disabled:bg-gray-50";
    const errorClasses = error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : '';

    return (
      <div>
        {label && (
          <label htmlFor={id || name} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <input
          type={type}
          id={id || name}
          name={name}
          ref={ref}
          className={`${baseClasses} ${errorClasses} ${className}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${id || name}-error` : undefined}
          {...props}
        />
        {error && (
          <p id={`${id || name}-error`} className="mt-1 text-xs text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input'; // Add display name

export default Input;