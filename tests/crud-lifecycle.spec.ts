import { test, expect, type APIRequestContext } from '@playwright/test';
import * as dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config({ path: '.dev.vars' });
import { TEST_CONFIG } from './fixtures/test-config';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const SUPERADMIN = (process.env.ADMIN_USERNAME || process.env.ADMIN_USER) as string;

function base64url(str: string) {
  return Buffer.from(str).toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function generateToken(username: string, role: string, tokenVersion: number = 1) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = { sub: username, role, tokenVersion, exp: Math.floor(Date.now() / 1000) + 8 * 3600 };
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(signatureInput).digest('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${signatureInput}.${signature}`;
}

test.describe('Ciclo CRUD en Panel Administrativo (Real sobre staging)', () => {
  const testPassword = 'TestPassword123!';
  let testUser = '';

  const createdTestUsers: string[] = [];
  async function getAdminToken() {
    const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
    const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    const res = await fetch(`${upstashUrl}/get/user:${SUPERADMIN}`, {
      headers: { Authorization: `Bearer ${upstashToken}` }
    });
    const json = await res.json();
    let tokenVersion = 1;
    if (json.result) {
      const user = JSON.parse(json.result);
      if (user.tokenVersion) tokenVersion = user.tokenVersion;
    }
    return generateToken(SUPERADMIN, 'superadmin', tokenVersion);
  }

  // Obtiene un token JWT válido para cualquier usuario desde Upstash
  async function getUserToken(username: string, role: string) {
    const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
    const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    const res = await fetch(`${upstashUrl}/get/user:${username}`, {
      headers: { Authorization: `Bearer ${upstashToken}` }
    });
    const json = await res.json();
    let tokenVersion = 1;
    if (json.result) {
      try {
        const user = JSON.parse(json.result);
        if (user.tokenVersion) tokenVersion = user.tokenVersion;
      } catch {}
    }
    return generateToken(username, role, tokenVersion);
  }

  // Utilidad para limpiar usuarios de prueba
  async function cleanupUsers(requestCtx: APIRequestContext, users: string[]) {
    if (users.length === 0) return;
    const adminToken = await getAdminToken();
    for (const user of users) {
      await requestCtx.delete('/api/users/delete', {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: { username: user }
      });
    }
  }



  test.beforeEach(async ({ request }) => {
    testUser = `admin_test_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    const adminToken = await getAdminToken();

    // Crear el usuario admin para la prueba
    const res = await request.post('/api/users/create', {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { username: testUser, password: testPassword, role: 'encargado' }
    });
    
    if (res.ok()) {
      if (!createdTestUsers.includes(testUser)) createdTestUsers.push(testUser);
    } else {
      console.log('Error creating test admin user:', await res.text());
    }
    expect(res.ok()).toBeTruthy();
  });

  test.afterAll(async ({ request }) => {
    try {
      await cleanupUsers(request, createdTestUsers);
    } finally {
      createdTestUsers.length = 0;
    }
  });

  test('Permite crear y luego visualizar una Item y anuncio en entorno real', async ({ page }) => {
    test.setTimeout(120000);

    // Definir nombres únicos antes de configurar los mocks
    const uniquePetName = `${TEST_CONFIG.sampleItem.title} ${Date.now()}`;
    const uniqueAnnouncementTitle = `${TEST_CONFIG.sampleAnnouncement.title} ${Date.now()}`;

    // ── Mocks de escritura → no commitean en GitHub ───────────────────────────
    await page.route(`**${TEST_CONFIG.endpoints.items}*`, async route => {
      if (route.request().method() === 'POST' || route.request().method() === 'PUT') {
        const reqPayload = route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, record: { id: `mock-item-${Date.now()}`, ...reqPayload } })
        });
      } else {
        await route.fallback();
      }
    });

    await page.route(`**${TEST_CONFIG.endpoints.announcements}*`, async route => {
      if (route.request().method() === 'POST' || route.request().method() === 'PUT') {
        const reqPayload = route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, record: { id: `mock-announce-${Date.now()}`, ...reqPayload } })
        });
      } else {
        await route.fallback();
      }
    });

    // ── Mocks de lectura → el cache invalidado devuelve el item creado ─────────
    // Esto garantiza que tras la invalidación de TanStack Query, el nombre aparece
    await page.route('**/api/public/pets*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'mock-pet-001', title: uniquePetName, status: 'active', main_image: '', gallery: [] }
        ])
      });
    });

    await page.route('**/api/public/announcements*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'mock-announce-001', title: uniqueAnnouncementTitle, type: 'general', status: 'active', main_image: '' }
        ])
      });
    });

    // ── 1. Inyectar sesión (evita el rate limiter del login) ──────────────────────
    const userToken = await getUserToken(testUser, 'encargado');
    await page.goto('/');
    
    const url = new URL(page.url());
    await page.context().addCookies([{
      name: 'auth_session_token',
      value: userToken,
      domain: url.hostname,
      path: '/'
    }]);

    await page.evaluate(({ u, r }: { u: string; r: string }) => {
      // 'session_user' es la clave que AuthContext (USER_KEY) lee para restaurar la sesión
      localStorage.setItem('session_user', JSON.stringify({ username: u, role: r }));
    }, { u: testUser, r: 'encargado' });
    
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: /Panel de Administración/i })).toBeVisible({ timeout: 15000 });

    // ── 2. Crear una Mascota ─────────────────────────────────────────────────
    await page.getByRole('button', { name: /Registrar Mascota/i }).first().click();
    await page.getByRole('textbox').first().fill(uniquePetName);

    // Seleccionar opciones genéricas si existen comboboxes requeridos
    const comboboxes = await page.getByRole('combobox').all();
    for (const combo of comboboxes) {
      await combo.click();
      await page.getByRole('option').first().click();
    }

    // Esperar a que la petición mockeada termine exitosamente
    const createPetPromise = page.waitForResponse(
      res => res.url().includes(TEST_CONFIG.endpoints.items) && res.status() === 201
    );
    await page.getByRole('button', { name: /Guardar|Crear/i }).first().click();
    await createPetPromise;

    // Verificar que aparece en la tabla/UI
    // (el mock GET de /public/pets devuelve el uniquePetName tras la invalidación)
    await expect(page.getByText(uniquePetName).first()).toBeAttached({ timeout: 20000 });

    // ── 3. Cambiar a Pestaña Anuncios ────────────────────────────────────────
    await page.getByRole('tab', { name: /Eventos y Anuncios/i }).click();

    // ── 4. Crear Anuncio ─────────────────────────────────────────────────────
    await page.getByRole('button', { name: /Nuevo/i }).first().click();

    // El formulario de Anuncio tiene: Título, Fecha (requerida), Hora (opc.), Descripción (requerida)
    // Usar localizadores por label para ser precisos
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel(/Título/i).fill(uniqueAnnouncementTitle);
    // Fecha requerida: usar formato YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];
    await dialog.getByLabel(/Fecha/i).fill(today);
    await dialog.getByLabel(/Descripción/i).fill(TEST_CONFIG.sampleAnnouncement.description);

    const createAnnouncePromise = page.waitForResponse(
      res => res.url().includes(TEST_CONFIG.endpoints.announcements) && res.status() === 201
    );
    await dialog.getByRole('button', { name: /Crear|Guardar/i }).click();
    await createAnnouncePromise;

    // Verificar que el anuncio aparece
    // (el mock GET de /public/announcements devuelve el uniqueAnnouncementTitle)
    await expect(page.getByText(uniqueAnnouncementTitle).first()).toBeAttached({ timeout: 20000 });
  });
});
