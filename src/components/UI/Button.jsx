// src/components/UI/Button.jsx
import React from 'react';
import { Loader2 } from 'lucide-react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils'; // Make sure this utility exists

// Define button variants using cva and theme colors
const buttonVariants = cva(
  // Base styles
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background", // Added ring-offset-background
  {
    variants: {
      variant: {
        // Primary: Use primary background and foreground from theme
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        // Outline: Use border color, transparent bg, primary text on hover
        outline: "border border-border bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground",
        // Secondary: Use secondary background/foreground
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        // Ghost: Transparent with hover effect
        ghost: "hover:bg-accent hover:text-accent-foreground",
        // Accent Pink: Use accent-pink variable
        accent: "bg-[hsl(var(--accent-pink))] text-[hsl(var(--accent-pink-foreground))] hover:bg-[hsl(var(--accent-pink))]/90",
        // Destructive: Use destructive colors
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
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

// Button component using cva and cn
const Button = React.forwardRef(({ className, variant, size, isLoading = false, disabled = false, children, icon: Icon, ...props }, ref) => {
  const combinedClassName = cn(buttonVariants({ variant, size, className }));

  return (
    <button
      className={combinedClassName}
      ref={ref}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          {Icon && <Icon className="mr-2 h-4 w-4 flex-shrink-0" />} {/* Added flex-shrink-0 */}
          {children}
        </>
      )}
    </button>
  );
});
Button.displayName = "Button";

export default Button;
export { buttonVariants }; // Export variants if needed elsewhere