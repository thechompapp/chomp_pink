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
    <div className="inline-flex rounded-full border border-black bg-white p-1" role="radiogroup">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            'px-4 py-1 text-sm font-medium rounded-full',
            selected === option.value
              ? 'bg-black text-white'
              : 'text-black'
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