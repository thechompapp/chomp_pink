import React from "react";

const Button = ({ variant = "primary", size = "md", className = "", children, ...props }) => {
  const baseStyles = "rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-[#b89e89]";

  const variantStyles = {
    primary: "bg-[#D1B399] text-white hover:bg-[#b89e89]",
    tertiary: "bg-transparent text-gray-600 hover:text-[#D1B399] border border-gray-300 hover:border-[#D1B399]",
  };

  const sizeStyles = {
    sm: "px-3 py-1 text-sm",
    md: "px-4 py-2 text-base",
  };

  const combinedStyles = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

  return (
    <button className={combinedStyles} {...props}>
      {children}
    </button>
  );
};

export default Button;