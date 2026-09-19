import { test, expect, APIRequestContext } from '@playwright/test';
import crypto from 'crypto';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.dev.vars' });

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
  const payload = {
    sub: username,
    role,
    tokenVersion,
    exp: Math.floor(Date.now() / 1000) + 8 * 3600
  };
  
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  
  const signature = crypto.createHmac('sha256', JWT_SECRET)
    .update(signatureInput)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
    
  return `${signatureInput}.${signature}`;
}

test.describe('Invalidación de Sesiones Globales y Seguridad', () => {
  let testUser = '';
  const testPassword = 'TestPassword123!';

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

  // Obtiene un token JWT válido para cualquier usuario desde Upstash Redis
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

  // Inyecta una sesión vía localStorage y cookie para evitar el rate limiter del endpoint /api/auth/login
  async function injectSession(page: any, username: string, role: string, token: string) {
    await page.goto('/');
    
    // Set the cookie for the server-side auth
    const url = new URL(page.url());
    await page.context().addCookies([{
      name: 'auth_session_token',
      value: token,
      domain: url.hostname,
      path: '/'
    }]);

    await page.evaluate(({ u, r }: { u: string; r: string }) => {
      // 'session_user' es la clave que AuthContext (USER_KEY) lee para restaurar la sesión
      localStorage.setItem('session_user', JSON.stringify({ username: u, role: r }));
    }, { u: username, r: role });
  }

  // Utilidad para limpiar los usuarios de prueba en bulk
  async function cleanupUsers(request: APIRequestContext) {
    if (createdTestUsers.length === 0) return;
    const adminToken = await getAdminToken();
    for (const user of createdTestUsers) {
      await request.delete('/api/users/delete', {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: { username: user }
      });
    }
  }

  test.beforeEach(async ({ playwright, request }) => {
    testUser = `testuser_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    const adminToken = await getAdminToken();

    const res = await request.post('/api/users/create', {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        username: testUser,
        password: testPassword,
        role: 'voluntario'
      }
    });
    if (!res.ok()) {
      console.log('Error creating user:', await res.text());
    } else {
      if (!createdTestUsers.includes(testUser)) {
        createdTestUsers.push(testUser);
      }
    }
    expect(res.ok()).toBeTruthy();
  });

  test.afterAll(async ({ request }) => {
    try {
      await cleanupUsers(request);
    } finally {
      // Vaciar el arreglo después de limpiar
      createdTestUsers.length = 0;
    }
  });

  test('Cierre de Sesión Forzado multi-contexto (Superadmin cierra sesión de usuario regular)', async ({ browser }) => {
    test.setTimeout(90000);
    // 1. Crear contexto del usuario regular (simulando un navegador diferente)
    const userContext = await browser.newContext();
    const userPage = await userContext.newPage();
    
    // Inyectar sesión del usuario de prueba (evita el rate limiter del login)
    const userToken = await getUserToken(testUser, 'voluntario');
    await injectSession(userPage, testUser, 'voluntario', userToken);

    // Ir al admin y verificar que el panel cargó
    await userPage.goto('/admin');
    await expect(userPage.getByRole('heading', { name: /Panel de Administración/i })).toBeVisible({ timeout: 15000 });
    
    // 2. Crear contexto del Superadmin
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    
    // Inyectar sesión de superadmin usando token con versión correcta
    const adminToken = await getAdminToken();
    const adminUserData = { username: SUPERADMIN, role: 'superadmin' };
    await adminPage.goto('/');
    
    const adminUrl = new URL(adminPage.url());
    await adminPage.context().addCookies([{
      name: 'auth_session_token',
      value: adminToken,
      domain: adminUrl.hostname,
      path: '/'
    }]);

    await adminPage.evaluate(({ user }) => {
      // 'session_user' es la clave que AuthContext (USER_KEY) lee para restaurar la sesión
      localStorage.setItem('session_user', JSON.stringify(user));
    }, { user: adminUserData });
    
    // Ir al panel de usuarios
    await adminPage.goto('/admin');
    const listResponsePromise1 = adminPage.waitForResponse(response => response.url().includes('/api/users/list') && (response.status() === 200 || response.status() === 304));
    await adminPage.getByRole('tab', { name: 'Usuarios' }).click();
    await listResponsePromise1;
    
    // Buscar al usuario de prueba y forzar logout
    // Buscamos la fila del usuario y usamos data-testid
    await adminPage.locator('table').getByTestId(`force-logout-${testUser}`).click();
    
    // Confirmar en el modal
    const dialog = adminPage.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const responsePromise = adminPage.waitForResponse(response => response.url().includes('/api/users/force-logout') && response.status() === 200);
    await dialog.getByRole('button', { name: 'Forzar Cierre' }).click();
    await responsePromise;
    await expect(adminPage.getByText('Sesiones invalidadas con éxito.')).toBeVisible({ timeout: 10000 });
    
    // 3. El heartbeat de 20s detectará la revocación automáticamente.
    // Recargamos la página para disparar la verificación inmediata al montar ProtectedRoute.
    await userPage.reload();
    // Con el polling de 20s y la verificación inmediata al montar, la redirección
    // ocurre en ≤20s sin necesidad de interacción manual.
    await expect(userPage).toHaveURL(/.*\/login/, { timeout: 25000 });

    await userContext.close();
    await adminContext.close();
  });


  test('Invalidación por Cambio de Contraseña', async ({ browser }) => {
    test.setTimeout(90000);
    // 1. Contexto de usuario regular
    const userContext = await browser.newContext();
    const userPage = await userContext.newPage();
    
    // Inyectar sesión del usuario de prueba (evita el rate limiter del login)
    const userToken = await getUserToken(testUser, 'voluntario');
    await injectSession(userPage, testUser, 'voluntario', userToken);

    // Ir al admin y verificar que el panel cargó
    await userPage.goto('/admin');
    await expect(userPage.getByRole('heading', { name: /Panel de Administración/i })).toBeVisible({ timeout: 15000 });
    
    // 2. Contexto del Superadmin (simulando reset de contraseña)
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    
    // Inyectar sesión del superadmin (evita el rate limiter del login)
    const adminToken = await getAdminToken();
    await injectSession(adminPage, SUPERADMIN, 'superadmin', adminToken);
    await adminPage.goto('/admin');
    
    const listResponsePromise2 = adminPage.waitForResponse(response => response.url().includes('/api/users/list') && (response.status() === 200 || response.status() === 304));
    await adminPage.getByRole('tab', { name: 'Usuarios' }).click();
    await listResponsePromise2;
    await adminPage.locator('table').getByTestId(`reset-${testUser}`).click();
    
    const dialog = adminPage.getByRole('dialog');
    await dialog.getByLabel(/Nueva Contraseña/i).fill('NuevoPass123!');
    const resetResponsePromise = adminPage.waitForResponse(response => response.url().includes('/api/users/reset-password') && response.status() === 200);
    await dialog.getByRole('button', { name: 'Resetear' }).click();
    await resetResponsePromise;
    await expect(adminPage.getByText(/exitosamente/i)).toBeVisible({ timeout: 10000 });
    
    // 3. El heartbeat de 20s detectará la revocación automáticamente.
    // Recargamos para disparar la verificación inmediata al montar ProtectedRoute.
    await userPage.reload();
    // La verificación inmediata al montar ProtectedRoute detecta el 401 y redirige.
    await expect(userPage).toHaveURL(/.*\/login/, { timeout: 25000 });

    await userContext.close();
    await adminContext.close();
  });

  test('Seguridad en Endpoint /api/users/force-logout', async ({ request }) => {
    // 1. Un voluntario intenta llamar al endpoint (403 Forbidden o 401)
    const userToken = generateToken(testUser, 'voluntario', 1);
    const resForbidden = await request.post('/api/users/force-logout', {
      headers: { Authorization: `Bearer ${userToken}` },
      data: { username: SUPERADMIN }
    });
    expect(resForbidden.status()).toBe(403);
    
    // 2. Superadmin se fuerza el cierre de sesión a sí mismo (permitido)
    const adminToken = await getAdminToken();
    const resSelf = await request.post('/api/users/force-logout', {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { username: SUPERADMIN }
    });
    expect(resSelf.status()).toBe(200);
    const jsonSelf = await resSelf.json();
    expect(jsonSelf.success).toBe(true);
  });

  test('Test de Integración de Preservación de TTLs en Upstash Redis', async ({ request }) => {
    const adminToken = await getAdminToken();
    
    // 1. Activar el TTL manualmente enviando logout request para el usuario
    const userToken = generateToken(testUser, 'voluntario', 1);
    await request.post('/api/auth/logout', {
      headers: { Authorization: `Bearer ${userToken}` }
    });

    // 2. Verificar el TTL directamente en KV a través del REST API de Upstash
    const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
    const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    
    const resTtl1 = await request.get(`${upstashUrl}/ttl/user:${testUser}`, {
      headers: { Authorization: `Bearer ${upstashToken}` }
    });
    const ttl1Data = await resTtl1.json();
    const ttl1 = ttl1Data.result; // El TTL en segundos
    
    expect(ttl1).toBeGreaterThan(0); // Debe tener un TTL activo
    
    // 3. Simular un force-logout que actualizará el tokenVersion
    const resForce = await request.post('/api/users/force-logout', {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { username: testUser }
    });
    expect(resForce.ok()).toBeTruthy();
    
    // 4. Verificar que el TTL sigue siendo aproximadamente el mismo
    const resTtl2 = await request.get(`${upstashUrl}/ttl/user:${testUser}`, {
      headers: { Authorization: `Bearer ${upstashToken}` }
    });
    const ttl2Data = await resTtl2.json();
    const ttl2 = ttl2Data.result;
    
    // Debe preservarlo y solo restarle el tiempo ínfimo que tomó la ejecución (usualmente 0 o 1 segundo de diferencia)
    expect(ttl2).toBeGreaterThan(0);
    expect(Math.abs(ttl1 - ttl2)).toBeLessThan(5); // Margen de 5 segundos
  });

});
