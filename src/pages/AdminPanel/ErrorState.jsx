import React from 'react';
import { AlertCircle } from 'lucide-react';

const ErrorState = ({ error, onRetry }) => (
  <div className="p-4 text-center">
    <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
    <h3 className="text-lg font-medium text-foreground mb-1">Error Loading Data</h3>
    <p className="text-muted-foreground mb-4">{error?.message || 'An unexpected error occurred'}</p>
    <button
      onClick={onRetry}
      className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
    >
      Try Again
    </button>
  </div>
);

export default ErrorState; 