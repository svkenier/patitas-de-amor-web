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

test.describe('Domain RBAC', () => {

  test('Encargado no puede ver la pestaña de Configuración ni Dominio', async ({ page }) => {
    await page.route('**/*', async (route, request) => {
      const requestUrl = new URL(request.url());
      if (!requestUrl.pathname.startsWith('/api/')) {
        return route.continue();
      }
      
      const path = requestUrl.pathname;
      if (path.includes('/auth/verify')) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: { username: 'encargado', role: 'encargado' } }) });
        return;
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    await page.goto('/');
    const url = new URL(page.url());
    const validToken = generateToken('encargado', 'encargado');
    await page.context().addCookies([{ name: 'auth_session_token', value: validToken, domain: url.hostname, path: '/' }]);
    await page.evaluate(() => { localStorage.setItem('session_user', JSON.stringify({ username: 'encargado', role: 'encargado' })); });

    await page.goto('/admin');
    
    // El encargado debe ver Mascotas, Anuncios y Usuarios, pero NO Configuración ni Dominio
    await expect(page.getByRole('tab', { name: /mascotas/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /eventos y anuncios/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /usuarios/i })).toBeVisible();
    
    await expect(page.getByRole('tab', { name: /configuración del refugio/i })).toBeHidden();
    await expect(page.getByRole('tab', { name: /dominio/i })).toBeHidden();
  });
});
