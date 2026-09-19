/**
 * Utilidades para la GitHub Contents API.
 *
 * Gestiona la base de datos almacenada en el repositorio público:
 *   /data/items.json         → JSON maestro de registros
 *   /data/settings/general.json → Configuración global
 *   /images/items/{id}.webp  → foto principal
 *   /images/items/{id}-extra-{n}.webp → fotos secundarias
 *
 * Variables de entorno requeridas (backend-only):
 *   GITHUB_TOKEN   — Personal Access Token con permisos repo
 *   GITHUB_OWNER   — Propietario del repositorio
 *   GITHUB_REPO    — Nombre del repositorio
 *   GITHUB_BRANCH  — Rama (default: main)
 */
function getGhConfig(env) {
    const missingVars = [];
    if (!env.GITHUB_TOKEN)
        missingVars.push('GITHUB_TOKEN');
    if (!env.GITHUB_OWNER)
        missingVars.push('GITHUB_OWNER');
    if (!env.GITHUB_REPO)
        missingVars.push('GITHUB_REPO');
    if (missingVars.length > 0) {
        console.error(`[GitHub Config Error]: Faltan variables de entorno requeridas: ${missingVars.join(', ')}`);
    }
    return {
        GITHUB_TOKEN: env.GITHUB_TOKEN ?? '',
        GITHUB_OWNER: env.GITHUB_OWNER ?? '',
        GITHUB_REPO: env.GITHUB_REPO ?? '',
        GITHUB_BRANCH: env.GITHUB_BRANCH ?? 'main',
    };
}
const GH_BASE = (env) => `https://api.github.com/repos/${getGhConfig(env).GITHUB_OWNER}/${getGhConfig(env).GITHUB_REPO}/contents`;
const GH_HEADERS = (env) => ({
    'Authorization': `token ${getGhConfig(env).GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'PatitasDeAmor-Worker/1.0',
});
export class ConfigurationError extends Error {
    provider;
    constructor(provider, message) {
        super(message);
        this.provider = provider;
        this.name = 'ConfigurationError';
    }
}
// ─── Helper genérico de petición ─────────────────────────────────────────────
async function ghRequest(method, path, env, body) {
    const response = await fetch(`${GH_BASE(env)}/${path}`, {
        method,
        headers: GH_HEADERS(env),
        body: body ? JSON.stringify(body) : undefined,
    });
    const cfg = getGhConfig(env);
    console.log(`[GitHub API] Request: ${method} ${cfg.GITHUB_OWNER}/${cfg.GITHUB_REPO} -> /${path} (Status: ${response.status})`);
    if (response.status === 204)
        return undefined;
    let json = {};
    const text = await response.text();
    try {
        json = JSON.parse(text);
    }
    catch {
        json = { message: text || `GitHub API error: ${response.status}` };
    }
    if (!response.ok) {
        const errorMsg = json['message'] ?? `GitHub API error: ${response.status}`;
        if (response.status === 401 || response.status === 403) {
            console.error(`[GitHub Config Error]: ${errorMsg}`);
            throw new ConfigurationError('GitHub', `Token inválido o sin permisos: ${errorMsg}`);
        }
        throw new Error(errorMsg);
    }
    return json;
}
// ─── Operaciones de archivo ───────────────────────────────────────────────────
export async function getFile(path, env) {
    try {
        return await ghRequest('GET', path, env);
    }
    catch (err) {
        if (err instanceof Error) {
            const msg = err.message;
            if (msg.includes('Not Found') || msg.includes('This repository is empty') || msg.includes('Git Repository is empty')) {
                return null;
            }
        }
        throw err;
    }
}
export async function getFileWithETag(path, env, ifNoneMatch) {
    const headers = { ...GH_HEADERS(env) };
    if (ifNoneMatch) {
        headers['If-None-Match'] = ifNoneMatch;
    }
    const response = await fetch(`${GH_BASE(env)}/${path}`, {
        method: 'GET',
        headers,
    });
    const cfg = getGhConfig(env);
    console.log(`[GitHub API] Request: GET ${cfg.GITHUB_OWNER}/${cfg.GITHUB_REPO} -> /${path} (Status: ${response.status})`);
    if (response.status === 304) {
        return { data: null, etag: response.headers.get('ETag'), notModified: true };
    }
    if (response.status === 404 || response.status === 409) {
        return { data: null, etag: null, notModified: false };
    }
    let json = {};
    const text = await response.text();
    try {
        json = JSON.parse(text);
    }
    catch {
        json = { message: text || `GitHub API error: ${response.status}` };
    }
    if (!response.ok) {
        const errorMsg = json['message'] ?? `GitHub API error: ${response.status}`;
        if (response.status === 401 || response.status === 403) {
            console.error(`[GitHub Config Error]: ${errorMsg}`);
            throw new ConfigurationError('GitHub', `Token inválido o sin permisos: ${errorMsg}`);
        }
        throw new Error(errorMsg);
    }
    return {
        data: json,
        etag: response.headers.get('ETag'),
        notModified: false,
    };
}
export async function putFile(path, content, message, env, sha) {
    // Corrección para Base64 segura en Edge
    let finalBase64 = content;
    if (!isBase64(content)) {
        const bytes = new TextEncoder().encode(content);
        const binString = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join('');
        finalBase64 = btoa(binString);
    }
    await ghRequest('PUT', path, env, {
        message,
        content: finalBase64,
        branch: getGhConfig(env).GITHUB_BRANCH,
        ...(sha ? { sha } : {}),
    });
}
export async function deleteFile(path, sha, message, env) {
    await ghRequest('DELETE', path, env, { message, sha, branch: getGhConfig(env).GITHUB_BRANCH });
}
// ─── Helpers específicos ───────────────────────────────────────────────────
export const SHELTER_INFO_PATH = 'data/settings/general.json';
export const cdnImageUrl = (relativePath, env) => {
    const cfg = getGhConfig(env);
    return `https://cdn.jsdelivr.net/gh/${cfg.GITHUB_OWNER}/${cfg.GITHUB_REPO}@${cfg.GITHUB_BRANCH}/${relativePath}`;
};
export function isBase64(str) {
    return /^[A-Za-z0-9+/]+=*$/.test(str.replace(/\s/g, ''));
}
export function generateItemId() {
    return `record-${Date.now()}`;
}
export function extractPathFromCdnUrl(url, env) {
    const cfg = getGhConfig(env);
    const prefix = `https://cdn.jsdelivr.net/gh/${cfg.GITHUB_OWNER}/${cfg.GITHUB_REPO}@${cfg.GITHUB_BRANCH}/`;
    if (url.startsWith(prefix)) {
        let path = url.substring(prefix.length);
        if (path.includes('?'))
            path = path.split('?')[0];
        return path;
    }
    return null;
}
