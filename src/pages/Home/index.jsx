/* src/pages/Home/index.jsx */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Results from './Results'; // Keep relative
import FilterContainer from '@/components/Filters/FilterContainer'; // Use the new FilterContainer
import SearchBar from '@/components/UI/SearchBar'; // Use alias
import ToggleSwitch from '@/components/UI/ToggleSwitch'; // Use alias
import TrendingTicker from '@/components/UI/TrendingTicker'; // Add trending ticker
import RestaurantCard from '@/components/UI/RestaurantCard';
import DishCard from '@/components/UI/DishCard';
import ListCard from '@/pages/Lists/ListCard';
import Button from '@/components/UI/Button';
import { useQuery } from '@tanstack/react-query';
import { trendingService } from '@/services/trendingService';
import { logDebug } from '@/utils/logger';
import { TrendingUp } from 'lucide-react';

const Home = () => {
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [contentType, setContentType] = useState('restaurants');
  const [filters, setFilters] = useState({});
  const [isSearchSticky, setIsSearchSticky] = useState(false);
  
  // Refs for intersection observer
  const searchBarRef = useRef(null);
  const stickySearchRef = useRef(null);

  // Fetch trending data
  const { data: trendingData = [] } = useQuery({
    queryKey: ['trending', contentType],
    queryFn: () => trendingService.getTrending(contentType),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !searchQuery // Only fetch when not searching
  });

  // Handle filter changes from FilterContainer
  const handleFilterChange = useCallback((newFilters) => {
    logDebug('[Home] Filters changed:', newFilters);
    setFilters(newFilters);
  }, []);

  // Handle search
  const handleSearch = useCallback((query) => {
    logDebug('[Home] Search query changed:', query);
    setSearchQuery(query);
  }, []);

  // Handle content type toggle
  const handleContentTypeChange = useCallback((newType) => {
    logDebug('[Home] Content type changed:', newType);
    setContentType(newType);
  }, []);

  // Sticky search bar logic
  useEffect(() => {
    const searchElement = searchBarRef.current;
    if (!searchElement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsSearchSticky(!entry.isIntersecting);
        });
      },
      { threshold: 0, rootMargin: '-100px 0px 0px 0px' }
    );

    observer.observe(searchElement);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Scroll to top when sticky search is clicked
  const handleStickySearchClick = () => {
    searchBarRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50 navbar-spacing">
      {/* Sticky Search Bar */}
      {isSearchSticky && (
        <div
          ref={stickySearchRef}
          className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 shadow-sm navbar-spacing"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <SearchBar
                  onSearch={handleSearch}
                  placeholder={`Search ${contentType}...`}
                  initialValue={searchQuery}
                  onClick={handleStickySearchClick}
                />
              </div>
              <ToggleSwitch
                options={[
                  { value: 'restaurants', label: 'Restaurants' },
                  { value: 'dishes', label: 'Dishes' },
                  { value: 'lists', label: 'Lists' }
                ]}
                value={contentType}
                onChange={handleContentTypeChange}
              />
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#F8F6F0] to-[#E8E2D5] text-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Find Your Next Great <span className="text-[#A78B71]">Meal</span>
            </h1>
            <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
              Discover restaurants, dishes, and curated lists from fellow food lovers in your city.
            </p>
            
            {/* Main Search Bar */}
            <div ref={searchBarRef} className="max-w-2xl mx-auto">
              <SearchBar
                onSearch={handleSearch}
                placeholder={`Search ${contentType}...`}
                size="lg"
                initialValue={searchQuery}
              />
            </div>
            
            {/* Content Type Toggle */}
            <div className="mt-6">
              <ToggleSwitch
                options={[
                  { value: 'restaurants', label: 'Restaurants' },
                  { value: 'dishes', label: 'Dishes' },
                  { value: 'lists', label: 'Lists' }
                ]}
                value={contentType}
                onChange={handleContentTypeChange}
                size="lg"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Trending Ticker */}
      {!searchQuery && trendingData.length > 0 && (
        <TrendingTicker items={trendingData.slice(0, 10)} />
      )}

      {/* Main Content */}
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${isSearchSticky ? 'pt-20' : ''}`}>
        {/* Trending Snapshot Section */}
        {!searchQuery && trendingData.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <TrendingUp className="mr-2 text-[#A78B71]" />
                Trending {contentType.charAt(0).toUpperCase() + contentType.slice(1)}
              </h2>
            </div>
            
            {/* Trending Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {trendingData.slice(0, 8).map((item) => {
                if (contentType === 'restaurants') {
                  return <RestaurantCard key={item.id} {...item} />;
                } else if (contentType === 'dishes') {
                  return <DishCard key={item.id} {...item} restaurant={item.restaurant || item.restaurant_name} />;
                } else if (contentType === 'lists') {
                  return <ListCard key={item.id} list={item} />;
                }
                return null;
              })}
            </div>
            
            {/* For More Button */}
            <div className="text-center">
              <Link to="/trending">
                <Button className="bg-white text-black border-gray-300 hover:bg-gray-50 hover:border-gray-400 shadow-sm">
                  For more - check out the Trending page
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Filters Section */}
        <div className="mb-8">
          <FilterContainer 
            onFilterChange={handleFilterChange}
            initialFilters={{}}
            showControls={true}
            showActiveFilters={true}
          />
        </div>

        {/* Results Section */}
        <Results 
          searchQuery={searchQuery}
          contentType={contentType}
          cityId={filters.cityId}
          boroughId={filters.boroughId}
          neighborhoodId={filters.neighborhoodId}
          hashtags={filters.hashtags || []}
        />
      </div>
    </div>
  );
};

export default Home;