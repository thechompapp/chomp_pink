/**
 * Common Components
 * 
 * Main export file for common reusable components.
 * Provides easy access to all standardized UI components.
 */

// Buttons
export { default as Button } from './buttons/Button';
export { default as IconButton } from './buttons/IconButton';

// Forms
export { default as Form } from './forms/Form';
export { default as Input } from './forms/Input';
export { default as Dropdown } from './forms/Dropdown';

// Feedback
export { default as Alert } from './feedback/Alert';
export { default as Toast } from './feedback/Toast';
export { default as Accordion } from './feedback/Accordion';

// Modals
export { default as Modal } from './modals/Modal';

// Cards
export { default as Card } from './cards/Card';

// Loaders
export { default as Spinner } from './loaders/Spinner';

// Pagination
export { default as Pagination } from './pagination/Pagination';

// Data Display
export { default as Table } from './data/Table';

// Navigation
export { default as TabPanel } from './navigation/TabPanel';

// Default export for convenient imports
export default {
  // Buttons
  Button,
  IconButton,
  
  // Forms
  Form,
  Input,
  Dropdown,
  
  // Feedback
  Alert,
  Toast,
  Accordion,
  
  // Modals
  Modal,
  
  // Cards
  Card,
  
  // Loaders
  Spinner,
  
  // Pagination
  Pagination,
  
  // Data Display
  Table,
  
  // Navigation
  TabPanel
};
