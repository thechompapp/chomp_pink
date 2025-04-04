// src/pages/Dashboard/SubmissionSkeleton.jsx
import React from 'react';
import SkeletonElement from '@/components/UI/SkeletonElement';

const SubmissionSkeleton = () => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 space-y-3">
      <div className="flex justify-between items-start">
         <div className="space-y-1.5">
             <SkeletonElement type="title" className="w-48" />
             <SkeletonElement type="text" className="w-64" />
         </div>
         <SkeletonElement type="text" className="w-16" />
      </div>
      <SkeletonElement type="text" className="w-40" />
      <div className="flex gap-2 pt-3 border-t border-gray-100 mt-3">
          <SkeletonElement type="button" className="w-28 h-8" />
          <SkeletonElement type="button" className="w-20 h-8" />
      </div>
    </div>
  );
};

export default SubmissionSkeleton;