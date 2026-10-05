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

test.describe('Defensa de Formularios CRUD', () => {

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

    // Intercepción integral de la API
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
      if (path.includes('/public/announcements') || path.includes('/admin/collections/announcements')) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ id: 'test-1', title: 'Anuncio Test', type: 'general', status: 'active', description: '' }]) });
        return;
      }
      if (path.includes('/admin/collections/pets') || path.includes('/public/pets')) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
        return;
      }
      if (method === 'POST' || method === 'PUT') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
        return;
      }
      // Respuesta por defecto segura para evitar crashes en Dashboards u otros.
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, data: [] }) });
    });
    
    await page.goto('/');
    const url = new URL(page.url());
    const validToken = generateToken('admin', 'owner');
    await page.context().addCookies([{ name: 'auth_session_token', value: validToken, domain: url.hostname, path: '/' }]);
    await page.evaluate(() => { localStorage.setItem('session_user', JSON.stringify({ username: 'admin', role: 'owner' })); });
  });

  test('Mascota: Validaciones vacías y numéricas', async ({ page }) => {
    let apiCalled = false;
    await page.route('**/api/admin/collections/pets*', async route => {
      if (route.request().method() === 'POST') apiCalled = true;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
    });

    await page.goto('/admin');
    await page.getByRole('button', { name: /registrar mascota/i }).first().click();

    // Llenamos con campos sucios/inválidos y evaluamos el comportamiento tras enviar
    const titleInput = page.getByRole('textbox', { name: /nombre/i }).first();
    await titleInput.fill('   '); // Solo espacios
    await titleInput.blur();

    const pesoInput = page.getByLabel(/peso/i).first();
    await pesoInput.fill('-5'); // Peso negativo
    await pesoInput.blur();

    const saveButton = page.getByRole('dialog').getByRole('button', { name: /crear registro/i }).first();
    await saveButton.click();

    // Yup debe mostrar errores visuales
    await expect(page.locator('text=El título/nombre es obligatorio').first()).toBeVisible();
    await expect(page.locator('text=No puede ser negativo').first()).toBeVisible();

    // Confirmación estricta de aislamiento
    expect(apiCalled).toBeFalsy();
  });

  test('Anuncios: Bloqueo de save sin cambios', async ({ page }) => {
    let apiCalled = false;
    await page.route('**/api/admin/collections/announcements*', async route => {
      if (route.request().method() === 'PUT') apiCalled = true;
      if (route.request().method() === 'GET') {
         await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ id: 'test-1', title: 'Anuncio Test', type: 'general', status: 'active', description: '' }]) });
      } else {
         await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
      }
    });

    await page.goto('/admin');
    await page.getByRole('tab', { name: /eventos y anuncios/i }).click();
    
    // Wait for mock data
    await expect(page.getByRole('cell', { name: 'Anuncio Test' }).first()).toBeVisible();
    
    // Open edit
    await page.getByRole('button', { name: /editar/i }).first().click();

    const saveButton = page.getByRole('button', { name: /guardar|crear/i }).first();

    const titleInput = page.getByRole('textbox', { name: /título/i }).first();
    await titleInput.fill('Anuncio Test Modificado');
    await titleInput.blur();

    // Restore to original
    await titleInput.fill('Anuncio Test');
    await titleInput.blur();

    // El dirty check debe haber cortado el envío o inhabilitado el botón.
    // Intentamos clickear por si acaso.
    if (await saveButton.isEnabled()) {
      await saveButton.click();
    } else {
      await expect(saveButton).toBeDisabled();
    }
    
    // Confirmación de que no hubo mutación HTTP
    expect(apiCalled).toBeFalsy();
  });

  test('Previsualización Dropzone: Dibuja miniatura base64 local', async ({ page }) => {
    await page.goto('/admin');
    await page.getByRole('button', { name: /registrar mascota/i }).first().click();

    // Crear archivo falso de 1x1 png en memoria
    const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==', 'base64');

    // Seleccionar archivo directamente en el primer input de la galería
    const fileInput = page.locator('input[type="file"]').nth(1); // El primero es el de cámara en móvil, el segundo es galería
    await fileInput.setInputFiles({
      name: 'test-image.png',
      mimeType: 'image/png',
      buffer: buffer
    });

    // Validar que aparece el botoncito de eliminar foto
    const removeBtn = page.getByRole('button', { name: /quitar foto/i }).first();
    await expect(removeBtn).toBeVisible();

    // Validar visualmente que existe un tag img con el src previsualizado (empezará por blob o data base64)
    const imgPreview = page.locator('img[alt*="Vista previa"]').first();
    await expect(imgPreview).toBeVisible();
  });

});
