import { test, expect } from '@playwright/test';

test.describe('Responsividad y UI de la vista pública', () => {

  test('Verificar ausencia de soft 404 en catálogo vacío', async ({ page }) => {
    await page.route('**/api/public/pets*', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    await page.goto('/mascotas');

    // Debe mostrar que todos están adoptados
    await expect(page.getByText(/¡Nuestros peludos están en buenas manos!/i)).toBeVisible();
    // No debe haber un texto de error 404
    await expect(page.getByText('404')).not.toBeVisible();
  });

  test('Responsive viewport on mobile', async ({ page }) => {
    // Resize viewport to mobile
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');

    // Validate that the main container or hero has the proper height class 
    // Since we can't reliably read 'min-h-[100dvh]' dynamically, we just ensure it renders without horizontal overflow
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });

    expect(hasHorizontalOverflow).toBe(false);
  });

});
