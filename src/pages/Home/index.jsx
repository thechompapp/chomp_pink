// src/pages/Home/index.jsx
import React from 'react';
import Results from './Results';
import FilterSection from '@/components/FilterSection';

const Home = () => {
  return (
    // Add container and mx-auto here to constrain the Home page content width
    <div className="container mx-auto px-4"> {/* Apply container centering and padding */}
      {/* Vertical stacking layout */}
      <div className="mb-6 lg:mb-8">
        <FilterSection />
      </div>
      <div>
        <Results />
      </div>
    </div>
  );
};

export default Home;