/**
 * ProgressiveFilterLoader.jsx - Progressive Loading for Filter Components
 * 
 * Phase 3: Advanced Optimizations
 * - Progressive loading with intelligent skeleton states
 * - Staged data loading based on priority
 * - Smooth transitions between loading states
 * - Adaptive loading strategies
 * - Performance-optimized skeleton animations
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { logDebug, logError } from '@/utils/logger';

/**
 * Skeleton Components for different filter types
 */
const FilterSkeleton = ({ width = "100%", height = "2rem", className = "" }) => (
  <div className={`animate-pulse ${className}`}>
    <div
      className="bg-gray-200 rounded-md"
      style={{ width, height }}
    />
  </div>
);

const FilterItemSkeleton = ({ count = 5, staggered = true }) => (
  <div className="space-y-2">
    {Array.from({ length: count }).map((_, index) => (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: 0.3, 
          delay: staggered ? index * 0.1 : 0 
        }}
      >
        <FilterSkeleton 
          width={`${Math.random() * 40 + 60}%`}
          height="2.5rem"
          className="rounded-full"
        />
      </motion.div>
    ))}
  </div>
);

const FilterGroupSkeleton = ({ title, itemCount = 5 }) => (
  <div className="space-y-3">
    <FilterSkeleton width="120px" height="1.5rem" className="font-semibold" />
    <FilterItemSkeleton count={itemCount} />
  </div>
);

/**
 * Loading States Enum
 */
const LOADING_STATES = {
  IDLE: 'idle',
  INITIAL: 'initial',
  PROGRESSIVE: 'progressive',
  COMPLETE: 'complete',
  ERROR: 'error',
  REFRESHING: 'refreshing'
};

/**
 * Loading Priorities for staged loading
 */
const LOADING_PRIORITIES = {
  CRITICAL: 'critical',    // Cities, essential data
  HIGH: 'high',           // Cuisines, frequently used filters
  MEDIUM: 'medium',       // Boroughs, secondary data
  LOW: 'low'             // Neighborhoods, tertiary data
};

/**
 * Progressive Filter Loader Component
 */
const ProgressiveFilterLoader = ({
  children,
  loadingStages = [],
  onLoadStage,
  enableIntersectionLoading = true,
  enableSkeletonAnimations = true,
  skeletonVariant = 'default',
  className = "",
  errorRetryAttempts = 3,
  loadingTimeout = 30000, // 30 seconds
  staggerDelay = 100
}) => {
  // State management
  const [currentState, setCurrentState] = useState(LOADING_STATES.IDLE);
  const [currentStage, setCurrentStage] = useState(0);
  const [stageErrors, setStageErrors] = useState({});
  const [retryAttempts, setRetryAttempts] = useState({});
  const [isVisible, setIsVisible] = useState(!enableIntersectionLoading);

  // Intersection observer for lazy loading
  const [containerRef, isIntersecting] = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px',
    triggerOnce: true
  });

  // Update visibility based on intersection
  useEffect(() => {
    if (enableIntersectionLoading && isIntersecting) {
      setIsVisible(true);
    }
  }, [isIntersecting, enableIntersectionLoading]);

  // ================================
  // PROGRESSIVE LOADING LOGIC
  // ================================

  /**
   * Execute a single loading stage
   */
  const executeStage = useCallback(async (stageIndex) => {
    const stage = loadingStages[stageIndex];
    if (!stage || !onLoadStage) return;

    const stageKey = `stage_${stageIndex}`;
    
    try {
      logDebug(`[ProgressiveFilterLoader] Starting stage ${stageIndex}:`, stage.name);
      setCurrentState(LOADING_STATES.PROGRESSIVE);
      
      // Add timeout for stage loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Stage timeout')), loadingTimeout)
      );
      
      const stagePromise = onLoadStage(stage, stageIndex);
      
      await Promise.race([stagePromise, timeoutPromise]);
      
      logDebug(`[ProgressiveFilterLoader] Completed stage ${stageIndex}`);
      
      // Clear any previous errors for this stage
      setStageErrors(prev => {
        const updated = { ...prev };
        delete updated[stageKey];
        return updated;
      });
      
    } catch (error) {
      logError(`[ProgressiveFilterLoader] Stage ${stageIndex} failed:`, error);
      
      const attempts = retryAttempts[stageKey] || 0;
      
      if (attempts < errorRetryAttempts) {
        // Retry the stage
        setRetryAttempts(prev => ({
          ...prev,
          [stageKey]: attempts + 1
        }));
        
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempts), 10000);
        setTimeout(() => executeStage(stageIndex), delay);
      } else {
        // Mark stage as failed
        setStageErrors(prev => ({
          ...prev,
          [stageKey]: error.message
        }));
      }
    }
  }, [loadingStages, onLoadStage, loadingTimeout, errorRetryAttempts, retryAttempts]);

  /**
   * Start progressive loading sequence
   */
  const startProgressiveLoading = useCallback(async () => {
    if (!isVisible || !loadingStages.length) return;
    
    setCurrentState(LOADING_STATES.INITIAL);
    setCurrentStage(0);
    
    // Sort stages by priority
    const sortedStages = [...loadingStages].sort((a, b) => {
      const priorityOrder = {
        [LOADING_PRIORITIES.CRITICAL]: 0,
        [LOADING_PRIORITIES.HIGH]: 1,
        [LOADING_PRIORITIES.MEDIUM]: 2,
        [LOADING_PRIORITIES.LOW]: 3
      };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
    
    // Execute stages based on priority
    const criticalStages = sortedStages.filter(s => s.priority === LOADING_PRIORITIES.CRITICAL);
    const otherStages = sortedStages.filter(s => s.priority !== LOADING_PRIORITIES.CRITICAL);
    
    try {
      // Load critical stages first (in parallel)
      if (criticalStages.length > 0) {
        logDebug('[ProgressiveFilterLoader] Loading critical stages');
        await Promise.all(
          criticalStages.map((stage, index) => 
            executeStage(loadingStages.indexOf(stage))
          )
        );
      }
      
      // Load other stages progressively
      for (let i = 0; i < otherStages.length; i++) {
        const stage = otherStages[i];
        const originalIndex = loadingStages.indexOf(stage);
        setCurrentStage(originalIndex);
        
        await executeStage(originalIndex);
        
        // Add stagger delay between stages
        if (i < otherStages.length - 1) {
          await new Promise(resolve => setTimeout(resolve, staggerDelay));
        }
      }
      
      setCurrentState(LOADING_STATES.COMPLETE);
      logDebug('[ProgressiveFilterLoader] All stages completed');
      
    } catch (error) {
      logError('[ProgressiveFilterLoader] Progressive loading failed:', error);
      setCurrentState(LOADING_STATES.ERROR);
    }
  }, [isVisible, loadingStages, executeStage, staggerDelay]);

  // Start loading when visible
  useEffect(() => {
    if (isVisible && currentState === LOADING_STATES.IDLE) {
      startProgressiveLoading();
    }
  }, [isVisible, currentState, startProgressiveLoading]);

  // ================================
  // SKELETON VARIANTS
  // ================================

  const renderSkeleton = useMemo(() => {
    switch (skeletonVariant) {
      case 'minimal':
        return (
          <div className="space-y-4">
            <FilterSkeleton width="200px" height="2rem" />
            <FilterItemSkeleton count={3} staggered={false} />
          </div>
        );
      
      case 'detailed':
        return (
          <div className="space-y-6">
            <FilterGroupSkeleton title="Location" itemCount={4} />
            <FilterGroupSkeleton title="Cuisine" itemCount={6} />
            <FilterGroupSkeleton title="Other" itemCount={3} />
          </div>
        );
      
      case 'progressive':
        const completedStages = Object.keys(stageErrors).length + currentStage;
        return (
          <div className="space-y-4">
            {loadingStages.slice(0, completedStages + 1).map((stage, index) => (
              <motion.div
                key={stage.name}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <FilterGroupSkeleton 
                  title={stage.name} 
                  itemCount={stage.expectedItemCount || 5} 
                />
              </motion.div>
            ))}
          </div>
        );
      
      default:
        return (
          <div className="space-y-4">
            <FilterGroupSkeleton title="Filters" itemCount={5} />
          </div>
        );
    }
  }, [skeletonVariant, currentStage, stageErrors, loadingStages]);

  // ================================
  // ERROR HANDLING
  // ================================

  const handleRetry = useCallback(() => {
    setCurrentState(LOADING_STATES.IDLE);
    setCurrentStage(0);
    setStageErrors({});
    setRetryAttempts({});
    startProgressiveLoading();
  }, [startProgressiveLoading]);

  const hasErrors = Object.keys(stageErrors).length > 0;
  const isLoading = [LOADING_STATES.INITIAL, LOADING_STATES.PROGRESSIVE].includes(currentState);
  const isComplete = currentState === LOADING_STATES.COMPLETE;

  // ================================
  // RENDER
  // ================================

  return (
    <div ref={containerRef} className={`progressive-filter-loader ${className}`}>
      <AnimatePresence mode="wait">
        {/* Loading State */}
        {isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {enableSkeletonAnimations ? (
              renderSkeleton
            ) : (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin mr-2" size={20} />
                <span className="text-gray-600">Loading filters...</span>
              </div>
            )}
          </motion.div>
        )}

        {/* Error State */}
        {currentState === LOADING_STATES.ERROR && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center justify-center py-8 text-center"
          >
            <AlertCircle className="text-red-500 mb-2" size={24} />
            <p className="text-red-600 mb-3">Failed to load filter data</p>
            <button
              onClick={handleRetry}
              className="flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
            >
              <RefreshCw size={16} className="mr-2" />
              Retry
            </button>
          </motion.div>
        )}

        {/* Partial Error State */}
        {hasErrors && !isLoading && currentState !== LOADING_STATES.ERROR && (
          <motion.div
            key="partial-error"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4"
          >
            <div className="flex items-center">
              <AlertCircle className="text-yellow-600 mr-2" size={16} />
              <span className="text-yellow-800 text-sm">
                Some filters failed to load. Functionality may be limited.
              </span>
            </div>
          </motion.div>
        )}

        {/* Loaded Content */}
        {(isComplete || (!isLoading && currentState !== LOADING_STATES.ERROR)) && children && (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Progress (for debugging) */}
      {process.env.NODE_ENV === 'development' && isLoading && (
        <div className="mt-2 text-xs text-gray-500">
          Stage {currentStage + 1} of {loadingStages.length}
          {loadingStages[currentStage] && ` - ${loadingStages[currentStage].name}`}
        </div>
      )}
    </div>
  );
};

// Helper hook for creating loading stages
export const useProgressiveLoading = (stages) => {
  const [loadingStages] = useState(stages);
  
  const createStage = useCallback((name, priority, loader, options = {}) => ({
    name,
    priority,
    loader,
    expectedItemCount: options.expectedItemCount || 5,
    timeout: options.timeout || 10000,
    retryable: options.retryable !== false
  }), []);

  return {
    loadingStages,
    createStage,
    LOADING_PRIORITIES
  };
};

export default ProgressiveFilterLoader; 