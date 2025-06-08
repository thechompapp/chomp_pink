/**
 * Dropdown Component
 * 
 * A fully styled custom dropdown component with support for
 * search, multi-select, and custom rendering of options.
 */
import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * Dropdown component
 * @param {Object} props - Component props
 * @param {Array} props.options - Array of options
 * @param {string|number} props.value - Selected value
 * @param {function} props.onChange - Function called when selection changes
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.disabled - Whether the dropdown is disabled
 * @param {boolean} props.searchable - Whether the dropdown is searchable
 * @param {boolean} props.clearable - Whether the dropdown can be cleared
 * @param {string} props.size - Size of the dropdown
 * @param {string} props.variant - Variant of the dropdown
 * @param {function} props.renderOption - Custom render function for options
 * @param {string} props.label - Label for the dropdown
 * @param {string} props.error - Error message
 * @returns {React.ReactNode}
 */
export const Dropdown = ({
  options = [],
  value = null,
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  searchable = false,
  clearable = false,
  size = 'medium',
  variant = 'primary',
  renderOption,
  label,
  error
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  
  // Find the selected option
  const selectedOption = options.find(option => 
    option.value === value || option.id === value
  );
  
  // Filter options based on search term
  const filteredOptions = searchable && searchTerm
    ? options.filter(option => 
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;
  
  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);
  
  // Toggle dropdown
  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      setSearchTerm('');
    }
  };
  
  // Handle option selection
  const handleSelect = (option) => {
    onChange(option.value || option.id);
    setIsOpen(false);
    setSearchTerm('');
  };
  
  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // Clear selection
  const handleClear = (e) => {
    e.stopPropagation();
    onChange(null);
    setSearchTerm('');
  };
  
  // Get size-specific styles
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return 'py-1 px-2 text-sm';
      case 'large':
        return 'py-3 px-4 text-lg';
      case 'medium':
      default:
        return 'py-2 px-3';
    }
  };
  
  // Get variant-specific styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-gray-100 border-gray-300 hover:bg-gray-200';
      case 'outline':
        return 'bg-white border-gray-300 hover:border-gray-400';
      case 'primary':
      default:
        return 'bg-white border-gray-300 hover:border-gray-400';
    }
  };
  
  // Render dropdown option
  const renderDropdownOption = (option) => {
    if (renderOption) {
      return renderOption(option);
    }
    
    return (
      <div className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center">
        {option.icon && (
          <span className="mr-2">{option.icon}</span>
        )}
        {option.label}
      </div>
    );
  };
  
  return (
    <div className="relative w-full" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      <div
        className={`
          relative w-full border rounded-md ${getSizeStyles()} ${getVariantStyles()}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${error ? 'border-red-500' : ''}
          flex items-center justify-between
        `}
        onClick={toggleDropdown}
      >
        {/* Selected value or placeholder */}
        <div className="flex-grow truncate">
          {selectedOption ? (
            <div className="flex items-center">
              {selectedOption.icon && (
                <span className="mr-2">{selectedOption.icon}</span>
              )}
              {selectedOption.label}
            </div>
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </div>
        
        {/* Clear button */}
        {clearable && selectedOption && (
          <button
            type="button"
            className="ml-2 text-gray-400 hover:text-gray-600"
            onClick={handleClear}
            aria-label="Clear selection"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
        
        {/* Dropdown arrow */}
        <div className="ml-2 text-gray-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-5 w-5 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="mt-1 text-sm text-red-500">{error}</div>
      )}
      
      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {/* Search input */}
          {searchable && (
            <div className="sticky top-0 p-2 bg-white border-b border-gray-200">
              <input
                ref={searchInputRef}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400"
                placeholder="Search..."
                value={searchTerm}
                onChange={handleSearchChange}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
          
          {/* Options list */}
          <div className="py-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.id || option.value}
                  onClick={() => handleSelect(option)}
                  className={`
                    ${(option.value === value || option.id === value) ? 'bg-blue-50 text-blue-700' : ''}
                  `}
                >
                  {renderDropdownOption(option)}
                </div>
              ))
            ) : (
              <div className="px-4 py-2 text-gray-500 text-center">
                No options available
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

Dropdown.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      label: PropTypes.string.isRequired,
      icon: PropTypes.node
    })
  ).isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  searchable: PropTypes.bool,
  clearable: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  variant: PropTypes.oneOf(['primary', 'secondary', 'outline']),
  renderOption: PropTypes.func,
  label: PropTypes.string,
  error: PropTypes.string
};

export default Dropdown;
