import { test, expect, APIRequestContext } from '@playwright/test';
import crypto from 'crypto';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.dev.vars' });

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const SUPERADMIN = (process.env.ADMIN_USERNAME || process.env.ADMIN_USER) as string;

/**
 * Genera un JWT HS256 compatible con la firma de jsonwebtoken (RFC 7519).
 * La implementación de jsonwebtoken también usa HMAC-SHA256 sobre el string
 * `header.payload` en base64url, que es exactamente lo que hace esta función.
 */
function generateToken(username: string, role: string, tokenVersion: number = 1): string {
  const header = base64url(Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const payload = base64url(Buffer.from(JSON.stringify({
    sub: username,
    role,
    tokenVersion,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 8 * 3600
  })));
  const data = `${header}.${payload}`;
  const sig = base64url(crypto.createHmac('sha256', JWT_SECRET).update(data).digest());
  return `${data}.${sig}`;
}

function base64url(input: Buffer | string): string {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input as string, 'utf8');
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}


test.describe('Invalidación de Sesiones Globales y Seguridad', () => {
  test.describe.configure({ mode: 'serial' });
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
    } else {
      const adminUser = {
        username: SUPERADMIN,
        password_hash: 'hashed',
        role: 'owner',
        tokenVersion: 1,
        last_login: new Date().toISOString(),
        created_by: 'system',
        created_at: new Date().toISOString(),
        isProtected: true
      };
      await fetch(`${upstashUrl}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${upstashToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(["SET", `user:${SUPERADMIN}`, JSON.stringify(adminUser)])
      });
      await fetch(`${upstashUrl}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${upstashToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(["SADD", "user:index", SUPERADMIN])
      });
    }
    return generateToken(SUPERADMIN, 'owner', tokenVersion);
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
      console.log('Error creating user:', res.status(), res.statusText(), await res.text());
    } else {
      // OPTION C: Set ephemeral TTL to guarantee purge even if test crashes
      const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
      const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
      await fetch(`${upstashUrl}/expire/user:${testUser}/30`, {
        headers: { Authorization: `Bearer ${upstashToken}` }
      });

      if (!createdTestUsers.includes(testUser)) {
        createdTestUsers.push(testUser);
      }
    }
    expect(res.ok()).toBeTruthy();
  });

  test.afterEach(async ({ request }) => {
    if (testUser) {
      try {
        const adminToken = await getAdminToken();
        await request.delete('/api/users/delete', {
          headers: { Authorization: `Bearer ${adminToken}` },
          data: { username: testUser }
        });
      } catch (e) {
        console.error('Error in afterEach cleanup:', e);
      }
    }
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
    const adminUserData = { username: SUPERADMIN, role: 'owner' };
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
    await expect(adminPage.getByRole('heading', { name: /Panel de Administración/i })).toBeVisible({ timeout: 15000 });

    const listResponsePromise1 = adminPage.waitForResponse(
      response => response.url().includes('/api/users/list') && (response.status() === 200 || response.status() === 304)
    );
    await adminPage.getByRole('tab', { name: 'Usuarios' }).click();
    await listResponsePromise1;
    
    // Buscar al usuario de prueba y forzar logout
    // Buscamos la fila del usuario y usamos data-testid
    await adminPage.locator('table').getByTestId(`force-logout-${testUser}`).waitFor({ state: 'visible', timeout: 10000 });
    await adminPage.locator('table').getByTestId(`force-logout-${testUser}`).click();
    
    // Confirmar en el modal
    const dialog = adminPage.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const responsePromise = adminPage.waitForResponse(response => response.url().includes('/api/users/force-logout'));
    await dialog.getByRole('button', { name: 'Forzar Cierre' }).click();
    const response = await responsePromise;
    console.log('Force logout UI response status:', response.status(), await response.text());
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
    await injectSession(adminPage, SUPERADMIN, 'owner', adminToken);
    // Ir al panel de usuarios
    await adminPage.goto('/admin');
    await expect(adminPage.getByRole('heading', { name: /Panel de Administración/i })).toBeVisible({ timeout: 15000 });

    const listResponsePromise2 = adminPage.waitForResponse(
      response => response.url().includes('/api/users/list') && (response.status() === 200 || response.status() === 304)
    );
    await adminPage.getByRole('tab', { name: 'Usuarios' }).click();
    await listResponsePromise2;
    
    await adminPage.locator('table').getByTestId(`reset-${testUser}`).waitFor({ state: 'visible', timeout: 10000 });
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
    
    // 2. Superadmin se fuerza el cierre de sesión a un usuario efímero (permitido)
    const adminToken = await getAdminToken();
    const resSelf = await request.post('/api/users/force-logout', {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { username: testUser }
    });
    expect(resSelf.status()).toBe(200);
    const jsonSelf = await resSelf.json();
    expect(jsonSelf.success).toBe(true);
  });

  test('Test de Integración de Preservación de TTLs en Upstash Redis', async ({ request }) => {
    const adminToken = await getAdminToken();
    
    // 1. Activar el TTL manualmente enviando logout request para el usuario
    //    Usar getUserToken para leer el tokenVersion real desde Redis
    const userToken = await getUserToken(testUser, 'voluntario');
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
    const resForceText = await resForce.text();
    if (!resForce.ok()) {
      console.log('Force logout failed:', resForce.status(), resForceText);
    }
    expect(resForce.ok()).toBeTruthy();
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
