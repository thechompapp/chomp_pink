import React, { useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Simple Tooltip component
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Trigger element
 * @param {string} props.content - Tooltip content
 * @param {string} props.className - Additional CSS classes
 */
const Tooltip = ({ children, content, className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);

  if (!content) {
    return children;
  }

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={cn(
            "absolute z-50 px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg",
            "bottom-full left-1/2 transform -translate-x-1/2 mb-2",
            "before:content-[''] before:absolute before:top-full before:left-1/2",
            "before:transform before:-translate-x-1/2 before:border-4",
            "before:border-transparent before:border-t-gray-900",
            className
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
};

export { Tooltip }; 