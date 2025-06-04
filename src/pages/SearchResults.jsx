import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import Button from '@/components/UI/Button';

/**
 * SearchResults Page Component
 * Displays search results based on query parameters
 */
const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const query = searchParams.get('q') || '';
  const type = searchParams.get('type') || 'all';
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Back button */}
      <Button 
        onClick={() => navigate(-1)} 
        variant="tertiary" 
        size="sm" 
        className="mb-6 flex items-center text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft size={16} className="mr-1" /> 
        Back
      </Button>

      {/* Search header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Search className="w-6 h-6 text-gray-400 mr-3" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Search Results
          </h1>
        </div>
        
        {query && (
          <p className="text-gray-600 dark:text-gray-400">
            Showing results for: <span className="font-semibold">"{query}"</span>
          </p>
        )}
      </div>

      {/* Results content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
        <div className="text-center">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Search Results Coming Soon
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Advanced search functionality is being developed. 
            {query && ` Your search for "${query}" will be processed once this feature is ready.`}
          </p>
          <div className="space-y-3">
            <Button 
              onClick={() => navigate('/search')} 
              className="mr-3"
            >
              Try Basic Search
            </Button>
            <Button 
              onClick={() => navigate('/')} 
              variant="secondary"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchResults; 