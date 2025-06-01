// src/components/UI/Input.jsx
import React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef(
  ({ label, id, name, type = 'text', className = '', error, ...props }, ref) => {
    const baseClasses = "flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
    const errorClasses = error ? 'border-red-500 focus-visible:ring-red-500' : '';

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
        <label htmlFor={id || name} className="block text-sm font-medium text-gray-700 mb-1">
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
          <p id={`${id || name}-error`} className="mt-1 text-xs text-red-600">
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