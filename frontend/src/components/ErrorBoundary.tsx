import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message || 'An unexpected error occurred.' };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <AlertTriangle className="mx-auto h-14 w-14 text-accent-500" />
          <h1 className="mt-5 font-serif text-3xl font-semibold text-primary-900">
            Something went wrong
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-primary-600">
            We encountered an unexpected error while rendering this page.
            Try reloading, and if the problem persists please contact support.
          </p>
          <p className="mt-4 rounded-sm bg-primary-50 px-4 py-3 text-xs text-primary-500 break-all">
            {this.state.errorMessage}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 rounded-sm bg-primary-700 px-7 py-3 text-sm font-medium text-white hover:bg-primary-800"
          >
            Reload page
          </button>
        </div>
      </div>
    );
  }
}
