import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tag, Loader2, Search } from 'lucide-react';
import { logDebug } from '@/utils/logger';
import { hashtagService } from '@/services/hashtagService';
import { useFilter, FILTER_TYPES } from '@/contexts/FilterContext';
import FilterGroup from './FilterGroup';
import FilterItem from './FilterItem';
import Input from '@/components/UI/Input';

/**
 * CuisineFilter component - displays cuisine/tag filters with search functionality
 * 
 * @param {Object} props - Component props
 * @param {number} props.limit - Maximum number of cuisines to display
 */
const CuisineFilter = ({ limit = 15 }) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fetch top cuisines
  const {
    data: cuisines = [],
    isLoading: isLoadingCuisines,
    error: errorCuisines
  } = useQuery({
    queryKey: ['topCuisines', limit],
    queryFn: () => hashtagService.getTopHashtags({ limit, category: 'cuisine' }),
    staleTime: Infinity,
  });
  
  // Filtered cuisines based on search
  const filteredCuisines = React.useMemo(() => {
    if (!searchQuery.trim()) return cuisines;
    
    const query = searchQuery.trim().toLowerCase();
    return cuisines.filter(cuisine => 
      cuisine.name.toLowerCase().includes(query)
    );
  }, [cuisines, searchQuery]);
  
  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  return (
    <FilterGroup
      title="Cuisines"
      icon={<Tag size={16} />}
      defaultExpanded={true}
    >
      <div className="space-y-3">
        {/* Search input */}
        <div className="relative">
          <Input
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search cuisines..."
            className="pl-8 text-sm"
          />
          <Search size={16} className="absolute left-2 top-2.5 text-gray-400" />
        </div>
        
        {/* Cuisine pills */}
        <div className="flex flex-wrap gap-2">
          {isLoadingCuisines ? (
            <Loader2 size={16} className="animate-spin text-muted-foreground" />
          ) : errorCuisines ? (
            <p className="text-sm text-destructive">Error loading cuisines</p>
          ) : filteredCuisines.length > 0 ? (
            filteredCuisines.map(cuisine => (
              <FilterItem
                key={`cuisine-${cuisine.id || cuisine.name}`}
                type={FILTER_TYPES.CUISINE}
                value={cuisine.name}
                label={cuisine.name}
                prefix="#"
              />
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              {searchQuery ? 'No matching cuisines found' : 'No cuisines available'}
            </p>
          )}
        </div>
      </div>
    </FilterGroup>
  );
};

export default CuisineFilter; 