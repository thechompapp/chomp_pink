import React from 'react';
import { motion } from 'framer-motion';
import SkeletonElement from './SkeletonElement';

const ListCardSkeleton = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col w-full h-64 bg-white border border-black rounded-lg shadow-sm overflow-hidden p-4"
    >
      {/* Header with badge and action buttons */}
      <div className="flex justify-between items-start mb-2">
        {/* List type badge */}
        <SkeletonElement type="button" className="w-12 h-5 rounded-full" />
        
        {/* Action buttons in top-right */}
        <div className="flex items-center space-x-1">
          <SkeletonElement type="button" className="w-6 h-6 rounded-full" />
          <SkeletonElement type="button" className="w-6 h-6 rounded-full" />
        </div>
      </div>

      {/* Main content section */}
      <div className="flex flex-col flex-grow">
        {/* Title */}
        <div className="mb-2">
          <SkeletonElement type="title" className="mb-1 h-6 w-4/5" />
        </div>

        {/* Description */}
        <div className="mb-3">
          <SkeletonElement type="text" className="w-full mb-1 h-4" />
          <SkeletonElement type="text" className="w-3/4 mb-1 h-4" />
        </div>

        {/* Items preview */}
        <div className="mb-3 space-y-2">
          <div className="flex items-center">
            <SkeletonElement type="text" className="w-3 h-3 rounded-full mr-2" />
            <SkeletonElement type="text" className="w-32 h-4" />
          </div>
          <div className="flex items-center">
            <SkeletonElement type="text" className="w-3 h-3 rounded-full mr-2" />
            <SkeletonElement type="text" className="w-28 h-4" />
          </div>
          <div className="flex items-center">
            <SkeletonElement type="text" className="w-3 h-3 rounded-full mr-2" />
            <SkeletonElement type="text" className="w-24 h-4" />
          </div>
        </div>

        {/* Stats section */}
        <div className="mt-auto pt-3 border-t border-black">
          <div className="flex items-center justify-between text-sm">
            {/* Left side stats */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <SkeletonElement type="text" className="w-3 h-3 rounded-full mr-1" />
                <SkeletonElement type="text" className="w-6 h-4" />
              </div>
              <div className="flex items-center">
                <SkeletonElement type="text" className="w-3 h-3 rounded-full mr-1" />
                <SkeletonElement type="text" className="w-8 h-4" />
              </div>
              <div className="flex items-center">
                <SkeletonElement type="text" className="w-3 h-3 rounded-full mr-1" />
                <SkeletonElement type="text" className="w-6 h-4" />
              </div>
            </div>

            {/* Right side badges */}
            <div className="flex items-center space-x-2">
              {[...Array(2)].map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <SkeletonElement type="button" className="w-12 h-5 rounded-full" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ListCardSkeleton; 