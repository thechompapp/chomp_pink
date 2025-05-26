/**
 * Alert Component Tests
 * 
 * Unit tests for the Alert component.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Alert from '@/components/common/feedback/Alert';

describe('Alert Component', () => {
  test('renders with default props', () => {
    render(<Alert>Alert message</Alert>);
    
    const alert = screen.getByRole('alert');
    const message = screen.getByText('Alert message');
    
    expect(alert).toBeInTheDocument();
    expect(message).toBeInTheDocument();
    expect(alert).toHaveClass('alert');
    expect(alert).toHaveClass('alert-info');
  });
  
  test('renders with different variants', () => {
    const { rerender } = render(<Alert variant="success">Success alert</Alert>);
    
    let alert = screen.getByRole('alert');
    expect(alert).toHaveClass('alert-success');
    
    rerender(<Alert variant="warning">Warning alert</Alert>);
    alert = screen.getByRole('alert');
    expect(alert).toHaveClass('alert-warning');
    
    rerender(<Alert variant="error">Error alert</Alert>);
    alert = screen.getByRole('alert');
    expect(alert).toHaveClass('alert-error');
  });
  
  test('renders with title', () => {
    render(<Alert title="Alert Title">Alert message</Alert>);
    
    const title = screen.getByText('Alert Title');
    
    expect(title).toBeInTheDocument();
    expect(title).toHaveClass('alert-title');
  });
  
  test('renders dismissible alert with close button', () => {
    render(<Alert dismissible>Dismissible alert</Alert>);
    
    const closeButton = screen.getByRole('button', { name: /dismiss/i });
    
    expect(closeButton).toBeInTheDocument();
    expect(closeButton).toHaveClass('alert-dismiss');
  });
  
  test('calls onDismiss handler when close button is clicked', () => {
    const handleDismiss = jest.fn();
    
    render(
      <Alert dismissible onDismiss={handleDismiss}>
        Dismissible alert
      </Alert>
    );
    
    const closeButton = screen.getByRole('button', { name: /dismiss/i });
    fireEvent.click(closeButton);
    
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });
  
  test('hides alert when dismissed', () => {
    render(
      <Alert dismissible>
        Dismissible alert
      </Alert>
    );
    
    const closeButton = screen.getByRole('button', { name: /dismiss/i });
    fireEvent.click(closeButton);
    
    const alert = screen.queryByRole('alert');
    expect(alert).not.toBeInTheDocument();
  });
  
  test('renders appropriate icon based on variant', () => {
    const { rerender } = render(<Alert variant="info">Info alert</Alert>);
    
    let alert = screen.getByRole('alert');
    let iconContainer = alert.querySelector('.alert-icon-container');
    expect(iconContainer).toBeInTheDocument();
    
    rerender(<Alert variant="success">Success alert</Alert>);
    alert = screen.getByRole('alert');
    iconContainer = alert.querySelector('.alert-icon-container');
    expect(iconContainer).toBeInTheDocument();
    
    rerender(<Alert variant="warning">Warning alert</Alert>);
    alert = screen.getByRole('alert');
    iconContainer = alert.querySelector('.alert-icon-container');
    expect(iconContainer).toBeInTheDocument();
    
    rerender(<Alert variant="error">Error alert</Alert>);
    alert = screen.getByRole('alert');
    iconContainer = alert.querySelector('.alert-icon-container');
    expect(iconContainer).toBeInTheDocument();
  });
  
  test('applies custom className', () => {
    render(<Alert className="custom-alert">Custom alert</Alert>);
    
    const alert = screen.getByRole('alert');
    
    expect(alert).toHaveClass('custom-alert');
  });
  
  test('passes additional props to alert element', () => {
    render(
      <Alert data-testid="custom-alert">
        Alert with custom props
      </Alert>
    );
    
    const alert = screen.getByTestId('custom-alert');
    
    expect(alert).toBeInTheDocument();
  });
});
