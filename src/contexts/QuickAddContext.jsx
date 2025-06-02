import React, { createContext, useContext, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import QuickAddModal from '@/components/UI/QuickAddModal';
import { logDebug } from '@/utils/logger';

const QuickAddContext = createContext();

/**
 * Transform QuickAdd item data to AddToListModal format
 * @param {Object} item - Item data from QuickAdd
 * @returns {Object} Transformed item data for AddToListModal
 */
const transformItemData = (item) => {
    if (!item) return null;
    
    // Create the base transformed item
    const transformed = {
        id: item.id,
        name: item.name,
        type: item.type,
        description: item.description,
    };
    
    // Handle restaurant items
    if (item.type === 'restaurant') {
        transformed.restaurant_id = item.id;
    }
    
    // Handle dish items
    if (item.type === 'dish') {
        transformed.dish_id = item.id;
        // Add restaurant info if available
        if (item.restaurantId) {
            transformed.restaurant_id = item.restaurantId;
        }
        if (item.restaurantName) {
            transformed.restaurant_name = item.restaurantName;
        }
    }
    
    // Add additional fields that might be useful
    if (item.photo_url) transformed.photo_url = item.photo_url;
    if (item.city) transformed.city = item.city;
    if (item.neighborhood) transformed.neighborhood = item.neighborhood;
    if (item.tags) transformed.tags = item.tags;
    
    logDebug('[QuickAddContext] Transformed item data:', { original: item, transformed });
    
    return transformed;
};

/**
 * QuickAddProvider Component
 * 
 * Provides global state management for the QuickAdd modal
 */
export const QuickAddProvider = ({ children }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [itemToAdd, setItemToAdd] = useState(null);

    // Open the quick add modal
    const openQuickAdd = useCallback((item) => {
        logDebug('[QuickAddContext] Opening quick add modal for item:', item);
        const transformedItem = transformItemData(item);
        setItemToAdd(transformedItem);
        setIsModalOpen(true);
    }, []);

    // Also support the openQuickAddModal function name for compatibility
    const openQuickAddModal = useCallback((data) => {
        logDebug('[QuickAddContext] Opening quick add modal via openQuickAddModal:', data);
        // Handle both direct item data and nested itemData structure
        const item = data?.itemData || data;
        const transformedItem = transformItemData(item);
        setItemToAdd(transformedItem);
        setIsModalOpen(true);
    }, []);

    // Close the quick add modal
    const closeQuickAdd = useCallback(() => {
        logDebug('[QuickAddContext] Closing quick add modal');
        setIsModalOpen(false);
        setItemToAdd(null);
    }, []);

    // Handle successful item addition
    const handleItemAdded = useCallback((listId, listItemId) => {
        logDebug('[QuickAddContext] Item added successfully to list:', { listId, listItemId });
        // Modal will auto-close
        setIsModalOpen(false);
        setItemToAdd(null);
    }, []);

    const contextValue = {
        isModalOpen,
        itemToAdd,
        openQuickAdd,
        openQuickAddModal, // Support both function names
        closeQuickAdd,
        handleItemAdded
    };

    return (
        <QuickAddContext.Provider value={contextValue}>
            {children}
            
            {/* Global QuickAdd Modal */}
            <QuickAddModal
                isOpen={isModalOpen}
                onClose={closeQuickAdd}
                itemToAdd={itemToAdd}
                onItemAdded={handleItemAdded}
            />
        </QuickAddContext.Provider>
    );
};

QuickAddProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

/**
 * Hook to use QuickAdd context
 */
export const useQuickAdd = () => {
    const context = useContext(QuickAddContext);
    if (!context) {
        console.error('useQuickAdd must be used within a QuickAddProvider');
        // Return a safe fallback object instead of throwing
        return { 
            openQuickAdd: () => console.warn('QuickAdd unavailable - provider missing'),
            openQuickAddModal: () => console.warn('QuickAdd unavailable - provider missing'),
            closeQuickAdd: () => console.warn('QuickAdd unavailable - provider missing'),
            isModalOpen: false,
            itemToAdd: null,
            handleItemAdded: () => console.warn('QuickAdd unavailable - provider missing'),
        };
    }
    return context;
};