import React from 'react';

const Button = ({ children, onClick, variant = 'primary', size = 'md', className = '', ...props }) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors rounded-lg focus:outline-none';
  
  const variants = {
    primary: 'bg-pink-500 text-white hover:bg-pink-600',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
    tertiary: 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button onClick={onClick} className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default Button;
