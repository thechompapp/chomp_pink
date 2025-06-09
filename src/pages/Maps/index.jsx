/* src/pages/Maps/index.jsx */
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapPin, Navigation, Layers, Search, Grid } from 'lucide-react';
import Button from '@/components/UI/Button';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import neighborhoodService from '@/services/neighborhoodService';
import NYCMap from '@/components/Maps/NYCMap';

/**
 * Maps Page Component
 * Interactive map of NYC neighborhoods and restaurants
 */
const Maps = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(null);
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [filteredNeighborhoods, setFilteredNeighborhoods] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('map'); // 'map' or 'grid'
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Get selected neighborhood from URL
  const neighborhoodParam = searchParams.get('neighborhood');
  
  // Fetch neighborhoods on component mount
  useEffect(() => {
    const fetchNeighborhoods = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // The API returns a hierarchical structure. We need to flatten it for the map.
        const hierarchicalData = await neighborhoodService.getNeighborhoods();

        const flattenNeighborhoods = (nodes) => {
          let flatArray = [];
          if (!Array.isArray(nodes)) {
            return flatArray;
          }
          
          nodes.forEach(node => {
            // Add the node itself if it's a renderable neighborhood (or any level you want to include)
            flatArray.push(node);
            
            // If the node has children, recurse
            if (node.children && node.children.length > 0) {
              flatArray = flatArray.concat(flattenNeighborhoods(node.children));
            }
          });
          
          return flatArray;
        };
        
        const nycNeighborhoods = flattenNeighborhoods(hierarchicalData);

        // The frontend no longer needs to filter by restaurant_count > 0 here,
        // as the map component itself has logic to hide/show boundaries based on this.
        // Passing all neighborhoods allows for more flexible future display options.
        setNeighborhoods(nycNeighborhoods);
        setFilteredNeighborhoods(nycNeighborhoods);
        
        // If there's a neighborhood parameter in URL, find and select it
        if (neighborhoodParam) {
          const foundNeighborhood = nycNeighborhoods.find(n => 
            n.name.toLowerCase().replace(/\s+/g, '-') === neighborhoodParam
          );
          if (foundNeighborhood) {
            setSelectedNeighborhood(foundNeighborhood);
          }
        }
      } catch (err) {
        console.error('Error fetching neighborhoods:', err);
        setError('Failed to load neighborhoods. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchNeighborhoods();
  }, [neighborhoodParam]);
  
  // Handle search functionality
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredNeighborhoods(neighborhoods);
      return;
    }
    
    const filtered = neighborhoods.filter(neighborhood =>
      neighborhood.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredNeighborhoods(filtered);
  }, [searchQuery, neighborhoods]);
  
  const handleNeighborhoodSelect = (neighborhood) => {
    setSelectedNeighborhood(neighborhood);
    setSearchParams({ neighborhood: neighborhood.name.toLowerCase().replace(/\s+/g, '-') });
  };
  
  const handleResetView = () => {
    setSelectedNeighborhood(null);
    setSearchParams({});
  };
  
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  const toggleViewMode = () => {
    setViewMode(viewMode === 'map' ? 'grid' : 'map');
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Loading NYC neighborhoods..." />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <MapPin className="h-12 w-12 mx-auto mb-2" />
            <p className="text-lg font-semibold">{error}</p>
          </div>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MapPin className="h-8 w-8 text-[#FF00A8]" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  NYC Restaurant Map
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Explore restaurants by neighborhood • {neighborhoods.length} neighborhoods with restaurants
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* View Mode Toggle */}
              {!selectedNeighborhood && (
                <Button
                  variant="outline"
                  onClick={toggleViewMode}
                  className="flex items-center space-x-2"
                  size="sm"
                >
                  {viewMode === 'map' ? (
                    <>
                      <Grid className="h-4 w-4" />
                      <span className="hidden sm:inline">Grid View</span>
                    </>
                  ) : (
                    <>
                      <MapPin className="h-4 w-4" />
                      <span className="hidden sm:inline">Map View</span>
                    </>
                  )}
                </Button>
              )}
              
              {selectedNeighborhood && (
                <Button
                  variant="outline"
                  onClick={handleResetView}
                  className="flex items-center space-x-2"
                >
                  <Navigation className="h-4 w-4" />
                  <span>Reset View</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!selectedNeighborhood ? (
          /* Neighborhood Selection View */
          <div className="space-y-6">
            {/* Search Bar */}
            <div className="max-w-md mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search neighborhoods..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-[#FF00A8] focus:border-transparent"
                />
              </div>
            </div>

            {viewMode === 'map' ? (
              /* Interactive Map View */
              <NYCMap
                neighborhoods={filteredNeighborhoods}
                onNeighborhoodClick={handleNeighborhoodSelect}
                selectedNeighborhood={selectedNeighborhood}
              />
            ) : (
              /* Grid View */
              <div className="space-y-4">
                <div className="text-center">
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                    Select a Neighborhood
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Click on any neighborhood below to explore its restaurants
                  </p>
                </div>
                
                {filteredNeighborhoods.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredNeighborhoods.map((neighborhood) => (
                      <div
                        key={neighborhood.id}
                        onClick={() => handleNeighborhoodSelect(neighborhood)}
                        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 cursor-pointer hover:shadow-lg hover:border-[#FF00A8] transition-all duration-200 group"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-[#FF00A8] transition-colors">
                              {neighborhood.name}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {neighborhood.restaurant_count} restaurant{parseInt(neighborhood.restaurant_count) !== 1 ? 's' : ''}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              {neighborhood.city_name}
                            </p>
                          </div>
                          <MapPin className="h-6 w-6 text-gray-400 group-hover:text-[#FF00A8] transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      No neighborhoods found matching "{searchQuery}"
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Selected Neighborhood View */
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                {selectedNeighborhood.name}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {selectedNeighborhood.restaurant_count} restaurant{parseInt(selectedNeighborhood.restaurant_count) !== 1 ? 's' : ''} in this neighborhood
              </p>
            </div>
            
            {/* Map Placeholder */}
            <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-96 flex items-center justify-center">
              <div className="text-center">
                <Layers className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Interactive map will be implemented here
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                  Showing restaurants in {selectedNeighborhood.name}
                </p>
              </div>
            </div>
            
            {/* Restaurant List Placeholder */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Restaurants in {selectedNeighborhood.name}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Restaurant listings will be integrated here with the existing restaurant components.
                This neighborhood has {selectedNeighborhood.restaurant_count} restaurant{parseInt(selectedNeighborhood.restaurant_count) !== 1 ? 's' : ''} to explore.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Maps; 