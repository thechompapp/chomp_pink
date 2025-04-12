import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = ({ variant = 'primary', size = 'md', className = '', children, isLoading = false, disabled = false, ...props }) => {
  const baseStyles = 'rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-[#b89e89] transition-colors';

  const variantStyles = {
    primary: 'bg-[#D1B399] text-white hover:bg-[#b89e89]',
    tertiary: 'bg-transparent text-gray-600 hover:text-[#D1B399] border border-gray-300 hover:border-[#D1B399]',
  };

  const sizeStyles = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-base',
  };

  const disabledStyles = disabled || isLoading ? 'opacity-50 cursor-not-allowed' : '';

  const combinedStyles = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${disabledStyles} ${className}`.trim();

  // Filter out custom props that shouldn't be passed to the DOM
  const buttonProps = { ...props };
  delete buttonProps.isLoading;

  return (
    <button className={combinedStyles} disabled={disabled || isLoading} {...buttonProps}>
      {isLoading && <Loader2 className="animate-spin h-4 w-4 mr-2 inline" />}
      {children}
    </button>
  );
};

export default Button;