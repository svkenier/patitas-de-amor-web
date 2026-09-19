import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno del proyecto para las pruebas
dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.example') });
dotenv.config({ path: path.resolve(process.cwd(), '.dev.vars') });

// Candado de Seguridad (Production Guard)
// Removido ya que se usa page.route para aislar las peticiones POST/PUT.

/**
 * Configuración global de Playwright
 * Ver https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  /* Ejecutar tests en paralelo */
  fullyParallel: true,
  /* Fallar la compilación en CI si se dejó algún test.only en el código */
  forbidOnly: !!process.env.CI,
  /* Reintentos solo en CI */
  retries: process.env.CI ? 2 : 0,
  /* Hilos de trabajo en CI */
  workers: process.env.CI ? 1 : undefined,
  /* Opciones para el reporte */
  reporter: [['html', { outputFolder: './tests/playwright-report' }]],
  /* Carpeta para artefactos de pruebas (traces, videos, screenshots) */
  outputDir: './tests/test-results/',
  
  /* Configuración compartida de contextos de navegador */
  use: {
    /* URL base contra la que se resolverán las navegaciones (ej. await page.goto('/')) */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || process.env.BASE_URL || 'http://localhost:5173',

    /* Recopilar rastros (traces) cuando un test falla */
    trace: 'on-first-retry',
    
    /* Grabar capturas de pantalla si un test falla */
    screenshot: 'only-on-failure',
  },

  /* Configurar proyectos para los navegadores más populares */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    /* Pruebas móviles (opcional, pueden habilitarse luego)
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    */
  ],

  /* Ejecutar el servidor de desarrollo local antes de comenzar las pruebas */
  webServer: {
    command: 'pnpm run preview',
    url: process.env.PLAYWRIGHT_BASE_URL || process.env.BASE_URL || 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
