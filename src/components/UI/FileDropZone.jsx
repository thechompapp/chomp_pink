/**
 * Reusable File Drop Zone Component
 * 
 * Extracted from BulkOperationsPanel for better reusability
 * and consistent file upload experience across the admin interface.
 */

import React, { useState, useCallback, useRef } from 'react';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

export const FileDropZone = ({ 
  onFileSelect, 
  acceptedTypes = '.csv,.json,.xlsx', 
  isLoading = false,
  maxSize = '10MB',
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);
  
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onFileSelect(files[0]);
    }
  }, [onFileSelect]);
  
  const handleFileInput = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      onFileSelect(file);
    }
  }, [onFileSelect]);
  
  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
        isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300",
        isLoading && "opacity-50 pointer-events-none",
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes}
        onChange={handleFileInput}
        className="hidden"
      />
      
      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      
      <div className="space-y-2">
        <p className="text-lg font-medium text-gray-900">
          Drop your file here, or{' '}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-blue-600 hover:text-blue-700 underline"
            disabled={isLoading}
          >
            browse
          </button>
        </p>
        <p className="text-sm text-gray-500">
          Supports {acceptedTypes.split(',').join(', ')} files up to {maxSize}
        </p>
      </div>
    </div>
  );
}; 