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
    logger.error('[ERROR BOUNDARY] Error de renderitzat no controlat:', {
      error: error.toString(),
      componentStack: errorInfo.componentStack,
    });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-8">
          <h1 className="text-2xl font-bold mb-4">S'ha produït un error a l'aplicació</h1>
          <p className="text-center mb-4">S'ha produït un error inesperat a la interfície. Si us plau, reinicia l'aplicació.</p>
          <details className="w-full max-w-2xl bg-white dark:bg-gray-800 p-4 rounded-md shadow">
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
