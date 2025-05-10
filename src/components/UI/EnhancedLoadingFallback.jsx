// src/components/UI/EnhancedLoadingFallback.jsx
import React, { useState, useEffect } from 'react';
import { logError, logInfo } from '@/utils/logger';

const EnhancedLoadingFallback = ({ componentName = 'component' }) => {
  const [loadingTime, setLoadingTime] = useState(0);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setLoadingTime(elapsed);
      
      // Log loading status and show warning after 3 seconds
      if (elapsed === 3 && !showWarning) {
        setShowWarning(true);
        logInfo(`[EnhancedLoadingFallback] ${componentName} is taking longer than expected to load (${elapsed}s)`);
      }
      
      // If loading takes more than 10 seconds, there's likely an issue
      if (elapsed === 10) {
        logError(`[EnhancedLoadingFallback] Possible loading failure for ${componentName} after ${elapsed}s`);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [componentName]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] p-6">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
      <p className="text-lg font-medium text-gray-700">Loading {componentName}...</p>
      
      {showWarning && (
        <div className="mt-6 max-w-md">
          <p className="text-amber-600 text-sm">
            This is taking longer than expected ({loadingTime}s).
            {loadingTime > 5 && " There might be an issue with loading this component."}
          </p>
          {loadingTime > 8 && (
            <p className="text-red-600 text-sm mt-2">
              If this persists, try refreshing the page or check the console for errors.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedLoadingFallback;
