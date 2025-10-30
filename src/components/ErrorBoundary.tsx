import { Component, ErrorInfo, ReactNode } from 'react';
import logger from '../utils/logger';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log a more detailed error object for better diagnostics
    logger.error('[ERROR BOUNDARY] Uncaught rendering error:', {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      componentStack: errorInfo.componentStack,
    });
  }

  public handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-destructive/10 text-destructive-foreground p-8">
          <h1 className="text-2xl font-bold mb-4">S'ha produït un error a l'aplicació</h1>
          <p className="text-center mb-4">S'ha produït un error inesperat a la interfície. Si us plau, reinicia l'aplicació.</p>
          <button
            onClick={this.handleReload}
            className="mb-4 px-4 py-2 bg-destructive text-destructive-foreground font-semibold rounded-md hover:bg-destructive/90 transition-colors"
          >
            Recarregar Aplicació
          </button>
          <details className="w-full max-w-2xl bg-card p-4 rounded-md shadow">
            <summary className="cursor-pointer font-semibold">Detalls de l'error</summary>
            <pre className="mt-2 text-xs whitespace-pre-wrap overflow-auto">
              {this.state.error?.toString()}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
