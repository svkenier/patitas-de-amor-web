import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// 1. Cargar variables manual para evitar dependencias extra si no existen
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const devVarsPath = path.join(rootDir, '.dev.vars');

if (fs.existsSync(devVarsPath)) {
  const content = fs.readFileSync(devVarsPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        let key = match[1].trim();
        let value = match[2].trim();
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        process.env[key] = value;
      }
    }
  }
}

const reqVars = [
  'GITHUB_TOKEN', 'GITHUB_OWNER', 'GITHUB_REPO', 
  'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 
  'ADMIN_USER', 'ADMIN_PASSWORD'
];

const missing = reqVars.filter(v => !process.env[v]);
if (missing.length > 0) {
  console.log(`[Seed]: Faltan credenciales (${missing.join(', ')}). Omitiendo sembrado.`);
  process.exit(0);
}

// Simulamos el entorno para que las funciones del core funcionen
const env = process.env as any;

// 2. Importar lógica del core
import { getFileWithETag, putFile } from '../src/core/github/github.js';
const PETS_JSON_PATH = 'data/pets.json';
import { listUsers, setUser } from '../src/core/auth/kv.js';
import { hashPassword } from '../src/core/auth/crypto.js';

async function seedGithub() {
  try {
    const res = await getFileWithETag(PETS_JSON_PATH, env);
    if (!res.data && !res.notModified) {
      await putFile(PETS_JSON_PATH, '[]', 'Initial commit for base database', env);
      console.log('[Seed GitHub]: Repositorio/archivo inicializado exitosamente.');
    } else {
      console.log('[Seed GitHub]: Archivo base detectado. Omitiendo sembrado.');
    }
  } catch (err) {
    if (err instanceof Error) {
      console.error('[Seed GitHub Error]:', err.message);
    } else {
      console.error('[Seed GitHub Error]:', err);
    }
  }
}

async function seedRedis() {
  try {
    const users = await listUsers(env);
    if (users.length > 0) {
      console.log('[Seed Redis]: Usuario administrador existente. Omitiendo sembrado.');
      return;
    }
    
    const hashed = await hashPassword(env.ADMIN_PASSWORD);
    await setUser({
      username: env.ADMIN_USER,
      password_hash: hashed,
      role: 'superadmin',
      tokenVersion: 1,
      last_login: new Date().toISOString(),
      created_by: 'system-seeder',
      created_at: new Date().toISOString(),
      isProtected: true
    }, env);
    
    console.log('[Seed Redis]: Administrador sembrado exitosamente.');
  } catch (err) {
    if (err instanceof Error) {
      console.error('[Seed Redis Error]:', err.message);
    } else {
      console.error('[Seed Redis Error]:', err);
    }
  }
}

async function run() {
  console.log('[Seed]: Iniciando comprobación de estado de bases de datos...');
  await seedGithub();
  await seedRedis();
  console.log('[Seed]: Comprobación finalizada.');
}

run();
