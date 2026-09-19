import { test, expect } from '@playwright/test';

test.describe('Comprobador de Enlaces Rotos', () => {
  
  test('Los enlaces del Navbar y Footer responden con HTTP 200', async ({ page, request }) => {
    await page.goto('/');

    // Encontrar todos los enlaces en el documento (Navbar y Footer usualmente usan <a>)
    // Se filtran los que tengan href
    const links = await page.locator('a[href]').all();
    
    for (const link of links) {
      const href = await link.getAttribute('href');
      if (!href) continue;

      // Ignorar enlaces de email, teléfono o redes sociales externas complejas para la prueba,
      // excepto whatsapp como pidió el usuario.
      if (href.startsWith('mailto:') || href.startsWith('tel:')) continue;

      // Si es un enlace de whatsapp, comprobar su formato
      if (href.includes('wa.me')) {
        expect(href).toMatch(/https:\/\/wa\.me\/\d+/);
        continue;
      }

      // Si es un enlace interno absoluto o relativo
      // Resolvemos la URL completa
      const url = new URL(href, page.url()).href;
      
      // Evitar salir a dominios externos aleatorios para no fallar por bloqueos de terceros, 
      // pero sí comprobar las internas.
      if (url.startsWith(page.url())) {
        const response = await request.get(url);
        expect(response.status(), `El enlace ${url} está roto`).toBe(200);
      }
    }
  });

});
