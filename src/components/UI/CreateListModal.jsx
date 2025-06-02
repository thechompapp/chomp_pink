import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { Plus, Loader2, AlertCircle, Check, Globe, Lock, UtensilsCrossed, Building2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { logDebug, logError } from '@/utils/logger';
import Modal from '@/components/UI/Modal';
import Button from '@/components/UI/Button';
import LoginPromptDialog from '@/components/UI/LoginPromptDialog';
import { listService } from '@/services/listService';

/**
 * Compact Toggle Switch Component
 */
const ToggleSwitch = ({ enabled, onToggle, leftIcon: LeftIcon, rightIcon: RightIcon, leftLabel, rightLabel }) => {
  return (
    <div className="flex items-center justify-center space-x-3">
      <div className={`flex items-center space-x-2 transition-colors ${!enabled ? 'text-primary font-medium' : 'text-gray-400'}`}>
        {LeftIcon && <LeftIcon className="h-5 w-5" />}
        <span className="text-base">{leftLabel}</span>
      </div>
      
      <button
        type="button"
        onClick={onToggle}
        className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 ${
          enabled ? 'bg-primary' : 'bg-gray-200'
        }`}
        role="switch"
        aria-checked={enabled}
      >
        <span
          className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            enabled ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
      
      <div className={`flex items-center space-x-2 transition-colors ${enabled ? 'text-primary font-medium' : 'text-gray-400'}`}>
        {RightIcon && <RightIcon className="h-5 w-5" />}
        <span className="text-base">{rightLabel}</span>
      </div>
    </div>
  );
};

/**
 * CreateListModal Component
 * 
 * A compact modal for creating new lists with essential toggles
 */
const CreateListModal = ({ isOpen, onClose, onListCreated }) => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_public: false,
    content_type: 'restaurants'
  });

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        description: '',
        is_public: false,
        content_type: 'restaurants'
      });
      setErrors({});
      setIsSuccess(false);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Handle authentication check
  useEffect(() => {
    if (isOpen && !authLoading && !isAuthenticated) {
      setShowLoginPrompt(true);
    }
  }, [isOpen, isAuthenticated, authLoading]);

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'List name is required';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'List name must be at least 3 characters';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'List name must be less than 100 characters';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // Handle toggle changes
  const handleToggle = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Handle content type toggle
  const handleContentTypeToggle = () => {
    setFormData(prev => ({
      ...prev,
      content_type: prev.content_type === 'restaurants' ? 'dishes' : 'restaurants'
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      logDebug('[CreateListModal] Creating new list:', formData);
      
      // Map frontend content_type to backend list_type
      const backendListType = formData.content_type === 'restaurants' ? 'restaurant' 
                           : formData.content_type === 'dishes' ? 'dish' 
                           : 'mixed';
      
      const response = await listService.createList({
        name: formData.name.trim(),
        description: formData.description.trim(),
        list_type: backendListType, // Use correct backend format
        is_public: formData.is_public
        // Note: Removed content_type as backend doesn't expect this field
      });

      if (response.success) {
        logDebug('[CreateListModal] List created successfully:', response.data);
        setIsSuccess(true);
        
        // Call success callback if provided
        if (onListCreated) {
          onListCreated(response.data);
        }

        // Show success state briefly, then close
        setTimeout(() => {
          onClose();
          
          // Navigate to the new list if we have an ID
          if (response.data?.id) {
            navigate(`/lists/${response.data.id}`);
          }
        }, 1500);
        
      } else {
        throw new Error(response.message || 'Failed to create list');
      }
      
    } catch (error) {
      logError('[CreateListModal] Error creating list:', error);
      setErrors({
        submit: error.message || 'Failed to create list. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  // Don't render modal content if authentication is loading
  if (authLoading) {
    return null;
  }

  // Show login prompt if not authenticated
  if (showLoginPrompt) {
    return (
      <LoginPromptDialog
        isOpen={showLoginPrompt}
        onClose={() => {
          setShowLoginPrompt(false);
          onClose();
        }}
        title="Login Required"
        message="Please log in to create a new list."
      />
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="List Created!">
        <div className="p-4 text-center">
          <div className="mx-auto flex items-center justify-center w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 mb-3">
            <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-1">
            "{formData.name}" created successfully!
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Redirecting you to your new list...
          </p>
        </div>
      </Modal>
    );
  }

  // Main form modal
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title="Create New List"
      dialogClassName="sm:max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Compact Toggles Section - Same Row */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-12">
            {/* Content Type Toggle */}
            <div className="flex-1 min-w-0">
              <ToggleSwitch
                enabled={formData.content_type === 'dishes'}
                onToggle={handleContentTypeToggle}
                leftIcon={Building2}
                rightIcon={UtensilsCrossed}
                leftLabel="Restaurants"
                rightLabel="Dishes"
              />
            </div>

            {/* Privacy Toggle */}
            <div className="flex-1 min-w-0">
              <ToggleSwitch
                enabled={formData.is_public}
                onToggle={() => handleToggle('is_public')}
                leftIcon={Lock}
                rightIcon={Globe}
                leftLabel="Private"
                rightLabel="Public"
              />
            </div>
          </div>
        </div>

        {/* List Name */}
        <div>
          <label htmlFor="list-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            List Name *
          </label>
          <input
            id="list-name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Enter list name..."
            className={`block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 ${
              errors.name ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            disabled={isSubmitting}
            maxLength={100}
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />
              {errors.name}
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="list-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <textarea
            id="list-description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Describe your list (optional)..."
            rows={2}
            className={`block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 ${
              errors.description ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            disabled={isSubmitting}
            maxLength={500}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {formData.description.length}/500
          </p>
          {errors.description && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />
              {errors.description}
            </p>
          )}
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-3">
            <div className="flex">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <div className="ml-2">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-400">Error creating list</h3>
                <p className="mt-1 text-xs text-red-700 dark:text-red-300">{errors.submit}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end space-x-2 pt-3 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isSubmitting || !formData.name.trim()}
            isLoading={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="h-3 w-3 mr-1" />
                Create List
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

CreateListModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onListCreated: PropTypes.func,
};

export default CreateListModal; 