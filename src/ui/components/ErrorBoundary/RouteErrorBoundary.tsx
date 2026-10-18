import type { ReactNode, ComponentType } from 'react';
import { useLocation } from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary';
import FullPageErrorFallback from './FullPageErrorFallback';
import type { FallbackProps } from './types';

export interface RouteErrorBoundaryProps {
  children: ReactNode;
  FallbackComponent?: ComponentType<FallbackProps>;
}

export default function RouteErrorBoundary({
  children,
  FallbackComponent = FullPageErrorFallback,
}: RouteErrorBoundaryProps) {
  const location = useLocation();

  return (
    <ErrorBoundary
      resetKeys={[location.pathname]}
      FallbackComponent={FallbackComponent}
    >
      {children}
    </ErrorBoundary>
  );
}
