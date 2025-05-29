// src/pages/Lists/ListCardSkeleton.jsx
import React from 'react';
import { motion } from 'framer-motion';
import SkeletonElement from '@/components/UI/SkeletonElement'; // Use global import

const ListCardSkeleton = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col w-full h-64 bg-white border border-gray-100 rounded-lg shadow-sm overflow-hidden p-4"
    >
      {/* Enhanced header section matching new ListCard */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 min-w-0">
          {/* Title skeleton */}
          <SkeletonElement type="title" className="mb-2 h-6 w-4/5" />
          {/* Description skeleton */}
          <SkeletonElement type="text" className="w-full mb-1 h-4" />
        </div>
        
        {/* Action buttons area */}
        <div className="ml-3 flex items-center space-x-2 flex-shrink-0">
          <SkeletonElement type="button" className="w-8 h-8 rounded-full" />
          <SkeletonElement type="button" className="w-20 h-7 rounded-full" />
        </div>
      </div>

      {/* Enhanced metadata section */}
      <div className="flex items-center flex-wrap gap-2 mb-3">
        <SkeletonElement type="text" className="w-12 h-4" />
        <SkeletonElement type="text" className="w-16 h-4" />
        <SkeletonElement type="button" className="w-20 h-5 rounded-full" />
        <SkeletonElement type="button" className="w-16 h-5 rounded-full" />
      </div>

      {/* Items preview section */}
      <div className="flex-grow min-h-0 mb-3">
        <div className="space-y-2">
          {[...Array(3)].map((_, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between py-2"
            >
              <div className="flex items-center space-x-2 flex-1">
                <SkeletonElement type="text" className="w-3 h-3 rounded-full" />
                <div className="flex-1">
                  <SkeletonElement type="text" className="w-3/4 h-4 mb-1" />
                  <SkeletonElement type="text" className="w-1/2 h-3" />
                </div>
              </div>
              <SkeletonElement type="button" className="w-12 h-6 rounded" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Show more button area */}
      <div className="flex justify-center pt-3 border-t border-gray-100">
        <SkeletonElement type="button" className="w-32 h-8 rounded-lg" />
      </div>
    </motion.div>
  );
};

export default ListCardSkeleton;