import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * FilterGroup component - creates a collapsible section for filter items
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Filter items to display in this group
 * @param {string} props.title - Title of the filter group
 * @param {React.ReactNode} props.icon - Icon to display next to the title
 * @param {boolean} props.defaultExpanded - Whether the group is expanded by default
 * @param {string} props.className - Additional CSS classes
 */
const FilterGroup = ({ 
  title, 
  icon, 
  children, 
  defaultExpanded = true,
  className = ""
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  
  return (
    <div className={`space-y-2 ${className}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
      >
        <span className="flex items-center">
          {icon && <span className="mr-2 text-gray-500 dark:text-gray-400">{icon}</span>}
          {title}
        </span>
        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="pl-6 overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FilterGroup; 