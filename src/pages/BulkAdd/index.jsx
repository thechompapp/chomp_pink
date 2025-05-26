/**
 * BulkAdd Page Index
 * Entry point for the Bulk Add feature
 */
import React from 'react';
import BulkAddPage from './BulkAddPage';

/**
 * BulkAdd component - entry point for the Bulk Add feature
 * Uses the refactored BulkAddPage component with improved architecture
 * @returns {JSX.Element} - Rendered component
 */
const BulkAdd = () => {
  return <BulkAddPage />;
};

export default BulkAdd;
