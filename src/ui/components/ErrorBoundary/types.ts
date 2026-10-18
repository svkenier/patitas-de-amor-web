import type { ReactNode, ComponentType, ErrorInfo } from 'react';

export interface FallbackProps {
  /** Objeto de error capturado */
  error: Error;
  /** Función para restablecer el estado del boundary y reintentar renderizado */
  resetErrorBoundary: () => void;
}

export interface ErrorBoundaryProps {
  children: ReactNode;
  /** Componente personalizado de contingencia */
  FallbackComponent?: ComponentType<FallbackProps>;
  /** Función de renderizado personalizada para el fallback */
  fallbackRender?: (props: FallbackProps) => ReactNode;
  /** Elemento estático alternativo */
  fallback?: ReactNode;
  /** Callback ejecutado al capturar una excepción */
  onError?: (error: Error, info: ErrorInfo) => void;
  /** Callback ejecutado al restablecer el boundary */
  onReset?: () => void;
  /** Claves que disparan un reset automático al cambiar (comparación superficial) */
  resetKeys?: Array<unknown>;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}
