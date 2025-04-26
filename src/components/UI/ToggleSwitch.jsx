/* src/components/UI/ToggleSwitch.jsx */
/**
 * ToggleSwitch component for selecting content type (lists, restaurants, dishes).
 * @param {Object} props
 * @param {Array<{value: string, label: string}>} props.options - Toggle options
 * @param {string} props.selected - Currently selected value
 * @param {Function} props.onChange - Callback for value change
 */
import React from 'react';
import { cn } from '@/lib/utils';

const ToggleSwitch = ({ options, selected, onChange }) => {
  return (
    <div className="inline-flex rounded-full border border-gray-200 bg-gray-100 p-1" role="radiogroup">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            'px-4 py-1 text-sm font-medium rounded-full transition-colors',
            selected === option.value
              ? 'bg-[#A78B71] text-white'
              : 'text-gray-700 hover:bg-gray-200'
          )}
          role="radio"
          aria-checked={selected === option.value}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default ToggleSwitch;