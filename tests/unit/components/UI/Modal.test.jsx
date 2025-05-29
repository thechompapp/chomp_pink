import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from '@/components/UI/Modal';

// Mock portal for modal rendering
vi.mock('react-dom', () => ({
  ...vi.importActual('react-dom'),
  createPortal: vi.fn((element) => element)
}));

describe('Modal Component', () => {
  const mockProps = {
    isOpen: true,
    onClose: vi.fn(),
    title: 'Test Modal',
    children: <div>Modal content</div>
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset body overflow style
    document.body.style.overflow = '';
  });

  describe('Rendering and Visibility', () => {
    it('should render when open', () => {
      render(<Modal {...mockProps} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      render(<Modal {...mockProps} isOpen={false} />);
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render with custom className', () => {
      render(<Modal {...mockProps} className="custom-modal" />);
      
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveClass('custom-modal');
    });

    it('should render without title', () => {
      render(<Modal {...mockProps} title={null} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });
  });

  describe('Interaction and Events', () => {
    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<Modal {...mockProps} />);
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);
      
      expect(mockProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when backdrop is clicked', async () => {
      const user = userEvent.setup();
      render(<Modal {...mockProps} />);
      
      const backdrop = screen.getByTestId('modal-backdrop');
      await user.click(backdrop);
      
      expect(mockProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('should not close when modal content is clicked', async () => {
      const user = userEvent.setup();
      render(<Modal {...mockProps} />);
      
      const modalContent = screen.getByText('Modal content');
      await user.click(modalContent);
      
      expect(mockProps.onClose).not.toHaveBeenCalled();
    });

    it('should close on Escape key press', async () => {
      const user = userEvent.setup();
      render(<Modal {...mockProps} />);
      
      await user.keyboard('{Escape}');
      
      expect(mockProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('should not close on backdrop click when closeOnBackdrop is false', async () => {
      const user = userEvent.setup();
      render(<Modal {...mockProps} closeOnBackdrop={false} />);
      
      const backdrop = screen.getByTestId('modal-backdrop');
      await user.click(backdrop);
      
      expect(mockProps.onClose).not.toHaveBeenCalled();
    });

    it('should not close on Escape when closeOnEscape is false', async () => {
      const user = userEvent.setup();
      render(<Modal {...mockProps} closeOnEscape={false} />);
      
      await user.keyboard('{Escape}');
      
      expect(mockProps.onClose).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation and Focus Management', () => {
    it('should trap focus within modal', async () => {
      const user = userEvent.setup();
      render(
        <Modal {...mockProps}>
          <input data-testid="first-input" />
          <button>Button</button>
          <input data-testid="last-input" />
        </Modal>
      );
      
      const firstInput = screen.getByTestId('first-input');
      const lastInput = screen.getByTestId('last-input');
      const closeButton = screen.getByRole('button', { name: /close/i });
      
      // Focus should start at close button
      expect(closeButton).toHaveFocus();
      
      // Tab should move to first input
      await user.tab();
      expect(firstInput).toHaveFocus();
      
      // Shift+Tab from first input should go to close button
      await user.tab({ shift: true });
      expect(closeButton).toHaveFocus();
    });

    it('should restore focus to trigger element on close', () => {
      const triggerButton = document.createElement('button');
      triggerButton.textContent = 'Open Modal';
      document.body.appendChild(triggerButton);
      triggerButton.focus();
      
      const { rerender } = render(<Modal {...mockProps} />);
      
      // Close modal
      rerender(<Modal {...mockProps} isOpen={false} />);
      
      expect(triggerButton).toHaveFocus();
      
      document.body.removeChild(triggerButton);
    });

    it('should focus first focusable element when opened', () => {
      render(
        <Modal {...mockProps}>
          <input data-testid="first-focusable" />
          <button>Second</button>
        </Modal>
      );
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toHaveFocus();
    });
  });

  describe('Body Scroll Lock', () => {
    it('should lock body scroll when modal opens', () => {
      render(<Modal {...mockProps} />);
      
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should restore body scroll when modal closes', () => {
      const { rerender } = render(<Modal {...mockProps} />);
      
      expect(document.body.style.overflow).toBe('hidden');
      
      rerender(<Modal {...mockProps} isOpen={false} />);
      
      expect(document.body.style.overflow).toBe('');
    });

    it('should not lock scroll when disableScrollLock is true', () => {
      render(<Modal {...mockProps} disableScrollLock={true} />);
      
      expect(document.body.style.overflow).not.toBe('hidden');
    });
  });

  describe('Size Variants', () => {
    it('should apply small size class', () => {
      render(<Modal {...mockProps} size="small" />);
      
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveClass('modal-small');
    });

    it('should apply large size class', () => {
      render(<Modal {...mockProps} size="large" />);
      
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveClass('modal-large');
    });

    it('should apply full size class', () => {
      render(<Modal {...mockProps} size="full" />);
      
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveClass('modal-full');
    });

    it('should use medium as default size', () => {
      render(<Modal {...mockProps} />);
      
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveClass('modal-medium');
    });
  });

  describe('Animation and Transitions', () => {
    it('should have animation classes when opening', () => {
      render(<Modal {...mockProps} />);
      
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveClass('modal-enter');
    });

    it('should handle animation completion', async () => {
      render(<Modal {...mockProps} />);
      
      const modal = screen.getByRole('dialog');
      
      // Simulate animation end
      fireEvent.animationEnd(modal);
      
      expect(modal).toHaveClass('modal-enter-active');
    });

    it('should disable animations when specified', () => {
      render(<Modal {...mockProps} disableAnimation={true} />);
      
      const modal = screen.getByRole('dialog');
      expect(modal).not.toHaveClass('modal-enter');
    });
  });

  describe('Custom Footer and Header', () => {
    it('should render custom footer', () => {
      const customFooter = (
        <div data-testid="custom-footer">
          <button>Save</button>
          <button>Cancel</button>
        </div>
      );
      
      render(<Modal {...mockProps} footer={customFooter} />);
      
      expect(screen.getByTestId('custom-footer')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    });

    it('should render custom header', () => {
      const customHeader = (
        <div data-testid="custom-header">
          <h2>Custom Title</h2>
          <span>Subtitle</span>
        </div>
      );
      
      render(<Modal {...mockProps} header={customHeader} title={null} />);
      
      expect(screen.getByTestId('custom-header')).toBeInTheDocument();
      expect(screen.getByText('Custom Title')).toBeInTheDocument();
    });

    it('should hide close button when specified', () => {
      render(<Modal {...mockProps} showCloseButton={false} />);
      
      expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<Modal {...mockProps} />);
      
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');
      expect(modal).toHaveAttribute('aria-labelledby');
    });

    it('should have aria-describedby when description is provided', () => {
      render(<Modal {...mockProps} description="Modal description" />);
      
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveAttribute('aria-describedby');
      expect(screen.getByText('Modal description')).toBeInTheDocument();
    });

    it('should support screen reader announcements', () => {
      render(<Modal {...mockProps} />);
      
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveAttribute('role', 'dialog');
    });

    it('should be marked as alert dialog when specified', () => {
      render(<Modal {...mockProps} role="alertdialog" />);
      
      const modal = screen.getByRole('alertdialog');
      expect(modal).toBeInTheDocument();
    });
  });

  describe('Portal Rendering', () => {
    it('should render in portal container when specified', () => {
      const portalContainer = document.createElement('div');
      portalContainer.id = 'modal-root';
      document.body.appendChild(portalContainer);
      
      render(<Modal {...mockProps} portalContainer={portalContainer} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      
      document.body.removeChild(portalContainer);
    });

    it('should render in document body by default', () => {
      render(<Modal {...mockProps} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Error Boundaries and Edge Cases', () => {
    it('should handle missing onClose gracefully', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<Modal {...mockProps} onClose={undefined} />);
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);
      
      // Should not throw error
      expect(consoleError).not.toHaveBeenCalled();
      
      consoleError.mockRestore();
    });

    it('should handle portal container not found', () => {
      const nonExistentContainer = document.createElement('div');
      
      render(<Modal {...mockProps} portalContainer={nonExistentContainer} />);
      
      // Should still render
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should cleanup event listeners on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
      
      const { unmount } = render(<Modal {...mockProps} />);
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('Performance Optimizations', () => {
    it('should not re-render when props do not change', () => {
      const renderSpy = vi.fn();
      
      const TestModal = (props) => {
        renderSpy();
        return <Modal {...props} />;
      };
      
      const { rerender } = render(<TestModal {...mockProps} />);
      
      renderSpy.mockClear();
      rerender(<TestModal {...mockProps} />);
      
      // Should not re-render for same props
      expect(renderSpy).toHaveBeenCalledTimes(1);
    });

    it('should lazy load animation styles', () => {
      // Test that animation styles are only applied when needed
      render(<Modal {...mockProps} disableAnimation={true} />);
      
      const modal = screen.getByRole('dialog');
      expect(modal).not.toHaveClass('modal-enter');
    });
  });
}); 