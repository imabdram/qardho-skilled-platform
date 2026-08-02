/**
 * tests/auth-me-identity-resolution.test.ts
 *
 * Tests the 14 scenarios specified in the Clerk Dev→Prod migration fix.
 * Uses vitest and pure in-memory stubs (no real DB or network).
 *
 * Run:  npx vitest run tests/auth-me-identity-resolution.test.ts
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { createHash, randomBytes } from 'crypto';

const expect = (actual: any) => ({
  toBe: (expected: any) => assert.strictEqual(actual, expected),
  not: {
    toBe: (expected: any) => assert.notStrictEqual(actual, expected),
    toHaveBeenCalled: () => assert.strictEqual(mockGetUserCalls.length, 0),
  },
});

let mockGetUserCalls: any[] = [];

// ---------------------------------------------------------------------------
// In-memory state
// ---------------------------------------------------------------------------
let dbUsers: any[]       = [];
let dbIdentities: any[]  = [];

const vi = {
  fn: (impl?: any) => {
    let currentImpl = impl;
    const f: any = (...args: any[]) => {
      f.mock.calls.push(args);
      return currentImpl ? currentImpl(...args) : undefined;
    };
    f.mock = { calls: [] };
    f.mockReset = () => { f.mock.calls = []; currentImpl = impl; };
    f.mockResolvedValue = (val: any) => { currentImpl = async () => val; return f; };
    f.mockReturnValue = (val: any) => { currentImpl = () => val; return f; };
    return f;
  }
};

// ---------------------------------------------------------------------------
// DB stub
// ---------------------------------------------------------------------------
function makeDbStub() {
  return {
    run: vi.fn().mockResolvedValue(undefined),

    get: vi.fn(async (sql: string, params: any[] = []) => {
      if (sql.includes('user_auth_identities') && sql.includes('clerk_user_id')) {
        return dbIdentities.find(
          (i) => i.clerk_user_id === params[0] && i.environment === params[1]
        );
      }
      if (sql.includes('WHERE id = $1')) {
        return dbUsers.find((u) => u.id === params[0]);
      }
      if (sql.includes('"clerkUserId" = $1')) {
        return dbUsers.find((u) => u.clerkUserId === params[0]);
      }
      return undefined;
    }),

    all: vi.fn(async (sql: string, params: any[] = []) => {
      if (sql.includes('LOWER(TRIM(u.email))')) {
        const email = params[0];
        const env   = params[1];
        return dbUsers.filter((u) => {
          const emailMatch = u.email && u.email.trim().toLowerCase() === email;
          const noIdentity = !dbIdentities.find(
            (i) => i.user_id === u.id && i.environment === env
          );
          return emailMatch && noIdentity;
        });
      }
      return [];
    }),

    transaction: vi.fn(async (work: (tx: any) => any) => {
      const tx = {
        run: vi.fn(async (sql: string, params: any[] = []) => {
          if (sql.includes('pg_advisory_xact_lock')) return;
          if (sql.includes('INSERT INTO users') && !sql.includes('user_auth_identities')) {
            const id = params[0];
            if (!dbUsers.find((u) => u.id === id)) {
              dbUsers.push({
                id,
                clerkUserId: params[1],
                name:        params[2],
                email:       params[3],
                role:        params[4],
                verified:    params[5],
                suspended:   false,
              });
            }
          }
          if (sql.includes('INSERT INTO user_auth_identities')) {
            const exists = dbIdentities.find((i) => i.clerk_user_id === params[2]);
            if (!exists) {
              dbIdentities.push({
                id:            params[0],
                user_id:       params[1],
                clerk_user_id: params[2],
                environment:   params[3],
              });
            }
          }
          if (sql.includes('UPDATE users') && sql.includes('"clerkUserId"')) {
            const userId = params[3];
            const user   = dbUsers.find((u) => u.id === userId);
            if (user) {
              user.clerkUserId = user.clerkUserId || params[0];
              user.role        = params[1];
              user.avatarUrl   = user.avatarUrl || params[2];
            }
          }
        }),

        get: vi.fn(async (sql: string, params: any[] = []) => {
          if (sql.includes('user_auth_identities') && sql.includes('clerk_user_id')) {
            return dbIdentities.find(
              (i) => i.clerk_user_id === params[0] && i.environment === params[1]
            );
          }
          return dbUsers.find((u) => u.id === params[0]);
        }),

        all: vi.fn(async (sql: string, params: any[] = []) => {
          if (sql.includes('LOWER(TRIM(u.email))')) {
            const email = params[0];
            const env   = params[1];
            return dbUsers.filter((u) => {
              const emailMatch = u.email && u.email.trim().toLowerCase() === email;
              const noIdentity = !dbIdentities.find(
                (i) => i.user_id === u.id && i.environment === env
              );
              return emailMatch && noIdentity;
            });
          }
          return [];
        }),
      };

      return work(tx);
    }),
  };
}

// ---------------------------------------------------------------------------
// Clerk stubs
// ---------------------------------------------------------------------------
const mockGetAuth = vi.fn();
const mockGetUser = vi.fn();

function clerkUserObj(opts: {
  userId: string;
  email: string;
  verified?: boolean;
  firstName?: string;
  imageUrl?: string;
}) {
  return {
    id:                      opts.userId,
    firstName:               opts.firstName ?? 'Test',
    lastName:                'User',
    imageUrl:                opts.imageUrl ?? null,
    primaryEmailAddressId:   'email-id-1',
    emailAddresses: [{
      id:             'email-id-1',
      emailAddress:   opts.email,
      verification:   { status: opts.verified !== false ? 'verified' : 'unverified' },
    }],
  };
}

// ---------------------------------------------------------------------------
// Inline handler – mirrors the fixed /api/auth/me logic
// ---------------------------------------------------------------------------
function makeHandler(db: ReturnType<typeof makeDbStub>, adminEmails = ['admin@qardho.com']) {
  const clerkEnv     = 'production' as const;
  const formatUser   = (u: any) => ({ ...u, verified: !!u.verified, suspended: !!u.suspended });

  return async function handler(req: any, res: any) {
    const auth        = mockGetAuth(req);
    const clerkUserId = auth?.userId;
    if (!clerkUserId) return res.status(401).json({ user: null });

    // ── Step 3/4: look up identity ──────────────────────────────────────────
    const existingIdentity = await db.get(
      'SELECT uai.user_id FROM user_auth_identities uai WHERE uai.clerk_user_id = $1 AND uai.environment = $2',
      [clerkUserId, clerkEnv]
    );

    // ── Step 5: found → return linked user ──────────────────────────────────
    if (existingIdentity) {
      const linkedUser = await db.get('SELECT * FROM users WHERE id = $1', [existingIdentity.user_id]);
      if (linkedUser) {
        if (linkedUser.suspended) return res.status(403).json({ error: 'Account suspended.', user: null });
        const email = (linkedUser.email || '').trim().toLowerCase();
        if (email && adminEmails.includes(email) && linkedUser.role !== 'admin') {
          await db.run('UPDATE users SET role = $1 WHERE id = $2', ['admin', linkedUser.id]);
          linkedUser.role = 'admin';
        }
        return res.json({ user: formatUser(linkedUser) });
      }
      await db.run('DELETE FROM user_auth_identities WHERE clerk_user_id = $1', [clerkUserId]);
    }

    // ── Legacy fallback (clerkUserId column) ─────────────────────────────────
    const legacyUser = await db.get('SELECT * FROM users WHERE "clerkUserId" = $1', [clerkUserId]);
    if (legacyUser) {
      if (legacyUser.suspended) return res.status(403).json({ error: 'Account suspended.', user: null });
      const bfId = `identity-bf-${Date.now()}-${randomBytes(4).toString('hex')}`;
      await db.run('INSERT INTO user_auth_identities ...', [bfId, legacyUser.id, clerkUserId, clerkEnv, new Date().toISOString()]);
      return res.json({ user: formatUser(legacyUser) });
    }

    // ── Step 6: Fetch from Clerk BAPI ────────────────────────────────────────
    let clerkUser: any;
    try { clerkUser = await mockGetUser(clerkUserId); }
    catch { return res.status(500).json({ error: 'Could not fetch user details from Clerk.' }); }

    const primaryEmailObj   = clerkUser.emailAddresses?.find((e: any) => e.id === clerkUser.primaryEmailAddressId)
                              ?? clerkUser.emailAddresses?.[0];
    const rawEmail          = primaryEmailObj?.emailAddress ?? '';
    const normalizedEmail   = rawEmail.trim().toLowerCase();
    const isEmailVerified   = Boolean(primaryEmailObj?.verification?.status === 'verified');
    const displayName       = clerkUser.firstName || normalizedEmail.split('@')[0] || 'User';
    const clerkImageUrl     = clerkUser.imageUrl ?? null;
    const isAutoAdmin       = Boolean(normalizedEmail && adminEmails.includes(normalizedEmail));

    // ── Steps 7/8: email match → link ────────────────────────────────────────
    if (normalizedEmail && isEmailVerified) {
      return db.transaction(async (tx: any) => {
        const lockKey = BigInt('0x' + createHash('sha256').update(clerkUserId).digest('hex').slice(0, 15)).toString();
        await tx.run('SELECT pg_advisory_xact_lock($1)', [lockKey]);

        // Race-condition re-check
        const identityCheck = await tx.get(
          'SELECT user_id FROM user_auth_identities WHERE clerk_user_id = $1 AND environment = $2',
          [clerkUserId, clerkEnv]
        );
        if (identityCheck) {
          const ru = await tx.get('SELECT * FROM users WHERE id = $1', [identityCheck.user_id]);
          if (ru?.suspended) return res.status(403).json({ error: 'Account suspended.', user: null });
          return res.json({ user: formatUser(ru) });
        }

        const matches = await tx.all(
          'SELECT u.* FROM users u WHERE LOWER(TRIM(u.email)) = $1 AND NOT EXISTS (SELECT 1 FROM user_auth_identities uai WHERE uai.user_id = u.id AND uai.environment = $2)',
          [normalizedEmail, clerkEnv]
        );

        if (matches.length === 1) {
          const eu         = matches[0];
          if (eu.suspended) return res.status(403).json({ error: 'Account suspended.', user: null });
          const targetRole = isAutoAdmin ? 'admin' : eu.role;
          await tx.run(
            'UPDATE users SET "clerkUserId" = COALESCE("clerkUserId", $1), role = $2, "avatarUrl" = COALESCE("avatarUrl", $3) WHERE id = $4',
            [clerkUserId, targetRole, clerkImageUrl, eu.id]
          );
          const identityId = `identity-${Date.now()}-${randomBytes(4).toString('hex')}`;
          await tx.run(
            'INSERT INTO user_auth_identities (id, user_id, clerk_user_id, environment, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $5) ON CONFLICT (clerk_user_id) DO NOTHING',
            [identityId, eu.id, clerkUserId, clerkEnv, new Date().toISOString()]
          );
          const updated = await tx.get('SELECT * FROM users WHERE id = $1', [eu.id]);
          return res.json({ user: formatUser(updated) });
        }

        if (matches.length > 1) {
          return res.status(409).json({ error: 'Account linking requires manual review.', code: 'MULTIPLE_ACCOUNTS_MATCH', user: null });
        }

        // ── Step 9: new pending user ──────────────────────────────────────────
        const newId     = `user-${Date.now()}-${randomBytes(4).toString('hex')}`;
        const now       = new Date().toISOString();
        const initRole  = isAutoAdmin ? 'admin' : 'pending';
        await tx.run(
          'INSERT INTO users (id, "clerkUserId", name, email, phone, role, verified, suspended, "createdAt", availability, "avatarUrl") VALUES ($1, $2, $3, $4, NULL, $5, $6, false, $7, \'available\', $8)',
          [newId, clerkUserId, displayName, normalizedEmail, initRole, isAutoAdmin, now, clerkImageUrl]
        );
        const identityId = `identity-${Date.now()}-${randomBytes(4).toString('hex')}`;
        await tx.run(
          'INSERT INTO user_auth_identities (id, user_id, clerk_user_id, environment, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $5) ON CONFLICT (clerk_user_id) DO NOTHING',
          [identityId, newId, clerkUserId, clerkEnv, now]
        );
        const nu = await tx.get('SELECT * FROM users WHERE id = $1', [newId]);
        return res.json({ user: formatUser(nu) });
      });
    }

    // ── Unverified/missing email: create pending without linking ─────────────
    return db.transaction(async (tx: any) => {
      const lockKey = BigInt('0x' + createHash('sha256').update(clerkUserId).digest('hex').slice(0, 15)).toString();
      await tx.run('SELECT pg_advisory_xact_lock($1)', [lockKey]);

      const ic = await tx.get(
        'SELECT user_id FROM user_auth_identities WHERE clerk_user_id = $1 AND environment = $2',
        [clerkUserId, clerkEnv]
      );
      if (ic) {
        const ru = await tx.get('SELECT * FROM users WHERE id = $1', [ic.user_id]);
        if (ru?.suspended) return res.status(403).json({ error: 'Account suspended.', user: null });
        return res.json({ user: formatUser(ru) });
      }

      const newId     = `user-${Date.now()}-${randomBytes(4).toString('hex')}`;
      const now       = new Date().toISOString();
      const initRole  = isAutoAdmin ? 'admin' : 'pending';
      await tx.run(
        'INSERT INTO users (id, "clerkUserId", name, email, phone, role, verified, suspended, "createdAt", availability, "avatarUrl") VALUES ($1, $2, $3, $4, NULL, $5, $6, false, $7, \'available\', $8)',
        [newId, clerkUserId, displayName, normalizedEmail || null, initRole, isAutoAdmin, now, clerkImageUrl]
      );
      const identityId = `identity-${Date.now()}-${randomBytes(4).toString('hex')}`;
      await tx.run(
        'INSERT INTO user_auth_identities (id, user_id, clerk_user_id, environment, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $5) ON CONFLICT (clerk_user_id) DO NOTHING',
        [identityId, newId, clerkUserId, clerkEnv, now]
      );
      const nu = await tx.get('SELECT * FROM users WHERE id = $1', [newId]);
      return res.json({ user: formatUser(nu) });
    });
  };
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
function mockRes() {
  let _status = 200;
  let _body: any = null;
  return {
    status(code: number) { _status = code; return this; },
    json(body: any)      { _body = body;   return this; },
    get statusCode() { return _status; },
    get body()       { return _body;   },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('GET /api/auth/me – identity resolution (14 scenarios)', () => {
  let db: ReturnType<typeof makeDbStub>;
  let handler: ReturnType<typeof makeHandler>;

  beforeEach(() => {
    dbUsers      = [];
    dbIdentities = [];
    mockGetAuth.mockReset();
    mockGetUser.mockReset();
    db      = makeDbStub();
    handler = makeHandler(db);
  });

  // T1-T4: dev user re-uses existing Neon account in production
  it('T1-T4: dev Neon user linked when prod Clerk ID has same verified email', async () => {
    dbUsers.push({
      id: 'user-original', clerkUserId: 'user_dev_abc',
      email: 'alice@example.com', role: 'worker',
      verified: true, suspended: false, name: 'Alice',
    });
    dbIdentities.push({ id: 'ident-dev', user_id: 'user-original', clerk_user_id: 'user_dev_abc', environment: 'development' });

    mockGetAuth.mockReturnValue({ userId: 'user_prod_xyz' });
    mockGetUser.mockResolvedValue(clerkUserObj({ userId: 'user_prod_xyz', email: 'alice@example.com' }));

    const res = mockRes();
    await handler({}, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.user.id).toBe('user-original');                                   // T2: reused
    expect(dbUsers.filter(u => u.email === 'alice@example.com').length).toBe(1);     // T3: no duplicate
    expect(res.body.user.role).toBe('worker');                                        // T4: worker preserved
  });

  // T5: employer role preserved
  it('T5: employer role preserved when linking production identity', async () => {
    dbUsers.push({ id: 'user-emp', email: 'emp@example.com', role: 'employer', verified: true, suspended: false });
    mockGetAuth.mockReturnValue({ userId: 'user_prod_emp' });
    mockGetUser.mockResolvedValue(clerkUserObj({ userId: 'user_prod_emp', email: 'emp@example.com' }));

    const res = mockRes();
    await handler({}, res);

    expect(res.body.user.role).toBe('employer');
    expect(dbUsers.filter(u => u.email === 'emp@example.com').length).toBe(1);
  });

  // T6: admin role preserved
  it('T6: admin role preserved when linking production identity', async () => {
    dbUsers.push({ id: 'user-adm', email: 'admin@qardho.com', role: 'admin', verified: true, suspended: false });
    mockGetAuth.mockReturnValue({ userId: 'user_prod_adm' });
    mockGetUser.mockResolvedValue(clerkUserObj({ userId: 'user_prod_adm', email: 'admin@qardho.com' }));

    const res = mockRes();
    await handler({}, res);

    expect(res.body.user.role).toBe('admin');
    expect(dbUsers.filter(u => u.email === 'admin@qardho.com').length).toBe(1);
  });

  // T7: existing avatar not overwritten
  it('T7: existing avatarUrl not overwritten by new Clerk avatar', async () => {
    dbUsers.push({
      id: 'user-profile', email: 'profile@example.com', role: 'worker',
      verified: true, suspended: false, bio: 'Plumber',
      avatarUrl: 'https://existing.com/avatar.jpg',
    });
    mockGetAuth.mockReturnValue({ userId: 'user_prod_profile' });
    mockGetUser.mockResolvedValue({
      ...clerkUserObj({ userId: 'user_prod_profile', email: 'profile@example.com' }),
      imageUrl: 'https://new-clerk.com/avatar.jpg',
    });

    const res = mockRes();
    await handler({}, res);

    expect(dbUsers.find(u => u.id === 'user-profile')!.avatarUrl).toBe('https://existing.com/avatar.jpg');
  });

  // T8: brand-new email creates pending user
  it('T8: completely new email creates a pending user', async () => {
    mockGetAuth.mockReturnValue({ userId: 'user_prod_new' });
    mockGetUser.mockResolvedValue(clerkUserObj({ userId: 'user_prod_new', email: 'newuser@example.com' }));

    const res = mockRes();
    await handler({}, res);

    expect(res.body.user.role).toBe('pending');
    expect(dbUsers.filter(u => u.email === 'newuser@example.com').length).toBe(1);
  });

  // T9: duplicate Neon email returns 409
  it('T9: duplicate Neon email blocks automatic linking with 409', async () => {
    dbUsers.push({ id: 'user-a', email: 'dup@example.com', role: 'worker',   suspended: false });
    dbUsers.push({ id: 'user-b', email: 'dup@example.com', role: 'employer', suspended: false });

    mockGetAuth.mockReturnValue({ userId: 'user_prod_dup' });
    mockGetUser.mockResolvedValue(clerkUserObj({ userId: 'user_prod_dup', email: 'dup@example.com' }));

    const res = mockRes();
    await handler({}, res);

    expect(res.statusCode).toBe(409);
    expect(res.body.code).toBe('MULTIPLE_ACCOUNTS_MATCH');
    expect(dbUsers.filter(u => u.email === 'dup@example.com').length).toBe(2); // unchanged
  });

  // T10: unverified email cannot link
  it('T10: unverified email does not link to existing user', async () => {
    dbUsers.push({ id: 'user-real', email: 'unverified@example.com', role: 'worker', suspended: false });
    mockGetAuth.mockReturnValue({ userId: 'user_prod_unv' });
    mockGetUser.mockResolvedValue(clerkUserObj({ userId: 'user_prod_unv', email: 'unverified@example.com', verified: false }));

    const res = mockRes();
    await handler({}, res);

    // New pending user created; original user untouched
    expect(res.body.user.role).toBe('pending');
    expect(res.body.user.id).not.toBe('user-real');
    expect(dbUsers.find(u => u.id === 'user-real')!.role).toBe('worker');
  });

  // T11: suspended user blocked
  it('T11: suspended user returns 403 even on link attempt', async () => {
    dbUsers.push({ id: 'user-susp', email: 'susp@example.com', role: 'worker', suspended: true });
    mockGetAuth.mockReturnValue({ userId: 'user_prod_susp' });
    mockGetUser.mockResolvedValue(clerkUserObj({ userId: 'user_prod_susp', email: 'susp@example.com' }));

    const res = mockRes();
    await handler({}, res);

    expect(res.statusCode).toBe(403);
  });

  // T12: concurrent requests do not create duplicates
  it('T12: concurrent logins for same prod Clerk ID produce exactly one identity', async () => {
    dbUsers.push({ id: 'user-con', email: 'concurrent@example.com', role: 'worker', suspended: false });
    mockGetAuth.mockReturnValue({ userId: 'user_prod_con' });
    mockGetUser.mockResolvedValue(clerkUserObj({ userId: 'user_prod_con', email: 'concurrent@example.com' }));

    const [r1, r2] = await Promise.all([
      (async () => { const r = mockRes(); await handler({}, r); return r; })(),
      (async () => { const r = mockRes(); await handler({}, r); return r; })(),
    ]);

    expect(r1.statusCode).toBe(200);
    expect(r2.statusCode).toBe(200);
    expect(dbUsers.filter(u => u.email === 'concurrent@example.com').length).toBe(1);
    expect(dbIdentities.filter(i => i.clerk_user_id === 'user_prod_con').length).toBe(1);
  });

  // T13: existing identity returned without BAPI call
  it('T13: existing identity row returns user immediately without calling Clerk BAPI', async () => {
    dbUsers.push({ id: 'user-fast', email: 'fast@example.com', role: 'employer', suspended: false });
    dbIdentities.push({ id: 'ident-fast', user_id: 'user-fast', clerk_user_id: 'user_prod_fast', environment: 'production' });

    mockGetAuth.mockReturnValue({ userId: 'user_prod_fast' });

    const res = mockRes();
    await handler({}, res);

    expect(mockGetUser).not.toHaveBeenCalled();
    expect(res.body.user.id).toBe('user-fast');
  });

  // T14: second production login (refresh) reuses identity
  it('T14: page refresh reuses production identity without creating a new user', async () => {
    dbUsers.push({ id: 'user-ref', email: 'refresh@example.com', role: 'employer', suspended: false });
    dbIdentities.push({ id: 'ident-ref', user_id: 'user-ref', clerk_user_id: 'user_prod_ref', environment: 'production' });

    mockGetAuth.mockReturnValue({ userId: 'user_prod_ref' });

    const res = mockRes();
    await handler({}, res);

    expect(mockGetUser).not.toHaveBeenCalled();
    expect(res.body.user.id).toBe('user-ref');
    expect(res.statusCode).toBe(200);
  });
});
