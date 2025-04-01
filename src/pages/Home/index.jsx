// src/pages/Home/index.jsx
import React, { useEffect } from 'react';
import PageContainer from '../../layouts/PageContainer';
import FilterSection from './FilterSection';
import Results from './Results';
import useAppStore from '../../hooks/useAppStore';

const Home = () => {
  // Use selectors from the store
  const fetchInitialData = useAppStore(state => state.fetchInitialData);
  const fetchTrendingData = useAppStore(state => state.fetchTrendingData);
  const isLoading = useAppStore(state => state.isLoading);
  const error = useAppStore(state => state.error);
  
  useEffect(() => {
    // Load initial data (cities, cuisines) and trending items on mount
    fetchInitialData();
    fetchTrendingData();
  }, [fetchInitialData, fetchTrendingData]);
  
  return (
    <PageContainer>
      <div className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-6">Discover What's Trending</h1>
        
        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <p>{error}</p>
          </div>
        )}
        
        {/* Filter Section */}
        <FilterSection />
        
        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center my-8">
            <div className="loader">Loading...</div>
          </div>
        )}
        
        {/* Results Grid */}
        <Results />
      </div>
    </PageContainer>
  );
};

export default Home;