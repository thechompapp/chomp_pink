/**
 * Accordion Component
 * 
 * A component for displaying collapsible content sections.
 * Supports single or multiple open sections, custom styling,
 * and animated transitions.
 */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * AccordionItem component
 * @param {Object} props - Component props
 * @param {string|number} props.id - Unique identifier for the item
 * @param {string} props.title - Title of the accordion item
 * @param {React.ReactNode} props.children - Content of the accordion item
 * @param {boolean} props.isOpen - Whether the item is open
 * @param {function} props.onToggle - Function called when item is toggled
 * @param {string} props.variant - Visual variant of the accordion item
 * @returns {React.ReactNode}
 */
const AccordionItem = ({
  id,
  title,
  children,
  isOpen,
  onToggle,
  variant = 'default'
}) => {
  // Get variant-specific styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'bordered':
        return 'border border-gray-200 rounded-md mb-2';
      case 'filled':
        return 'bg-gray-50 rounded-md mb-2';
      case 'minimal':
        return 'border-b border-gray-200';
      case 'default':
      default:
        return 'border-b border-gray-200';
    }
  };
  
  return (
    <div className={`${getVariantStyles()}`}>
      <button
        className="w-full text-left py-4 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        onClick={() => onToggle(id)}
        aria-expanded={isOpen}
      >
        <div className="flex items-center justify-between">
          <span className="font-medium">{title}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-5 w-5 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-4 pt-0">{children}</div>
      </div>
    </div>
  );
};

AccordionItem.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  variant: PropTypes.oneOf(['default', 'bordered', 'filled', 'minimal'])
};

/**
 * Accordion component
 * @param {Object} props - Component props
 * @param {Array} props.items - Array of accordion items
 * @param {boolean} props.allowMultiple - Whether multiple items can be open at once
 * @param {Array} props.defaultOpen - Array of IDs of items that are open by default
 * @param {string} props.variant - Visual variant of the accordion
 * @param {string} props.className - Additional CSS classes
 * @returns {React.ReactNode}
 */
export const Accordion = ({
  items = [],
  allowMultiple = false,
  defaultOpen = [],
  variant = 'default',
  className = ''
}) => {
  const [openItems, setOpenItems] = useState(new Set(defaultOpen));
  
  // Update open items when defaultOpen changes
  useEffect(() => {
    setOpenItems(new Set(defaultOpen));
  }, [defaultOpen.join(',')]);
  
  // Handle item toggle
  const handleToggle = (itemId) => {
    setOpenItems((prevOpenItems) => {
      const newOpenItems = new Set(prevOpenItems);
      
      if (newOpenItems.has(itemId)) {
        newOpenItems.delete(itemId);
      } else {
        if (!allowMultiple) {
          newOpenItems.clear();
        }
        newOpenItems.add(itemId);
      }
      
      return newOpenItems;
    });
  };
  
  return (
    <div className={className}>
      {items.map((item) => (
        <AccordionItem
          key={item.id}
          id={item.id}
          title={item.title}
          isOpen={openItems.has(item.id)}
          onToggle={handleToggle}
          variant={variant}
        >
          {item.content}
        </AccordionItem>
      ))}
    </div>
  );
};

Accordion.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      title: PropTypes.string.isRequired,
      content: PropTypes.node.isRequired
    })
  ).isRequired,
  allowMultiple: PropTypes.bool,
  defaultOpen: PropTypes.array,
  variant: PropTypes.oneOf(['default', 'bordered', 'filled', 'minimal']),
  className: PropTypes.string
};

export default Accordion;
