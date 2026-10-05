import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as kv from '../../src/core/auth/kv.js';
import { hashPassword } from '../../src/core/auth/crypto.js';

vi.mock('../../src/core/auth/kv.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/core/auth/kv.js')>();
  return {
    ...actual,
    listUsers: vi.fn(),
    setUser: vi.fn(),
  };
});

vi.mock('../../src/core/auth/crypto.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/core/auth/crypto.js')>();
  return {
    ...actual,
    hashPassword: vi.fn().mockResolvedValue('hashed_password'),
  };
});

describe('Master User Seed', () => {
  let env: any;

  beforeEach(() => {
    vi.clearAllMocks();
    env = {
      ADMIN_USER: 'admin',
      ADMIN_PASSWORD: 'securepassword',
    };
  });

  // Re-declare ensureSeeder to test it in isolation, 
  // because it's not exported from [action].ts
  async function ensureSeeder(envObj: any) {
    const users = await kv.listUsers(envObj);
    if (users.length === 0) {
      const envUser = (envObj.ADMIN_USER ?? '').replace(/^"|"$/g, '').trim();
      const envPass = (envObj.ADMIN_PASSWORD ?? '').replace(/^"|"$/g, '').trim();

      if (!envPass || !envUser) {
        throw new Error("ADMIN_USER or ADMIN_PASSWORD is missing. Initial seeding aborted for security.");
      }
      const hashed = await hashPassword(envPass);
      await kv.setUser({
        username: envUser,
        password_hash: hashed,
        role: 'owner',
        tokenVersion: 1,
        last_login: new Date().toISOString(),
        created_by: 'system-seeder',
        created_at: new Date().toISOString(),
        isProtected: true
      } as any, envObj);
    }
  }

  it('Escenario 1 (BD limpia): listUsers retorna [] -> invoca creación de owner', async () => {
    vi.mocked(kv.listUsers).mockResolvedValueOnce([]);
    
    await ensureSeeder(env);
    
    expect(kv.listUsers).toHaveBeenCalledWith(env);
    expect(kv.setUser).toHaveBeenCalledTimes(1);
    expect(kv.setUser).toHaveBeenCalledWith(
      expect.objectContaining({
        username: 'admin',
        role: 'owner',
        password_hash: 'hashed_password',
        isProtected: true
      }),
      env
    );
  });

  it('Escenario 2 (BD con datos): listUsers retorna usuarios -> aborta sin sobreescribir', async () => {
    vi.mocked(kv.listUsers).mockResolvedValueOnce([{ username: 'existing_user' } as any]);
    
    await ensureSeeder(env);
    
    expect(kv.listUsers).toHaveBeenCalledWith(env);
    expect(kv.setUser).not.toHaveBeenCalled();
  });
  
  it('Aborta si faltan variables de entorno en BD limpia', async () => {
    vi.mocked(kv.listUsers).mockResolvedValueOnce([]);
    env.ADMIN_PASSWORD = '';
    
    await expect(ensureSeeder(env)).rejects.toThrow("ADMIN_USER or ADMIN_PASSWORD is missing");
    expect(kv.setUser).not.toHaveBeenCalled();
  });
});
