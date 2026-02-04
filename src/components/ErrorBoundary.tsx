import { Component, ErrorInfo, ReactNode } from 'react';
import logger from '../utils/logger';

interface Props {
  children: ReactNode;
  translations?: { t: (key: string) => string };
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundaryInner extends Component<Props, State> {
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
      // Obtenemos las traducciones del wrapper
      const { t } = (this.props as any).translations || { t: (key: string) => key };
      
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-destructive/10 text-destructive-foreground p-8">
          <h1 className="text-2xl font-bold mb-4">{t('error_boundary.title')}</h1>
          <p className="text-center mb-4">{t('error_boundary.message')}</p>
          <button
            onClick={this.handleReload}
            className="mb-4 px-4 py-2 bg-destructive text-destructive-foreground font-semibold rounded-md hover:bg-destructive/90 transition-colors"
          >
            {t('error_boundary.reload_button')}
          </button>
          <details className="w-full max-w-2xl bg-card p-4 rounded-md shadow">
            <summary className="cursor-pointer font-semibold">{t('error_boundary.error_details')}</summary>
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

// Wrapper funcional que proporciona las traducciones
import { useTranslation } from 'react-i18next';

const ErrorBoundary: React.FC<Props> = ({ children }) => {
  const { t } = useTranslation();
  
  return (
    <ErrorBoundaryInner translations={{ t }}>
      {children}
    </ErrorBoundaryInner>
  );
};

export default ErrorBoundary;
