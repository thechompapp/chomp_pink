// src/components/UI/LoadingSpinner.jsx
import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({
  size = 'md', // 'sm', 'md', 'lg'
  message = 'Loading...',
  className = '', // Allow custom styling
  messageClassName = 'text-sm text-gray-500 ml-2',
  spinnerClassName = 'text-gray-500',
}) => {
  const sizeMap = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div className={`flex justify-center items-center py-6 ${className}`}>
      <Loader2 className={`animate-spin ${sizeMap[size] || sizeMap['md']} ${spinnerClassName}`} />
      {message && <span className={messageClassName}>{message}</span>}
    </div>
  );
};

export default LoadingSpinner;