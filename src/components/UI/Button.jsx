// src/components/UI/Button.jsx
import React from 'react';
import { Loader2 } from 'lucide-react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "inline-flex items-center justify-center text-sm font-medium transition-colors focus:outline-none focus:ring-0 disabled:opacity-50 disabled:pointer-events-none rounded-md border shadow-sm",
  {
    variants: {
      variant: {
        primary: "bg-white text-black border-gray-300 hover:bg-gray-50 hover:border-gray-400",
        secondary: "bg-white text-black border-gray-300 hover:bg-gray-50 hover:border-gray-400",
        accent: "bg-white text-black border-gray-300 hover:bg-gray-50 hover:border-gray-400",
        ghost: "bg-white text-black border-gray-300 hover:bg-gray-50 hover:border-gray-400",
        link: "bg-white text-black border-gray-300 hover:bg-gray-50 hover:border-gray-400 underline-offset-4 hover:underline",
        destructive: "bg-white text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400",
        outline: "bg-white text-black border-gray-300 hover:bg-gray-50 hover:border-gray-400",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 py-2",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

const Button = React.forwardRef(({
  className,
  variant,
  size,
  isLoading = false,
  children,
  ...props
}, ref) => {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : null}
      {children}
    </button>
  );
});

Button.displayName = 'Button';

// Support both default and named exports
export default Button;
export { Button, buttonVariants };