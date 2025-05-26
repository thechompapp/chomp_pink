/**
 * Button Component Tests
 * 
 * Unit tests for the Button component.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '@/components/common/buttons/Button';

describe('Button Component', () => {
  test('renders with default props', () => {
    render(<Button>Click me</Button>);
    
    const button = screen.getByRole('button', { name: /click me/i });
    
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('btn');
    expect(button).toHaveClass('btn-primary');
    expect(button).toHaveClass('btn-md');
    expect(button).not.toHaveClass('btn-full-width');
    expect(button).not.toHaveClass('btn-loading');
    expect(button).not.toBeDisabled();
  });
  
  test('renders with custom variant and size', () => {
    render(
      <Button variant="secondary" size="lg">
        Secondary Button
      </Button>
    );
    
    const button = screen.getByRole('button', { name: /secondary button/i });
    
    expect(button).toHaveClass('btn-secondary');
    expect(button).toHaveClass('btn-lg');
  });
  
  test('renders as full width when fullWidth is true', () => {
    render(<Button fullWidth>Full Width Button</Button>);
    
    const button = screen.getByRole('button', { name: /full width button/i });
    
    expect(button).toHaveClass('btn-full-width');
  });
  
  test('renders in loading state when isLoading is true', () => {
    render(<Button isLoading>Loading Button</Button>);
    
    const button = screen.getByRole('button', { name: /loading button/i });
    
    expect(button).toHaveClass('btn-loading');
    expect(button).toBeDisabled();
    expect(button.querySelector('.btn-loading-spinner')).toBeInTheDocument();
  });
  
  test('renders as disabled when disabled is true', () => {
    render(<Button disabled>Disabled Button</Button>);
    
    const button = screen.getByRole('button', { name: /disabled button/i });
    
    expect(button).toHaveClass('btn-disabled');
    expect(button).toBeDisabled();
  });
  
  test('applies custom className', () => {
    render(<Button className="custom-class">Custom Button</Button>);
    
    const button = screen.getByRole('button', { name: /custom button/i });
    
    expect(button).toHaveClass('custom-class');
  });
  
  test('calls onClick handler when clicked', () => {
    const handleClick = jest.fn();
    
    render(<Button onClick={handleClick}>Clickable Button</Button>);
    
    const button = screen.getByRole('button', { name: /clickable button/i });
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  test('does not call onClick handler when disabled', () => {
    const handleClick = jest.fn();
    
    render(
      <Button onClick={handleClick} disabled>
        Disabled Button
      </Button>
    );
    
    const button = screen.getByRole('button', { name: /disabled button/i });
    fireEvent.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
  });
  
  test('does not call onClick handler when loading', () => {
    const handleClick = jest.fn();
    
    render(
      <Button onClick={handleClick} isLoading>
        Loading Button
      </Button>
    );
    
    const button = screen.getByRole('button', { name: /loading button/i });
    fireEvent.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
  });
  
  test('renders with correct button type', () => {
    render(<Button type="submit">Submit Button</Button>);
    
    const button = screen.getByRole('button', { name: /submit button/i });
    
    expect(button).toHaveAttribute('type', 'submit');
  });
  
  test('passes additional props to button element', () => {
    render(
      <Button data-testid="test-button" aria-label="Test Button">
        Test Button
      </Button>
    );
    
    const button = screen.getByTestId('test-button');
    
    expect(button).toHaveAttribute('aria-label', 'Test Button');
  });
});
