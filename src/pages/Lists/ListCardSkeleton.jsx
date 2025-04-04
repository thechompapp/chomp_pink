// src/pages/Lists/ListCardSkeleton.jsx
import React from 'react';
import SkeletonElement from '@/components/UI/SkeletonElement'; // Use global import

const ListCardSkeleton = () => {
  return (
    <div className="flex flex-col w-full h-56 bg-white border border-gray-100 rounded-lg shadow-sm overflow-hidden p-4">
      {/* Mimic ListCard structure */}
       <div className="flex flex-col flex-grow text-left">
         {/* Top section */}
         <div className="flex-grow mb-2">
            <SkeletonElement type="title" className="mb-2" />
            <SkeletonElement type="text" className="w-full mb-1.5" />
            <SkeletonElement type="text" className="w-1/2 mb-1" />
            <SkeletonElement type="text" className="w-1/2 mb-1" />
         </div>
         {/* Follow Button section */}
         <div className="mt-auto pt-3 border-t border-gray-100">
           <SkeletonElement type="button" className="w-full h-8" />
         </div>
       </div>
    </div>
  );
};

export default ListCardSkeleton;