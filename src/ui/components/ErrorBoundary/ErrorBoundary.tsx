import { Component, type ReactNode, type ErrorInfo } from 'react';
import type { ErrorBoundaryProps, ErrorBoundaryState, FallbackProps } from './types';

function areResetKeysDifferent(prevKeys?: Array<unknown>, currentKeys?: Array<unknown>): boolean {
  if (!prevKeys && !currentKeys) return false;
  if (!prevKeys || !currentKeys) return true;
  if (prevKeys.length !== currentKeys.length) return true;
  for (let i = 0; i < prevKeys.length; i++) {
    if (!Object.is(prevKeys[i], currentKeys[i])) {
      return true;
    }
  }
  return false;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.groupCollapsed(
        '%c[ErrorBoundary] Excepción capturada en renderizado',
        'background: #DC2626; color: #FFFFFF; font-weight: bold; padding: 2px 6px; border-radius: 4px;'
      );
      console.error('Error:', error);
      console.info('Component Stack:', info.componentStack);
      console.groupEnd();
    }

    this.props.onError?.(error, info);
  }

  override componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (this.state.hasError && areResetKeysDifferent(prevProps.resetKeys, this.props.resetKeys)) {
      this.resetErrorBoundary();
    }
  }

  resetErrorBoundary = (): void => {
    this.props.onReset?.();
    this.setState({ hasError: false, error: null });
  };

  override render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback, fallbackRender, FallbackComponent } = this.props;

    if (hasError && error) {
      const fallbackProps: FallbackProps = {
        error,
        resetErrorBoundary: this.resetErrorBoundary,
      };

      if (fallbackRender) {
        return fallbackRender(fallbackProps);
      }

      if (FallbackComponent) {
        return <FallbackComponent {...fallbackProps} />;
      }

      if (fallback) {
        return fallback;
      }
    }

    return children;
  }
}

export default ErrorBoundary;
