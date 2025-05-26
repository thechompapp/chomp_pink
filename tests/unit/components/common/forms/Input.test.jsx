/**
 * Input Component Tests
 * 
 * Unit tests for the Input component.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Input from '@/components/common/forms/Input';

describe('Input Component', () => {
  test('renders with default props', () => {
    render(<Input name="test-input" />);
    
    const input = screen.getByRole('textbox');
    
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('name', 'test-input');
    expect(input).toHaveAttribute('type', 'text');
    expect(input).not.toBeDisabled();
    expect(input).not.toHaveAttribute('readonly');
    expect(input).not.toHaveAttribute('required');
  });
  
  test('renders with label', () => {
    render(<Input name="test-input" label="Test Label" />);
    
    const label = screen.getByText('Test Label');
    const input = screen.getByLabelText('Test Label');
    
    expect(label).toBeInTheDocument();
    expect(input).toBeInTheDocument();
    expect(label).toHaveClass('input-label');
  });
  
  test('renders required indicator when required is true', () => {
    render(<Input name="test-input" label="Required Field" required />);
    
    const requiredIndicator = screen.getByText('*');
    
    expect(requiredIndicator).toBeInTheDocument();
    expect(requiredIndicator).toHaveClass('input-required');
  });
  
  test('renders with placeholder', () => {
    render(<Input name="test-input" placeholder="Enter value" />);
    
    const input = screen.getByPlaceholderText('Enter value');
    
    expect(input).toBeInTheDocument();
  });
  
  test('renders with value', () => {
    render(<Input name="test-input" value="Test Value" />);
    
    const input = screen.getByDisplayValue('Test Value');
    
    expect(input).toBeInTheDocument();
  });
  
  test('calls onChange handler when input changes', () => {
    const handleChange = jest.fn();
    
    render(<Input name="test-input" onChange={handleChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'New Value' } });
    
    expect(handleChange).toHaveBeenCalledTimes(1);
  });
  
  test('calls onBlur handler when input loses focus', () => {
    const handleBlur = jest.fn();
    
    render(<Input name="test-input" onBlur={handleBlur} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.blur(input);
    
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });
  
  test('renders as disabled when disabled is true', () => {
    render(<Input name="test-input" disabled />);
    
    const input = screen.getByRole('textbox');
    const container = input.closest('.input-container');
    
    expect(input).toBeDisabled();
    expect(container).toHaveClass('input-disabled');
  });
  
  test('renders as read-only when readOnly is true', () => {
    render(<Input name="test-input" readOnly />);
    
    const input = screen.getByRole('textbox');
    const container = input.closest('.input-container');
    
    expect(input).toHaveAttribute('readonly');
    expect(container).toHaveClass('input-readonly');
  });
  
  test('renders error message when error is provided', () => {
    render(<Input name="test-input" error="This field is required" />);
    
    const input = screen.getByRole('textbox');
    const errorMessage = screen.getByText('This field is required');
    
    expect(input).toHaveClass('input-field-error');
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveClass('input-error-text');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });
  
  test('renders helper text when helperText is provided', () => {
    render(<Input name="test-input" helperText="Enter your username" />);
    
    const helperText = screen.getByText('Enter your username');
    
    expect(helperText).toBeInTheDocument();
    expect(helperText).toHaveClass('input-helper-text');
  });
  
  test('does not render helper text when error is provided', () => {
    render(
      <Input 
        name="test-input" 
        error="This field is required" 
        helperText="Enter your username" 
      />
    );
    
    const errorMessage = screen.getByText('This field is required');
    const helperText = screen.queryByText('Enter your username');
    
    expect(errorMessage).toBeInTheDocument();
    expect(helperText).not.toBeInTheDocument();
  });
  
  test('renders with different input types', () => {
    render(<Input name="password-input" type="password" />);
    
    const input = screen.getByRole('textbox', { hidden: true });
    
    expect(input).toHaveAttribute('type', 'password');
  });
  
  test('applies custom className', () => {
    render(<Input name="test-input" className="custom-input" />);
    
    const container = screen.getByRole('textbox').closest('.input-container');
    
    expect(container).toHaveClass('custom-input');
  });
  
  test('passes inputProps to input element', () => {
    render(
      <Input 
        name="test-input" 
        inputProps={{ 
          'data-testid': 'custom-input',
          maxLength: 10,
          autoComplete: 'off'
        }} 
      />
    );
    
    const input = screen.getByTestId('custom-input');
    
    expect(input).toHaveAttribute('maxLength', '10');
    expect(input).toHaveAttribute('autoComplete', 'off');
  });
});
