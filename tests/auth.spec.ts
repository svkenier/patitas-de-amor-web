import { test, expect } from '@playwright/test';

test.describe('Autenticación y Rutas Privadas', () => {

  test('Debe redirigir al login si se accede a /admin sin autenticación', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/.*\/login/);
    await expect(page.getByRole('heading', { name: /Iniciar Sesión/i })).toBeVisible();
  });

  test('Muestra errores de validación con credenciales incorrectas', async ({ page }) => {
    await page.goto('/login');
    const submitBtn = page.getByRole('button', { name: /Ingresar/i });
    await expect(submitBtn).toBeDisabled();

    await page.getByLabel(/Usuario/i).fill('admin_fake');
    await page.getByLabel(/Contraseña/i).fill('wrongpass');
    await submitBtn.click();

    const alert = page.locator('.MuiAlert-message');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText(/Usuario o contraseña/i);
  });

  test('Higiene: Trim de username y password, y visualización en onBlur', async ({ page }) => {
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, user: { username: 'superadmin', role: 'owner' } })
      });
    });

    await page.goto('/login');

    const usernameInput = page.getByRole('textbox', { name: /usuario/i });
    const passwordInput = page.getByLabel(/contraseña/i);

    await usernameInput.fill('  SupeRAdmin_01  ');
    await passwordInput.fill('  MiClaveSecreta  ');

    await usernameInput.blur();
    await expect(usernameInput).toHaveValue('superadmin_01');

    const [requestEvent] = await Promise.all([
      page.waitForRequest(req => req.url().includes('/api/auth/login') && req.method() === 'POST'),
      page.getByRole('button', { name: /ingresar/i }).click()
    ]);

    const postData = JSON.parse(requestEvent.postData() || '{}');
    expect(postData.username).toBe('superadmin_01');
    expect(postData.password).toBe('MiClaveSecreta');
  });

});
