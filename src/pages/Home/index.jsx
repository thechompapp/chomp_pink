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
  // Lifted state for filters
  const [filters, setFilters] = useState({
    cityId: null,
    boroughId: null, // Added boroughId
    neighborhoodId: null,
    hashtags: [],
  });

  // State for content type toggle (moved from Results)
  const [contentType, setContentType] = useState('lists'); // Default to lists
  
  // State for search functionality
  const [searchQuery, setSearchQuery] = useState('');
  
  // State for sticky search bar
  const [isSearchSticky, setIsSearchSticky] = useState(false);
  const searchSectionRef = useRef(null);

  // Fetch trending data for snapshots (8 items each)
  const { data: trendingRestaurants } = useQuery({
    queryKey: ['trendingRestaurantsHome'],
    queryFn: () => trendingService.getTrendingRestaurants(8),
    staleTime: 5 * 60 * 1000,
    placeholderData: []
  });

  const { data: trendingDishes } = useQuery({
    queryKey: ['trendingDishesHome'],
    queryFn: () => trendingService.getTrendingDishes(8),
    staleTime: 5 * 60 * 1000,
    placeholderData: []
  });

  const { data: trendingLists } = useQuery({
    queryKey: ['trendingListsHome'],
    queryFn: () => trendingService.getTrendingLists(8),
    staleTime: 5 * 60 * 1000,
    placeholderData: []
  });

  // Scroll handler for sticky search bar
  useEffect(() => {
    const handleScroll = () => {
      if (searchSectionRef.current) {
        const rect = searchSectionRef.current.getBoundingClientRect();
        setIsSearchSticky(rect.bottom <= 0);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Filter change handler
  const handleFilterChange = useCallback((newFilters) => {
    logDebug('[Home] Filter changed:', newFilters);
    setFilters(newFilters);
  }, []);

  // Content type toggle handler
  const handleContentTypeChange = useCallback((type) => {
    logDebug('[Home] Content type changed to:', type);
    setContentType(type);
  }, []);

  // Search handler
  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
  }, []);

  // Get trending data based on toggle
  const getTrendingData = () => {
    switch (contentType) {
      case 'restaurants':
        return Array.isArray(trendingRestaurants) ? trendingRestaurants : [];
      case 'dishes':
        return Array.isArray(trendingDishes) ? trendingDishes : [];
      case 'lists':
        return Array.isArray(trendingLists) ? trendingLists : [];
      default:
        return [];
    }
  };

  const trendingData = getTrendingData();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Section */}
      <div ref={searchSectionRef} className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-20">
          <div className="text-center mb-6">
            {/* Main Logo Marquee */}
            <div className="flex justify-center mb-4">
              <img 
                src="/images/dooflogo.png" 
                alt="DOOF Logo" 
                className="h-24 sm:h-32 w-auto"
              />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Discover Amazing Food
            </h1>
            <p className="text-gray-600">
              Find restaurants, dishes, and curated lists from food lovers
            </p>
          </div>
          
          <SearchBar 
            className="mb-6" 
            contentType={contentType}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSearch={handleSearch}
          />
          
          {/* Content Type Toggle */}
          <div className="flex justify-center">
            <ToggleSwitch
              options={[
                { value: 'lists', label: 'Lists' },
                { value: 'restaurants', label: 'Restaurants' },
                { value: 'dishes', label: 'Dishes' }
              ]}
              selected={contentType}
              onChange={handleContentTypeChange}
              className="mb-4"
            />
          </div>
        </div>
      </div>

      {/* Sticky Search Bar */}
      {isSearchSticky && (
        <div className="fixed top-16 left-0 right-0 z-40 bg-white shadow-md border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <SearchBar 
                  contentType={contentType}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  onSearch={handleSearch}
                  className="mb-0"
                />
              </div>
              <div className="flex-shrink-0">
                <ToggleSwitch
                  options={[
                    { value: 'lists', label: 'Lists' },
                    { value: 'restaurants', label: 'Restaurants' },
                    { value: 'dishes', label: 'Dishes' }
                  ]}
                  selected={contentType}
                  onChange={handleContentTypeChange}
                  className="mb-0"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trending Ticker */}
      <TrendingTicker 
        refreshInterval={180000} // 3 minutes
        scrollSpeed="normal"
        pauseOnHover={true}
      />

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

        {/* Filters Section - Now on Top */}
        <div className="mb-8">
          <FilterContainer 
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        </div>

        {/* Results Section - Full Width */}
        <div className="w-full">
          <Results 
            filters={filters}
            contentType={contentType}
            searchQuery={searchQuery}
          />
        </div>
      </div>
    </div>
  );
};

export default Home;