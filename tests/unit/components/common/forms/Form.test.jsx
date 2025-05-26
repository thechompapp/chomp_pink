/**
 * Form Component Tests
 * 
 * Unit tests for the Form component.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Form from '@/components/common/forms/Form';

describe('Form Component', () => {
  test('renders with children', () => {
    render(
      <Form onSubmit={jest.fn()}>
        <div data-testid="form-content">Form Content</div>
      </Form>
    );
    
    const formElement = screen.getByRole('form');
    const formContent = screen.getByTestId('form-content');
    
    expect(formElement).toBeInTheDocument();
    expect(formContent).toBeInTheDocument();
    expect(formElement).toHaveClass('form');
  });
  
  test('calls onSubmit handler when form is submitted', () => {
    const handleSubmit = jest.fn();
    
    render(
      <Form onSubmit={handleSubmit}>
        <button type="submit">Submit</button>
      </Form>
    );
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);
    
    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });
  
  test('prevents default form submission behavior', () => {
    const handleSubmit = jest.fn();
    
    render(
      <Form onSubmit={handleSubmit}>
        <button type="submit">Submit</button>
      </Form>
    );
    
    const formElement = screen.getByRole('form');
    const submitEvent = createSubmitEvent();
    
    fireEvent(formElement, submitEvent);
    
    expect(submitEvent.preventDefault).toHaveBeenCalledTimes(1);
    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });
  
  test('does not call onSubmit when form is disabled', () => {
    const handleSubmit = jest.fn();
    
    render(
      <Form onSubmit={handleSubmit} disabled>
        <button type="submit">Submit</button>
      </Form>
    );
    
    const formElement = screen.getByRole('form');
    const submitEvent = createSubmitEvent();
    
    fireEvent(formElement, submitEvent);
    
    expect(submitEvent.preventDefault).toHaveBeenCalledTimes(1);
    expect(handleSubmit).not.toHaveBeenCalled();
  });
  
  test('applies disabled class when disabled is true', () => {
    render(
      <Form onSubmit={jest.fn()} disabled>
        <div>Form Content</div>
      </Form>
    );
    
    const formElement = screen.getByRole('form');
    
    expect(formElement).toHaveClass('form-disabled');
  });
  
  test('applies custom className', () => {
    render(
      <Form onSubmit={jest.fn()} className="custom-form">
        <div>Form Content</div>
      </Form>
    );
    
    const formElement = screen.getByRole('form');
    
    expect(formElement).toHaveClass('custom-form');
  });
  
  test('passes additional props to form element', () => {
    render(
      <Form 
        onSubmit={jest.fn()} 
        data-testid="custom-form"
        name="test-form"
        autoComplete="off"
      >
        <div>Form Content</div>
      </Form>
    );
    
    const formElement = screen.getByTestId('custom-form');
    
    expect(formElement).toHaveAttribute('name', 'test-form');
    expect(formElement).toHaveAttribute('autoComplete', 'off');
  });
  
  test('has noValidate attribute', () => {
    render(
      <Form onSubmit={jest.fn()}>
        <div>Form Content</div>
      </Form>
    );
    
    const formElement = screen.getByRole('form');
    
    expect(formElement).toHaveAttribute('noValidate');
  });
});

// Helper function to create a submit event with preventDefault spy
function createSubmitEvent() {
  return {
    preventDefault: jest.fn(),
    stopPropagation: jest.fn()
  };
}
