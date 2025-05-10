import React from 'react';
import { cn } from '@/lib/utils';

export const Label = ({ className, htmlFor, children, ...props }) => {
  return (
    <label htmlFor={htmlFor} className={cn("block text-sm font-medium text-gray-700 mb-1", className)} {...props}>
      {children}
    </label>
  );
};

export default Label;
