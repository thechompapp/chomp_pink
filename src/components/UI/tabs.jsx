import React from 'react';
import { cn } from '@/lib/utils';

const TabsContext = React.createContext();

const Tabs = React.forwardRef(({ className, defaultValue, value, onValueChange, ...props }, ref) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const currentValue = value !== undefined ? value : internalValue;

  const handleValueChange = React.useCallback((newValue) => {
    if (value === undefined) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  }, [value, onValueChange]);

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
      <div
        ref={ref}
        className={cn("w-full", className)}
        {...props}
      />
    </TabsContext.Provider>
  );
});
Tabs.displayName = "Tabs";

const TabsList = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-500",
      className
    )}
    {...props}
  />
));
TabsList.displayName = "TabsList";

const TabsTrigger = React.forwardRef(({ className, value, ...props }, ref) => {
  const context = React.useContext(TabsContext);
  const isActive = context?.value === value;

  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isActive
          ? "bg-white text-gray-950 shadow-sm"
          : "text-gray-500 hover:text-gray-900",
        className
      )}
      onClick={() => context?.onValueChange?.(value)}
      {...props}
    />
  );
});
TabsTrigger.displayName = "TabsTrigger";

const TabsContent = React.forwardRef(({ className, value, ...props }, ref) => {
  const context = React.useContext(TabsContext);
  const isActive = context?.value === value;

  if (!isActive) return null;

  return (
    <div
      ref={ref}
      className={cn(
        "mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2",
        className
      )}
      {...props}
    />
  );
});
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent }; 