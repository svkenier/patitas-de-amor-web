# 📋 PROJECT RULES & ARCHITECTURE SPECIFICATION

> **Contexto:** Sistema web 100% autónomo y gratuito ($0.00 de por vida) para gestión de adopción de mascotas de un refugio benéfico, combinando **Cloudflare Pages (Hosting + Serverless Functions + Upstash Redis Auth)** y **GitHub (Data Store + CDN)**.

---

## 🛑 PROTOCOLO INICIAL DE DESARROLLO (OBLIGATORIO)

**Para cualquier IA, asistente o desarrollador antes de escribir código:**

1. **Fase de Preguntas y Clarificación:** Antes de generar código masivo, modular o crear archivos "a lo loco", la IA **DEBE formular todas las preguntas técnicas y de diseño necesarias** para despejar ambigüedades.
2. **Autorización Explícita:** No se debe iniciar la escritura ni reestructuración de código hasta que el usuario responda las dudas y otorgue su **autorización explícita** para proceder.
3. **Cero Dependencias Innecesarias:**
   - Queda **estrictamente prohibido instalar bibliotecas externas** para modales, alertas, iconos, selectores, loaders o animaciones que puedan resolverse directamente con **Material UI Transitions** y **CSS Transitions**.
   - Si se considera indispensable agregar una nueva dependencia ajena al stack base autorizado, la IA **DEBE solicitar autorización expresa** al usuario explicando la razón técnica antes de modificar el `package.json`.
4. **Cero Redundancia de Código:** Reutilizar componentes de MUI, tipos de TypeScript, cliente de Axios centralizado y hooks personalizados.

---

## 🛠️ STACK TECNOLÓGICO OFICIAL

- **Core:** React (v18+) + TypeScript.
- **Empaquetador / Build Tool:** Vite.
- **Framework de UI:** Material UI (`@mui/material`, `@emotion/react`, `@emotion/styled`).
- **Iconografía:** `@mui/icons-material`.
- **Cliente HTTP:** Axios (`axios`) con interceptores centralizados para JWT.
- **Manejo de Datos & Estado Asíncrono:** TanStack Query (`@tanstack/react-query`).
- **Enrutamiento:** `react-router-dom`.
- **Backend Serverless:** Cloudflare Pages Functions (`/api/*`) con `@upstash/redis`, `bcryptjs`, `jsonwebtoken`.
- **Optimización de Imágenes:** Nativa vía HTML5 `<canvas>` (salida a `image/webp`).

---

## 🎨 GUÍA DE DISEÑO Y CONSISTENCIA VISUAL GLOBAL

### 1. Regla de Cohesión Estética (Aplica a TODO el sitio)

- **Consistencia 100% Obligatoria:** Absolutamente todas las rutas de la aplicación —incluyendo Portada (`/`), Catálogo (`/mascotas`), Ficha (`/mascotas/:id`), Requisitos (`/requisitos`), Términos (`/terminos`), Privacidad (`/privacidad`), Login (`/login`) y Panel (`/admin`)— **DEBEN compartir exactamente el mismo lenguaje visual, componentes base, paleta de colores y comportamiento de transiciones**.
- **Prohibición de Vistas Planas/Descuidadas:** Ninguna página informativa o legal debe verse como un documento de texto crudo o desatendido. Deben utilizar el contenedor institucional (`Container maxWidth="md"`), encabezados jerárquicos con icono temático, tarjetas con fondo `#FFFFFF`, bordes sutiles de `1px solid #E5E7EB` y revelación animada suave (`AnimatedSection`).

### 2. Principios Visuales y Dinamismo

- **Minimalismo Profesional y Limpio:** Interfaz sobria, moderna y ordenada. Cero elementos recargados, bordes fluorescentes o gradientes estridentes.
- **Movilidad y Vida (Scroll & Micro-interacciones):**
  - Revelación sutil de secciones en scroll (Fade/Slide in con transiciones nativas de MUI / IntersectionObserver).
  - Micro-interacciones reactivas: elevación suave en tarjetas (`transform: translateY(-4px)` con transición fluida de `box-shadow`) y feedback táctil en botones.

### 3. Canales de Contacto Exclusivos por WhatsApp (Cero almacenamiento web)

- **Adopción de Mascota:** Enlace en la ficha individual con mensaje prearmado que incluye nombre, ID y URL directa a la web.
- **Reporte de Rescate / Emergencia:** Enlace para enviar ubicación GPS y detalles del animal en calle.
- **Solicitud de Ingreso / Donaciones:** Enlace directo para coordinar apadrinamiento o entrega responsable.

---

## 🏛️ ARQUITECTURA GENERAL DEL SISTEMA

### 1. Frontend & Lógica Segura (Cloudflare Pages)

- **Hosting Frontend:** SPA en React + Vite alojada en Cloudflare Pages (Plan Hobby Gratuito).
- **Cliente API Centralizado (`src/api/client.ts`):** Instancia de Axios con interceptores para inyección de token JWT y redirección automática ante respuestas `401`.
- **Serverless Functions (`/api/*`):** Endpoints seguros en Node.js que aíslan los secretos (`GITHUB_TOKEN`, `JWT_SECRET`, `SUPERADMIN_USERNAME`, `MASTER_RESCUE_KEY`).
- **Seguridad y Credenciales:** El `GITHUB_TOKEN` **NUNCA** baja al cliente. Vive exclusivamente en las variables de entorno de Cloudflare Pages.
- **Autenticación y Usuarios Privados (Upstash Redis / Upstash Redis):**
  - Los usuarios **NUNCA** se guardan en GitHub público. Se almacenan 100% privados en Upstash Redis.
  - Identificación mediante **Username simple alfanumérico** en minúsculas (`user:{username}`).
  - Contraseñas hasheadas con `bcryptjs`.
  - Sesiones basadas en JWT firmados guardados en `localStorage`.

### 2. Base de Datos de Mascotas & CDN (GitHub)

- **Almacén de Archivos y Fichas:** Repositorio público en GitHub utilizado como base de datos y banco de imágenes.
- **Estructura de Carpetas en el Repositorio:**
  - `/images/`: Guarda las fotos optimizadas de las mascotas (`pet-{id}.webp`, `pet-{id}-extra-{n}.webp`).
  - `/data/`: Guarda **1 archivo JSON por mascota** (`pet-{id}.json`) para evitar colisiones de concurrencia (`409 Conflict`).
  - `/dist/`: Contiene el archivo consolidado `mascotas-index.json`.
- **Automatización (GitHub Actions):**
  - Se dispara tras cambios en `/data/**`.
  - Recopila todos los `.json` individuales y genera `/dist/mascotas-index.json` en segundo plano (<10 seg).
- **Consumo Público:** Los visitantes descargan la lista compilada y las fotos a través del CDN global gratuito **jsDelivr** (`https://cdn.jsdelivr.net/gh/{owner}/{repo}@main/...`) con bypass de caché (`?t=${Date.now()}`).

---

## 👥 SISTEMA DE ROLES, ACCESOS Y CICLO DE VIDA DE USUARIOS

### 1. Jerarquía de Roles

- **`superadmin` (Propietario / SBK - Nivel 3):**
  - Control total sobre catálogo de mascotas.
  - Puede crear cuentas de cualquier rango (`superadmin`, `encargado`, `voluntario`).
  - **Poder Total de Rescate:** Puede cambiar/restablecer la contraseña de cualquier usuario (`encargado` o `voluntario`) desde el panel si se lo solicitan.
  - Puede eliminar a cualquier usuario.
  - **Cuenta Permanente:** Inmune a eliminación (`SUPERADMIN_USERNAME`) y no expira jamás por inactividad.
- **`encargado` (Administradores del Refugio - Nivel 2):**
  - Control total sobre catálogo de mascotas.
  - Puede crear cuentas con rol `encargado` y `voluntario`.
  - Puede eliminar cuentas de `voluntarios`.
  - **No puede eliminar a otros encargados ni al superadmin** (evita sabotajes).
  - Si olvida su clave, otro compañero le crea un usuario nuevo o acude al SuperAdmin para restablecerla.
- **`voluntario` (Ayudantes - Nivel 1):**
  - Permiso para crear y editar fichas de mascotas y fotos.
  - Sin acceso a la administración de usuarios.

### 2. Auto-Eliminación por Desconexión (TTL en Upstash Redis)

- **Sesión Activa:** Mientras un usuario mantenga su sesión abierta o en uso, la cuenta se mantiene **persistente (sin temporizador de borrado)**.
- **Sesión Cerrada / Desconectado:** Al cerrar sesión o desconectarse, se inicia un temporizador de **30 días de inactividad desconectada**.
- **Reactivación:** Si el usuario inicia sesión antes de los 30 días, el temporizador se cancela y la cuenta vuelve a ser persistente. Si pasan 30 días continuos desconectado, Upstash Redis elimina la cuenta automáticamente.
- **SuperAdmin:** Nunca tiene temporizador; su cuenta es permanente.

---

## ⚙️ ESPECIFICACIONES TÉCNICAS Y REGLAS DE NEGOCIO

### 1. Gestión de Imágenes y Optimización (Cliente)

- **Conversión Obligatoria:** Todas las imágenes (principal y secundarias) deben procesarse en el navegador antes de enviarse al backend mediante `<canvas>`.
- **Formato:** Exclusivamente `image/webp`.
- **Dimensiones y Calidad:** Ancho máximo de 1200 px proporcional y calidad de compresión entre 0.75 y 0.85 (peso objetivo: 80 KB - 150 KB por foto).
- **Limpieza Sincronizada:** Al eliminar una mascota desde el panel, el sistema **elimina tanto el archivo `.json` de datos como todas las imágenes `.webp` asociadas (principal y secundarias)** en GitHub vía API.

### 2. Endpoints Serverless Requeridos (`/api`)

- `POST /api/auth/login`: Valida credenciales, cancela TTL y entrega JWT.
- `POST /api/auth/logout`: Activa el TTL de 30 días en Upstash Redis para el usuario que se desconecta.
- `POST /api/auth/rescue`: Permite al SuperAdmin cambiar su clave usando la `MASTER_RESCUE_KEY`.
- `POST /api/users/create`: Registra un usuario en Upstash Redis validando duplicados.
- `POST /api/users/reset-password`: Permite al SuperAdmin asignar una nueva contraseña a cualquier usuario.
- `DELETE /api/users/delete`: Elimina un usuario de Upstash Redis validando jerarquía e inmunidad.
- `GET /api/users/list`: Lista los usuarios registrados para el panel de administración.
- `POST /api/pets`: Sube o actualiza las fotos WebP y crea/modifica el archivo `data/pet-{id}.json` en GitHub.
- `DELETE /api/pets`: Elimina de GitHub tanto `data/pet-{id}.json` como las imágenes asociadas usando sus SHAs.

---

## 🔒 VARIABLES DE ENTORNO REQUERIDAS (Cloudflare Pages)

```env
# GitHub API (Base de datos de mascotas e imágenes)
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
GITHUB_OWNER=usuario-u-organizacion
GITHUB_REPO=refugio-mascotas-data
GITHUB_BRANCH=main

# Autenticación y Seguridad
JWT_SECRET=clave_secreta_super_larga_para_firmar_jwt
SUPERADMIN_USERNAME=sbk
MASTER_RESCUE_KEY=clave_maestra_de_rescate_personal

# Contacto Institucional
VITE_WHATSAPP_PHONE=584120000000

# Upstash Redis (Inyectadas automáticamente al vincular KV en Cloudflare Pages)
KV_URL=redis://...
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...
KV_REST_API_READ_ONLY_TOKEN=...
```

---

## 📁 ESTRUCTURA DE ARCHIVOS ESPERADA (TypeScript + Vite + MUI + Axios)

```text
refugio-app/
├── .github/
│   └── workflows/
│       └── build-index.yml       # Action que unifica /data/*.json en /dist/mascotas-index.json
├── api/                          # Cloudflare Pages Serverless Functions
│   ├── auth/
│   │   ├── login.ts              # Login en KV + desactiva TTL
│   │   ├── logout.ts             # Logout + activa TTL de 30 días
│   │   └── rescue.ts             # Recuperación de SuperAdmin con Master Key
│   ├── users/
│   │   ├── create.ts             # Crear usuarios con control de duplicados
│   │   ├── reset-password.ts     # Reseteo administrativo de clave por SuperAdmin
│   │   ├── delete.ts             # Borrar usuarios con jerarquía e inmunidad
│   │   └── list.ts               # Listar usuarios
│   └── pets.ts                   # CRUD seguro de mascotas y galería contra GitHub API
├── data/                         # Archivos JSON individuales de mascotas (en GitHub)
├── images/                       # Fotos en WebP de mascotas (en GitHub)
├── dist/                         # Archivo mascotas-index.json compilado
├── src/
│   ├── api/
│   │   └── client.ts             # Instancia central de Axios con interceptores para JWT
│   ├── types/
│   │   ├── pet.ts                # Interfaces TypeScript de mascotas y galería
│   │   └── user.ts               # Interfaces TypeScript de usuarios y roles
│   ├── components/
│   │   ├── Navbar.tsx            # Barra de navegación principal
│   │   ├── Footer.tsx            # Pie de página con enlaces institucionales
│   │   ├── ProtectedRoute.tsx    # Guardián de rutas autenticadas por rol
│   │   ├── PetCard.tsx           # Tarjeta de adopción con micro-interacciones hover
│   │   ├── PetForm.tsx           # Formulario flexible con subida de fotos (MUI Dialog)
│   │   ├── ImageGallery.tsx      # Galería de fotos para la ficha de detalle
│   │   ├── ContactSection.tsx    # Tarjetas de WhatsApp para Adopción, Rescate y Donación
│   │   ├── AnimatedSection.tsx   # Wrapper para animaciones de entrada en scroll
│   │   └── UserManagement.tsx    # Pestaña para gestionar usuarios y roles (MUI Table)
│   ├── pages/
│   │   ├── Home.tsx              # Portada con destacados y flujo de adopción
│   │   ├── Catalog.tsx           # Catálogo completo con filtros avanzados (/mascotas)
│   │   ├── PetDetail.tsx         # Ficha individual con galería y botón WhatsApp (/mascotas/:id)
│   │   ├── Requirements.tsx      # Reglamento y requisitos de adopción responsable (/requisitos)
│   │   ├── Terms.tsx             # Términos y condiciones (/terminos)
│   │   ├── Privacy.tsx           # Políticas de privacidad (/privacidad)
│   │   ├── Login.tsx             # Formulario de ingreso sobrio y minimalista
│   │   └── Admin.tsx             # Panel de administración estructurado
│   ├── utils/
│   │   └── imageOptimizer.ts     # Redimensión y conversión a WebP en Canvas
│   ├── utils/
│   │   └── whatsapp.ts           # Generador de URLs de WhatsApp con enlace a la ficha
│   ├── theme/
│   │   └── theme.ts              # Paleta limpia, transiciones y sombras de Material UI
│   ├── App.tsx                   # Enrutamiento React Router + QueryClientProvider
│   └── main.tsx
├── RULES.md                      # Este archivo de reglas
├── tsconfig.json
├── vite.config.ts
├── wrangler.jsonc
└── package.json
```

---

## 🐾 MODELO DE DATOS Y DEFINICIONES TÉCNICAS RESUELTAS

### 1. Gestión de Fotos y Galería

- Cada mascota cuenta con **1 foto principal obligatoria** (portada de la tarjeta) y un arreglo opcional de **fotos secundarias** (`fotos_secundarias?: string[]`).
- Todas las imágenes secundarias se procesan con compresión automática a WebP vía Canvas en el cliente antes de ser enviadas a GitHub.

### 2. Campos del Formulario y Validación Mínima

- **Regla Anti-Vacío:** El formulario no permite envíos en blanco. Únicamente el **Nombre** y la **Foto Principal** son obligatorios para crear una ficha.
- **Campos Opcionales:** Especie, raza, edad aproximada, sexo, tamaño, peso, estado de salud (vacunado, esterilizado, desparasitado), estado de adopción y descripción/historia pueden llenarse inicialmente o completarse con posterioridad.

```typescript
export interface Pet {
  id: string; // Identificador único (ej: pet-1718293049)
  nombre: string; // REQUERIDO
  imagen_principal: string; // REQUERIDO (URL WebP)
  fotos_secundarias?: string[]; // OPCIONAL (URLs WebP galería)
  especie?: "perro" | "gato" | "otro"; // OPCIONAL
  raza?: string; // OPCIONAL
  edad_aproximada?: string; // OPCIONAL (ej: "2 meses", "1 año")
  sexo?: "macho" | "hembra"; // OPCIONAL
  tamano?: "pequeno" | "mediano" | "grande"; // OPCIONAL
  peso_kg?: number | string; // OPCIONAL (ej: 12.5)
  vacunado?: boolean; // OPCIONAL
  esterilizado?: boolean; // OPCIONAL
  desparasitado?: boolean; // OPCIONAL
  estado: "disponible" | "en_proceso" | "adoptado"; // Default: "disponible"
  descripcion?: string; // OPCIONAL
  destacado?: boolean; // OPCIONAL (Para home)
  created_at: string; // ISO Date
  updated_at: string; // ISO Date
}
```

### 3. Filtros del Catálogo

- Filtros predefinidos en `/mascotas`: Búsqueda por texto (nombre/raza), especie, sexo, tamaño, edad aproximada y estado de adopción.
