import React from 'react';

const TableSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-10 bg-muted rounded-t-lg" />
    {[...Array(5)].map((_, i) => (
      <div key={i} className="h-16 bg-muted/50 border-b border-border" />
    ))}
  </div>
);

export default TableSkeleton; 