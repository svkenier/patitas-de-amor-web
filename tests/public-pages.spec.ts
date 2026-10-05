import { test, expect } from '@playwright/test';
import { TEST_CONFIG } from './fixtures/test-config';

test.describe('Páginas Públicas y Navegación', () => {

  test.beforeEach(async ({ page }) => {
    // Mock settings and items to avoid ECONNREFUSED when the local dev/backend server is not running
    await page.route('**/api/settings', async route => {
      await route.fulfill({ status: 200, json: {} });
    });
    
    await page.route('**/api/public/pets*', async route => {
      await route.fulfill({ status: 200, json: [] });
    });
  });

  test('La página de Inicio (/) carga sin errores y muestra componentes clave', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/');
    
    expect(errors.length).toBe(0);

    await expect(page).toHaveTitle(TEST_CONFIG.siteTitlePattern);
    await expect(page.locator('h1')).toHaveText(TEST_CONFIG.heroHeadlinePattern);

    const viewPetsBtn = page.getByRole('link').first();
    await expect(viewPetsBtn).toBeVisible({ timeout: 10000 });

    const images = await page.locator('img').all();
    for (const img of images) {
      const isVisible = await img.isVisible();
      if (isVisible) {
        const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
        expect(naturalWidth).toBeGreaterThan(0);
      }
    }
  });

  test('El catálogo de Mascotas (/mascotas) muestra listado o Empty State', async ({ page }) => {
    await page.goto('/mascotas');
    await expect(page).toHaveTitle(TEST_CONFIG.siteTitlePattern);

    // Validar el Empty State y ausencia de soft 404
    const petButton = page.getByRole('link', { name: /Ver/i }).first();
    const emptyState = page.getByText(/¡Nuestros peludos están en buenas manos!/i).first();

    await expect(petButton.or(emptyState)).toBeAttached({ timeout: 10000 });
    // Validar explícitamente que no se muestre un 404
    await expect(page.getByText('404').first()).not.toBeVisible();
  });

  const legalPages = [
    { url: '/requisitos', title: TEST_CONFIG.siteTitlePattern, heading: /Requisitos/i },
    { url: '/terminos', title: TEST_CONFIG.siteTitlePattern, heading: /Términos/i },
    { url: '/privacidad', title: TEST_CONFIG.siteTitlePattern, heading: /Privacidad/i }
  ];

  for (const { url, title, heading } of legalPages) {
    test(`La página ${url} carga correctamente sin errores 404/500`, async ({ page }) => {
      const response = await page.goto(url);
      
      expect(response).not.toBeNull();
      expect(response?.status()).toBe(200);

      await expect(page).toHaveTitle(title);
      await expect(page.locator('h1, h2').filter({ hasText: heading }).first()).toBeVisible();
      
      const mainContent = page.locator('main').or(page.locator('.MuiContainer-root')).first();
      await expect(mainContent).toBeVisible();
    });
  }

  test('Renderiza componente NotFound al visitar una ruta inexistente', async ({ page }) => {
    const randomRoute = `/ruta-inexistente-${Date.now()}`;
    await page.goto(randomRoute);

    await expect(page).toHaveTitle(/Página no encontrada/i);

    await expect(page.locator('h1')).toHaveText('404');
    await expect(page.locator('text=¡Ups! Nos hemos perdido')).toBeVisible();

    const homeBtn = page.getByRole('link', { name: /Volver al inicio/i });
    await expect(homeBtn).toBeVisible();
    await homeBtn.click();

    await expect(page).toHaveURL(/.*localhost.*|.*127\.0\.0\.1.*/);
    await expect(page.locator('h1')).toHaveText(TEST_CONFIG.heroHeadlinePattern);
  });

});
