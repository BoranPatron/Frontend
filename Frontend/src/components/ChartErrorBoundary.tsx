import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ChartErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // Aktualisiere den State, sodass der nächste Render die Fallback-UI zeigt
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Chart Error Boundary caught an error:', error, errorInfo);
    
    // Spezielle Behandlung für DOM-Fehler
    if (error.message.includes('removeChild') || error.message.includes('not a child')) {
      console.warn('DOM cleanup error detected - this is likely a Chart.js cleanup issue');
      // Versuche den Fehler zu ignorieren und die Komponente neu zu rendern
      setTimeout(() => {
        this.setState({ hasError: false, error: undefined });
      }, 100);
    }
  }

  public render() {
    if (this.state.hasError) {
      // Fallback-UI
      return this.props.fallback || (
        <div className="flex items-center justify-center h-64 bg-gradient-to-br from-[#1a1a2e]/90 to-[#16213e]/90 rounded-xl border border-red-500/30 p-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-400 mb-2">Chart-Fehler</h3>
            <p className="text-sm text-gray-400 mb-4">
              Ein Fehler ist beim Rendern des Charts aufgetreten
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: undefined })}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors duration-200"
            >
              Erneut versuchen
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ChartErrorBoundary;
