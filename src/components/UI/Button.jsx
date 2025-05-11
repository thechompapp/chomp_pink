// src/components/UI/Button.jsx
import React from 'react';
import { Loader2 } from 'lucide-react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils'; // Make sure this utility exists

// Define button variants using cva and theme colors
const buttonVariants = cva(
  // Base styles
  "inline-flex items-center justify-center rounded-sm text-sm font-medium transition-colors focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none", // Simplified base style
  {
    variants: {
      variant: {
        // Primary: Black with white text
        primary: "bg-black text-white",
        // Outline: Clean outline with no hover effects
        outline: "border border-black bg-transparent text-black",
        // Secondary: Light gray with black text
        secondary: "bg-[#f2f2f2] text-black",
        // Ghost: No background with black text
        ghost: "text-black",
        // Accent: Black (previously pink)
        accent: "bg-black text-white",
        // Destructive: Clean red
        destructive: "bg-red-500 text-white",
      },
      size: {
        sm: "h-9 px-3",
        md: "h-10 px-4 py-2",
        lg: "h-11 px-8", // Removed rounded-md here, base has it
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

// Button component with simplified event handling
const Button = React.forwardRef((props, ref) => {
  const { 
    className, 
    variant, 
    size, 
    isLoading = false, 
    disabled = false, 
    children, 
    icon: Icon, 
    onClick,
    ...rest
  } = props;
  
  // Simple combined class names
  const classes = cn(buttonVariants({ variant, size }), className);
  
  // Simple click handler for debugging
  const handleClick = (e) => {
    if (onClick && !disabled && !isLoading) {
      // For follow buttons, stop event propagation
      if (props['data-testid']?.includes('follow') || 
          props['aria-label']?.includes('follow')) {
        e.stopPropagation();
        e.preventDefault();
        console.log('[Button] Follow button clicked');
      }
      onClick(e);
    }
  };
  
  return (
    <button
      ref={ref}
      className={classes}
      disabled={disabled || isLoading}
      onClick={handleClick}
      {...rest}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          {Icon && <Icon className="mr-2 h-4 w-4 flex-shrink-0" />}
          {children}
        </>
      )}
    </button>
  );
});

Button.displayName = "Button";

export default Button;
export { buttonVariants };