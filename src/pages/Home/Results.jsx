// src/pages/Home/Results.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import useAppStore from '../../hooks/useAppStore';
import useFilteredData from '../../hooks/useFilteredData';

const Results = () => {
  // Get trending data from the store
  const trendingData = useAppStore(state => state.trendingData);
  
  // Apply filters to the data
  const filteredData = useFilteredData(trendingData);
  
  // Check if we have any data to display
  if (!filteredData || filteredData.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No trending items match your filters. Try adjusting your criteria.</p>
      </div>
    );
  }
  
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredData.map((item) => (
          <div key={`${item.type}-${item.id}`} className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Item Image */}
            <div className="h-48 bg-gray-200 relative">
              {item.image_url ? (
                <img 
                  src={item.image_url} 
                  alt={item.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <span className="text-gray-400">No image</span>
                </div>
              )}
              
              {/* Item Type Badge */}
              <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                {item.type === 'dish' ? 'Dish' : 
                 item.type === 'restaurant' ? 'Restaurant' : 'List'}
              </div>
            </div>
            
            {/* Item Content */}
            <div className="p-4">
              <h3 className="font-bold text-lg mb-1 truncate">
                <Link 
                  to={`/${item.type}/${item.id}`} 
                  className="hover:text-blue-600"
                >
                  {item.name}
                </Link>
              </h3>
              
              {/* Location */}
              {item.location && (
                <p className="text-gray-600 text-sm mb-2">
                  {item.location}
                </p>
              )}
              
              {/* Tags/Cuisines */}
              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {item.tags.slice(0, 3).map((tag) => (
                    <span 
                      key={tag} 
                      className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                  {item.tags.length > 3 && (
                    <span className="text-gray-500 text-xs">
                      +{item.tags.length - 3} more
                    </span>
                  )}
                </div>
              )}
              
              {/* Trending Stats */}
              <div className="flex items-center mt-3">
                <div className="text-sm text-gray-600">
                  <span className="font-medium text-green-600">
                    {item.votes_up || 0}
                  </span>{' '}
                  upvotes
                </div>
                <span className="mx-2 text-gray-300">|</span>
                <div className="text-sm text-gray-600">
                  Trending in{' '}
                  <span className="font-medium">{item.trending_location || 'NYC'}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Results;