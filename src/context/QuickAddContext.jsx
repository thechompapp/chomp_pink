import React, { createContext, useContext, useState } from 'react';

const QuickAddContext = createContext();

export const QuickAddProvider = ({ children, userLists, addToList, fetchError }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [item, setItem] = useState(null);

    const openQuickAdd = (itemData) => {
        setItem(itemData);
        setIsOpen(true);
    };

    const closeQuickAdd = () => {
        setIsOpen(false);
        setItem(null);
    };

    return (
        <QuickAddContext.Provider value={{ isOpen, item, openQuickAdd, closeQuickAdd, userLists, addToList, fetchError }}>
            {children}
        </QuickAddContext.Provider>
    );
};

export const useQuickAdd = () => {
    const context = useContext(QuickAddContext);
    if (!context) {
        throw new Error('useQuickAdd must be used within a QuickAddProvider');
    }
    return context;
};