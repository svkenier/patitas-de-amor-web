import { test, expect } from '@playwright/test';

test.describe('Autenticación y Rutas Privadas', () => {

  test('Debe redirigir al login si se accede a /admin sin autenticación', async ({ page }) => {
    // Intentar ir directo al admin
    await page.goto('/admin');
    
    // Verificar que la URL cambió a /login por el ProtectedRoute
    await expect(page).toHaveURL(/.*\/login/);
    await expect(page.getByRole('heading', { name: /Iniciar Sesión/i })).toBeVisible();
  });

  test('Muestra errores de validación con credenciales incorrectas', async ({ page }) => {
    await page.goto('/login');
    
    // El botón debería estar deshabilitado porque los campos están vacíos
    const submitBtn = page.getByRole('button', { name: /Ingresar/i });
    await expect(submitBtn).toBeDisabled();

    // Intentar con algo inválido
    await page.getByLabel(/Usuario/i).fill('admin_fake');
    await page.getByLabel(/Contraseña/i).fill('wrongpass');
    await submitBtn.click();

    // Esperar mensaje de error
    const alert = page.locator('.MuiAlert-message');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText(/Credenciales/i);
  });

});
