// src/components/UI/SkeletonElement.jsx
import React from 'react';

const SkeletonElement = ({ type = 'text', className = '' }) => {
  const typeClasses = {
    text: 'h-4 bg-gray-200 rounded', // Standard text line
    title: 'h-6 w-3/4 bg-gray-200 rounded', // Larger text line
    avatar: 'h-10 w-10 bg-gray-200 rounded-full',
    thumbnail: 'h-24 w-full bg-gray-200 rounded',
    button: 'h-9 w-20 bg-gray-200 rounded-lg',
    rect: 'bg-gray-200 rounded', // Generic rectangle, relies on className for size
  };

  const classes = `animate-pulse ${typeClasses[type] || typeClasses.rect} ${className}`;

  return <div className={classes}></div>;
};

export default SkeletonElement;