// src/components/ErrorBoundary.jsx
import React from 'react';
import { AlertTriangle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ error: error, errorInfo: errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="p-6 max-w-lg mx-auto my-12 bg-red-50 border border-red-200 rounded-lg text-center">
            <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-700 mb-2">Something went wrong.</h2>
            <p className="text-red-600 mb-4">
                We encountered an error trying to display this section. Please try refreshing the page.
            </p>
            {/* Optional: Display error details during development */}
            {import.meta.env.DEV && this.state.error && (
                <details className="mt-4 text-left text-xs text-red-700 bg-red-100 p-2 rounded overflow-auto">
                    <summary className="cursor-pointer font-medium">Error Details (Development Only)</summary>
                    <pre className="mt-2 whitespace-pre-wrap break-words">
                        {this.state.error.toString()}
                        {this.state.errorInfo?.componentStack}
                    </pre>
                </details>
            )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;