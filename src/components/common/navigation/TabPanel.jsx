/**
 * TabPanel Component
 * 
 * A component for organizing content into tabs.
 * Supports horizontal and vertical orientations, custom styling,
 * and dynamic tab content.
 */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * TabPanel component
 * @param {Object} props - Component props
 * @param {Array} props.tabs - Array of tab objects
 * @param {number|string} props.activeTab - ID of the active tab
 * @param {function} props.onTabChange - Function called when tab changes
 * @param {string} props.orientation - Orientation of tabs (horizontal or vertical)
 * @param {string} props.variant - Visual variant of tabs
 * @param {string} props.size - Size of tabs
 * @param {boolean} props.fullWidth - Whether tabs should take full width
 * @param {string} props.className - Additional CSS classes
 * @returns {React.ReactNode}
 */
export const TabPanel = ({
  tabs = [],
  activeTab,
  onTabChange,
  orientation = 'horizontal',
  variant = 'default',
  size = 'medium',
  fullWidth = false,
  className = ''
}) => {
  const [currentTab, setCurrentTab] = useState(activeTab || (tabs[0]?.id || 0));
  
  // Update current tab when activeTab prop changes
  useEffect(() => {
    if (activeTab !== undefined && activeTab !== currentTab) {
      setCurrentTab(activeTab);
    }
  }, [activeTab]);
  
  // Handle tab click
  const handleTabClick = (tabId) => {
    setCurrentTab(tabId);
    if (onTabChange) {
      onTabChange(tabId);
    }
  };
  
  // Get orientation-specific styles
  const getOrientationStyles = () => {
    return orientation === 'vertical'
      ? 'flex flex-row'
      : 'flex flex-col';
  };
  
  // Get tab list styles based on orientation
  const getTabListStyles = () => {
    return orientation === 'vertical'
      ? 'flex flex-col border-r border-gray-200'
      : 'flex flex-row border-b border-gray-200';
  };
  
  // Get variant-specific styles for tabs
  const getVariantStyles = (isActive) => {
    switch (variant) {
      case 'pills':
        return isActive
          ? 'bg-blue-500 text-white rounded-md shadow-sm'
          : 'text-gray-600 hover:bg-gray-100 rounded-md';
      case 'underline':
        return isActive
          ? 'text-blue-600 border-b-2 border-blue-500'
          : 'text-gray-600 hover:text-gray-800 border-b-2 border-transparent';
      case 'contained':
        return isActive
          ? 'bg-white text-blue-600 border-t border-l border-r border-gray-200 rounded-t-md -mb-px'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200 rounded-t-md';
      case 'default':
      default:
        return isActive
          ? 'text-blue-600 border-b-2 border-blue-500'
          : 'text-gray-600 hover:text-gray-800 border-b-2 border-transparent';
    }
  };
  
  // Get size-specific styles for tabs
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return 'px-3 py-2 text-sm';
      case 'large':
        return 'px-6 py-4 text-lg';
      case 'medium':
      default:
        return 'px-4 py-3';
    }
  };
  
  // Get the active tab content
  const getActiveTabContent = () => {
    const activeTabObj = tabs.find(tab => tab.id === currentTab);
    return activeTabObj ? activeTabObj.content : null;
  };
  
  return (
    <div className={`${getOrientationStyles()} ${className}`}>
      {/* Tab list */}
      <div className={`${getTabListStyles()} ${orientation === 'vertical' ? 'mr-4' : 'mb-4'}`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`
              ${getVariantStyles(tab.id === currentTab)}
              ${getSizeStyles()}
              ${fullWidth && orientation !== 'vertical' ? 'flex-1' : ''}
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
              transition-colors duration-200
              ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
            onClick={() => !tab.disabled && handleTabClick(tab.id)}
            disabled={tab.disabled}
            aria-selected={tab.id === currentTab}
            role="tab"
          >
            <div className="flex items-center justify-center">
              {tab.icon && <span className="mr-2">{tab.icon}</span>}
              {tab.label}
              {tab.badge && (
                <span className="ml-2 bg-gray-200 text-gray-700 text-xs rounded-full px-2 py-0.5">
                  {tab.badge}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
      
      {/* Tab content */}
      <div className="flex-1">
        {getActiveTabContent()}
      </div>
    </div>
  );
};

TabPanel.propTypes = {
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
      content: PropTypes.node.isRequired,
      icon: PropTypes.node,
      badge: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      disabled: PropTypes.bool
    })
  ).isRequired,
  activeTab: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onTabChange: PropTypes.func,
  orientation: PropTypes.oneOf(['horizontal', 'vertical']),
  variant: PropTypes.oneOf(['default', 'pills', 'underline', 'contained']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  fullWidth: PropTypes.bool,
  className: PropTypes.string
};

export default TabPanel;
