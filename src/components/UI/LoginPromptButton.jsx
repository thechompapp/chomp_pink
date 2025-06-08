import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { LogIn, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import LoginPromptDialog from './LoginPromptDialog';

/**
 * LoginPromptButton - A button that shows a login prompt instead of hiding functionality
 * 
 * This component replaces the problematic "return null" pattern that completely
 * hides features from unauthenticated users with a friendly login prompt.
 */
const LoginPromptButton = ({ 
  children,
  className = "",
  variant = "primary",
  size = "md",
  icon: Icon = LogIn,
  title = "Login Required",
  message = "Please log in to use this feature.",
  tooltip = "Log in to continue",
  style = "button", // "button" | "icon" | "card"
  ...props 
}) => {
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowLoginPrompt(true);
  };

  // Icon button style (for add-to-list buttons)
  if (style === "icon") {
    return (
      <>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleClick}
          className={`w-8 h-8 bg-white text-black border border-gray-300 hover:bg-gray-50 hover:border-gray-400 shadow-sm rounded-full flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 ${className}`}
          title={tooltip}
          aria-label={tooltip}
          {...props}
        >
          <Icon size={14} />
        </motion.button>
        
        <LoginPromptDialog
          isOpen={showLoginPrompt}
          onClose={() => setShowLoginPrompt(false)}
          title={title}
          message={message}
        />
      </>
    );
  }

  // Card/section style (for larger areas)
  if (style === "card") {
    return (
      <>
        <div 
          onClick={handleClick}
          className={`p-3 bg-white text-black border border-gray-300 hover:bg-gray-50 hover:border-gray-400 shadow-sm rounded-md cursor-pointer transition-colors ${className}`}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleClick(e)}
        >
          <div className="flex items-center justify-center text-black">
            <Icon size={16} className="mr-2" />
            <span className="text-sm">{children || "Log in to continue"}</span>
          </div>
        </div>
        
        <LoginPromptDialog
          isOpen={showLoginPrompt}
          onClose={() => setShowLoginPrompt(false)}
          title={title}
          message={message}
        />
      </>
    );
  }

  // Standard button style
  const variantClasses = {
    primary: "bg-white text-black border border-gray-300 hover:bg-gray-50 hover:border-gray-400 shadow-sm focus:ring-gray-400",
    secondary: "bg-white text-black border border-gray-300 hover:bg-gray-50 hover:border-gray-400 shadow-sm focus:ring-gray-400",
    outline: "bg-white text-black border border-gray-300 hover:bg-gray-50 hover:border-gray-400 shadow-sm focus:ring-gray-400",
  };

  const sizeClasses = {
    sm: "px-3 py-1 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={`
          inline-flex items-center justify-center rounded-md font-medium 
          focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors
          ${variantClasses[variant]} 
          ${sizeClasses[size]} 
          ${className}
        `}
        title={tooltip}
        {...props}
      >
        <Icon size={16} className="mr-2" />
        {children || "Log In"}
      </button>
      
      <LoginPromptDialog
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        title={title}
        message={message}
      />
    </>
  );
};

LoginPromptButton.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  variant: PropTypes.oneOf(['primary', 'secondary', 'outline']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  icon: PropTypes.elementType,
  title: PropTypes.string,
  message: PropTypes.string,
  tooltip: PropTypes.string,
  style: PropTypes.oneOf(['button', 'icon', 'card']),
};

export default LoginPromptButton; 