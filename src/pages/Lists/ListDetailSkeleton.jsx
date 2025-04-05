// src/pages/Lists/ListDetailSkeleton.jsx
import React from 'react';
import SkeletonElement from '@/components/UI/SkeletonElement';
import ListItemSkeleton from '@/pages/Lists/ListItemSkeleton'; // Corrected import path

const ListDetailSkeleton = () => {
  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 pb-12 animate-pulse">
      {/* Back Button Placeholder */}
      <SkeletonElement type="text" className="w-32 h-5 my-4" />

      {/* List Header Section Skeleton */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5 mb-6 space-y-3">
        <SkeletonElement type="title" className="w-3/4 h-7" /> {/* List Name */}
        <SkeletonElement type="text" className="w-full h-4" /> {/* Description Line 1 */}
        <SkeletonElement type="text" className="w-5/6 h-4" /> {/* Description Line 2 */}
        {/* Tags Placeholder */}
        <div className="flex flex-wrap gap-2 mb-1">
            <SkeletonElement type="pill" className="w-16 h-5" />
            <SkeletonElement type="pill" className="w-20 h-5" />
            <SkeletonElement type="pill" className="w-14 h-5" />
        </div>
         {/* Creator Handle Placeholder */}
        <SkeletonElement type="text" className="w-1/4 h-3" />
        {/* Sorting Controls Placeholder */}
        <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
             <SkeletonElement type="text" className="w-10 h-4 self-center mr-1" />
             <SkeletonElement type="button" className="w-16 h-7" />
             <SkeletonElement type="button" className="w-20 h-7" />
             <SkeletonElement type="button" className="w-20 h-7" />
             <SkeletonElement type="button" className="w-16 h-7" />
             <SkeletonElement type="button" className="w-16 h-7" />
        </div>
         {/* Edit/Share Controls Placeholder */}
        <div className="pt-4 flex items-center flex-wrap gap-x-4 gap-y-2 border-t border-gray-100 mt-4">
           <SkeletonElement type="text" className="w-20 h-5 mr-2" />
           <SkeletonElement type="button" className="w-24 h-7" />
           <SkeletonElement type="button" className="w-20 h-7" />
           <SkeletonElement type="button" className="w-16 h-7" />
        </div>
      </div>

      {/* List Items Section Skeleton */}
      <div className="space-y-1">
        <SkeletonElement type="title" className="w-1/3 h-6 mb-3" /> {/* Items Header */}
        {/* Virtualized List Placeholder */}
        <div className="h-[60vh] border border-gray-100 rounded-lg bg-white shadow-sm p-3 space-y-2">
            {/* Show several list item skeletons */}
            {[...Array(5)].map((_, i) => <ListItemSkeleton key={i} />)}
        </div>
      </div>
    </div>
  );
};

export default ListDetailSkeleton;