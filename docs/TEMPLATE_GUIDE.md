# Plantilla de Interfaz y Backend Cloudflare (Boilerplate)

Esta plantilla es una base modular, agnóstica y 100% reutilizable para aplicaciones React (Vite) desplegadas en Cloudflare Pages, con un backend integrado (Cloudflare Pages Functions) y un Core de conexión a GitHub y Redis.

## Estructura del Proyecto

- **/public/**: Recursos estáticos, imágenes de branding, favicon, robots.txt, etc. (Específico del cliente).
- **/functions/api/**: API Serverless de Cloudflare Pages. Aquí residen los endpoints genéricos (`/items`, `/announcements`, `/auth`, `/settings`). Esta carpeta es completamente agnóstica al dominio.
- **/src/core/**: El motor agnóstico de la aplicación. (Se copia íntegramente a nuevos proyectos)
  - `api/`: Cliente HTTP genérico para conectar con las funciones (`get`, `post`, `put`, `del`).
  - `auth/`: Lógica de sesión con JWT y Redis.
  - `github/`: Conexión a GitHub para uso como base de datos.
  - `media/`: Optimización de imágenes (WebP via Canvas) y utilidades de SEO.
  - `types/`: Tipos de datos fundamentales (`BaseRecord`).
  - `utils/`: Helpers genéricos (ej. `whatsapp.ts`, formateo).
- **/src/config/**: Configuraciones y textos de negocio (ej. `whatsapp.config.ts`).
- **/src/ui/**: La interfaz de usuario (Boilerplate). Los componentes aquí están acoplados visualmente pero pueden (y deben) adaptarse o reescribirse según las necesidades de cada proyecto. Se comunican siempre con tipos genéricos como `BaseRecord`.

## Configuración y Variables de Entorno

### Entorno Local (`.env`)

```env
# Configuración del frontend (Vite)
VITE_SITE_URL=http://localhost:5173
VITE_GITHUB_OWNER=mi-organizacion
VITE_GITHUB_REPO=repo-datos
VITE_WHATSAPP_PHONE=5491112345678

# Configuración del Backend (Cloudflare Pages Functions - no llevan prefijo VITE_)
GITHUB_TOKEN=ghp_tuto...
GITHUB_OWNER=mi-organizacion
GITHUB_REPO=repo-datos
GITHUB_BRANCH=main

UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
JWT_SECRET=un_secreto_seguro_para_firmar_tokens
```

### Configuración en Cloudflare Pages

En el dashboard de Cloudflare Pages:
1. Ve a **Settings > Environment variables**.
2. Añade las mismas variables descritas en la sección anterior (tanto las `VITE_` como las del backend).
3. Asegúrate de configurar el **Build command** a `npm run build` o `pnpm run build` y el **Build output directory** a `dist`.

## Clonar y Adaptar para Nuevos Proyectos

- **Bloques funcionales y de motor a copiar íntegros:** 
  1. La carpeta completa `/src/core/` (lógica de negocio genérica, modelos como `BaseRecord` y cliente API).
  2. El backend `/functions/` (Cloudflare Pages Functions).
  3. El sistema de autenticación y sesión (`AuthContext`).
  4. La infraestructura de pruebas (`tests/` y `playwright.config.ts`).

- **Bloques a reescribir/adaptar por proyecto:** 
  1. Los componentes visuales y páginas de la UI (`src/ui/pages/`), adaptados a la interfaz específica de cada cliente.
  2. Recursos gráficos y base en `/public`.
  3. Las plantillas y reglas de negocio específicas en `/src/config/` (ej. `whatsapp.config.ts`). Aquí es donde ajustas todos los textos de contacto.

- **Configuración obligatoria:** Variables de entorno necesarias en Cloudflare Pages (`GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO`, URLs/Tokens de Upstash Redis, JWT_SECRET).

## Tests y Mantenimiento

Los tests en `/tests` se ejecutan mediante Playwright. Utilizamos `data-testid` como selector principal para evitar fragilidad en los tests cuando la UI cambie de un proyecto a otro.
Ejecutar tests: `npm run test:e2e` o `npx playwright test`. Los reportes se generan aisladamente en `/tests/reports/`.
