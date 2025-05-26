/**
 * Unit tests for the Registration Store
 */
import { renderHook, act } from '@testing-library/react-hooks';
import useRegistrationStore from '../../../../src/stores/auth/useRegistrationStore';
import useAuthenticationStore from '../../../../src/stores/auth/useAuthenticationStore';
import { apiClient } from '../../../../src/services/http';
import ErrorHandler from '../../../../src/utils/ErrorHandler';

// Mock dependencies
jest.mock('../../../../src/stores/auth/useAuthenticationStore', () => ({
  __esModule: true,
  default: {
    getState: jest.fn(),
    setState: jest.fn()
  }
}));

jest.mock('../../../../src/services/http', () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn()
  }
}));

jest.mock('../../../../src/utils/ErrorHandler', () => ({
  handle: jest.fn()
}));

describe('useRegistrationStore', () => {
  beforeEach(() => {
    // Clear mocks before each test
    jest.clearAllMocks();
    
    // Reset store state
    act(() => {
      useRegistrationStore.setState({
        registrationStep: 1,
        registrationData: {},
        verificationToken: null,
        isLoading: false,
        error: null
      });
    });
  });

  describe('register', () => {
    it('should successfully register a user and auto-login', async () => {
      // Mock successful registration response
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser'
      };
      
      const responseData = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        token: 'test-token'
      };
      
      apiClient.post.mockResolvedValueOnce({
        data: {
          success: true,
          data: responseData
        }
      });

      const { result } = renderHook(() => useRegistrationStore());
      
      // Call register
      let success;
      await act(async () => {
        success = await result.current.register(userData);
      });
      
      // Verify API call and state updates
      expect(apiClient.post).toHaveBeenCalledWith('/auth/register', userData);
      expect(success).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.registrationData).toEqual({});
      expect(result.current.registrationStep).toBe(1);
      
      // Verify auto-login
      expect(useAuthenticationStore.setState).toHaveBeenCalledWith({
        isAuthenticated: true,
        user: responseData,
        token: 'test-token',
        error: null,
        lastAuthCheck: expect.any(Number)
      });
    });

    it('should not auto-login if autoLogin is false', async () => {
      // Mock successful registration response with autoLogin: false
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser',
        autoLogin: false
      };
      
      const responseData = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        token: 'test-token'
      };
      
      apiClient.post.mockResolvedValueOnce({
        data: {
          success: true,
          data: responseData
        }
      });

      const { result } = renderHook(() => useRegistrationStore());
      
      // Call register
      let success;
      await act(async () => {
        success = await result.current.register(userData);
      });
      
      // Verify API call and state updates
      expect(apiClient.post).toHaveBeenCalledWith('/auth/register', userData);
      expect(success).toBe(true);
      
      // Verify no auto-login
      expect(useAuthenticationStore.setState).not.toHaveBeenCalled();
    });

    it('should handle registration failure', async () => {
      // Mock failed registration response
      apiClient.post.mockResolvedValueOnce({
        data: {
          success: false,
          message: 'Email already in use'
        }
      });

      const { result } = renderHook(() => useRegistrationStore());
      
      // Call register
      let success;
      await act(async () => {
        success = await result.current.register({
          email: 'existing@example.com',
          password: 'password123'
        });
      });
      
      // Verify error handling
      expect(success).not.toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeDefined();
    });

    it('should handle API errors during registration', async () => {
      // Mock API error
      const error = new Error('API error');
      apiClient.post.mockRejectedValueOnce(error);
      
      // Mock error handler
      ErrorHandler.handle.mockReturnValueOnce({
        message: 'Registration failed due to server error'
      });
      
      const { result } = renderHook(() => useRegistrationStore());
      
      // Call register
      let errorMessage;
      await act(async () => {
        errorMessage = await result.current.register({
          email: 'test@example.com',
          password: 'password123'
        });
      });
      
      // Verify error handling
      expect(ErrorHandler.handle).toHaveBeenCalled();
      expect(errorMessage).toBe('Registration failed due to server error');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Registration failed due to server error');
    });
  });

  describe('startEmailVerification', () => {
    it('should successfully start email verification', async () => {
      // Mock successful API response
      apiClient.post.mockResolvedValueOnce({
        data: {
          success: true,
          verificationToken: 'test-token'
        }
      });

      const { result } = renderHook(() => useRegistrationStore());
      
      // Call startEmailVerification
      let success;
      await act(async () => {
        success = await result.current.startEmailVerification('test@example.com');
      });
      
      // Verify API call and state updates
      expect(apiClient.post).toHaveBeenCalledWith('/auth/verify-email/start', { email: 'test@example.com' });
      expect(success).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.verificationToken).toBe('test-token');
    });

    it('should handle API errors during email verification start', async () => {
      // Mock API error
      const error = new Error('API error');
      apiClient.post.mockRejectedValueOnce(error);
      
      // Mock error handler
      ErrorHandler.handle.mockReturnValueOnce({
        message: 'Failed to start email verification'
      });
      
      const { result } = renderHook(() => useRegistrationStore());
      
      // Call startEmailVerification
      let errorMessage;
      await act(async () => {
        errorMessage = await result.current.startEmailVerification('test@example.com');
      });
      
      // Verify error handling
      expect(ErrorHandler.handle).toHaveBeenCalled();
      expect(errorMessage).toBe('Failed to start email verification');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Failed to start email verification');
    });
  });

  describe('completeEmailVerification', () => {
    it('should successfully complete email verification', async () => {
      // Setup initial state with verification token
      act(() => {
        useRegistrationStore.setState({
          verificationToken: 'test-token'
        });
      });
      
      // Mock successful API response
      apiClient.post.mockResolvedValueOnce({
        data: {
          success: true
        }
      });

      const { result } = renderHook(() => useRegistrationStore());
      
      // Call completeEmailVerification
      let success;
      await act(async () => {
        success = await result.current.completeEmailVerification('test@example.com', '123456');
      });
      
      // Verify API call and state updates
      expect(apiClient.post).toHaveBeenCalledWith('/auth/verify-email/complete', {
        email: 'test@example.com',
        code: '123456',
        verificationToken: 'test-token'
      });
      expect(success).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.verificationToken).toBe(null);
    });

    it('should handle API errors during email verification completion', async () => {
      // Setup initial state with verification token
      act(() => {
        useRegistrationStore.setState({
          verificationToken: 'test-token'
        });
      });
      
      // Mock API error
      const error = new Error('API error');
      apiClient.post.mockRejectedValueOnce(error);
      
      // Mock error handler
      ErrorHandler.handle.mockReturnValueOnce({
        message: 'Failed to complete email verification'
      });
      
      const { result } = renderHook(() => useRegistrationStore());
      
      // Call completeEmailVerification
      let errorMessage;
      await act(async () => {
        errorMessage = await result.current.completeEmailVerification('test@example.com', '123456');
      });
      
      // Verify error handling
      expect(ErrorHandler.handle).toHaveBeenCalled();
      expect(errorMessage).toBe('Failed to complete email verification');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Failed to complete email verification');
    });
  });

  describe('checkUsernameAvailability', () => {
    it('should return true when username is available', async () => {
      // Mock successful API response
      apiClient.get.mockResolvedValueOnce({
        data: {
          available: true
        }
      });

      const { result } = renderHook(() => useRegistrationStore());
      
      // Call checkUsernameAvailability
      let isAvailable;
      await act(async () => {
        isAvailable = await result.current.checkUsernameAvailability('newuser');
      });
      
      // Verify API call and result
      expect(apiClient.get).toHaveBeenCalledWith('/auth/check-username/newuser');
      expect(isAvailable).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should return false when username is not available', async () => {
      // Mock API response for unavailable username
      apiClient.get.mockResolvedValueOnce({
        data: {
          available: false
        }
      });

      const { result } = renderHook(() => useRegistrationStore());
      
      // Call checkUsernameAvailability
      let isAvailable;
      await act(async () => {
        isAvailable = await result.current.checkUsernameAvailability('existinguser');
      });
      
      // Verify result
      expect(isAvailable).toBe(false);
    });

    it('should handle API errors during username availability check', async () => {
      // Mock API error
      const error = new Error('API error');
      apiClient.get.mockRejectedValueOnce(error);
      
      // Mock error handler
      ErrorHandler.handle.mockReturnValueOnce({
        message: 'Failed to check username availability'
      });
      
      const { result } = renderHook(() => useRegistrationStore());
      
      // Call checkUsernameAvailability
      let isAvailable;
      await act(async () => {
        isAvailable = await result.current.checkUsernameAvailability('testuser');
      });
      
      // Verify error handling
      expect(ErrorHandler.handle).toHaveBeenCalled();
      expect(isAvailable).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Failed to check username availability');
    });
  });

  describe('checkEmailAvailability', () => {
    it('should return true when email is available', async () => {
      // Mock successful API response
      apiClient.get.mockResolvedValueOnce({
        data: {
          available: true
        }
      });

      const { result } = renderHook(() => useRegistrationStore());
      
      // Call checkEmailAvailability
      let isAvailable;
      await act(async () => {
        isAvailable = await result.current.checkEmailAvailability('new@example.com');
      });
      
      // Verify API call and result
      expect(apiClient.get).toHaveBeenCalledWith('/auth/check-email/new%40example.com');
      expect(isAvailable).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should return false when email is not available', async () => {
      // Mock API response for unavailable email
      apiClient.get.mockResolvedValueOnce({
        data: {
          available: false
        }
      });

      const { result } = renderHook(() => useRegistrationStore());
      
      // Call checkEmailAvailability
      let isAvailable;
      await act(async () => {
        isAvailable = await result.current.checkEmailAvailability('existing@example.com');
      });
      
      // Verify result
      expect(isAvailable).toBe(false);
    });
  });

  describe('updateRegistrationData', () => {
    it('should update registration data', () => {
      // Setup initial state
      act(() => {
        useRegistrationStore.setState({
          registrationData: { email: 'test@example.com' }
        });
      });

      const { result } = renderHook(() => useRegistrationStore());
      
      // Call updateRegistrationData
      act(() => {
        result.current.updateRegistrationData({ username: 'testuser' });
      });
      
      // Verify state update
      expect(result.current.registrationData).toEqual({
        email: 'test@example.com',
        username: 'testuser'
      });
    });
  });

  describe('setRegistrationStep', () => {
    it('should set registration step', () => {
      const { result } = renderHook(() => useRegistrationStore());
      
      // Call setRegistrationStep
      act(() => {
        result.current.setRegistrationStep(2);
      });
      
      // Verify state update
      expect(result.current.registrationStep).toBe(2);
    });
  });

  describe('resetRegistration', () => {
    it('should reset registration state', () => {
      // Setup initial state
      act(() => {
        useRegistrationStore.setState({
          registrationStep: 3,
          registrationData: { email: 'test@example.com', username: 'testuser' },
          verificationToken: 'test-token',
          isLoading: true,
          error: 'Some error'
        });
      });

      const { result } = renderHook(() => useRegistrationStore());
      
      // Call resetRegistration
      act(() => {
        result.current.resetRegistration();
      });
      
      // Verify state reset
      expect(result.current.registrationStep).toBe(1);
      expect(result.current.registrationData).toEqual({});
      expect(result.current.verificationToken).toBe(null);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  describe('getters', () => {
    it('should return registration step', () => {
      // Setup initial state
      act(() => {
        useRegistrationStore.setState({ registrationStep: 2 });
      });

      const { result } = renderHook(() => useRegistrationStore());
      
      // Call getter
      expect(result.current.getRegistrationStep()).toBe(2);
    });

    it('should return registration data', () => {
      // Setup initial state
      const registrationData = { email: 'test@example.com', username: 'testuser' };
      act(() => {
        useRegistrationStore.setState({ registrationData });
      });

      const { result } = renderHook(() => useRegistrationStore());
      
      // Call getter
      expect(result.current.getRegistrationData()).toEqual(registrationData);
    });

    it('should return loading state', () => {
      // Setup initial state
      act(() => {
        useRegistrationStore.setState({ isLoading: true });
      });

      const { result } = renderHook(() => useRegistrationStore());
      
      // Call getter
      expect(result.current.getIsLoading()).toBe(true);
    });

    it('should return error', () => {
      // Setup initial state
      act(() => {
        useRegistrationStore.setState({ error: 'Test error' });
      });

      const { result } = renderHook(() => useRegistrationStore());
      
      // Call getter
      expect(result.current.getError()).toBe('Test error');
    });
  });
});
