/**
 * Modal Component
 * 
 * A reusable modal dialog component with customizable header, body, and footer.
 * Supports different sizes, animations, and accessibility features.
 */
import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import './Modal.styles.css';

/**
 * Modal Component
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to call when the modal is closed
 * @param {React.ReactNode} props.children - Modal content
 * @param {string} props.title - Modal title
 * @param {React.ReactNode} props.footer - Modal footer content
 * @param {string} props.size - Modal size (sm, md, lg, xl, full)
 * @param {boolean} props.closeOnEsc - Whether to close the modal when Escape key is pressed
 * @param {boolean} props.closeOnOverlayClick - Whether to close the modal when the overlay is clicked
 * @param {boolean} props.showCloseButton - Whether to show the close button in the header
 * @param {string} props.className - Additional CSS class names
 * @param {Object} props.rest - Additional props for the modal container
 */
const Modal = ({
  isOpen,
  onClose,
  children,
  title,
  footer,
  size = 'md',
  closeOnEsc = true,
  closeOnOverlayClick = true,
  showCloseButton = true,
  className = '',
  ...rest
}) => {
  const modalRef = useRef(null);
  const overlayRef = useRef(null);
  
  // Handle Escape key press
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (closeOnEsc && event.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scrolling when modal is open
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restore body scrolling when modal is closed
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, closeOnEsc]);
  
  // Handle click outside modal
  const handleOverlayClick = (event) => {
    if (closeOnOverlayClick && event.target === overlayRef.current) {
      onClose();
    }
  };
  
  // Focus trap inside modal
  useEffect(() => {
    if (isOpen && modalRef.current) {
      // Focus the modal when it opens
      modalRef.current.focus();
      
      // Set up focus trap
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements.length > 0) {
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        const handleTabKey = (event) => {
          if (event.key === 'Tab') {
            if (event.shiftKey && document.activeElement === firstElement) {
              event.preventDefault();
              lastElement.focus();
            } else if (!event.shiftKey && document.activeElement === lastElement) {
              event.preventDefault();
              firstElement.focus();
            }
          }
        };
        
        modalRef.current.addEventListener('keydown', handleTabKey);
        
        return () => {
          if (modalRef.current) {
            modalRef.current.removeEventListener('keydown', handleTabKey);
          }
        };
      }
    }
  }, [isOpen]);
  
  // Don't render anything if modal is not open
  if (!isOpen) {
    return null;
  }
  
  // Combine class names based on props
  const modalClasses = classNames(
    'modal',
    `modal-${size}`,
    className
  );
  
  return (
    <div 
      className="modal-overlay" 
      ref={overlayRef}
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div 
        className={modalClasses}
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        tabIndex={-1}
        {...rest}
      >
        {/* Modal Header */}
        {(title || showCloseButton) && (
          <div className="modal-header">
            {title && (
              <h2 className="modal-title" id="modal-title">
                {title}
              </h2>
            )}
            
            {showCloseButton && (
              <button
                type="button"
                className="modal-close"
                onClick={onClose}
                aria-label="Close"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            )}
          </div>
        )}
        
        {/* Modal Body */}
        <div className="modal-body">
          {children}
        </div>
        
        {/* Modal Footer */}
        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
  footer: PropTypes.node,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl', 'full']),
  closeOnEsc: PropTypes.bool,
  closeOnOverlayClick: PropTypes.bool,
  showCloseButton: PropTypes.bool,
  className: PropTypes.string
};

export default Modal;
