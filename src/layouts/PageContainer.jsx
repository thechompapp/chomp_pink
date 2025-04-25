import React from 'react';
import PropTypes from 'prop-types';

/**
 * A simple container component to provide consistent padding and max-width for page content.
 * Now always uses light background.
 */
const PageContainer = ({ children, maxWidth = 'max-w-7xl' }) => {
  return (
    // Removed dark:bg-gray-900 - always uses light bg
    <main className={`container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 ${maxWidth} bg-white text-gray-900 rounded-md shadow-sm mb-8`}>
      {children}
    </main>
  );
};

PageContainer.propTypes = {
  children: PropTypes.node.isRequired,
  maxWidth: PropTypes.string, // e.g., 'max-w-7xl', 'max-w-5xl'
};

export default PageContainer;