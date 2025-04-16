// src/pages/Home/index.jsx
import React from 'react';
import Results from './Results';
import FilterSection from '@/components/FilterSection'; // Use alias

const Home = () => {
  return (
    // Apply the same container classes as the Trending page for consistency
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
        {/* Filter Section */}
        <div className="mb-6 lg:mb-8"> {/* Keep existing margin if needed */}
            <FilterSection />
        </div>
        {/* Results Section */}
        <div>
            <Results />
        </div>
    </div>
  );
};

export default Home;