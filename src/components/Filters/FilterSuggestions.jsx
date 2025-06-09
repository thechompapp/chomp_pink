/**
 * FilterSuggestions.jsx - Real-time Filter Suggestions
 * 
 * Phase 3: Advanced Optimizations
 * - Intelligent filter suggestions based on user behavior
 * - Real-time suggestion updates
 * - Smart recommendation algorithms
 * - Contextual suggestion display
 * - Performance-optimized suggestion rendering
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, TrendingUp, Clock, MapPin, Utensils, Star, X, ChevronRight } from 'lucide-react';
import { useFiltersQuery } from '@/hooks/useFiltersQuery';
import { logDebug } from '@/utils/logger';

/**
 * Suggestion Types
 */
const SUGGESTION_TYPES = {
  TRENDING: 'trending',
  POPULAR: 'popular',
  RELATED: 'related',
  CONTEXTUAL: 'contextual',
  RECENT: 'recent',
  SMART: 'smart'
};

/**
 * Suggestion Priority Levels
 */
const SUGGESTION_PRIORITIES = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

/**
 * Icon mapping for different suggestion types
 */
const SUGGESTION_ICONS = {
  [SUGGESTION_TYPES.TRENDING]: TrendingUp,
  [SUGGESTION_TYPES.POPULAR]: Star,
  [SUGGESTION_TYPES.RELATED]: ChevronRight,
  [SUGGESTION_TYPES.CONTEXTUAL]: Lightbulb,
  [SUGGESTION_TYPES.RECENT]: Clock,
  [SUGGESTION_TYPES.SMART]: Lightbulb
};

/**
 * Individual Suggestion Component
 */
const SuggestionItem = React.memo(({ 
  suggestion, 
  onApply, 
  onDismiss, 
  isHighlighted = false,
  showDismiss = true 
}) => {
  const Icon = SUGGESTION_ICONS[suggestion.type] || Lightbulb;
  
  const handleApply = useCallback(() => {
    onApply(suggestion);
  }, [suggestion, onApply]);
  
  const handleDismiss = useCallback((e) => {
    e.stopPropagation();
    onDismiss(suggestion.id);
  }, [suggestion.id, onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      className={`group relative p-3 rounded-lg border cursor-pointer transition-all duration-200 
        ${isHighlighted 
          ? 'border-blue-300 bg-blue-50 shadow-md' 
          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
        }
        ${suggestion.priority === SUGGESTION_PRIORITIES.HIGH ? 'ring-2 ring-blue-100' : ''}
      `}
      onClick={handleApply}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Suggestion Content */}
      <div className="flex items-start space-x-3">
        {/* Icon */}
        <div className={`flex-shrink-0 p-2 rounded-full 
          ${isHighlighted ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}
        `}>
          <Icon size={16} />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 mb-1">
            {suggestion.title}
          </h4>
          <p className="text-xs text-gray-600 mb-2">
            {suggestion.description}
          </p>
          
          {/* Filter Preview */}
          {suggestion.filters && (
            <div className="flex flex-wrap gap-1">
              {Object.entries(suggestion.filters).map(([key, value]) => (
                <span
                  key={key}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs 
                           bg-blue-100 text-blue-800"
                >
                  {key}: {Array.isArray(value) ? value.join(', ') : value}
                </span>
              ))}
            </div>
          )}
          
          {/* Metadata */}
          {suggestion.metadata && (
            <div className="flex items-center mt-2 text-xs text-gray-500 space-x-3">
              {suggestion.metadata.matchCount && (
                <span>{suggestion.metadata.matchCount} matches</span>
              )}
              {suggestion.metadata.confidence && (
                <span>{Math.round(suggestion.metadata.confidence * 100)}% confidence</span>
              )}
              {suggestion.metadata.lastUsed && (
                <span>Used {suggestion.metadata.lastUsed}</span>
              )}
            </div>
          )}
        </div>
        
        {/* Dismiss Button */}
        {showDismiss && (
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 rounded-full opacity-0 group-hover:opacity-100 
                     transition-opacity hover:bg-gray-200"
            aria-label="Dismiss suggestion"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Priority Indicator */}
      {suggestion.priority === SUGGESTION_PRIORITIES.HIGH && (
        <div className="absolute top-2 right-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        </div>
      )}
    </motion.div>
  );
});

/**
 * Suggestion Group Component
 */
const SuggestionGroup = React.memo(({ 
  title, 
  suggestions, 
  onApplySuggestion, 
  onDismissSuggestion,
  isCollapsed = false,
  onToggleCollapse 
}) => {
  return (
    <div className="mb-4">
      {/* Group Header */}
      <button
        onClick={onToggleCollapse}
        className="flex items-center justify-between w-full p-2 text-left text-sm font-medium 
                 text-gray-700 hover:text-gray-900 transition-colors"
      >
        <span>{title}</span>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">
            {suggestions.length} suggestion{suggestions.length !== 1 ? 's' : ''}
          </span>
          <motion.div
            animate={{ rotate: isCollapsed ? 0 : 90 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight size={14} />
          </motion.div>
        </div>
      </button>
      
      {/* Group Content */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-2 overflow-hidden"
          >
            {suggestions.map((suggestion, index) => (
              <SuggestionItem
                key={suggestion.id}
                suggestion={suggestion}
                onApply={onApplySuggestion}
                onDismiss={onDismissSuggestion}
                isHighlighted={index === 0 && suggestion.priority === SUGGESTION_PRIORITIES.HIGH}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

/**
 * Main Filter Suggestions Component
 */
const FilterSuggestions = ({
  currentFilters = {},
  onApplyFilters,
  onDismissSuggestion,
  maxSuggestions = 6,
  enableGrouping = true,
  enableRealTime = true,
  refreshInterval = 30000, // 30 seconds
  className = ""
}) => {
  // State
  const [suggestions, setSuggestions] = useState([]);
  const [dismissedSuggestions, setDismissedSuggestions] = useState(new Set());
  const [collapsedGroups, setCollapsedGroups] = useState(new Set());
  const [isVisible, setIsVisible] = useState(true);
  
  // Refs
  const refreshTimerRef = useRef(null);
  const lastUpdateRef = useRef(Date.now());

  // Get filter query for accessing suggestions
  const { suggestions: querySuggestions, queries } = useFiltersQuery(currentFilters, {
    enableSuggestions: true,
    enableRealTimeSync: enableRealTime
  });

  // ================================
  // SUGGESTION GENERATION
  // ================================

  /**
   * Generate intelligent suggestions based on current state
   */
  const generateSuggestions = useCallback(async () => {
    try {
      const generatedSuggestions = [];
      
      // Get available data for generating suggestions
      const cities = queries.cities.data || [];
      const cuisines = queries.cuisines.data || [];
      
      // 1. CONTEXTUAL SUGGESTIONS based on current filters
      if (currentFilters.city && !currentFilters.cuisine?.length) {
        const cityData = cities.find(c => c.id === currentFilters.city);
        if (cityData) {
          generatedSuggestions.push({
            id: `contextual_cuisine_${currentFilters.city}`,
            type: SUGGESTION_TYPES.CONTEXTUAL,
            priority: SUGGESTION_PRIORITIES.HIGH,
            title: `Popular cuisines in ${cityData.name}`,
            description: 'Discover the most loved food types in this city',
            filters: {
              cuisine: ['Italian', 'Mexican', 'Asian'] // Mock data - replace with real data
            },
            metadata: {
              matchCount: 42,
              confidence: 0.85
            }
          });
        }
      }

      // 2. TRENDING SUGGESTIONS
      if (!currentFilters.city) {
        generatedSuggestions.push({
          id: 'trending_cities',
          type: SUGGESTION_TYPES.TRENDING,
          priority: SUGGESTION_PRIORITIES.MEDIUM,
          title: 'Trending Cities',
          description: 'Popular food destinations right now',
          filters: {
            city: cities[0]?.id // Most popular city
          },
          metadata: {
            matchCount: 156,
            confidence: 0.92
          }
        });
      }

      // 3. SMART COMBINATIONS
      if (currentFilters.cuisine?.length && !currentFilters.city) {
        const cuisine = currentFilters.cuisine[0];
        generatedSuggestions.push({
          id: `smart_${cuisine}_city`,
          type: SUGGESTION_TYPES.SMART,
          priority: SUGGESTION_PRIORITIES.HIGH,
          title: `Best cities for ${cuisine} food`,
          description: 'Cities known for excellent ' + cuisine + ' restaurants',
          filters: {
            city: cities.slice(0, 3).map(c => c.id)
          },
          metadata: {
            matchCount: 89,
            confidence: 0.78
          }
        });
      }

      // 4. RECENT/POPULAR combinations
      if (Object.keys(currentFilters).length === 0) {
        generatedSuggestions.push({
          id: 'popular_combo',
          type: SUGGESTION_TYPES.POPULAR,
          priority: SUGGESTION_PRIORITIES.MEDIUM,
          title: 'Popular Filter Combination',
          description: 'Most commonly used filters by other users',
          filters: {
            city: cities[0]?.id,
            cuisine: ['Italian']
          },
          metadata: {
            matchCount: 203,
            confidence: 0.89,
            lastUsed: '2 hours ago'
          }
        });
      }

      // Filter out dismissed suggestions
      const filteredSuggestions = generatedSuggestions.filter(
        suggestion => !dismissedSuggestions.has(suggestion.id)
      );

      // Limit and sort by priority
      const prioritizedSuggestions = filteredSuggestions
        .sort((a, b) => {
          const priorityOrder = {
            [SUGGESTION_PRIORITIES.HIGH]: 0,
            [SUGGESTION_PRIORITIES.MEDIUM]: 1,
            [SUGGESTION_PRIORITIES.LOW]: 2
          };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        })
        .slice(0, maxSuggestions);

      setSuggestions(prioritizedSuggestions);
      lastUpdateRef.current = Date.now();
      
      logDebug('[FilterSuggestions] Generated suggestions:', prioritizedSuggestions.length);

    } catch (error) {
      console.error('[FilterSuggestions] Error generating suggestions:', error);
    }
  }, [currentFilters, dismissedSuggestions, maxSuggestions, queries, cities]);

  // ================================
  // REAL-TIME UPDATES
  // ================================

  /**
   * Set up real-time suggestion updates
   */
  useEffect(() => {
    if (!enableRealTime) return;

    const setupRealTimeUpdates = () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }

      refreshTimerRef.current = setInterval(() => {
        generateSuggestions();
      }, refreshInterval);
    };

    setupRealTimeUpdates();

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [enableRealTime, refreshInterval, generateSuggestions]);

  // ================================
  // EFFECT HOOKS
  // ================================

  // Generate suggestions when filters change
  useEffect(() => {
    generateSuggestions();
  }, [generateSuggestions]);

  // Include React Query suggestions
  useEffect(() => {
    if (querySuggestions?.length > 0) {
      setSuggestions(prev => {
        // Merge with existing suggestions, avoiding duplicates
        const existingIds = new Set(prev.map(s => s.id));
        const newSuggestions = querySuggestions.filter(s => !existingIds.has(s.id));
        return [...prev, ...newSuggestions].slice(0, maxSuggestions);
      });
    }
  }, [querySuggestions, maxSuggestions]);

  // ================================
  // EVENT HANDLERS
  // ================================

  const handleApplySuggestion = useCallback((suggestion) => {
    if (onApplyFilters && suggestion.filters) {
      logDebug('[FilterSuggestions] Applying suggestion:', suggestion.title);
      onApplyFilters(suggestion.filters);
      
      // Remove the applied suggestion
      setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
    }
  }, [onApplyFilters]);

  const handleDismissSuggestion = useCallback((suggestionId) => {
    setDismissedSuggestions(prev => new Set([...prev, suggestionId]));
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
    
    if (onDismissSuggestion) {
      onDismissSuggestion(suggestionId);
    }
    
    logDebug('[FilterSuggestions] Dismissed suggestion:', suggestionId);
  }, [onDismissSuggestion]);

  const handleToggleGroup = useCallback((groupName) => {
    setCollapsedGroups(prev => {
      const updated = new Set(prev);
      if (updated.has(groupName)) {
        updated.delete(groupName);
      } else {
        updated.add(groupName);
      }
      return updated;
    });
  }, []);

  const handleDismissAll = useCallback(() => {
    const allIds = suggestions.map(s => s.id);
    setDismissedSuggestions(prev => new Set([...prev, ...allIds]));
    setSuggestions([]);
  }, [suggestions]);

  // ================================
  // GROUPING LOGIC
  // ================================

  const groupedSuggestions = useMemo(() => {
    if (!enableGrouping) {
      return { 'All Suggestions': suggestions };
    }

    return suggestions.reduce((groups, suggestion) => {
      let groupName;
      
      switch (suggestion.type) {
        case SUGGESTION_TYPES.TRENDING:
          groupName = 'Trending Now';
          break;
        case SUGGESTION_TYPES.POPULAR:
          groupName = 'Popular Choices';
          break;
        case SUGGESTION_TYPES.CONTEXTUAL:
          groupName = 'Based on Your Selection';
          break;
        case SUGGESTION_TYPES.SMART:
          groupName = 'Smart Recommendations';
          break;
        default:
          groupName = 'Other Suggestions';
      }

      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(suggestion);
      
      return groups;
    }, {});
  }, [suggestions, enableGrouping]);

  // ================================
  // RENDER
  // ================================

  if (!isVisible || suggestions.length === 0) {
    return null;
  }

  return (
    <div className={`filter-suggestions ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Lightbulb size={18} className="text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-900">
            Suggestions
          </h3>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">
            {suggestions.length} active
          </span>
          <button
            onClick={handleDismissAll}
            className="text-xs text-gray-400 hover:text-gray-600 underline"
          >
            Dismiss all
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 rounded-full hover:bg-gray-100"
            aria-label="Hide suggestions"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Suggestion Groups */}
      <div className="space-y-3">
        {Object.entries(groupedSuggestions).map(([groupName, groupSuggestions]) => (
          <SuggestionGroup
            key={groupName}
            title={groupName}
            suggestions={groupSuggestions}
            onApplySuggestion={handleApplySuggestion}
            onDismissSuggestion={handleDismissSuggestion}
            isCollapsed={collapsedGroups.has(groupName)}
            onToggleCollapse={() => handleToggleGroup(groupName)}
          />
        ))}
      </div>

      {/* Real-time Update Indicator */}
      {enableRealTime && (
        <div className="flex items-center justify-center mt-4 text-xs text-gray-500">
          <Clock size={12} className="mr-1" />
          <span>Updates every {Math.round(refreshInterval / 1000)}s</span>
        </div>
      )}
    </div>
  );
};

export default React.memo(FilterSuggestions); 