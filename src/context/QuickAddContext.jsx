import React, { createContext, useContext } from 'react';

const QuickAddContext = createContext();

export const QuickAddProvider = ({ children, openQuickAdd }) => {
    // We're now using the props passed from App.jsx directly
    return (
        <QuickAddContext.Provider value={{ openQuickAdd }}>
            {children}
        </QuickAddContext.Provider>
    );
};

export const useQuickAdd = () => {
    const context = useContext(QuickAddContext);
    if (!context) {
        console.error('useQuickAdd must be used within a QuickAddProvider');
        // Return a safe fallback object instead of throwing
        return { 
            openQuickAdd: () => console.warn('QuickAdd unavailable - provider missing'),
        };
    }
    return context;
};