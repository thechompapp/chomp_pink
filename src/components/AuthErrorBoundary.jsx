/**
 * Authentication Error Boundary
 * 
 * Handles authentication errors gracefully and provides user feedback
 */
import React, { Component } from 'react';
import { toast } from 'react-hot-toast';
import { AlertTriangle, RefreshCw, LogIn } from 'lucide-react';
import { AdminAuthSetup } from '@/utils/adminAuthSetup';

class AuthErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isRetrying: false,
    };
  }

  static getDerivedStateFromError(error) {
    // Check if this is an authentication-related error
    if (error.message.includes('authentication') || 
        error.message.includes('login') ||
        error.message.includes('401') ||
        error.message.includes('Unauthorized')) {
      return { hasError: true, error };
    }
    
    // For non-auth errors, don't catch them
    return null;
  }

  componentDidCatch(error, errorInfo) {
    console.error('Authentication error caught by boundary:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Show user-friendly toast message
    if (error.message.includes('authentication') || error.message.includes('401')) {
      toast.error('Authentication error. Please try logging in again.');
    }
  }

  handleRetry = async () => {
    this.setState({ isRetrying: true });

    try {
      // Try to fix authentication in development mode
      if (import.meta.env.DEV) {
        const result = await AdminAuthSetup.autoFix();
        if (result.success) {
          toast.success('Authentication restored!');
          this.setState({ hasError: false, error: null, errorInfo: null });
          
          // Force a page reload to reset state
          setTimeout(() => {
            window.location.reload();
          }, 1000);
          return;
        }
      }

      // Clear error state and try again
      this.setState({ hasError: false, error: null, errorInfo: null });
      
    } catch (error) {
      console.error('Error during retry:', error);
      toast.error('Failed to restore authentication');
    } finally {
      this.setState({ isRetrying: false });
    }
  };

  handleLogin = () => {
    // Redirect to login page
    window.location.href = '/login';
  };

  render() {
    if (this.state.hasError) {
      const isDev = import.meta.env.DEV;
      
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            
            <h1 className="text-xl font-semibold text-gray-900 text-center mb-2">
              Authentication Error
            </h1>
            
            <p className="text-gray-600 text-center mb-6">
              There was a problem with your authentication. This might happen after logging out or when switching between admin features.
            </p>

            {isDev && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>Development Mode:</strong> You can try auto-fixing the authentication or refresh the page.
                </p>
              </div>
            )}

            <div className="space-y-3">
              {isDev && (
                <button
                  onClick={this.handleRetry}
                  disabled={this.state.isRetrying}
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${this.state.isRetrying ? 'animate-spin' : ''}`} />
                  {this.state.isRetrying ? 'Retrying...' : 'Auto-Fix Authentication'}
                </button>
              )}
              
              <button
                onClick={this.handleLogin}
                className="w-full flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Go to Login
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Page
              </button>
            </div>

            {isDev && this.state.error && (
              <details className="mt-6 text-sm">
                <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
                  {this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AuthErrorBoundary; 