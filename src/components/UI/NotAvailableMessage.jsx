import React from 'react';
import { AlertTriangle } from 'lucide-react';

const NotAvailableMessage = ({ 
  title = "Feature Not Available", 
  message = "This feature is not available in the current version.", 
  actionLabel, 
  onAction 
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-muted rounded-lg border border-border text-center">
      <AlertTriangle size={48} className="text-yellow-500 mb-4" />
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4 max-w-md">{message}</p>
      {actionLabel && onAction && (
        <button 
          onClick={onAction}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default NotAvailableMessage; 