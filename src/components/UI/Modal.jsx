import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { XMarkIcon } from '@heroicons/react/24/outline';

/**
 * Accessible modal component with focus management
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is currently open
 * @param {Function} props.onClose - Handler for closing the modal
 * @param {string} props.title - Modal title
 * @param {React.ReactNode} props.children - Modal content
 * @param {string} props.className - Additional class name for the modal
 * @param {string} props.dialogClassName - Additional class name for the dialog
 * @returns {React.ReactElement|null} The modal component or null when closed
 */
const Modal = ({ isOpen, onClose, title, children, className = '', dialogClassName = '' }) => {
  const dialogRef = useRef(null);
  
  // Focus management
  useEffect(() => {
    if (isOpen && dialogRef.current) {
      // Store previous active element
      const previousActiveElement = document.activeElement;
      
      // Focus the dialog
      dialogRef.current.focus();
      
      // Restore focus when the modal is closed
      return () => {
        previousActiveElement?.focus();
      };
    }
  }, [isOpen]);
  
  // ESC key handler
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
          onClick={onClose} 
          aria-hidden="true"
        />

        {/* Dialog */}
        <div 
          ref={dialogRef}
          className={`relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full ${dialogClassName || 'sm:max-w-lg'} ${className}`}
          tabIndex="-1"
        >
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="flex items-start justify-between">
              <h3 id="modal-title" className="text-lg font-semibold leading-6 text-gray-900">
                {title}
              </h3>
              <button
                type="button"
                className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={onClose}
                aria-label="Close"
              >
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  dialogClassName: PropTypes.string
};

Modal.displayName = 'Modal';

// Support both default and named exports
export default Modal;
export { Modal };