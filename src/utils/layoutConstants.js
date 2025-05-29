/**
 * Centralized layout constants for consistent UI across the application
 * These constants ensure uniform card layouts, spacing, and responsive behavior
 */

// Standard grid layouts for different content types
export const GRID_LAYOUTS = {
  // Primary content grid (for main content areas)
  PRIMARY: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4",
  
  // Compact grid (for dense content or sidebar usage)
  COMPACT: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3",
  
  // Full width grid (for lists and detailed content)
  FULL_WIDTH: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
  
  // Search results grid (4 columns max for better readability)
  SEARCH: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4",
};

// Card dimensions
export const CARD_DIMENSIONS = {
  // Standard card height for all card types
  HEIGHT: "h-64",
  
  // Compact card height
  COMPACT_HEIGHT: "h-48",
  
  // Card padding
  PADDING: "p-4",
  
  // Card border radius
  BORDER_RADIUS: "rounded-lg",
  
  // Card border
  BORDER: "border border-black",
  
  // Card background
  BACKGROUND: "bg-white",
};

// Container dimensions and spacing
export const CONTAINER = {
  // Maximum width for page containers
  MAX_WIDTH: "max-w-7xl",
  
  // Standard padding for page containers
  PADDING: "px-4 sm:px-6 lg:px-8",
  
  // Vertical spacing
  VERTICAL_SPACING: "py-6",
  
  // Section spacing
  SECTION_SPACING: "space-y-6",
  
  // Content spacing
  CONTENT_SPACING: "space-y-4",
};

// Responsive breakpoints (matching Tailwind CSS)
export const BREAKPOINTS = {
  SM: '640px',   // sm
  MD: '768px',   // md
  LG: '1024px',  // lg
  XL: '1280px',  // xl
  '2XL': '1536px', // 2xl
};

// Animation constants
export const ANIMATIONS = {
  // Card entrance animation
  ENTRANCE: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.2 }
  },
  
  // Card hover animation
  HOVER: {
    y: -2,
    boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
    transition: { duration: 0.2 }
  },
  
  // Tag stagger animation
  TAG_STAGGER: {
    visible: {
      transition: {
        staggerChildren: 0.02
      }
    }
  }
};

// Typography and spacing
export const TYPOGRAPHY = {
  // Page titles
  PAGE_TITLE: "text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100",
  
  // Section titles
  SECTION_TITLE: "text-xl font-semibold text-foreground mb-3",
  
  // Card titles
  CARD_TITLE: "text-lg font-bold text-black line-clamp-2 mb-1",
  
  // Card metadata
  CARD_METADATA: "text-sm text-gray-600",
  
  // Card description
  CARD_DESCRIPTION: "text-sm text-gray-600 line-clamp-2 mb-2 leading-relaxed",
};

// Color palette for consistent theming
export const COLORS = {
  // Type label colors
  RESTAURANT_BADGE: "bg-orange-100 text-orange-700",
  DISH_BADGE: "bg-green-100 text-green-700",
  LIST_BADGE: "bg-blue-100 text-blue-700",
  
  // Status colors
  FEATURED: "bg-purple-100 text-purple-700",
  TRENDING: "bg-red-100 text-red-700",
  OPEN: "bg-green-100 text-green-700",
  
  // Button colors
  ADD_BUTTON: "bg-black text-white",
  EXTERNAL_BUTTON: "text-gray-400 hover:text-gray-600",
};

// Complete layout utility function
export const getGridLayout = (type = 'primary') => {
  switch (type) {
    case 'compact':
      return GRID_LAYOUTS.COMPACT;
    case 'full-width':
      return GRID_LAYOUTS.FULL_WIDTH;
    case 'search':
      return GRID_LAYOUTS.SEARCH;
    case 'primary':
    default:
      return GRID_LAYOUTS.PRIMARY;
  }
};

// Complete card class builder
export const getCardClasses = (variant = 'default') => {
  const base = `${CARD_DIMENSIONS.BACKGROUND} ${CARD_DIMENSIONS.BORDER_RADIUS} ${CARD_DIMENSIONS.BORDER} ${CARD_DIMENSIONS.PADDING} ${CARD_DIMENSIONS.HEIGHT} overflow-hidden relative hover:shadow-lg transition-all duration-200`;
  
  switch (variant) {
    case 'compact':
      return base.replace(CARD_DIMENSIONS.HEIGHT, CARD_DIMENSIONS.COMPACT_HEIGHT);
    default:
      return base;
  }
};

// Complete container class builder
export const getContainerClasses = () => {
  return `${CONTAINER.MAX_WIDTH} mx-auto ${CONTAINER.PADDING} ${CONTAINER.VERTICAL_SPACING} ${CONTAINER.SECTION_SPACING}`;
}; 