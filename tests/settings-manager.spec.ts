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

test.describe('Settings Manager - Validaciones y Payload', () => {
  const DEFAULT_SETTINGS = {
    phone: '04120000000',
    whatsapp: '584120000000',
    email: 'refugio@test.com',
    address: 'Sede Principal',
    instagram: 'patitas',
    facebook: '',
    donation_link: '',
    contact_email: '',
    shelter_address: '',
    expirationDate: '2027-10-01',
    monitoringActive: true
  };

  test.beforeEach(async ({ page }) => {
    // Intercepción integral de la API (solo backend, ignorando archivos estáticos de Vite con /api/ en la ruta)
    await page.route('**/*', async (route, request) => {
      const requestUrl = new URL(request.url());
      if (!requestUrl.pathname.startsWith('/api/')) {
        return route.continue();
      }
      
      const path = requestUrl.pathname;
      const method = request.method();
      
      if (path.includes('/auth/verify')) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: { username: 'admin', role: 'owner' } }) });
        return;
      }
      if (path.includes('/settings')) {
        if (method === 'GET') {
          await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(DEFAULT_SETTINGS) });
        } else {
          await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
        }
        return;
      }
      // Respuesta por defecto para todo lo demás (listas, métricas, etc)
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, data: [] }) });
    });

    await page.goto('/');
    const url = new URL(page.url());
    const validToken = generateToken('admin', 'owner');
    await page.context().addCookies([{ name: 'auth_session_token', value: validToken, domain: url.hostname, path: '/' }]);
    await page.evaluate(() => { localStorage.setItem('session_user', JSON.stringify({ username: 'admin', role: 'owner' })); });

    await page.goto('/admin');
    await page.getByRole('tab', { name: /configuración del refugio/i }).click();
    
    // Using simple text instead of special character regex
    await expect(page.getByRole('heading', { name: /configuración/i }).first()).toBeVisible({ timeout: 10000 });
  });

  test('Dirty State y Sanitización WhatsApp', async ({ page }) => {
    const saveButton = page.getByRole('button', { name: /guardar/i }).first();
    await expect(saveButton).toBeDisabled();

    const waInput = page.getByRole('textbox', { name: /whatsapp/i });
    // Usamos focus y pegado simulado o escribimos algo corto que se limpie
    await waInput.fill(' 58 412 11 22 ');
    
    // Check dirty state activated
    await expect(saveButton).toBeEnabled();

    // Trigger onBlur to test sanitization
    await waInput.blur();
    await expect(waInput).toHaveValue('584121122'); // Should be normalized

    // Revert to original
    await waInput.fill('584120000000');
    await waInput.blur();
    
    // Save button should be disabled again because value is identical
    await expect(saveButton).toBeDisabled();
  });

  test('Payload parcial de SettingsManager', async ({ page }) => {
    const igInput = page.getByRole('textbox', { name: /instagram/i });
    await igInput.fill('https://instagram.com/patitas_bqto');
    await igInput.blur();

    const saveButton = page.getByRole('button', { name: /guardar/i }).first();
    await expect(saveButton).toBeEnabled();

    const [requestEvent] = await Promise.all([
      page.waitForRequest(req => req.url().includes('/api/settings') && ['POST', 'PUT'].includes(req.method())),
      saveButton.click()
    ]);

    const postData = JSON.parse(requestEvent.postData() || '{}');
    expect(postData.social_links.instagram).toBe('https://instagram.com/patitas_bqto');
    expect(postData.whatsapp).toBe('584120000000'); // Full payload is sent, not partial
  });
});
