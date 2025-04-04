// src/components/UI/RestaurantCardSkeleton.jsx
import React from 'react';
import SkeletonElement from './SkeletonElement';

const RestaurantCardSkeleton = () => {
  return (
    <div className="flex flex-col w-full h-56 bg-white border border-gray-100 rounded-lg shadow-sm overflow-hidden p-4">
      {/* Mimic BaseCard structure */}
      <div className="flex flex-col flex-grow text-left">
        {/* Top section */}
        <div className="flex-grow mb-2">
            <SkeletonElement type="title" className="mb-2" />
            <SkeletonElement type="text" className="w-5/6 mb-1.5" />
            <SkeletonElement type="text" className="w-1/2 mb-1.5" />
        </div>
        {/* Tags section */}
        <div className="flex flex-wrap gap-1 mt-auto pt-2 border-t border-gray-100">
            <SkeletonElement type="text" className="w-10 h-3 rounded-full" />
            <SkeletonElement type="text" className="w-12 h-3 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export default RestaurantCardSkeleton;