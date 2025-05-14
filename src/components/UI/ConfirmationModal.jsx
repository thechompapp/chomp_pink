import React from 'react';
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
  if (!isOpen) return null;

  const getVariantClass = () => {
    switch (variant) {
      case 'error': return 'modal-error';
      case 'warning': return 'modal-warning';
      case 'info': return 'modal-info';
      default: return 'modal-success';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-container ${getVariantClass()}`} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-content">
          <p>{message}</p>
          
          {summary && (
            <div className="modal-summary">
              <h3>Summary</h3>
              <ul>
                {Object.entries(summary).map(([key, value]) => (
                  <li key={key}>
                    <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong> {value}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <Button onClick={onClose} variant="primary">{confirmLabel}</Button>
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
