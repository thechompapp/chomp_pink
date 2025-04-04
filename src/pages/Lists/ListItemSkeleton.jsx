// src/pages/Lists/ListItemSkeleton.jsx
import React from 'react';
import SkeletonElement from '@/components/UI/SkeletonElement';

const ListItemSkeleton = () => {
  return (
    <div className="relative bg-white rounded-lg border border-gray-100 p-3 sm:p-4 flex items-center justify-between">
       <div className="flex-grow text-left mr-4 space-y-1">
          <SkeletonElement type="text" className="w-3/4" />
          <SkeletonElement type="text" className="w-1/2" />
       </div>
       <div className="flex items-center gap-2 flex-shrink-0">
          <SkeletonElement type="text" className="w-8 h-3 rounded-full hidden sm:inline-block" />
          <SkeletonElement type="text" className="w-10 h-3 rounded-full hidden sm:inline-block" />
          <SkeletonElement type="text" className="w-5 h-5 rounded-full" />
          <SkeletonElement type="text" className="w-5 h-5 rounded-full" />
       </div>
    </div>
  );
};

export default ListItemSkeleton;