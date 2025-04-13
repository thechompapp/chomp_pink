import { ReactNode } from 'react';

declare module '@/components/UI/Input.jsx' {
  interface InputProps {
    type: string;
    value: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    className?: string;
    icon?: ReactNode;
    disabled?: boolean;
    label?: string;
    readOnly?: boolean;
  }

  const Input: React.FC<InputProps>;
  export default Input;
}

declare module '@/components/UI/Select.jsx' {
  interface SelectOption {
    value: string;
    label: string;
  }

  interface SelectProps {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    label?: string;
    options: SelectOption[];
    className?: string;
    disabled?: boolean;
  }

  const Select: React.FC<SelectProps>;
  export default Select;
} 