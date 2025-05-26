/**
 * IconButton Component Tests
 * 
 * Unit tests for the IconButton component.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import IconButton from '@/components/common/buttons/IconButton';

// Mock icon component
const MockIcon = () => <svg data-testid="mock-icon" />;

describe('IconButton Component', () => {
  test('renders with icon and text', () => {
    render(
      <IconButton icon={<MockIcon />}>
        Button Text
      </IconButton>
    );
    
    const button = screen.getByRole('button', { name: /button text/i });
    const icon = screen.getByTestId('mock-icon');
    
    expect(button).toBeInTheDocument();
    expect(icon).toBeInTheDocument();
    expect(button).toHaveClass('icon-btn');
    expect(button).toHaveClass('icon-left');
  });
  
  test('renders with icon on the right', () => {
    render(
      <IconButton icon={<MockIcon />} iconPosition="right">
        Right Icon
      </IconButton>
    );
    
    const button = screen.getByRole('button', { name: /right icon/i });
    
    expect(button).toHaveClass('icon-right');
  });
  
  test('renders icon-only button', () => {
    render(
      <IconButton icon={<MockIcon />} iconOnly>
        Icon Only
      </IconButton>
    );
    
    const button = screen.getByRole('button');
    const iconText = screen.queryByText('Icon Only');
    
    expect(button).toHaveClass('icon-only');
    expect(iconText).not.toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label', 'Icon Only');
  });
  
  test('renders with tooltip', () => {
    render(
      <IconButton icon={<MockIcon />} tooltip="Button Tooltip">
        Tooltip Button
      </IconButton>
    );
    
    const button = screen.getByRole('button', { name: /tooltip button/i });
    
    expect(button).toHaveAttribute('title', 'Button Tooltip');
  });
  
  test('uses text as tooltip for icon-only buttons', () => {
    render(
      <IconButton icon={<MockIcon />} iconOnly>
        Icon Tooltip
      </IconButton>
    );
    
    const button = screen.getByRole('button');
    
    expect(button).toHaveAttribute('title', 'Icon Tooltip');
  });
  
  test('passes additional props to Button component', () => {
    render(
      <IconButton 
        icon={<MockIcon />} 
        variant="secondary" 
        size="lg" 
        fullWidth 
        disabled
      >
        Custom Button
      </IconButton>
    );
    
    const button = screen.getByRole('button', { name: /custom button/i });
    
    expect(button).toHaveClass('btn-secondary');
    expect(button).toHaveClass('btn-lg');
    expect(button).toHaveClass('btn-full-width');
    expect(button).toBeDisabled();
  });
  
  test('applies custom className', () => {
    render(
      <IconButton icon={<MockIcon />} className="custom-class">
        Custom Icon Button
      </IconButton>
    );
    
    const button = screen.getByRole('button', { name: /custom icon button/i });
    
    expect(button).toHaveClass('custom-class');
  });
});
