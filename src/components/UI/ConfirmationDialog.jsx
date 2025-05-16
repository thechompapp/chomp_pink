// src/components/UI/ConfirmationDialog.jsx
import React from 'react';
import Modal from '@/components/UI/Modal';
import Button from '@/components/UI/Button';
import { AlertTriangle, Loader2 } from 'lucide-react';
import PropTypes from 'prop-types';

const ConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  isLoading = false,
  children,
  confirmButtonText = "Confirm",
  cancelButtonText = "Cancel",
  confirmButtonVariant = "destructive",
  confirmButtonCustomClasses = "",
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="p-4">
        <div className="text-sm text-gray-600 mb-6 text-center">
          {children}
        </div>

        <div className="flex justify-end space-x-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelButtonText}
          </Button>
          <Button
            variant={confirmButtonVariant}
            size="sm"
            onClick={onConfirm}
            disabled={isLoading}
            isLoading={isLoading}
            className="min-w-[80px] flex justify-center"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : confirmButtonText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

ConfirmationDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string,
  isLoading: PropTypes.bool,
  children: PropTypes.node.isRequired,
  confirmButtonText: PropTypes.string,
  cancelButtonText: PropTypes.string,
  confirmButtonVariant: PropTypes.oneOf(['primary', 'secondary', 'destructive', 'outline', 'ghost', 'link']),
  confirmButtonCustomClasses: PropTypes.string
};

ConfirmationDialog.displayName = 'ConfirmationDialog';

// Support both default and named exports
export default ConfirmationDialog;
export { ConfirmationDialog };