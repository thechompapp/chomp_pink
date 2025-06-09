/* src/components/UI/ToggleSwitch.jsx */
/**
 * ToggleSwitch component for selecting content type (lists, restaurants, dishes).
 * @param {Object} props
 * @param {Array<{value: string, label: string}>} props.options - Toggle options
 * @param {string} props.selected - Currently selected value
 * @param {string} props.value - Alternative value for backward compatibility
 * @param {Function} props.onChange - Callback for value change
 */
import React from 'react';
import { cn } from '@/lib/utils';

const ToggleSwitch = ({ options = [], selected, value, onChange }) => {
  // Defensive programming: ensure options is always an array
  const safeOptions = Array.isArray(options) ? options : [];
  
  // Support both 'selected' and 'value' props for backward compatibility
  const activeValue = selected || value;
  
  if (safeOptions.length === 0) {
    console.warn('ToggleSwitch: No options provided');
    return null;
  }

  return (
    <div className="inline-flex rounded-full border border-black bg-white p-1" role="radiogroup">
      {safeOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange?.(option.value)}
          className={cn(
            'px-4 py-1 text-sm font-medium rounded-full transition-colors',
            activeValue === option.value
              ? 'bg-black text-white'
              : 'text-black hover:bg-gray-100'
          )}
          role="radio"
          aria-checked={activeValue === option.value}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default ToggleSwitch;