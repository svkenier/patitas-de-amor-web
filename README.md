# Portal de Adopción de Mascotas y CMS Desacoplado

Bienvenido al repositorio oficial del **Portal de Adopción de Mascotas**. Este proyecto incluye tanto la aplicación pública para los adoptantes como el panel administrativo (CMS) para gestionar las mascotas y eventos.

## 🚀 Stack Tecnológico
- **Frontend**: React 18, TypeScript, Vite.
- **UI/Estilos**: Material UI (MUI).
- **Backend/Despliegue**: Cloudflare Pages Functions.
- **Persistencia**: GitHub API (Almacenamiento Serverless en un repositorio separado).
- **Caché y Sesiones**: Upstash Redis (KV Store).

## 🏗 Arquitectura
El sistema se basa en una separación estricta de responsabilidades:
- **Core Agnóstico (`src/core/`)**: Toda la lógica de persistencia, sincronización con GitHub API y la autenticación se maneja sin conocimiento directo del dominio específico.
- **Capa UI (`src/ui/`)**: La interfaz gráfica que consume el core agnóstico pero le da el contexto de dominio ("Mascotas", "Adopciones", "Eventos").
- **Cloudflare Pages Functions (`functions/api/`)**: Funciones Serverless que manejan endpoints como login y CRUD protegiendo los secretos en el servidor.

## 🛠 Guía de Desarrollo Local

### Prerrequisitos
- Node.js v20+
- `pnpm` instalado
- Variables de entorno configuradas

### 1. Variables de Entorno
Crea un archivo `.dev.vars` en la raíz del proyecto tomando como referencia `.dev.vars.example`:
```ini
GITHUB_TOKEN="tu-token-aqui"
GITHUB_OWNER="organizacion"
GITHUB_REPO="nombre-del-repo-db"
UPSTASH_REDIS_REST_URL="url-upstash"
UPSTASH_REDIS_REST_TOKEN="token-upstash"
JWT_SECRET="secret-local"
ADMIN_USER="admin"
ADMIN_PASSWORD="password"
```

### 2. Instalación
```bash
pnpm install
```

### 3. Servidor de Desarrollo
```bash
pnpm dev
```
> **Nota**: `pnpm dev` utiliza Wrangler para simular las Cloudflare Pages Functions localmente. No uses `vite dev` si necesitas que las rutas de `/api/` funcionen.

### 4. Construcción para Producción
```bash
pnpm build
```

## 🌿 Convención de Ramas
- `main`: Rama principal de Producción. Cualquier commit en esta rama activará el despliegue en producción en Cloudflare Pages.
- `develop`: Rama de desarrollo (Staging / Previews). Usada para pruebas antes de fusionar a `main`.
