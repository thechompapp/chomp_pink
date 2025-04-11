// src/components/UI/ErrorMessage.jsx
import React from 'react';
import { AlertTriangle, RefreshCw, Loader2 } from 'lucide-react'; // Added Loader2
// --- Corrected Import Path ---
import Button from '@/components/UI/Button.jsx'; // Use alias and correct path
// --- End Correction ---

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
    <div className={containerClassName} role="alert"> {/* Added role="alert" */}
      <AlertTriangle className={iconClassName} aria-hidden="true" />
      <p className={messageClassName}>{message}</p>
      {onRetry && (
        <Button
            onClick={onRetry}
            variant="secondary" // Use secondary for retry to differentiate? Or keep primary.
            size="sm"
            disabled={isLoadingRetry}
            // Pass isLoading prop if Button supports it, otherwise handle visually
            className={`mb-2 ${isLoadingRetry ? 'opacity-70 cursor-wait' : ''}`} // Visual cue for loading
            aria-label="Retry loading data" // More specific label
        >
          {isLoadingRetry ? (
              <>
                <Loader2 className="animate-spin h-4 w-4 mr-1" /> {/* Use Loader2 */}
                Retrying...
              </>
           ) : (
              <>
                <RefreshCw size={14} className="mr-1" /> {/* Added retry icon */}
                Retry
              </>
           )}
        </Button>
      )}
      {/* Render any children passed (e.g., a 'Back' link) */}
      {children}
    </div>
  );
};

export default ErrorMessage;