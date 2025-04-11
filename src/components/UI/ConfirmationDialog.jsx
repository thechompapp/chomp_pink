// src/components/UI/ConfirmationDialog.jsx
import React from 'react';
import Modal from '@/components/UI/Modal'; // Use alias
import Button from '@/components/Button'; // Use alias
import { AlertTriangle, Loader2 } from 'lucide-react';

const ConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  isLoading = false,
  children,
  confirmButtonText = "Confirm",
  cancelButtonText = "Cancel",
  confirmButtonVariant = "primary", // Default to primary
  confirmButtonCustomClasses = "bg-red-600 hover:bg-red-700 focus:ring-red-500 !text-white", // Default to danger style
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="p-4">
        {/* Optional: Icon for visual cue */}
        {/* <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" /> */}

        <div className="text-sm text-gray-600 mb-6 text-center">
          {children}
        </div>

        <div className="flex justify-end space-x-3">
          <Button
            variant="tertiary" // Use tertiary for cancel
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
            isLoading={isLoading} // Pass isLoading to Button if it supports it
            className={`${confirmButtonCustomClasses} min-w-[80px] flex justify-center`}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : confirmButtonText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationDialog;