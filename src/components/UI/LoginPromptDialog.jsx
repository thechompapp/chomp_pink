import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { X, LogIn, UserPlus } from 'lucide-react';
import Button from './Button';

/**
 * LoginPromptDialog - A user-friendly authentication prompt
 * 
 * Replaces hard redirects with a smooth in-page dialog that encourages
 * users to log in while keeping them on the current page.
 */
const LoginPromptDialog = ({ 
  isOpen, 
  onClose, 
  title = "Login Required",
  message = "Please log in to continue with this action.",
  actionContext = "continue",
  currentPath 
}) => {
  if (!isOpen) return null;

  // Get current path for redirect after login
  const redirectPath = currentPath || window.location.pathname;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div 
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all"
        role="dialog"
        aria-labelledby="login-dialog-title"
        aria-describedby="login-dialog-description"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 
            id="login-dialog-title"
            className="text-lg font-semibold text-gray-900"
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p 
            id="login-dialog-description"
            className="text-gray-600 mb-6"
          >
            {message}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <Link
              to={`/login?redirect=${encodeURIComponent(redirectPath)}`}
              className="w-full"
              onClick={onClose}
            >
              <Button
                variant="primary"
                size="md"
                className="w-full flex items-center justify-center"
              >
                <LogIn size={16} className="mr-2" />
                Log In
              </Button>
            </Link>

            <Link
              to={`/register?redirect=${encodeURIComponent(redirectPath)}`}
              className="w-full"
              onClick={onClose}
            >
              <Button
                variant="outline"
                size="md"
                className="w-full flex items-center justify-center"
              >
                <UserPlus size={16} className="mr-2" />
                Create Account
              </Button>
            </Link>
          </div>

          {/* Footer text */}
          <p className="text-sm text-gray-500 text-center mt-4">
            You'll be redirected back here after signing in.
          </p>
        </div>
      </div>
    </div>
  );
};

LoginPromptDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  message: PropTypes.string,
  actionContext: PropTypes.string,
  currentPath: PropTypes.string,
};

export default LoginPromptDialog; 