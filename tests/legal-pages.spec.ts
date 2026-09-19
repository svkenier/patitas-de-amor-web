import { test, expect } from '@playwright/test';
import { TEST_CONFIG } from './fixtures/test-config';

test.describe('Páginas Legales e Informativas', () => {

  // Títulos flexibles ya que algunas páginas usan el por defecto de index.html
  const legalPages = [
    { url: '/requisitos', title: TEST_CONFIG.siteTitlePattern, heading: /Requisitos/i },
    { url: '/terminos', title: TEST_CONFIG.siteTitlePattern, heading: /Términos/i },
    { url: '/privacidad', title: TEST_CONFIG.siteTitlePattern, heading: /Privacidad/i }
  ];

  for (const { url, title, heading } of legalPages) {
    test(`La página ${url} carga correctamente sin errores 404/500`, async ({ page }) => {
      const response = await page.goto(url);
      
      // Asegurarse de que la respuesta existe y el status es 200 (OK)
      expect(response).not.toBeNull();
      expect(response?.status()).toBe(200);

      // Verificar el título
      await expect(page).toHaveTitle(title);

      // Asegurarse de que el título principal de la página está presente
      await expect(page.locator('h1, h2').filter({ hasText: heading }).first()).toBeVisible();
      
      // Asegurarse de que el contenido principal está presente
      const mainContent = page.locator('main').or(page.locator('.MuiContainer-root')).first();
      await expect(mainContent).toBeVisible();
    });
  }
});
