/**
 * Tipos TypeScript para el sistema de Usuarios, Roles y Autenticación.
 * Basado en la jerarquía de roles definida en src/docs/Rules.md.
 *
 * Almacenamiento: Upstash Redis — NUNCA en GitHub público.
 * Autenticación: JWT firmado guardado en `localStorage`.
 * TTL: 30 días de inactividad desconectada (cancelado al iniciar sesión).
 */
/**
 * Mapa numérico de nivel para comparaciones de jerarquía.
 * Uso: `ROLE_LEVEL[roleA] > ROLE_LEVEL[roleB]`
 */
export const ROLE_LEVEL = {
    voluntario: 1,
    encargado: 2,
    superadmin: 3,
};
// ─── Permisos y Guardias ──────────────────────────────────────────────────────
/**
 * Devuelve `true` si el `actorRole` tiene suficiente nivel
 * para administrar (crear/eliminar) al `targetRole`.
 *
 * Reglas:
 * - `superadmin` puede gestionar a `encargado` y `voluntario`.
 * - `encargado`  puede gestionar solo a `voluntario`.
 * - `voluntario` no puede gestionar a nadie.
 */
export function canManage(actorRole, targetRole) {
    return ROLE_LEVEL[actorRole] > ROLE_LEVEL[targetRole];
}
/**
 * Devuelve `true` si el `actorRole` puede crear usuarios del `newRole`.
 *
 * Reglas adicionales:
 * - Solo `superadmin` puede crear otros `superadmin`.
 * - `encargado` solo puede crear `encargado` y `voluntario`.
 */
export function canCreateRole(actorRole, newRole) {
    if (actorRole === 'superadmin')
        return true;
    if (actorRole === 'encargado')
        return newRole !== 'superadmin';
    return false;
}
