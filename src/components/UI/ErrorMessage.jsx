// src/components/UI/ErrorMessage.jsx
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Button from '@/components/Button'; // Corrected import path

const ErrorMessage = ({
  message = 'An unexpected error occurred.',
  onRetry, // Optional retry function
  isLoadingRetry = false, // Optional loading state for retry button
  containerClassName = 'text-center py-8 px-4 max-w-lg mx-auto',
  messageClassName = 'text-red-600 mb-4',
  iconClassName = 'h-10 w-10 text-red-400 mx-auto mb-3',
  children // Allow adding extra content like links
}) => {
  return (
    <div className={containerClassName}>
      <AlertTriangle className={iconClassName} aria-hidden="true" />
      <p className={messageClassName}>{message}</p>
      {onRetry && (
        <Button
            onClick={onRetry}
            variant="primary" // Or choose another appropriate variant
            size="sm"
            disabled={isLoadingRetry}
            className="mb-2" // Add some margin if children are present
        >
          {isLoadingRetry ? 'Retrying...' : 'Retry'}
        </Button>
      )}
      {/* Render any children passed (e.g., a 'Back' link) */}
      {children}
    </div>
  );
};

export default ErrorMessage;