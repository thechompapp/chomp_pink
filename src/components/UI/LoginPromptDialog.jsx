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
  // Don't render anything if not open
  if (!isOpen) return null;

  // Get current path for redirect after login
  const redirectPath = currentPath || window.location.pathname;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 p-4 transition-opacity duration-200"
      style={{ backdropFilter: 'blur(2px)' }}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 transform transition-all duration-200 scale-100 opacity-100"
        role="dialog"
        aria-labelledby="login-dialog-title"
        aria-describedby="login-dialog-description"
        style={{
          animation: 'modalSlideIn 0.2s ease-out',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 
            id="login-dialog-title"
            className="text-lg font-semibold text-gray-900"
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors rounded-full p-1 hover:bg-gray-100"
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <p 
            id="login-dialog-description"
            className="text-gray-600 mb-4 leading-relaxed text-sm"
          >
            {message}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <Link
              to={`/login?redirect=${encodeURIComponent(redirectPath)}`}
              className="w-full"
              onClick={onClose}
            >
              <Button
                variant="primary"
                size="sm"
                className="w-full flex items-center justify-center transition-all duration-200 hover:scale-[1.02]"
              >
                <LogIn size={14} className="mr-2" />
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
                size="sm"
                className="w-full flex items-center justify-center transition-all duration-200 hover:scale-[1.02]"
              >
                <UserPlus size={14} className="mr-2" />
                Create Account
              </Button>
            </Link>
          </div>

          {/* Footer text */}
          <p className="text-xs text-gray-500 text-center mt-3">
            You'll be redirected back here after signing in.
          </p>
        </div>
      </div>
      
      {/* Add CSS animation keyframes */}
      <style jsx>{`
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
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