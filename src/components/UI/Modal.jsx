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
          data-testid="modal-backdrop"
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
          onClick={onClose} 
          aria-hidden="true"
        />

        {/* Dialog */}
        <div 
          ref={dialogRef}
          className={`relative transform overflow-hidden rounded-xl bg-white dark:bg-gray-800 text-left shadow-2xl transition-all sm:my-8 sm:w-full ${dialogClassName || 'sm:max-w-lg'} ${className}`}
          tabIndex="-1"
        >
          <div className="bg-white dark:bg-gray-800 px-6 pb-4 pt-6 sm:p-6 sm:pb-4">
            <div className="flex items-start justify-between mb-4">
              <h3 id="modal-title" className="text-xl font-semibold leading-6 text-gray-900 dark:text-gray-100">
                {title}
              </h3>
              <button
                type="button"
                className="rounded-full bg-gray-100 dark:bg-gray-700 p-2 text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                onClick={onClose}
                aria-label="Close"
              >
                <XMarkIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="text-gray-600 dark:text-gray-300">
              {children}
            </div>
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