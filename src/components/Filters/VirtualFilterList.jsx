/**
 * VirtualFilterList.jsx - Virtual Scrolling for Large Filter Lists
 * 
 * Phase 3: Advanced Optimizations
 * - Virtual scrolling for performance with large datasets
 * - Smooth scrolling and item buffering
 * - Search highlighting and filtering
 * - Keyboard navigation support
 * - Accessibility features
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ChevronDown, ChevronUp } from 'lucide-react';
import FilterItem from './FilterItem';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import { logDebug } from '@/utils/logger';

/**
 * Virtual Filter List Component
 * Efficiently renders large lists of filter options with virtual scrolling
 */
const VirtualFilterList = ({
  items = [],
  selectedItems = [],
  onToggleItem,
  onSelectAll,
  onClearAll,
  searchable = true,
  searchPlaceholder = "Search filters...",
  maxHeight = 300,
  itemHeight = 40,
  enableSearch = true,
  enableBulkActions = true,
  enableKeyboardNavigation = true,
  className = "",
  emptyMessage = "No items found",
  loadingMessage = "Loading items...",
  isLoading = false,
  virtualizeThreshold = 50 // Start virtualizing after this many items
}) => {
  // State for search and UI
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Refs
  const searchInputRef = useRef(null);
  const listRef = useRef(null);
  const containerRef = useRef(null);

  // Filter items based on search term
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    
    const term = searchTerm.toLowerCase();
    return items.filter(item => {
      const label = typeof item === 'string' ? item : item.name || item.label || '';
      return label.toLowerCase().includes(term);
    });
  }, [items, searchTerm]);

  // Check if we should use virtual scrolling
  const shouldVirtualize = filteredItems.length > virtualizeThreshold;

  // Calculate visible height
  const visibleHeight = useMemo(() => {
    const itemCount = Math.min(filteredItems.length, Math.floor(maxHeight / itemHeight));
    return itemCount * itemHeight;
  }, [filteredItems.length, maxHeight, itemHeight]);

  // ================================
  // KEYBOARD NAVIGATION
  // ================================

  const handleKeyDown = useCallback((event) => {
    if (!enableKeyboardNavigation) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setFocusedIndex(prev => 
          Math.min(prev + 1, filteredItems.length - 1)
        );
        break;
      
      case 'ArrowUp':
        event.preventDefault();
        setFocusedIndex(prev => Math.max(prev - 1, 0));
        break;
      
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < filteredItems.length) {
          const item = filteredItems[focusedIndex];
          onToggleItem(item);
        }
        break;
      
      case 'Escape':
        setIsSearchFocused(false);
        setFocusedIndex(-1);
        break;
      
      case '/':
        if (!isSearchFocused) {
          event.preventDefault();
          searchInputRef.current?.focus();
        }
        break;
    }
  }, [enableKeyboardNavigation, filteredItems, focusedIndex, onToggleItem, isSearchFocused]);

  // Add keyboard event listeners
  useEffect(() => {
    if (enableKeyboardNavigation) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown, enableKeyboardNavigation]);

  // Scroll focused item into view
  useEffect(() => {
    if (shouldVirtualize && listRef.current && focusedIndex >= 0) {
      listRef.current.scrollToItem(focusedIndex, 'smart');
    }
  }, [focusedIndex, shouldVirtualize]);

  // ================================
  // SEARCH FUNCTIONALITY
  // ================================

  const handleSearchChange = useCallback((event) => {
    const value = event.target.value;
    setSearchTerm(value);
    setFocusedIndex(-1); // Reset focus when searching
    logDebug('[VirtualFilterList] Search term changed:', value);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setFocusedIndex(-1);
    searchInputRef.current?.focus();
  }, []);

  // ================================
  // BULK ACTIONS
  // ================================

  const handleSelectAll = useCallback(() => {
    if (onSelectAll) {
      onSelectAll(filteredItems);
    }
  }, [onSelectAll, filteredItems]);

  const handleClearAll = useCallback(() => {
    if (onClearAll) {
      onClearAll();
    }
  }, [onClearAll]);

  // ================================
  // VIRTUAL LIST ITEM RENDERER
  // ================================

  const VirtualListItem = useCallback(({ index, style }) => {
    const item = filteredItems[index];
    const itemKey = typeof item === 'string' ? item : item.id || item.name || index;
    const itemLabel = typeof item === 'string' ? item : item.name || item.label || '';
    const isSelected = selectedItems.includes(itemKey);
    const isFocused = index === focusedIndex;

    return (
      <div style={style}>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, delay: index * 0.01 }}
          className={`px-2 ${isFocused ? 'bg-blue-50' : ''}`}
        >
          <FilterItem
            key={itemKey}
            label={itemLabel}
            isActive={isSelected}
            onClick={() => onToggleItem(itemKey)}
            className={`w-full justify-start ${isFocused ? 'ring-2 ring-blue-300' : ''}`}
            // Highlight search terms
            highlightText={searchTerm}
          />
        </motion.div>
      </div>
    );
  }, [filteredItems, selectedItems, focusedIndex, onToggleItem, searchTerm]);

  // ================================
  // REGULAR LIST ITEM RENDERER
  // ================================

  const RegularListItems = useMemo(() => {
    return filteredItems.map((item, index) => {
      const itemKey = typeof item === 'string' ? item : item.id || item.name || index;
      const itemLabel = typeof item === 'string' ? item : item.name || item.label || '';
      const isSelected = selectedItems.includes(itemKey);
      const isFocused = index === focusedIndex;

      return (
        <motion.div
          key={itemKey}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: index * 0.02 }}
          className={`${isFocused ? 'bg-blue-50' : ''} px-2 py-1`}
        >
          <FilterItem
            label={itemLabel}
            isActive={isSelected}
            onClick={() => onToggleItem(itemKey)}
            className={`w-full justify-start ${isFocused ? 'ring-2 ring-blue-300' : ''}`}
            highlightText={searchTerm}
          />
        </motion.div>
      );
    });
  }, [filteredItems, selectedItems, focusedIndex, onToggleItem, searchTerm]);

  // ================================
  // LOADING STATE
  // ================================

  if (isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center py-8 ${className}`}>
        <LoadingSpinner size="sm" />
        <p className="mt-2 text-sm text-gray-600">{loadingMessage}</p>
      </div>
    );
  }

  // ================================
  // MAIN RENDER
  // ================================

  return (
    <div ref={containerRef} className={`flex flex-col space-y-3 ${className}`}>
      {/* Search Input */}
      {enableSearch && searchable && (
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={handleSearchChange}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg text-sm 
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     transition-all duration-200"
            aria-label="Search filter options"
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 
                       hover:text-gray-600 transition-colors"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>
      )}

      {/* Bulk Actions */}
      {enableBulkActions && filteredItems.length > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            {selectedItems.length} of {filteredItems.length} selected
          </span>
          <div className="flex space-x-2">
            <button
              onClick={handleSelectAll}
              className="text-blue-600 hover:text-blue-800 underline"
              disabled={selectedItems.length === filteredItems.length}
            >
              Select All
            </button>
            <button
              onClick={handleClearAll}
              className="text-red-600 hover:text-red-800 underline"
              disabled={selectedItems.length === 0}
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* Filter List */}
      <div className="relative">
        {filteredItems.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <p className="text-sm">{emptyMessage}</p>
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="mt-2 text-blue-600 hover:text-blue-800 underline text-sm"
              >
                Clear search
              </button>
            )}
          </div>
        ) : shouldVirtualize ? (
          // Virtual Scrolling List
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <List
              ref={listRef}
              height={Math.min(visibleHeight, maxHeight)}
              itemCount={filteredItems.length}
              itemSize={itemHeight}
              overscanCount={5}
              className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
            >
              {VirtualListItem}
            </List>
          </div>
        ) : (
          // Regular List (for smaller datasets)
          <div 
            className="space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
            style={{ maxHeight: `${maxHeight}px` }}
          >
            <AnimatePresence mode="popLayout">
              {RegularListItems}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Keyboard Navigation Hint */}
      {enableKeyboardNavigation && isSearchFocused && (
        <div className="text-xs text-gray-500 mt-2">
          Use ↑↓ to navigate, Enter to select, Esc to close
        </div>
      )}
    </div>
  );
};

export default React.memo(VirtualFilterList); 