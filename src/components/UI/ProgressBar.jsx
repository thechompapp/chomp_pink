/**
 * Reusable Progress Bar Component
 * 
 * Extracted from BulkOperationsPanel for better reusability
 * and consistent progress indication across the admin interface.
 */

import React from 'react';
import { cn } from '@/lib/utils';

export const ProgressBar = ({ 
  progress = 0, 
  status = 'processing', 
  message = 'Processing...', 
  className = '' 
}) => (
  <div className={cn("w-full", className)}>
    <div className="flex justify-between text-sm text-gray-600 mb-1">
      <span>{message}</span>
      <span>{Math.round(progress)}%</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div 
        className={cn(
          "h-2 rounded-full transition-all duration-300",
          status === 'success' && "bg-green-500",
          status === 'error' && "bg-red-500",
          status === 'warning' && "bg-yellow-500",
          status === 'processing' && "bg-blue-500"
        )}
        style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
      />
    </div>
  </div>
); 