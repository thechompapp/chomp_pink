/**
 * Card Component
 * 
 * A versatile card component for displaying content in a contained, styled box.
 * Supports header, footer, and various visual styles.
 */
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import './Card.styles.css';

/**
 * Card Component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Card content
 * @param {string} props.title - Card title
 * @param {React.ReactNode} props.header - Custom card header content
 * @param {React.ReactNode} props.footer - Card footer content
 * @param {string} props.variant - Card variant (default, outlined, elevated)
 * @param {boolean} props.hoverable - Whether the card should have hover effects
 * @param {boolean} props.clickable - Whether the card should appear clickable
 * @param {Function} props.onClick - Click handler for the card
 * @param {string} props.className - Additional CSS class names
 * @param {Object} props.rest - Additional props for the card element
 */
const Card = ({
  children,
  title,
  header,
  footer,
  variant = 'default',
  hoverable = false,
  clickable = false,
  onClick,
  className = '',
  ...rest
}) => {
  // Combine class names based on props
  const cardClasses = classNames(
    'card',
    `card-${variant}`,
    {
      'card-hoverable': hoverable,
      'card-clickable': clickable
    },
    className
  );
  
  return (
    <div 
      className={cardClasses} 
      onClick={clickable ? onClick : undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      {...rest}
    >
      {/* Card Header */}
      {(header || title) && (
        <div className="card-header">
          {header || (
            <h3 className="card-title">{title}</h3>
          )}
        </div>
      )}
      
      {/* Card Body */}
      <div className="card-body">
        {children}
      </div>
      
      {/* Card Footer */}
      {footer && (
        <div className="card-footer">
          {footer}
        </div>
      )}
    </div>
  );
};

Card.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
  header: PropTypes.node,
  footer: PropTypes.node,
  variant: PropTypes.oneOf(['default', 'outlined', 'elevated']),
  hoverable: PropTypes.bool,
  clickable: PropTypes.bool,
  onClick: PropTypes.func,
  className: PropTypes.string
};

export default Card;
