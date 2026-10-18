import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useState } from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
  ErrorBoundary,
  FullPageErrorFallback,
  CompactErrorFallback,
  RouteErrorBoundary,
} from '@ui/components/ErrorBoundary';

// Componente señuelo para pruebas de renderizado
function Bomb({ shouldThrow, message = 'Excepción simulada' }: { shouldThrow: boolean; message?: string }) {
  if (shouldThrow) {
    throw new Error(message);
  }
  return <div data-testid="happy-content">Todo funciona perfectamente</div>;
}

describe('ErrorBoundary & Resiliencia', () => {
  beforeEach(() => {
    // Suprime logs de consola durante las pruebas para una salida limpia en Vitest
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'groupCollapsed').mockImplementation(() => {});
    vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('Caso 1: Renderiza los hijos normalmente cuando no existe ningún error', () => {
    render(
      <MemoryRouter>
        <ErrorBoundary FallbackComponent={FullPageErrorFallback}>
          <Bomb shouldThrow={false} />
        </ErrorBoundary>
      </MemoryRouter>
    );

    expect(screen.getByTestId('happy-content')).toBeTruthy();
    expect(screen.getByText('Todo funciona perfectamente')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('Caso 2: Captura la excepción en tiempo de renderizado y monta el componente Fallback amigable', () => {
    const onError = vi.fn();

    render(
      <MemoryRouter>
        <ErrorBoundary FallbackComponent={FullPageErrorFallback} onError={onError}>
          <Bomb shouldThrow={true} message="Error crítico de prueba" />
        </ErrorBoundary>
      </MemoryRouter>
    );

    expect(screen.queryByTestId('happy-content')).toBeNull();
    const alertBox = screen.getByRole('alert');
    expect(alertBox).toBeTruthy();
    expect(alertBox.getAttribute('aria-live')).toBe('assertive');
    expect(screen.getByText('¡Una patita tropezó en el camino!')).toBeTruthy();
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /ir al inicio/i })).toBeTruthy();

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Error crítico de prueba' }),
      expect.anything()
    );
  });

  it('Caso 3: Ejecuta onReset y limpia el estado de error al hacer clic en "Reintentar"', () => {
    const onReset = vi.fn();

    function TestHarness() {
      const [explode, setExplode] = useState(true);

      return (
        <MemoryRouter>
          <ErrorBoundary
            FallbackComponent={FullPageErrorFallback}
            onReset={() => {
              onReset();
              setExplode(false);
            }}
          >
            <Bomb shouldThrow={explode} />
          </ErrorBoundary>
        </MemoryRouter>
      );
    }

    render(<TestHarness />);

    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.queryByTestId('happy-content')).toBeNull();

    const retryButton = screen.getByRole('button', { name: /reintentar/i });
    fireEvent.click(retryButton);

    expect(onReset).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByTestId('happy-content')).toBeTruthy();
  });

  it('Caso 4: Verifica el auto-reset reactivo al cambiar los valores de resetKeys', () => {
    function TestHarness({ route, shouldThrow }: { route: string; shouldThrow: boolean }) {
      return (
        <MemoryRouter>
          <ErrorBoundary
            resetKeys={[route]}
            FallbackComponent={FullPageErrorFallback}
          >
            <Bomb shouldThrow={shouldThrow} />
          </ErrorBoundary>
        </MemoryRouter>
      );
    }

    const { rerender } = render(<TestHarness route="/inicio" shouldThrow={true} />);

    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.queryByTestId('happy-content')).toBeNull();

    // Simulación de navegación a /mascotas con el error resuelto
    rerender(<TestHarness route="/mascotas" shouldThrow={false} />);

    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByTestId('happy-content')).toBeTruthy();
  });

  it('Caso 5: Comprueba que CompactErrorFallback renderice correctamente su contenedor accesible y preserve sus propiedades', () => {
    const onReset = vi.fn();
    const dummyError = new Error('Fallo de red en carrusel');

    render(
      <CompactErrorFallback
        error={dummyError}
        resetErrorBoundary={onReset}
        minHeight={{ xs: '450px', md: '550px' }}
        title="No pudimos cargar las mascotas destacadas"
        message="Ocurrió un detalle temporal con el carrusel de mascotas."
      />
    );

    const alertContainer = screen.getByRole('alert');
    expect(alertContainer).toBeTruthy();
    expect(alertContainer.getAttribute('aria-live')).toBe('polite');
    expect(screen.getByText('No pudimos cargar las mascotas destacadas')).toBeTruthy();
    expect(screen.getByText('Ocurrió un detalle temporal con el carrusel de mascotas.')).toBeTruthy();

    const retryButton = screen.getByRole('button', { name: /reintentar sección/i });
    expect(retryButton).toBeTruthy();
    fireEvent.click(retryButton);
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('Caso 6: RouteErrorBoundary envuelve y renderiza correctamente en una ruta activa', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <RouteErrorBoundary>
          <Bomb shouldThrow={false} />
        </RouteErrorBoundary>
      </MemoryRouter>
    );

    expect(screen.getByTestId('happy-content')).toBeTruthy();
  });
});
