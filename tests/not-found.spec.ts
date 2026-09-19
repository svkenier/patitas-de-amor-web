import { test, expect } from '@playwright/test';
import { TEST_CONFIG } from './fixtures/test-config';

test.describe('Página 404', () => {

  test('Renderiza componente NotFound al visitar una ruta inexistente', async ({ page }) => {
    // Generar ruta aleatoria
    const randomRoute = `/ruta-inexistente-${Date.now()}`;
    await page.goto(randomRoute);

    // Verificar que el título coincide con el SEO configurado en NotFound.tsx
    await expect(page).toHaveTitle(/Página no encontrada/i);

    // Verificar presencia visual del texto 404
    await expect(page.locator('h1')).toHaveText('404');
    await expect(page.locator('text=¡Ups! Nos hemos perdido')).toBeVisible();

    // Comprobar que el botón devuelve al inicio
    const homeBtn = page.getByRole('link', { name: /Volver al inicio/i });
    await expect(homeBtn).toBeVisible();
    await homeBtn.click();

    // Verificar la navegación a inicio
    await expect(page).toHaveURL(/.*localhost.*|.*127\.0\.0\.1.*/);
    await expect(page.locator('h1')).toHaveText(TEST_CONFIG.heroHeadlinePattern);
  });

});
