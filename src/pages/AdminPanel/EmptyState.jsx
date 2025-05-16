import React from 'react';

const EmptyState = ({ resourceType, onAdd }) => (
  <div className="p-4 text-center">
    <h3 className="text-lg font-medium text-foreground mb-1">No {resourceType} Found</h3>
    <p className="text-muted-foreground mb-4">Get started by adding a new {resourceType.slice(0, -1)}</p>
    <button
      onClick={onAdd}
      className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
    >
      Add New
    </button>
  </div>
);

export default EmptyState; 