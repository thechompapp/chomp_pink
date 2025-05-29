// src/components/UI/RestaurantCardSkeleton.jsx
import React from 'react';
import { motion } from 'framer-motion';
import SkeletonElement from './SkeletonElement';

const RestaurantCardSkeleton = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col w-full h-64 bg-white border border-black rounded-lg shadow-sm overflow-hidden p-4"
    >
      {/* Add to List button placeholder */}
      <div className="absolute top-2 right-2">
        <SkeletonElement type="button" className="w-8 h-8 rounded-full" />
      </div>

      {/* Type label and external link placeholder */}
      <div className="flex justify-between items-start mb-2">
        <SkeletonElement type="button" className="w-20 h-5 rounded-full" />
        <SkeletonElement type="button" className="w-6 h-6 rounded-full" />
      </div>

      {/* Enhanced header section matching new RestaurantCard */}
      <div className="flex flex-col flex-grow">
        {/* Image placeholder */}
        <div className="mb-3 rounded-lg overflow-hidden bg-gray-100 h-32">
          <SkeletonElement type="image" className="w-full h-full" />
        </div>
        
        {/* Title and description */}
        <div className="mb-2">
          <SkeletonElement type="title" className="mb-2 h-6 w-4/5" />
          <SkeletonElement type="text" className="w-full mb-1 h-4" />
          <SkeletonElement type="text" className="w-3/4 mb-1 h-4" />
        </div>

        {/* Enhanced metadata section */}
        <div className="space-y-2 mb-3">
          {/* Location */}
          <div className="flex items-center">
            <SkeletonElement type="text" className="w-3 h-3 rounded-full mr-2" />
            <SkeletonElement type="text" className="w-32 h-4" />
          </div>
          
          {/* Rating and phone */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <SkeletonElement type="text" className="w-12 h-4" />
            </div>
            <SkeletonElement type="text" className="w-6 h-4" />
          </div>
          
          {/* Popularity */}
          <div className="flex items-center">
            <SkeletonElement type="text" className="w-3 h-3 rounded-full mr-2" />
            <SkeletonElement type="text" className="w-16 h-4" />
          </div>
        </div>

        {/* Badges section */}
        <div className="flex items-center space-x-2 mb-3">
          {[...Array(2)].map((_, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <SkeletonElement type="button" className="w-16 h-5 rounded-full" />
            </motion.div>
          ))}
        </div>

        {/* Tags section with black border */}
        <div className="mt-auto pt-3 border-t border-black">
          <div className="flex flex-wrap gap-1.5">
            {[...Array(3)].map((_, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 + 0.2 }}
              >
                <SkeletonElement type="text" className="w-12 h-6 rounded-full border border-black" />
              </motion.div>
            ))}
            <SkeletonElement type="text" className="w-8 h-6 rounded-full border border-black" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default RestaurantCardSkeleton;