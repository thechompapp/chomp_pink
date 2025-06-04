// src/components/UI/Input.jsx
import React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef(
  ({ label, id, name, type = 'text', className = '', error, ...props }, ref) => {
    const baseClasses = "flex h-10 w-full bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:bg-white dark:focus:bg-gray-700 focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50 transition-colors";
    const errorClasses = error ? 'bg-red-50 dark:bg-red-900/20 focus:bg-red-50 dark:focus:bg-red-900/20' : '';

    // If used without label (shadcn/ui style), return just the input
    if (!label) {
      return (
        <input
          type={type}
          id={id || name}
          name={name}
          ref={ref}
          className={cn(baseClasses, errorClasses, className)}
          aria-invalid={!!error}
          aria-describedby={error ? `${id || name}-error` : undefined}
          {...props}
        />
      );
    }

    // If used with label (original style), return the full component
    return (
      <div>
        <label htmlFor={id || name} className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
          {label}
        </label>
        <input
          type={type}
          id={id || name}
          name={name}
          ref={ref}
          className={cn(baseClasses, errorClasses, className)}
          aria-invalid={!!error}
          aria-describedby={error ? `${id || name}-error` : undefined}
          {...props}
        />
        {error && (
          <p id={`${id || name}-error`} className="mt-1 text-xs text-red-500 dark:text-red-400">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
export { Input };