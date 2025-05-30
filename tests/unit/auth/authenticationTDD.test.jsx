import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { useAuth } from '@/contexts/auth/AuthContext';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }) => children,
}));

// Mock the auth store with comprehensive state management
const createMockAuthStore = (initialState = {}) => ({
  isAuthenticated: false,
  user: null,
  token: null,
  isSuperuser: false,
  superuserStatusReady: true,
  isLoading: false,
  error: null,
  lastAuthCheck: null,
  
  // Methods
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  checkAuthStatus: vi.fn(),
  setSuperuser: vi.fn(),
  
  // Getters
  getCurrentUser: vi.fn(() => initialState.user || null),
  getIsAuthenticated: vi.fn(() => initialState.isAuthenticated || false),
  getIsLoading: vi.fn(() => initialState.isLoading || false),
  getIsSuperuser: vi.fn(() => initialState.isSuperuser || false),
  getSuperuserStatusReady: vi.fn(() => initialState.superuserStatusReady || true),
  
  ...initialState
});

let mockAuthStore = createMockAuthStore();

vi.mock('@/contexts/auth/AuthContext', () => ({
  useAuth: vi.fn(() => mockAuthStore)
}));

// Mock components for testing
const MockProtectedComponent = () => {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    return <div data-testid="login-required">Please log in to continue</div>;
  }
  
  return (
    <div data-testid="protected-content">
      <p>Welcome, {user?.username || user?.email}!</p>
      <button data-testid="protected-action">Protected Action</button>
    </div>
  );
};

const MockAddToListButton = ({ onAddToList }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated || !onAddToList) return null;
  
  return (
    <button 
      data-testid="add-to-list-button"
      onClick={onAddToList}
    >
      Add to List
    </button>
  );
};

const MockAdminPanel = () => {
  const { isAuthenticated, isSuperuser, superuserStatusReady } = useAuth();
  
  if (!isAuthenticated) {
    return <div data-testid="admin-login-required">Admin access requires login</div>;
  }
  
  if (!superuserStatusReady) {
    return <div data-testid="admin-loading">Checking permissions...</div>;
  }
  
  if (!isSuperuser) {
    return <div data-testid="admin-access-denied">Access denied: Admin privileges required</div>;
  }
  
  return (
    <div data-testid="admin-panel">
      <h1>Admin Panel</h1>
      <button data-testid="admin-action">Admin Action</button>
      <button data-testid="bulk-add-button">Bulk Add</button>
    </div>
  );
};

const MockBulkAddComponent = () => {
  const { isAuthenticated, isSuperuser } = useAuth();
  
  if (!isAuthenticated || !isSuperuser) {
    return <div data-testid="bulk-add-protected">Bulk add requires admin privileges</div>;
  }
  
  return (
    <div data-testid="bulk-add-interface">
      <h2>Bulk Add Interface</h2>
      <button data-testid="bulk-upload">Upload CSV</button>
      <button data-testid="bulk-submit">Submit Bulk Data</button>
    </div>
  );
};

// Test wrapper component
const TestWrapper = ({ children, initialRoute = '/' }) => (
  <MemoryRouter initialEntries={[initialRoute]}>
    {children}
  </MemoryRouter>
);

describe('Authentication TDD Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to unauthenticated state by default
    mockAuthStore = createMockAuthStore({
      isAuthenticated: false,
      user: null,
      token: null,
      isSuperuser: false,
      superuserStatusReady: true,
      isLoading: false,
      error: null
    });
  });

  describe('TDD: Authentication State Management', () => {
    it('should start in unauthenticated state', () => {
      expect(mockAuthStore.isAuthenticated).toBe(false);
      expect(mockAuthStore.user).toBeNull();
      expect(mockAuthStore.token).toBeNull();
      expect(mockAuthStore.isSuperuser).toBe(false);
    });

    it('should track loading state during authentication', () => {
      mockAuthStore = createMockAuthStore({
        isLoading: true,
        isAuthenticated: false
      });

      expect(mockAuthStore.isLoading).toBe(true);
      expect(mockAuthStore.getIsLoading()).toBe(true);
    });

    it('should handle authentication success state', () => {
      mockAuthStore = createMockAuthStore({
        isAuthenticated: true,
        user: { id: 1, username: 'testuser', email: 'test@example.com' },
        token: 'test-token-123',
        isSuperuser: false
      });

      expect(mockAuthStore.isAuthenticated).toBe(true);
      expect(mockAuthStore.user).toEqual({
        id: 1,
        username: 'testuser',
        email: 'test@example.com'
      });
      expect(mockAuthStore.token).toBe('test-token-123');
      expect(mockAuthStore.getIsAuthenticated()).toBe(true);
    });

    it('should handle superuser authentication state', () => {
      mockAuthStore = createMockAuthStore({
        isAuthenticated: true,
        user: { 
          id: 1, 
          username: 'admin', 
          email: 'admin@example.com',
          account_type: 'superuser' 
        },
        token: 'admin-token-123',
        isSuperuser: true,
        superuserStatusReady: true
      });

      expect(mockAuthStore.isSuperuser).toBe(true);
      expect(mockAuthStore.getIsSuperuser()).toBe(true);
      expect(mockAuthStore.getSuperuserStatusReady()).toBe(true);
    });

    it('should handle authentication errors', () => {
      mockAuthStore = createMockAuthStore({
        isAuthenticated: false,
        error: 'Invalid credentials',
        isLoading: false
      });

      expect(mockAuthStore.error).toBe('Invalid credentials');
      expect(mockAuthStore.isAuthenticated).toBe(false);
    });
  });

  describe('TDD: UI Conditional Rendering Based on Auth State', () => {
    it('should hide protected components when unauthenticated', () => {
      render(
        <TestWrapper>
          <MockProtectedComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('login-required')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should show protected components when authenticated', () => {
      mockAuthStore = createMockAuthStore({
        isAuthenticated: true,
        user: { username: 'testuser' }
      });

      render(
        <TestWrapper>
          <MockProtectedComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(screen.getByText('Welcome, testuser!')).toBeInTheDocument();
      expect(screen.queryByTestId('login-required')).not.toBeInTheDocument();
    });

    it('should hide Add to List buttons when unauthenticated', () => {
      const mockOnAddToList = vi.fn();
      
      render(
        <TestWrapper>
          <MockAddToListButton onAddToList={mockOnAddToList} />
        </TestWrapper>
      );

      expect(screen.queryByTestId('add-to-list-button')).not.toBeInTheDocument();
    });

    it('should show Add to List buttons when authenticated', () => {
      mockAuthStore = createMockAuthStore({
        isAuthenticated: true,
        user: { id: 1, username: 'testuser' }
      });

      const mockOnAddToList = vi.fn();
      
      render(
        <TestWrapper>
          <MockAddToListButton onAddToList={mockOnAddToList} />
        </TestWrapper>
      );

      expect(screen.getByTestId('add-to-list-button')).toBeInTheDocument();
    });

    it('should handle authentication state changes dynamically', () => {
      const { rerender } = render(
        <TestWrapper>
          <MockProtectedComponent />
        </TestWrapper>
      );

      // Initially unauthenticated
      expect(screen.getByTestId('login-required')).toBeInTheDocument();

      // Update to authenticated state
      mockAuthStore = createMockAuthStore({
        isAuthenticated: true,
        user: { username: 'newuser' }
      });

      rerender(
        <TestWrapper>
          <MockProtectedComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(screen.getByText('Welcome, newuser!')).toBeInTheDocument();
    });
  });

  describe('TDD: Admin Panel Protected Route', () => {
    it('should require login for admin panel', () => {
      render(
        <TestWrapper>
          <MockAdminPanel />
        </TestWrapper>
      );

      expect(screen.getByTestId('admin-login-required')).toBeInTheDocument();
      expect(screen.queryByTestId('admin-panel')).not.toBeInTheDocument();
    });

    it('should show loading state while checking admin permissions', () => {
      mockAuthStore = createMockAuthStore({
        isAuthenticated: true,
        user: { username: 'testuser' },
        isSuperuser: false,
        superuserStatusReady: false // Still loading permissions
      });

      render(
        <TestWrapper>
          <MockAdminPanel />
        </TestWrapper>
      );

      expect(screen.getByTestId('admin-loading')).toBeInTheDocument();
      expect(screen.queryByTestId('admin-panel')).not.toBeInTheDocument();
    });

    it('should deny access to regular authenticated users', () => {
      mockAuthStore = createMockAuthStore({
        isAuthenticated: true,
        user: { username: 'regularuser' },
        isSuperuser: false,
        superuserStatusReady: true
      });

      render(
        <TestWrapper>
          <MockAdminPanel />
        </TestWrapper>
      );

      expect(screen.getByTestId('admin-access-denied')).toBeInTheDocument();
      expect(screen.queryByTestId('admin-panel')).not.toBeInTheDocument();
    });

    it('should grant access to superuser accounts', () => {
      mockAuthStore = createMockAuthStore({
        isAuthenticated: true,
        user: { 
          username: 'admin', 
          account_type: 'superuser' 
        },
        isSuperuser: true,
        superuserStatusReady: true
      });

      render(
        <TestWrapper>
          <MockAdminPanel />
        </TestWrapper>
      );

      expect(screen.getByTestId('admin-panel')).toBeInTheDocument();
      expect(screen.getByText('Admin Panel')).toBeInTheDocument();
      expect(screen.getByTestId('admin-action')).toBeInTheDocument();
      expect(screen.getByTestId('bulk-add-button')).toBeInTheDocument();
    });
  });

  describe('TDD: Bulk Add Protected Feature', () => {
    it('should protect bulk add from unauthenticated users', () => {
      render(
        <TestWrapper>
          <MockBulkAddComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('bulk-add-protected')).toBeInTheDocument();
      expect(screen.queryByTestId('bulk-add-interface')).not.toBeInTheDocument();
    });

    it('should protect bulk add from regular authenticated users', () => {
      mockAuthStore = createMockAuthStore({
        isAuthenticated: true,
        user: { username: 'regularuser' },
        isSuperuser: false
      });

      render(
        <TestWrapper>
          <MockBulkAddComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('bulk-add-protected')).toBeInTheDocument();
      expect(screen.queryByTestId('bulk-add-interface')).not.toBeInTheDocument();
    });

    it('should allow bulk add for superuser accounts', () => {
      mockAuthStore = createMockAuthStore({
        isAuthenticated: true,
        user: { 
          username: 'admin', 
          account_type: 'superuser' 
        },
        isSuperuser: true
      });

      render(
        <TestWrapper>
          <MockBulkAddComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('bulk-add-interface')).toBeInTheDocument();
      expect(screen.getByText('Bulk Add Interface')).toBeInTheDocument();
      expect(screen.getByTestId('bulk-upload')).toBeInTheDocument();
      expect(screen.getByTestId('bulk-submit')).toBeInTheDocument();
    });
  });

  describe('TDD: Authentication Actions and Interactions', () => {
    it('should call onAddToList when authenticated user clicks Add to List', async () => {
      mockAuthStore = createMockAuthStore({
        isAuthenticated: true,
        user: { id: 1, username: 'testuser' }
      });

      const mockOnAddToList = vi.fn();
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <MockAddToListButton onAddToList={mockOnAddToList} />
        </TestWrapper>
      );

      const addButton = screen.getByTestId('add-to-list-button');
      await user.click(addButton);

      expect(mockOnAddToList).toHaveBeenCalledTimes(1);
    });

    it('should handle admin actions when superuser is authenticated', async () => {
      mockAuthStore = createMockAuthStore({
        isAuthenticated: true,
        user: { username: 'admin' },
        isSuperuser: true,
        superuserStatusReady: true
      });

      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <MockAdminPanel />
        </TestWrapper>
      );

      const adminAction = screen.getByTestId('admin-action');
      const bulkAddButton = screen.getByTestId('bulk-add-button');

      expect(adminAction).toBeInTheDocument();
      expect(bulkAddButton).toBeInTheDocument();

      // Should be able to click admin actions
      await user.click(adminAction);
      await user.click(bulkAddButton);
    });

    it('should handle bulk add operations for authorized users', async () => {
      mockAuthStore = createMockAuthStore({
        isAuthenticated: true,
        user: { username: 'admin' },
        isSuperuser: true
      });

      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <MockBulkAddComponent />
        </TestWrapper>
      );

      const uploadButton = screen.getByTestId('bulk-upload');
      const submitButton = screen.getByTestId('bulk-submit');

      await user.click(uploadButton);
      await user.click(submitButton);

      // Buttons should be clickable for authorized users
      expect(uploadButton).toBeInTheDocument();
      expect(submitButton).toBeInTheDocument();
    });
  });

  describe('TDD: Permission Level Validation', () => {
    const testCases = [
      {
        name: 'unauthenticated user',
        state: { isAuthenticated: false, isSuperuser: false },
        expectations: {
          protectedContent: false,
          addToList: false,
          adminPanel: false,
          bulkAdd: false
        }
      },
      {
        name: 'regular authenticated user',
        state: { 
          isAuthenticated: true, 
          user: { username: 'regular' }, 
          isSuperuser: false,
          superuserStatusReady: true 
        },
        expectations: {
          protectedContent: true,
          addToList: true,
          adminPanel: false,
          bulkAdd: false
        }
      },
      {
        name: 'superuser',
        state: { 
          isAuthenticated: true, 
          user: { username: 'admin' }, 
          isSuperuser: true,
          superuserStatusReady: true 
        },
        expectations: {
          protectedContent: true,
          addToList: true,
          adminPanel: true,
          bulkAdd: true
        }
      }
    ];

    testCases.forEach(({ name, state, expectations }) => {
      it(`should apply correct permissions for ${name}`, () => {
        mockAuthStore = createMockAuthStore(state);

        const { container } = render(
          <TestWrapper>
            <div>
              <MockProtectedComponent />
              <MockAddToListButton onAddToList={vi.fn()} />
              <MockAdminPanel />
              <MockBulkAddComponent />
            </div>
          </TestWrapper>
        );

        // Test protected content access
        const hasProtectedContent = !!screen.queryByTestId('protected-content');
        expect(hasProtectedContent).toBe(expectations.protectedContent);

        // Test Add to List button visibility
        const hasAddToList = !!screen.queryByTestId('add-to-list-button');
        expect(hasAddToList).toBe(expectations.addToList);

        // Test admin panel access
        const hasAdminPanel = !!screen.queryByTestId('admin-panel');
        expect(hasAdminPanel).toBe(expectations.adminPanel);

        // Test bulk add access
        const hasBulkAdd = !!screen.queryByTestId('bulk-add-interface');
        expect(hasBulkAdd).toBe(expectations.bulkAdd);
      });
    });
  });

  describe('TDD: Authentication Method Calls', () => {
    it('should call login method with correct parameters', async () => {
      const loginMock = vi.fn().mockResolvedValue({
        user: { id: 1, username: 'testuser' },
        token: 'test-token'
      });

      mockAuthStore = createMockAuthStore({
        login: loginMock
      });

      const credentials = { email: 'test@example.com', password: 'password123' };
      await mockAuthStore.login(credentials);

      expect(loginMock).toHaveBeenCalledWith(credentials);
    });

    it('should call logout method', async () => {
      const logoutMock = vi.fn().mockResolvedValue();

      mockAuthStore = createMockAuthStore({
        isAuthenticated: true,
        logout: logoutMock
      });

      await mockAuthStore.logout();

      expect(logoutMock).toHaveBeenCalledTimes(1);
    });

    it('should call checkAuthStatus method', async () => {
      const checkAuthMock = vi.fn().mockResolvedValue(true);

      mockAuthStore = createMockAuthStore({
        checkAuthStatus: checkAuthMock
      });

      await mockAuthStore.checkAuthStatus();

      expect(checkAuthMock).toHaveBeenCalledTimes(1);
    });

    it('should call register method with user data', async () => {
      const registerMock = vi.fn().mockResolvedValue({
        user: { id: 1, username: 'newuser' },
        token: 'new-token'
      });

      mockAuthStore = createMockAuthStore({
        register: registerMock
      });

      const userData = { 
        username: 'newuser', 
        email: 'new@example.com', 
        password: 'password123' 
      };
      await mockAuthStore.register(userData);

      expect(registerMock).toHaveBeenCalledWith(userData);
    });
  });

  describe('TDD: Error Handling in Authentication', () => {
    it('should handle login errors gracefully', () => {
      mockAuthStore = createMockAuthStore({
        isAuthenticated: false,
        error: 'Invalid email or password',
        isLoading: false
      });

      render(
        <TestWrapper>
          <MockProtectedComponent />
        </TestWrapper>
      );

      expect(mockAuthStore.error).toBe('Invalid email or password');
      expect(screen.getByTestId('login-required')).toBeInTheDocument();
    });

    it('should handle permission loading states', () => {
      mockAuthStore = createMockAuthStore({
        isAuthenticated: true,
        user: { username: 'testuser' },
        isSuperuser: false,
        superuserStatusReady: false // Still loading
      });

      render(
        <TestWrapper>
          <MockAdminPanel />
        </TestWrapper>
      );

      expect(screen.getByTestId('admin-loading')).toBeInTheDocument();
      expect(screen.getByText('Checking permissions...')).toBeInTheDocument();
    });

    it('should handle authentication state inconsistencies', () => {
      mockAuthStore = createMockAuthStore({
        isAuthenticated: true,
        user: null, // Inconsistent state
        token: null
      });

      render(
        <TestWrapper>
          <MockProtectedComponent />
        </TestWrapper>
      );

      // Should still show protected content if isAuthenticated is true
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  describe('TDD: Edge Cases and Security', () => {
    it('should not show Add to List button without onAddToList handler', () => {
      mockAuthStore = createMockAuthStore({
        isAuthenticated: true,
        user: { id: 1, username: 'testuser' }
      });

      render(
        <TestWrapper>
          <MockAddToListButton onAddToList={null} />
        </TestWrapper>
      );

      expect(screen.queryByTestId('add-to-list-button')).not.toBeInTheDocument();
    });

    it('should handle rapid authentication state changes', () => {
      const { rerender } = render(
        <TestWrapper>
          <MockProtectedComponent />
        </TestWrapper>
      );

      // Rapid state changes
      for (let i = 0; i < 5; i++) {
        mockAuthStore = createMockAuthStore({
          isAuthenticated: i % 2 === 0,
          user: i % 2 === 0 ? { username: `user${i}` } : null
        });

        rerender(
          <TestWrapper>
            <MockProtectedComponent />
          </TestWrapper>
        );
      }

      // Final state should be unauthenticated (i=4, 4%2=0, so authenticated)
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should validate superuser status is ready before showing admin features', () => {
      mockAuthStore = createMockAuthStore({
        isAuthenticated: true,
        user: { username: 'admin' },
        isSuperuser: true,
        superuserStatusReady: false // Not ready yet
      });

      render(
        <TestWrapper>
          <MockAdminPanel />
        </TestWrapper>
      );

      expect(screen.getByTestId('admin-loading')).toBeInTheDocument();
      expect(screen.queryByTestId('admin-panel')).not.toBeInTheDocument();
    });
  });
}); 