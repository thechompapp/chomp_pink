import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import './ConfirmationModal.css';
import Button from './Button';

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  confirmLabel = 'OK',
  summary = null,
  variant = 'success' // success, error, warning, info
}) => {
  // Force the modal to be visible when isOpen is true
  useEffect(() => {
    if (isOpen) {
      console.log('[ConfirmationModal] Modal is open with title:', title);
      // Force the modal to be visible
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    
    // Cleanup function
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen, title]);
  
  if (!isOpen) return null;

  const getVariantClass = () => {
    switch (variant) {
      case 'error': return 'modal-error';
      case 'warning': return 'modal-warning';
      case 'info': return 'modal-info';
      default: return 'modal-success';
    }
  };
  
  const handleClose = (e) => {
    if (e) e.preventDefault();
    console.log('[ConfirmationModal] Closing modal');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className={`modal-container ${getVariantClass()}`} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>
        <div className="modal-content">
          <p className="modal-message">{message}</p>
          
          {summary && (
            <div className="modal-summary">
              <h3>Summary</h3>
              <ul>
                {Object.entries(summary).map(([key, value]) => (
                  <li key={key}>
                    <strong>{key}:</strong> {value}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <Button onClick={handleClose} variant="primary">{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
};

ConfirmationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  confirmLabel: PropTypes.string,
  summary: PropTypes.object,
  variant: PropTypes.oneOf(['success', 'error', 'warning', 'info'])
};

export default ConfirmationModal;
