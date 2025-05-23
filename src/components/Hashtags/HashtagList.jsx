import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { logDebug } from '@/utils/logger';

/**
 * Reusable component for displaying a list of hashtags
 * Features:
 * - Clickable tags that navigate to filtered results
 * - Customizable appearance
 * - Optional count display
 * - Virtualization support for large lists
 */
const HashtagList = ({
  hashtags = [],
  onClick,
  navigateOnClick = true,
  showCount = false,
  className = "",
  tagClassName = "",
  maxTags = null,
  sortBy = "count", // "count", "name", or "none"
}) => {
  const navigate = useNavigate();
  
  // Process and sort hashtags
  const processedTags = useMemo(() => {
    // Make a copy to avoid mutating props
    let tags = [...hashtags];
    
    // Sort tags if requested
    if (sortBy === "count") {
      tags = tags.sort((a, b) => {
        const countA = typeof a === 'object' ? (a.usage_count || a.count || 0) : 0;
        const countB = typeof b === 'object' ? (b.usage_count || b.count || 0) : 0;
        return countB - countA; // Descending order
      });
    } else if (sortBy === "name") {
      tags = tags.sort((a, b) => {
        const nameA = typeof a === 'object' ? a.name : String(a);
        const nameB = typeof b === 'object' ? b.name : String(b);
        return nameA.localeCompare(nameB);
      });
    }
    
    // Limit number of tags if maxTags is set
    if (maxTags !== null && tags.length > maxTags) {
      tags = tags.slice(0, maxTags);
    }
    
    return tags;
  }, [hashtags, sortBy, maxTags]);
  
  // Handle tag click
  const handleTagClick = (tag) => {
    const tagName = typeof tag === 'object' ? tag.name : tag;
    
    logDebug(`[HashtagList] Tag clicked: ${tagName}`);
    
    // Call custom click handler if provided
    if (onClick) {
      onClick(tagName);
    }
    
    // Navigate to filtered results if enabled
    if (navigateOnClick) {
      navigate(`/search?hashtags=${encodeURIComponent(tagName)}`);
    }
  };
  
  // Render empty state
  if (!processedTags.length) {
    return null;
  }
  
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {processedTags.map((tag, index) => {
        const tagName = typeof tag === 'object' ? tag.name : tag;
        const count = typeof tag === 'object' ? (tag.usage_count || tag.count) : null;
        
        return (
          <button
            key={`${tagName}-${index}`}
            onClick={() => handleTagClick(tag)}
            className={`inline-flex items-center px-2 py-1 bg-[#A78B71]/80 text-white rounded-full text-xs hover:bg-[#A78B71] transition-colors ${tagClassName}`}
          >
            #{tagName.toLowerCase()}
            {showCount && count !== null && (
              <span className="ml-1 bg-white/20 px-1.5 py-0.5 rounded-full text-[10px]">
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default HashtagList;
