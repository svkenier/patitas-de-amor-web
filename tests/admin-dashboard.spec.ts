import { test, expect } from '@playwright/test';
import crypto from 'crypto';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.dev.vars' });

function generateToken(username: string, role: string) {
  const secret = process.env.JWT_SECRET || 'dev-secret-change-me';
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = { sub: username, role, tokenVersion: 1, exp: Math.floor(Date.now() / 1000) + 8 * 3600 };
  const b64 = (s: string) => Buffer.from(s).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const signatureInput = `${b64(JSON.stringify(header))}.${b64(JSON.stringify(payload))}`;
  const signature = crypto.createHmac('sha256', secret).update(signatureInput).digest('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${signatureInput}.${signature}`;
}

test.describe('Resiliencia del Dashboard Administrativo', () => {

  test('El Dashboard muestra estado controlado ante error 500 en métricas', async ({ page }) => {
    // Interceptar la API para forzar error 500 en carga inicial
    await page.route('**/*', async (route, request) => {
      const requestUrl = new URL(request.url());
      if (!requestUrl.pathname.startsWith('/api/')) return route.continue();
      
      const path = requestUrl.pathname;
      if (path.includes('/auth/verify')) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: { username: 'admin', role: 'owner' } }) });
        return;
      }
      
      // Simular error del servidor en listados
      if (path.includes('/admin/collections') || path.includes('/settings')) {
        await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Server Error' }) });
        return;
      }
      
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    await page.goto('/');
    const url = new URL(page.url());
    const validToken = generateToken('admin', 'owner');
    await page.context().addCookies([{ name: 'auth_session_token', value: validToken, domain: url.hostname, path: '/' }]);
    await page.evaluate(() => { localStorage.setItem('session_user', JSON.stringify({ username: 'admin', role: 'owner' })); });

    await page.goto('/admin');
    
    // Verificamos que no se rompe en blanco. Debería mostrar la UI del AdminDashboard, quizás vacía o con un mensaje de error,
    // pero el componente Tabs debe estar presente.
    await expect(page.getByRole('tab', { name: /mascotas/i })).toBeVisible();
    await expect(page.locator('.MuiContainer-root').first()).toBeVisible();
  });
});
