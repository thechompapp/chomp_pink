/**
 * FloatingQuickAdd - Central Export Module
 * 
 * This module maintains 100% backward compatibility with the original FloatingQuickAdd
 * while providing access to the new modular architecture.
 * 
 * All existing imports and usage patterns continue to work unchanged.
 */

// Main component export for backward compatibility
export { default } from './FloatingQuickAdd';

// Modular exports for advanced usage
export { useQuickAddState } from './hooks/useQuickAddState';
export { useQuickAddForms } from './hooks/useQuickAddForms';
export { useQuickAddData } from './hooks/useQuickAddData';
export { useQuickAddSubmissions } from './hooks/useQuickAddSubmissions';

export { 
  ErrorDisplay, 
  SuccessDisplay, 
  LoadingIndicator, 
  FormNavigation, 
  FloatingActionButton, 
  FormField, 
  SuggestionsList 
} from './components/QuickAddUIComponents';

export { ListFormView } from './views/ListFormView';
export { RestaurantFormView } from './views/RestaurantFormView';
export { DishFormView } from './views/DishFormView';
export { MainMenuView } from './views/MainMenuView'; 