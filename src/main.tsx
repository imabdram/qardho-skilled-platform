import React, { Component, ErrorInfo, ReactNode, StrictMode } from 'react';
import { ClerkProvider } from '@clerk/react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

const isLocalhost = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1'
);

let rawKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';

// Production keys (pk_live_...) are strictly locked by Clerk to suuqaxirfadaha.app.
// On localhost, fallback to development test key (pk_test_...) to prevent 400 origin error.
if (isLocalhost && rawKey.startsWith('pk_live_')) {
  console.warn(
    '[Clerk] Production key (pk_live_...) detected on localhost. Switching to development key for local testing.'
  );
  rawKey = 'pk_test_YW1hemluZy1tYW1tYWwtMjcuY2xlcmsuYWNjb3VudHMuZGV2JA';
}

const PUBLISHABLE_KEY = rawKey || 'pk_test_YW1hemluZy1tYW1tYWwtMjcuY2xlcmsuYWNjb3VudHMuZGV2JA';

if (!PUBLISHABLE_KEY && import.meta.env.PROD) {
  throw new Error('VITE_CLERK_PUBLISHABLE_KEY environment variable is required in production.');
}

interface ErrorBoundaryProps {
  children: ReactNode;
}
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  declare readonly props: Readonly<ErrorBoundaryProps>;
  state: ErrorBoundaryState = { hasError: false, error: null };

  constructor(props: ErrorBoundaryProps) {
    super(props);
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('React ErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-center">
          <div className="max-w-md rounded-2xl border border-red-200 bg-white p-6 shadow-xl">
            <h2 className="text-base font-black text-red-700">Application Error</h2>
            <p className="mt-2 text-xs font-semibold text-slate-600">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-brand-700 transition"
            >
              Reload Platform
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ClerkProvider>
    </ErrorBoundary>
  </StrictMode>,
);