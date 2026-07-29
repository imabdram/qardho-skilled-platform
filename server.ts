import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { Pool } from 'pg';
import sharp from 'sharp';
import { clerkMiddleware, getAuth, clerkClient } from '@clerk/express';
import { isProfileFieldKey } from './src/validation';

declare global {
  namespace Express {
    interface Request {
      authUser?: any;
    }
  }
}

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEMO_PASSWORD = 'demo1234';

const DEMO_EMPLOYER = {
  id: 'employer-1',
  name: 'Qardho Agricultural Co.',
  email: 'employer1@qardho.com',
  phone: '+252 90 700 1122',
  role: 'employer',
  skill: null,
  location: 'Kaambo',
  bio: 'Local farming collective focusing on water-efficient agricultural systems in Karkaar.',
  rate: null,
  availability: 'available',
  verified: false
};

const DEMO_ADMIN = {
  id: 'admin-1',
  name: 'Platform Admin',
  email: 'admin@qardho.com',
  phone: '+252 90 700 1100',
  role: 'admin',
  skill: null,
  location: 'Kaambo',
  bio: 'Seeded platform administrator for moderation and support.',
  rate: null,
  availability: 'available',
  verified: true
};

function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash?: string | null) {
  if (!storedHash) return false;

  const [method, salt, hash] = storedHash.split(':');
  if (method !== 'scrypt' || !salt || !hash) return false;

  const actual = Buffer.from(hash, 'hex');
  const expected = scryptSync(password, salt, actual.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
const parseCookies = (header = '') => Object.fromEntries(header.split(';').map((part) => part.trim()).filter(Boolean).map((part) => {
  const separator = part.indexOf('=');
  return [decodeURIComponent(part.slice(0, separator)), decodeURIComponent(part.slice(separator + 1))];
}));

function sanitizeUser(user: any) {
  if (!user) return user;
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

function normalizePostgresUrl(databaseUrl: string) {
  try {
    const url = new URL(databaseUrl);
    const sslMode = url.searchParams.get('sslmode');

    if (sslMode && ['prefer', 'require', 'verify-ca'].includes(sslMode)) {
      url.searchParams.set('sslmode', 'verify-full');
    }

    return url.toString();
  } catch {
    return databaseUrl;
  }
}

function createPostgresDb(databaseUrl: string) {
  const normalizedDatabaseUrl = normalizePostgresUrl(databaseUrl);
  const pool = new Pool({
    connectionString: normalizedDatabaseUrl,
    connectionTimeoutMillis: 5000,
    query_timeout: 10000,
  });
  const isPreConnectionReset = (error: any) =>
    error?.code === 'ECONNRESET' ||
    String(error?.message || '').includes('ECONNRESET') ||
    String(error?.message || '').includes('before secure TLS connection was established');
  const queryWithRetry = async (sql: string, params: any[] = []) => {
    try {
      return await pool.query(sql, params);
    } catch (error) {
      if (!isPreConnectionReset(error)) throw error;
      await new Promise((resolve) => setTimeout(resolve, 250));
      return pool.query(sql, params);
    }
  };
  const connectWithRetry = async () => {
    try {
      return await pool.connect();
    } catch (error) {
      if (!isPreConnectionReset(error)) throw error;
      await new Promise((resolve) => setTimeout(resolve, 250));
      return pool.connect();
    }
  };

  return {
    async exec(sql: string) {
      await queryWithRetry(sql);
    },
    async run(sql: string, params: any[] = []) {
      return queryWithRetry(sql, params);
    },
    async get(sql: string, params: any[] = []) {
      const result = await queryWithRetry(sql, params);
      return result.rows[0];
    },
    async all(sql: string, params: any[] = []) {
      const result = await queryWithRetry(sql, params);
      return result.rows;
    },
    async transaction<T>(work: (tx: any) => Promise<T>) {
      const client = await connectWithRetry();
      const tx = {
        run: (sql: string, params: any[] = []) => client.query(sql, params),
        get: async (sql: string, params: any[] = []) => (await client.query(sql, params)).rows[0],
        all: async (sql: string, params: any[] = []) => (await client.query(sql, params)).rows,
      };
      try {
        await client.query('BEGIN');
        const result = await work(tx);
        await client.query('COMMIT');
        return result;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    },
  };
}

async function ensureDemoCredentials(db: any) {
  const createdAt = new Date().toISOString();
  const demoPasswordHash = hashPassword(DEMO_PASSWORD);

  await db.run(
    `INSERT INTO users (
      id, name, email, phone, role, skill, location, bio, rate, "createdAt", "smsNotificationsEnabled", "passwordHash", availability, verified
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, false, $11, $12, $13)
    ON CONFLICT (id) DO NOTHING`,
    [
      DEMO_EMPLOYER.id,
      DEMO_EMPLOYER.name,
      DEMO_EMPLOYER.email,
      DEMO_EMPLOYER.phone,
      DEMO_EMPLOYER.role,
      DEMO_EMPLOYER.skill,
      DEMO_EMPLOYER.location,
      DEMO_EMPLOYER.bio,
      DEMO_EMPLOYER.rate,
      createdAt,
      demoPasswordHash,
      DEMO_EMPLOYER.availability,
      DEMO_EMPLOYER.verified
    ]
  );

  await db.run(
    `INSERT INTO users (
      id, name, email, phone, role, skill, location, bio, rate, "createdAt", "smsNotificationsEnabled", "passwordHash", availability, verified
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, false, $11, $12, $13)
    ON CONFLICT (id) DO NOTHING`,
    [
      DEMO_ADMIN.id,
      DEMO_ADMIN.name,
      DEMO_ADMIN.email,
      DEMO_ADMIN.phone,
      DEMO_ADMIN.role,
      DEMO_ADMIN.skill,
      DEMO_ADMIN.location,
      DEMO_ADMIN.bio,
      DEMO_ADMIN.rate,
      createdAt,
      demoPasswordHash,
      DEMO_ADMIN.availability,
      DEMO_ADMIN.verified
    ]
  );

  await db.run(
    `UPDATE users
      SET "passwordHash" = $1
      WHERE id IN ('worker-1', 'employer-1', 'admin-1')`,
    [demoPasswordHash]
  );
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '7mb' }));

  const PORT = Number(process.env.PORT || 3000);
  const isProduction = process.env.NODE_ENV === 'production' || path.basename(__dirname) === 'dist';
  const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
  await mkdir(uploadDir, { recursive: true });
  app.use('/uploads', express.static(uploadDir, { maxAge: isProduction ? '30d' : 0, immutable: isProduction }));

  if (isProduction && !process.env.CLERK_SECRET_KEY) {
    throw new Error('CLERK_SECRET_KEY environment variable is required in production.');
  }

  const allowedOrigins = [
    'https://suuqaxirfadaha.app',
    'https://www.suuqaxirfadaha.app',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    process.env.APP_URL
  ].filter(Boolean);

  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required. Set it to your Neon PostgreSQL connection string.');
  }

  const db = createPostgresDb(process.env.DATABASE_URL);

  // Create tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT NOT NULL,
      role TEXT,
      bio TEXT,
      rate TEXT,
      "createdAt" TEXT,
      "smsNotificationsEnabled" BOOLEAN DEFAULT false,
      "passwordHash" TEXT,
      availability TEXT DEFAULT 'available',
      verified BOOLEAN DEFAULT false
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      "employerId" TEXT NOT NULL,
      "employerName" TEXT NOT NULL,
      location TEXT NOT NULL,
      description TEXT NOT NULL,
      rate TEXT NOT NULL,
      phone TEXT NOT NULL,
      "assignedWorkerId" TEXT,
      "assignedWorkerName" TEXT,
      "completionRequestedAt" TEXT,
      "workerCompletedAt" TEXT,
      status TEXT NOT NULL DEFAULT 'open',
      "createdAt" TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS connections (
      id TEXT PRIMARY KEY,
      "fromUserId" TEXT NOT NULL,
      "fromUserName" TEXT NOT NULL,
      "toUserId" TEXT NOT NULL,
      "toUserName" TEXT NOT NULL,
      status TEXT NOT NULL,
      message TEXT,
      phone TEXT,
      "createdAt" TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      "jobId" TEXT NOT NULL,
      "jobTitle" TEXT NOT NULL,
      "employerId" TEXT NOT NULL,
      "applicantId" TEXT NOT NULL,
      "applicantName" TEXT NOT NULL,
      "applicantSkill" TEXT NOT NULL,
      message TEXT NOT NULL,
      phone TEXT NOT NULL,
      location TEXT NOT NULL,
      status TEXT NOT NULL,
      "createdAt" TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      "workerId" TEXT NOT NULL,
      "employerId" TEXT NOT NULL,
      "employerName" TEXT NOT NULL,
      "jobId" TEXT,
      "jobTitle" TEXT,
      rating INTEGER NOT NULL,
      comment TEXT NOT NULL,
      "createdAt" TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS verification_messages (
      "userId" TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      "adminId" TEXT NOT NULL,
      "adminName" TEXT NOT NULL,
      "missingFields" JSONB NOT NULL DEFAULT '[]'::jsonb,
      note TEXT,
      "sentAt" TEXT NOT NULL,
      "readAt" TEXT
    );
    CREATE TABLE IF NOT EXISTS sessions (
      "tokenHash" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      "createdAt" TEXT NOT NULL,
      "expiresAt" TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      "tokenHash" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      "createdAt" TEXT NOT NULL,
      "expiresAt" TEXT NOT NULL,
      "usedAt" TEXT
    );
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      href TEXT,
      "readAt" TEXT,
      "createdAt" TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS completion_events (
      id TEXT PRIMARY KEY,
      "jobId" TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      "actorId" TEXT NOT NULL,
      action TEXT NOT NULL,
      note TEXT,
      "createdAt" TEXT NOT NULL
    );
  `);

  await db.exec(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS "clerkUserId" TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS "passwordHash" TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS availability TEXT DEFAULT 'available';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended BOOLEAN DEFAULT false;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS "whatsappPhone" TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS gender TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS "pricingType" TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS "pricingAmount" NUMERIC;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS "pricingCurrency" TEXT DEFAULT 'USD';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS "pricingNote" TEXT;
    ALTER TABLE users ALTER COLUMN phone DROP NOT NULL;
    ALTER TABLE jobs ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'open';
    ALTER TABLE jobs ADD COLUMN IF NOT EXISTS "assignedWorkerId" TEXT;
    ALTER TABLE jobs ADD COLUMN IF NOT EXISTS "assignedWorkerName" TEXT;
    ALTER TABLE jobs ADD COLUMN IF NOT EXISTS "completionRequestedAt" TEXT;
    ALTER TABLE jobs ADD COLUMN IF NOT EXISTS "workerCompletedAt" TEXT;
    ALTER TABLE jobs ADD COLUMN IF NOT EXISTS requirements TEXT;
    ALTER TABLE jobs ADD COLUMN IF NOT EXISTS category TEXT;
    ALTER TABLE jobs ADD COLUMN IF NOT EXISTS "workType" TEXT;
    ALTER TABLE jobs ADD COLUMN IF NOT EXISTS "expectedDuration" TEXT;
    ALTER TABLE jobs ADD COLUMN IF NOT EXISTS "pricingType" TEXT;
    ALTER TABLE jobs ADD COLUMN IF NOT EXISTS "pricingAmount" NUMERIC;
    ALTER TABLE jobs ADD COLUMN IF NOT EXISTS "pricingCurrency" TEXT DEFAULT 'USD';
    ALTER TABLE jobs ADD COLUMN IF NOT EXISTS "pricingNote" TEXT;
    ALTER TABLE jobs ADD COLUMN IF NOT EXISTS "completionRequestedBy" TEXT;
    ALTER TABLE jobs ADD COLUMN IF NOT EXISTS "completionRequestedRole" TEXT;
    ALTER TABLE jobs ADD COLUMN IF NOT EXISTS "completionConfirmedBy" TEXT;
    ALTER TABLE jobs ADD COLUMN IF NOT EXISTS "completionConfirmedAt" TEXT;
    ALTER TABLE jobs ADD COLUMN IF NOT EXISTS "completionDisputedBy" TEXT;
    ALTER TABLE jobs ADD COLUMN IF NOT EXISTS "completionDisputedAt" TEXT;
    ALTER TABLE connections ADD COLUMN IF NOT EXISTS "jobId" TEXT;
    ALTER TABLE connections ADD COLUMN IF NOT EXISTS "jobTitle" TEXT;
    ALTER TABLE connections ADD COLUMN IF NOT EXISTS "expectedTimeline" TEXT;
    ALTER TABLE applications ADD COLUMN IF NOT EXISTS "proposedPricingType" TEXT;
    ALTER TABLE applications ADD COLUMN IF NOT EXISTS "proposedAmount" NUMERIC;
    ALTER TABLE applications ADD COLUMN IF NOT EXISTS "proposedCurrency" TEXT DEFAULT 'USD';
    ALTER TABLE applications ADD COLUMN IF NOT EXISTS "proposedNote" TEXT;
    ALTER TABLE applications ADD COLUMN IF NOT EXISTS "expectedTimeline" TEXT;
    ALTER TABLE reviews ADD COLUMN IF NOT EXISTS "jobId" TEXT;
    ALTER TABLE reviews ADD COLUMN IF NOT EXISTS "jobTitle" TEXT;
    ALTER TABLE reviews ADD COLUMN IF NOT EXISTS "workerName" TEXT;
    ALTER TABLE reviews ADD COLUMN IF NOT EXISTS "reviewerRole" TEXT DEFAULT 'employer';
    ALTER TABLE reviews ADD COLUMN IF NOT EXISTS "revieweeRole" TEXT DEFAULT 'worker';
    ALTER TABLE reviews ADD COLUMN IF NOT EXISTS "communicationRating" INTEGER;
    ALTER TABLE reviews ADD COLUMN IF NOT EXISTS "fairnessRating" INTEGER;
    ALTER TABLE reviews ADD COLUMN IF NOT EXISTS "paymentReliabilityRating" INTEGER;
    ALTER TABLE reviews ADD COLUMN IF NOT EXISTS "jobAccuracyRating" INTEGER;
    ALTER TABLE users ALTER COLUMN phone DROP NOT NULL;
  `);
  await db.exec(`
    CREATE TABLE IF NOT EXISTS user_auth_identities (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      clerk_user_id TEXT NOT NULL UNIQUE,
      environment TEXT NOT NULL CHECK (environment IN ('development', 'production')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP::text,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP::text,
      CONSTRAINT uai_user_env_unique UNIQUE (user_id, environment)
    );
    CREATE INDEX IF NOT EXISTS idx_uai_clerk_user_id ON user_auth_identities(clerk_user_id);
    CREATE INDEX IF NOT EXISTS idx_uai_user_id ON user_auth_identities(user_id);
    CREATE INDEX IF NOT EXISTS idx_uai_environment ON user_auth_identities(environment);
    CREATE INDEX IF NOT EXISTS idx_uai_user_id_environment ON user_auth_identities(user_id, environment);

    INSERT INTO user_auth_identities (id, user_id, clerk_user_id, environment, created_at, updated_at)
    SELECT 
      'identity-' || id,
      id,
      "clerkUserId",
      'development',
      COALESCE("createdAt", CURRENT_TIMESTAMP::text),
      CURRENT_TIMESTAMP::text
    FROM users
    WHERE "clerkUserId" IS NOT NULL AND TRIM("clerkUserId") != ''
    ON CONFLICT (clerk_user_id) DO NOTHING;
  `);

  await db.run("UPDATE jobs SET status = 'open' WHERE status IS NULL OR status = ''");
  await db.run(`
    UPDATE jobs j
      SET "assignedWorkerId" = a."applicantId",
          "assignedWorkerName" = a."applicantName"
      FROM applications a
      WHERE a."jobId" = j.id
        AND a.status = 'accepted'
        AND (j."assignedWorkerId" IS NULL OR j."assignedWorkerId" = '')
  `);

  await db.run("UPDATE users SET availability = 'available' WHERE availability IS NULL OR availability = ''");
  const locationMappings = [
    ['Wadajir', 'Kaambo'],
    ['Horseed', 'Qoryacad'],
    ['Gashan', 'Xorgoble'],
    ['Bulsho', 'Xiingood'],
    ['Rafto', 'Xiddo'],
  ];
  await Promise.all(locationMappings.map(async ([oldLocation, newLocation]) => {
    await db.run('UPDATE users SET location = $1 WHERE location = $2', [newLocation, oldLocation]);
    await db.run('UPDATE jobs SET location = $1 WHERE location = $2', [newLocation, oldLocation]);
    await db.run('UPDATE applications SET location = $1 WHERE location = $2', [newLocation, oldLocation]);
  }));

  const formatUser = (user: any) => ({
    ...sanitizeUser(user),
    smsNotificationsEnabled: !!user.smsNotificationsEnabled,
    verified: !!user.verified,
    suspended: !!user.suspended,
  });
  const formatPublicUser = (user: any) => {
    const { phone, whatsappPhone, email, ...publicUser } = formatUser(user);
    return publicUser;
  };

  const formatVerificationMessage = (message: any) => message ? ({
    userId: message.userId,
    adminId: message.adminId,
    adminName: message.adminName,
    missingFields: Array.isArray(message.missingFields) ? message.missingFields.filter(isProfileFieldKey) : [],
    note: message.note || undefined,
    sentAt: message.sentAt,
    readAt: message.readAt || undefined,
  }) : null;
  const validRoles = ['worker', 'employer', 'admin', 'pending'];
  const validJobStatuses = ['open', 'active', 'completion_requested_by_worker', 'completion_requested_by_employer', 'completed', 'completion_disputed', 'cancelled', 'closed', 'in_progress'];
  const validRequestStatuses = ['accepted', 'declined'];
  const validAvailability = ['available', 'busy', 'unavailable'];
  const validPricingTypes = ['project', 'hour', 'day'];
  const validGenders = ['male', 'female', 'prefer_not_to_say'];
  const isBlank = (value: any) => typeof value !== 'string' || value.trim().length === 0;
  const cleanText = (value: any, maxLength = 5000) => typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, maxLength) : '';
  const validNonNegativeAmount = (value: any) => value === undefined || value === null || value === '' || (Number.isFinite(Number(value)) && Number(value) >= 0);
  const normalizePhone = (value: any) => {
    const normalized = String(value || '').replace(/[^\d+]/g, '');
    if (!normalized) return null;
    if (normalized.startsWith('+')) return /^\+\d{8,15}$/.test(normalized) ? normalized : null;
    if (normalized.startsWith('252')) return /^252\d{8,9}$/.test(normalized) ? `+${normalized}` : null;
    return /^\d{8,15}$/.test(normalized) ? `+${normalized}` : null;
  };
  const normalizeSomaliPhone = (value: any) => {
    if (typeof value !== 'string' && typeof value !== 'number') return null;
    let digits = String(value || '').replace(/\D/g, '');
    if (!digits) return null;
    while (digits.startsWith('252') && digits.length > 9) {
      digits = digits.slice(3);
    }
    if (digits.startsWith('0')) {
      digits = digits.slice(1);
    }
    return /^\d{8,9}$/.test(digits) ? `+252${digits}` : null;
  };
  const getUserById = async (id: string) => db.get('SELECT * FROM users WHERE id = $1', [id]);
  const createSession = async (res: any, userId: string) => {
    const token = randomBytes(32).toString('base64url');
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + 1000 * 60 * 60 * 24 * 14);
    await db.run('INSERT INTO sessions ("tokenHash", "userId", "createdAt", "expiresAt") VALUES ($1, $2, $3, $4)', [hashToken(token), userId, createdAt.toISOString(), expiresAt.toISOString()]);
    res.setHeader('Set-Cookie', `qardho_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=1209600${isProduction ? '; Secure' : ''}`);
  };
  const clearSession = async (req: any, res: any) => {
    const token = parseCookies(req.headers.cookie || '').qardho_session;
    if (token) await db.run('DELETE FROM sessions WHERE "tokenHash" = $1', [hashToken(token)]);
    res.setHeader('Set-Cookie', `qardho_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${isProduction ? '; Secure' : ''}`);
  };
  app.use(clerkMiddleware());

  const requireClerkAuth = (req: any, res: any, next: any) => {
    const auth = getAuth(req);
    if (!auth?.userId) {
      return res.status(401).json({ error: 'Please sign in to continue.', code: 'AUTH_REQUIRED' });
    }
    next();
  };

  const getClerkEnvironment = () => {
    const env = (process.env.CLERK_ENVIRONMENT || 'development').toLowerCase().trim();
    if (env !== 'development' && env !== 'production') {
      throw new Error('Invalid CLERK_ENVIRONMENT configuration. Must be development or production.');
    }
    return env as 'development' | 'production';
  };

  const loadPlatformUser = async (req: any, res: any, next: any) => {
    try {
      let clerkEnv: 'development' | 'production';
      try {
        clerkEnv = getClerkEnvironment();
      } catch (err: any) {
        return res.status(400).json({ error: err.message, code: 'INVALID_CLERK_ENVIRONMENT' });
      }

      const auth = getAuth(req);
      if (!auth?.userId) {
        return res.status(401).json({ error: 'Please sign in to continue.', code: 'AUTH_REQUIRED' });
      }

      let platformUser = await db.get(
        `SELECT u.* FROM users u
         JOIN user_auth_identities uai ON u.id = uai.user_id
         WHERE uai.clerk_user_id = $1 AND uai.environment = $2`,
        [auth.userId, clerkEnv]
      );

      if (!platformUser) {
        platformUser = await db.get('SELECT * FROM users WHERE "clerkUserId" = $1', [auth.userId]);
      }

      if (!platformUser) {
        return res.status(401).json({ error: 'Platform profile not synchronized.', code: 'PROFILE_NOT_SYNCED' });
      }
      if (platformUser.suspended) {
        return res.status(403).json({ error: 'This account is currently suspended.', code: 'ACCOUNT_SUSPENDED' });
      }

      req.authUser = platformUser;
      next();
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  const optionalPlatformUser = async (req: any, res: any, next: any) => {
    try {
      const auth = getAuth(req);
      if (auth?.userId) {
        let clerkEnv = 'development';
        try { clerkEnv = getClerkEnvironment(); } catch {}

        let platformUser = await db.get(
          `SELECT u.* FROM users u
           JOIN user_auth_identities uai ON u.id = uai.user_id
           WHERE uai.clerk_user_id = $1 AND uai.environment = $2`,
          [auth.userId, clerkEnv]
        );

        if (!platformUser) {
          platformUser = await db.get('SELECT * FROM users WHERE "clerkUserId" = $1', [auth.userId]);
        }

        if (platformUser && !platformUser.suspended) {
          req.authUser = platformUser;
        }
      }
    } catch (err: any) {
      console.error('optionalPlatformUser error', err);
    } finally {
      next();
    }
  };
  
  app.use(optionalPlatformUser);

  const requirePlatformRole = (...roles: string[]) => [
    requireClerkAuth,
    loadPlatformUser,
    (req: any, res: any, next: any) => {
      if (!roles.includes(req.authUser.role)) {
        return res.status(403).json({ error: 'You do not have permission to perform this action.', code: 'FORBIDDEN_ROLE' });
      }
      next();
    }
  ];

  const authenticated = (req: any, res: any) => {
    if (!req.authUser || req.authUser.suspended) {
      res.status(401).json({ error: 'Please sign in to continue.' });
      return null;
    }
    return req.authUser;
  };
  const requireRole = (...roles: string[]) => requirePlatformRole(...roles);
  // Active Server-Sent Events (SSE) connections per user
  const activeSseClients = new Map<string, Set<any>>();

  const broadcastNotificationToUser = (userId: string, notification: any, extraPayload?: any) => {
    const clients = activeSseClients.get(userId);
    if (clients && clients.size > 0) {
      const data = JSON.stringify({
        type: 'notification',
        notification,
        extraPayload,
        timestamp: new Date().toISOString(),
      });
      for (const clientRes of Array.from(clients)) {
        try {
          clientRes.write(`data: ${data}\n\n`);
        } catch {
          // ignore broken pipe / socket write error
        }
      }
    }
  };

  const addNotification = async (userId: string, type: string, title: string, message: string, href?: string, extraPayload?: any) => {
    const notificationId = `notice-${Date.now()}-${randomBytes(4).toString('hex')}`;
    const createdAt = new Date().toISOString();
    await db.run(
      'INSERT INTO notifications (id, "userId", type, title, message, href, "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [notificationId, userId, type, title, message, href || null, createdAt]
    );

    const notificationObj = {
      id: notificationId,
      userId,
      type,
      title,
      message,
      href: href || null,
      createdAt,
      readAt: null,
    };

    broadcastNotificationToUser(userId, notificationObj, extraPayload);
    return notificationObj;
  };
  const deleteUserCascade = async (userId: string, runner = db) => {
    await runner.run('DELETE FROM reviews WHERE "workerId" = $1 OR "employerId" = $1', [userId]);
    await runner.run('DELETE FROM applications WHERE "applicantId" = $1 OR "employerId" = $1', [userId]);
    await runner.run('DELETE FROM connections WHERE "fromUserId" = $1 OR "toUserId" = $1', [userId]);
    await runner.run('UPDATE jobs SET "assignedWorkerId" = NULL, "assignedWorkerName" = NULL WHERE "assignedWorkerId" = $1', [userId]);
    await runner.run('DELETE FROM jobs WHERE "employerId" = $1', [userId]);
    await runner.run('DELETE FROM verification_messages WHERE "userId" = $1', [userId]);
    await runner.run('DELETE FROM users WHERE id = $1', [userId]);
  };
  const adminOnly = async (req: any, res: any) => {
    const actor = req.authUser?.role === 'admin' ? req.authUser : null;
    if (!actor) {
      res.status(403).json({ error: 'Admin access required.' });
      return null;
    }
    return actor;
  };


  // Seed data if empty
  const usersCount = await db.get('SELECT COUNT(*) as count FROM users');
  if (Number(usersCount.count) === 0) {
    console.log('Seeding initial database with sample workers, jobs, connections, reviews...');
    
    // Sample Workers
    const SAMPLE_WORKERS = [
      {
        id: 'worker-1',
        name: 'Ahmed Mohamed Ali',
        email: 'ahmed.mohamed@example.com',
        phone: '+252 90 779 1234',
        role: 'worker',
        skill: 'Solar Technician',
        location: 'Kaambo',
        bio: 'Certified solar energy installer with over 5 years of experience in installing household panels and system repairs around Qardho.',
        rate: '$20 / day',
        availability: 'available',
        verified: 1,
        createdAt: new Date().toISOString()
      },
      {
        id: 'worker-2',
        name: 'Halima Farah Gure',
        email: 'halima.farah@example.com',
        phone: '+252 90 655 4321',
        role: 'worker',
        skill: 'Professional Tailor',
        location: 'Qoryacad',
        bio: 'Expert tailor specializing in traditional Somali garments, school uniforms, and custom embroidery. Fast turnaround and reliable quality.',
        rate: '$15 / day',
        availability: 'busy',
        verified: 1,
        createdAt: new Date().toISOString()
      },
      {
        id: 'worker-3',
        name: 'Yusuf Barre Omar',
        email: 'yusuf.barre@example.com',
        phone: '+252 90 711 9988',
        role: 'worker',
        skill: 'Mason & Builder',
        location: 'Xorgoble',
        bio: 'Experienced construction mason specializing in blockwork, plastering, and water reservoir/berked construction for homes and agricultural land.',
        rate: '$25 / day',
        availability: 'available',
        verified: 1,
        createdAt: new Date().toISOString()
      },
      {
        id: 'worker-4',
        name: 'Fartun Said Jama',
        email: 'fartun.said@example.com',
        phone: '+252 90 782 5566',
        role: 'worker',
        skill: 'Primary School Teacher',
        location: 'Xiingood',
        bio: 'Dedicated primary school teacher specializing in Mathematics and Somali literature tutoring. Passionate about helping children succeed.',
        rate: '$12 / day',
        availability: 'available',
        verified: 0,
        createdAt: new Date().toISOString()
      },
      {
        id: 'worker-5',
        name: 'Jama Duale Abdi',
        email: 'jama.duale@example.com',
        phone: '+252 90 733 4455',
        role: 'worker',
        skill: 'Plumber & Pipefitter',
        location: 'Xiddo',
        bio: 'Reliable plumber with expertise in household piping, solar water heating systems, and water pumps installation.',
        rate: '$18 / day',
        availability: 'unavailable',
        verified: 1,
        createdAt: new Date().toISOString()
      },
      {
        ...DEMO_EMPLOYER,
        createdAt: new Date().toISOString()
      }
    ];

    for (const w of SAMPLE_WORKERS) {
      await db.run(
        'INSERT INTO users (id, name, email, phone, role, skill, location, bio, rate, "createdAt", "smsNotificationsEnabled", "passwordHash", availability, verified, suspended) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, false, $11, $12, $13, false)',
        [
          w.id,
          w.name,
          w.email,
          w.phone,
          w.role,
          w.skill,
          w.location,
          w.bio,
          w.rate,
          w.createdAt,
          w.id === 'worker-1' || w.id === 'employer-1' ? hashPassword(DEMO_PASSWORD) : null,
          w.availability || 'available',
          Boolean(w.verified)
        ]
      );
    }

    // Sample Jobs
    const SAMPLE_JOBS = [
      {
        id: 'job-1',
        title: 'Solar Panel System Installer Needed',
        employerId: 'employer-1',
        employerName: 'Qardho Agricultural Co.',
        location: 'Kaambo',
        description: 'We are looking for an experienced Solar Technician to install a 5KW solar pump system for a local farm outside Qardho. Panels and equipment are provided on site.',
        rate: '$250 Total',
        phone: '+252 90 700 1122',
        status: 'open',
        createdAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 'job-2',
        title: 'Custom Uniform Tailoring',
        employerId: 'employer-2',
        employerName: 'Darul-Hikmah School',
        location: 'Qoryacad',
        description: 'Needs a professional tailor to sew 45 sets of student school uniforms. Material will be delivered to your workshop. Looking for high quality stitching.',
        rate: '$150 Total',
        phone: '+252 90 600 3344',
        status: 'in_progress',
        createdAt: new Date(Date.now() - 172800000).toISOString()
      },
      {
        id: 'job-3',
        title: 'Concrete Plastering Work for Berked',
        employerId: 'employer-3',
        employerName: 'Hassan Gure Farms',
        location: 'Xorgoble',
        description: 'Mason needed to complete plastering work on a newly built underground concrete water reservoir (berked) to ensure water-tight finish.',
        rate: '$30 / day',
        phone: '+252 90 790 9900',
        status: 'open',
        createdAt: new Date().toISOString()
      }
    ];

    for (const j of SAMPLE_JOBS) {
      await db.run(
        'INSERT INTO jobs (id, title, "employerId", "employerName", location, description, rate, phone, status, "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
        [j.id, j.title, j.employerId, j.employerName, j.location, j.description, j.rate, j.phone, j.status, j.createdAt]
      );
    }

    // Sample Connections
    const SAMPLE_CONNECTIONS = [
      {
        id: 'conn-1',
        fromUserId: 'employer-1',
        fromUserName: 'Qardho Agricultural Co.',
        toUserId: 'worker-1',
        toUserName: 'Ahmed Mohamed Ali',
        status: 'pending',
        message: 'Hello Ahmed, we saw your solar technician profile and would love to hire you for our farm solar water pump system setup. Let us talk on the phone!',
        phone: '+252 90 700 1122',
        createdAt: new Date().toISOString()
      },
      {
        id: 'conn-2',
        fromUserId: 'employer-2',
        fromUserName: 'Darul-Hikmah School',
        toUserId: 'worker-2',
        toUserName: 'Halima Farah Gure',
        status: 'accepted',
        message: 'Greetings Halima, we have 45 school uniforms that need customized tailoring. Please check this offer.',
        phone: '+252 90 600 3344',
        createdAt: new Date(Date.now() - 86400000).toISOString()
      }
    ];

    for (const c of SAMPLE_CONNECTIONS) {
      await db.run(
        'INSERT INTO connections (id, "fromUserId", "fromUserName", "toUserId", "toUserName", status, message, phone, "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [c.id, c.fromUserId, c.fromUserName, c.toUserId, c.toUserName, c.status, c.message, c.phone, c.createdAt]
      );
    }

    // Sample Applications
    const SAMPLE_APPLICATIONS = [
      {
        id: 'app-1',
        jobId: 'job-1',
        jobTitle: 'Solar Panel System Installer Needed',
        employerId: 'employer-1',
        applicantId: 'worker-1',
        applicantName: 'Ahmed Mohamed Ali',
        applicantSkill: 'Solar Technician',
        message: 'Hi, I am extremely interested in this project. I have installed three similar agricultural pump systems in the past year in Kaambo and Xorgoble.',
        phone: '+252 90 779 1234',
        location: 'Kaambo',
        status: 'pending',
        createdAt: new Date().toISOString()
      }
    ];

    for (const a of SAMPLE_APPLICATIONS) {
      await db.run(
        'INSERT INTO applications (id, "jobId", "jobTitle", "employerId", "applicantId", "applicantName", "applicantSkill", message, phone, location, status, "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)',
        [a.id, a.jobId, a.jobTitle, a.employerId, a.applicantId, a.applicantName, a.applicantSkill, a.message, a.phone, a.location, a.status, a.createdAt]
      );
    }

    // Sample Reviews
    const SAMPLE_REVIEWS = [
      {
        id: 'rev-1',
        workerId: 'worker-1',
        employerId: 'employer-1',
        employerName: 'Qardho Agricultural Co.',
        rating: 5,
        comment: 'Ahmed installed our solar-powered well pump system quickly and professionally. He had deep knowledge of solar arrays and troubleshooting. Highly recommended trade worker in Qardho!',
        createdAt: new Date(Date.now() - 5 * 86400000).toISOString()
      },
      {
        id: 'rev-2',
        workerId: 'worker-1',
        employerId: 'employer-3',
        employerName: 'Hassan Gure Farms',
        rating: 4,
        comment: 'Very polite and knowledgeable solar tech. Helped wire up our farmhouse backup batteries. Price was reasonable too.',
        createdAt: new Date(Date.now() - 10 * 86400000).toISOString()
      },
      {
        id: 'rev-3',
        workerId: 'worker-2',
        employerId: 'employer-2',
        employerName: 'Darul-Hikmah School',
        rating: 5,
        comment: 'Halima completed the student uniform stitching project way ahead of schedule. The stitch quality on the shirts and trousers is professional. Excellent communicator.',
        createdAt: new Date(Date.now() - 3 * 86400000).toISOString()
      }
    ];

    for (const r of SAMPLE_REVIEWS) {
      await db.run(
        'INSERT INTO reviews (id, "workerId", "employerId", "employerName", rating, comment, "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [r.id, r.workerId, r.employerId, r.employerName, r.rating, r.comment, r.createdAt]
      );
    }
  }

  if (!isProduction) {
    await ensureDemoCredentials(db);
  }

  // --- API Routes ---

  // Get all users
  app.get('/api/users', async (req, res) => {
    try {
      if (!await adminOnly(req, res)) return;
      const users = await db.all('SELECT * FROM users ORDER BY "createdAt" DESC');
      res.json(users.map(formatUser));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get all workers (users with role = 'worker')
  app.get('/api/workers', async (req, res) => {
    try {
      const workers = await db.all("SELECT * FROM users WHERE role = 'worker' AND COALESCE(suspended, false) = false");
      res.json(workers.map((worker: any) => req.authUser?.id === worker.id || req.authUser?.role === 'admin' ? formatUser(worker) : formatPublicUser(worker)));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get all jobs
  app.get('/api/jobs', async (req, res) => {
    try {
      const jobs = await db.all('SELECT * FROM jobs ORDER BY "createdAt" DESC');
      const employerIds = Array.from(new Set(jobs.map((j: any) => j.employerId))).filter(Boolean);
      const employers = employerIds.length > 0
        ? await db.all(`SELECT id, "avatarUrl" FROM users WHERE id IN (${employerIds.map((_, i) => `$${i + 1}`).join(',')})`, employerIds)
        : [];
      const avatarMap = new Map(employers.map((e: any) => [e.id, e.avatarUrl]));

      res.json(await Promise.all(jobs.map(async (job: any) => {
        const employerAvatarUrl = avatarMap.get(job.employerId) || undefined;
        const jobWithAvatar = { ...job, employerAvatarUrl };
        const authorized = req.authUser && (req.authUser.role === 'admin' || req.authUser.id === job.employerId || req.authUser.id === job.assignedWorkerId);
        if (authorized) return jobWithAvatar;
        const { phone, ...safeJob } = jobWithAvatar;
        return safeJob;
      })));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get all connections
  app.get('/api/connections', async (req, res) => {
    try {
      const actor = authenticated(req, res);
      if (!actor) return;
      const connections = actor.role === 'admin'
        ? await db.all('SELECT * FROM connections ORDER BY "createdAt" DESC')
        : await db.all('SELECT * FROM connections WHERE "fromUserId" = $1 OR "toUserId" = $1 ORDER BY "createdAt" DESC', [actor.id]);
      const safeConnections = await Promise.all(connections.map(async (connection: any) => {
        if (actor.role === 'admin') return connection;
        if (connection.status !== 'accepted') return { ...connection, phone: undefined };
        const contactUserId = actor.id === connection.fromUserId ? connection.toUserId : connection.fromUserId;
        const contactUser = await db.get('SELECT phone, "whatsappPhone" FROM users WHERE id = $1', [contactUserId]);
        return { ...connection, phone: contactUser?.whatsappPhone || contactUser?.phone || undefined };
      }));
      res.json(safeConnections);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get all applications
  app.get('/api/applications', async (req, res) => {
    try {
      const actor = authenticated(req, res);
      if (!actor) return;
      const applications = actor.role === 'admin'
        ? await db.all('SELECT * FROM applications ORDER BY "createdAt" DESC')
        : await db.all('SELECT * FROM applications WHERE "applicantId" = $1 OR "employerId" = $1 ORDER BY "createdAt" DESC', [actor.id]);
      res.json(applications.map((application: any) => application.status === 'accepted' || application.applicantId === actor.id ? application : { ...application, phone: undefined }));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get all reviews
  app.get('/api/reviews', async (req, res) => {
    try {
      const reviews = await db.all('SELECT * FROM reviews ORDER BY "createdAt" DESC');
      res.json(reviews);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });


  app.post('/api/demo/reset', async (req, res) => {
    try {
      if (isProduction) return res.status(403).json({ error: 'Demo reset disabled in production' });
      if (!await adminOnly(req, res)) return;
      await db.run('DELETE FROM reviews');
      await db.run('DELETE FROM applications');
      await db.run('DELETE FROM connections');
      await db.run('DELETE FROM jobs');

      const createdAt = new Date().toISOString();
      await db.run(
        `INSERT INTO jobs (id, title, "employerId", "employerName", location, description, rate, phone, status, "createdAt") VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8, 'open', $9),
          ($10, $11, $12, $13, $14, $15, $16, $17, 'open', $18)`,
        [
          'job-demo-1', 'Solar Panel System Installer Needed', 'employer-1', 'Qardho Agricultural Co.', 'Kaambo', 'Install a 5KW solar pump system for a local farm outside Qardho.', '$250 Total', '+252 90 700 1122', createdAt,
          'job-demo-2', 'Concrete Plastering Work for Berked', 'employer-1', 'Qardho Agricultural Co.', 'Xorgoble', 'Mason needed to complete plastering on a water reservoir.', '$30 / day', '+252 90 700 1122', createdAt
        ]
      );
      await db.run(
        'INSERT INTO applications (id, "jobId", "jobTitle", "employerId", "applicantId", "applicantName", "applicantSkill", message, phone, location, status, "createdAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)',
        ['app-demo-1', 'job-demo-1', 'Solar Panel System Installer Needed', 'employer-1', 'worker-1', 'Ahmed Mohamed Ali', 'Solar Technician', 'I have installed similar solar pump systems around Kaambo and can start this week.', '+252 90 779 1234', 'Kaambo', 'pending', createdAt]
      );
      await db.run(
        'INSERT INTO connections (id, "fromUserId", "fromUserName", "toUserId", "toUserName", status, message, phone, "createdAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
        ['conn-demo-1', 'employer-1', 'Qardho Agricultural Co.', 'worker-1', 'Ahmed Mohamed Ali', 'pending', 'We would like to discuss a solar installation job.', '+252 90 700 1122', createdAt]
      );
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update profile
  app.post('/api/profile/update', async (req, res) => {
    const { name, email, phone, whatsappPhone, role, skill, location, bio, rate, smsNotificationsEnabled, availability, gender, pricingType, pricingAmount, pricingCurrency, pricingNote } = req.body;
    try {
      const actor = authenticated(req, res);
      if (!actor) return;
      if (isBlank(name) || isBlank(phone)) return res.status(400).json({ error: 'Name and phone are required.' });
      if (role && role !== actor.role && !(actor.role === 'pending' && ['worker', 'employer'].includes(role))) return res.status(403).json({ error: 'Use More Settings to switch account roles.' });
      if (availability && !validAvailability.includes(availability)) {
        return res.status(400).json({ error: 'Invalid availability value.' });
      }
      if (gender && !validGenders.includes(gender)) return res.status(400).json({ error: 'Invalid gender option.' });
      if (pricingType && !validPricingTypes.includes(pricingType)) return res.status(400).json({ error: 'Invalid pricing type.' });
      if (!validNonNegativeAmount(pricingAmount)) return res.status(400).json({ error: 'Pricing amount cannot be negative.' });
      const normalizedPhone = normalizePhone(phone);
      const normalizedWhatsapp = whatsappPhone ? normalizePhone(whatsappPhone) : null;
      if (!normalizedPhone || (whatsappPhone && !normalizedWhatsapp)) return res.status(400).json({ error: 'Enter valid international phone numbers.' });
      const normalizedEmail = email ? String(email).trim().toLowerCase() : null;
      if (normalizedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return res.status(400).json({ error: 'Enter a valid email address.' });
      const nextRole = actor.role === 'pending' && ['worker', 'employer'].includes(role) ? role : actor.role;

      await db.run(
        `UPDATE users SET 
          name = $1, 
          email = $2, 
          phone = $3, 
          role = $4, 
          skill = $5, 
          location = $6, 
          bio = $7, 
          rate = $8, 
          "smsNotificationsEnabled" = $9,
          availability = $10,
          "whatsappPhone" = $11,
          gender = $12,
          "pricingType" = $13,
          "pricingAmount" = $14,
          "pricingCurrency" = $15,
          "pricingNote" = $16
        WHERE id = $17`,
        [cleanText(name, 120), normalizedEmail, normalizedPhone, nextRole, cleanText(skill, 120) || null, cleanText(location, 120) || null, cleanText(bio, 2000) || null, cleanText(rate, 120) || null, !!smsNotificationsEnabled, availability || 'available', normalizedWhatsapp, gender || null, pricingType || null, pricingAmount === '' || pricingAmount === undefined ? null : Number(pricingAmount), cleanText(pricingCurrency, 8) || 'USD', cleanText(pricingNote, 500) || null, actor.id]
      );

      const user = await db.get('SELECT * FROM users WHERE id = $1', [actor.id]);
      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }
      res.json({
        success: true,
        user: formatUser(user)
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/admin/overview', async (req, res) => {
    try {
      const actor = req.authUser?.role === 'admin' ? req.authUser : null;
      if (!actor) return res.status(403).json({ error: 'Admin access required.' });
      const [users, jobs, connections, applications, reviews] = await Promise.all([
        db.all('SELECT * FROM users ORDER BY "createdAt" DESC'),
        db.all('SELECT * FROM jobs ORDER BY "createdAt" DESC'),
        db.all('SELECT * FROM connections ORDER BY "createdAt" DESC'),
        db.all('SELECT * FROM applications ORDER BY "createdAt" DESC'),
        db.all('SELECT * FROM reviews ORDER BY "createdAt" DESC'),
      ]);
      res.json({ users: users.map(formatUser), jobs, connections, applications, reviews });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/profile/switch-role', async (req, res) => {
    const actor = authenticated(req, res);
    if (!actor) return;
    const role = req.body?.role;
    if (!['worker', 'employer'].includes(role) || !['worker', 'employer'].includes(actor.role)) return res.status(400).json({ error: 'Role switching is available only for worker and employer accounts.' });
    if (role === actor.role) return res.json({ success: true, user: formatUser(actor) });
    if (req.body?.confirmation !== 'CONFIRM') return res.status(400).json({ error: 'Type CONFIRM to switch roles.' });
    if ([actor.name, actor.phone, actor.location, actor.bio].some(isBlank)) return res.status(400).json({ error: 'Complete your name, phone, location, and bio before switching roles.' });
    await db.run('UPDATE users SET role = $1, skill = CASE WHEN $1 = \'worker\' THEN COALESCE(skill, \'General Laborer\') ELSE skill END, availability = CASE WHEN $1 = \'worker\' THEN COALESCE(availability, \'available\') ELSE availability END WHERE id = $2', [role, actor.id]);
    res.json({ success: true, user: formatUser(await getUserById(actor.id)) });
  });

  app.post('/api/profile/avatar', async (req, res) => {
    const actor = authenticated(req, res);
    if (!actor) return;
    try {
      const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(req.body?.imageDataUrl || ''));
      if (!match) return res.status(400).json({ error: 'Upload a JPEG, PNG, or WebP image.' });
      const input = Buffer.from(match[2], 'base64');
      if (input.length > 5 * 1024 * 1024) return res.status(400).json({ error: 'Profile images must be 5 MB or smaller.' });
      const metadata = await sharp(input).metadata();
      if (!['jpeg', 'png', 'webp'].includes(metadata.format || '')) return res.status(400).json({ error: 'Unsupported image format.' });
      const output = await sharp(input).rotate().resize(800, 800, { fit: 'cover', position: 'attention', withoutEnlargement: true }).webp({ quality: 78, effort: 4 }).toBuffer();
      let avatarUrl: string;
      if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
        const timestamp = Math.floor(Date.now() / 1000);
        const folder = 'qardho-profiles';
        const signature = createHash('sha1').update(`folder=${folder}&timestamp=${timestamp}${process.env.CLOUDINARY_API_SECRET}`).digest('hex');
        const form = new FormData();
        form.set('file', `data:image/webp;base64,${output.toString('base64')}`);
        form.set('api_key', process.env.CLOUDINARY_API_KEY);
        form.set('timestamp', String(timestamp));
        form.set('folder', folder);
        form.set('signature', signature);
        const upload = await fetch(`https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: form });
        const result: any = await upload.json();
        if (!upload.ok || !result.secure_url) throw new Error(result.error?.message || 'Cloud image storage failed.');
        avatarUrl = result.secure_url;
      } else {
        const filename = `profile-${actor.id.replace(/[^a-zA-Z0-9_-]/g, '')}-${Date.now()}.webp`;
        await writeFile(path.join(uploadDir, filename), output);
        avatarUrl = `/uploads/${filename}`;
      }
      const previousUrl = actor.avatarUrl;
      await db.run('UPDATE users SET "avatarUrl" = $1 WHERE id = $2', [avatarUrl, actor.id]);
      if (previousUrl?.startsWith('/uploads/')) await unlink(path.join(uploadDir, path.basename(previousUrl))).catch(() => undefined);
      res.json({ success: true, avatarUrl, user: formatUser(await getUserById(actor.id)) });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Could not process this image.' });
    }
  });

  app.delete('/api/profile/avatar', async (req, res) => {
    const actor = authenticated(req, res);
    if (!actor) return;
    if (actor.avatarUrl?.startsWith('/uploads/')) await unlink(path.join(uploadDir, path.basename(actor.avatarUrl))).catch(() => undefined);
    await db.run('UPDATE users SET "avatarUrl" = NULL WHERE id = $1', [actor.id]);
    res.json({ success: true, user: formatUser(await getUserById(actor.id)) });
  });

  app.post('/api/auth/forgot-password', (req, res) => {
    res.status(410).json({ error: 'Password reset is managed through Clerk.' });
  });

  app.post('/api/auth/reset-password', (req, res) => {
    res.status(410).json({ error: 'Password reset is managed through Clerk.' });
  });

  app.post('/api/auth/logout', (req, res) => {
    res.json({ success: true, message: 'Logged out.' });
  });

  app.get('/api/auth/me', requireClerkAuth, async (req: any, res: any) => {
    try {
      let clerkEnv: 'development' | 'production';
      try {
        clerkEnv = getClerkEnvironment();
      } catch (err: any) {
        return res.status(400).json({ error: err.message, code: 'INVALID_CLERK_ENVIRONMENT' });
      }

      const auth = getAuth(req);
      const clerkUserId = auth?.userId;
      if (!clerkUserId) {
        return res.status(401).json({ user: null });
      }

      // 1. Search user_auth_identities by clerk_user_id & environment
      const existingIdentity = await db.get(
        'SELECT uai.*, u.suspended FROM user_auth_identities uai JOIN users u ON uai.user_id = u.id WHERE uai.clerk_user_id = $1 AND uai.environment = $2',
        [clerkUserId, clerkEnv]
      );

      if (existingIdentity) {
        const linkedUser = await db.get('SELECT * FROM users WHERE id = $1', [existingIdentity.user_id]);
        if (linkedUser) {
          if (linkedUser.suspended) {
            return res.status(403).json({ error: 'This account is currently suspended.', user: null });
          }
          const adminEmails = (process.env.ADMIN_EMAILS || 'admin@qardho.com').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
          const userEmail = (linkedUser.email || '').trim().toLowerCase();
          if (userEmail && adminEmails.includes(userEmail) && linkedUser.role !== 'admin') {
            await db.run('UPDATE users SET role = $1 WHERE id = $2', ['admin', linkedUser.id]);
            linkedUser.role = 'admin';
          }
          return res.json({ user: formatUser(linkedUser) });
        }
      }

      // Fallback: Check legacy users.clerkUserId
      const legacyUser = await db.get('SELECT * FROM users WHERE "clerkUserId" = $1', [clerkUserId]);
      if (legacyUser) {
        if (legacyUser.suspended) {
          return res.status(403).json({ error: 'This account is currently suspended.', user: null });
        }
        const identityId = `identity-${Date.now()}-${randomBytes(4).toString('hex')}`;
        await db.run(
          `INSERT INTO user_auth_identities (id, user_id, clerk_user_id, environment, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $5)
           ON CONFLICT (clerk_user_id) DO NOTHING`,
          [identityId, legacyUser.id, clerkUserId, clerkEnv, new Date().toISOString()]
        );
        return res.json({ user: formatUser(legacyUser) });
      }

      // Fetch Clerk details via BAPI
      let clerkUserObj: any;
      try {
        clerkUserObj = await clerkClient.users.getUser(clerkUserId);
      } catch (err: any) {
        console.error('Error fetching Clerk user details:', err);
        return res.status(500).json({ error: 'Could not fetch user details from Clerk.' });
      }

      const clerkImageUrl = clerkUserObj.imageUrl || null;
      const adminEmails = (process.env.ADMIN_EMAILS || 'admin@qardho.com').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);

      const primaryEmailObj = clerkUserObj.emailAddresses?.find((e: any) => e.id === clerkUserObj.primaryEmailAddressId) || clerkUserObj.emailAddresses?.[0];
      const rawEmail = primaryEmailObj?.emailAddress || '';
      const normalizedEmail = rawEmail.trim().toLowerCase();
      const isEmailVerified = Boolean(
        primaryEmailObj && (primaryEmailObj.verification?.status === 'verified' || primaryEmailObj.verified === true)
      );

      const firstName = clerkUserObj.firstName || '';
      const lastName = clerkUserObj.lastName || '';
      const displayName = (firstName || lastName) ? `${firstName} ${lastName}`.trim() : (normalizedEmail.split('@')[0] || 'User');
      const isAutoAdmin = Boolean(normalizedEmail && adminEmails.includes(normalizedEmail));

      // Attempt linking by verified email
      if (normalizedEmail && isEmailVerified) {
        const matches = await db.all(
          `SELECT u.* FROM users u 
           LEFT JOIN user_auth_identities uai ON u.id = uai.user_id AND uai.environment = $1
           WHERE LOWER(u.email) = $2 AND uai.id IS NULL`,
          [clerkEnv, normalizedEmail]
        );

        if (matches.length === 1) {
          const existingUser = matches[0];
          if (existingUser.suspended) {
            return res.status(403).json({ error: 'This account is currently suspended.', user: null });
          }

          const targetRole = isAutoAdmin ? 'admin' : existingUser.role;

          return await db.transaction(async (tx: any) => {
            await tx.run(
              'UPDATE users SET "clerkUserId" = COALESCE("clerkUserId", $1), role = $2, "avatarUrl" = COALESCE("avatarUrl", $3) WHERE id = $4',
              [clerkUserId, targetRole, clerkImageUrl, existingUser.id]
            );

            const identityId = `identity-${Date.now()}-${randomBytes(4).toString('hex')}`;
            await tx.run(
              `INSERT INTO user_auth_identities (id, user_id, clerk_user_id, environment, created_at, updated_at)
               VALUES ($1, $2, $3, $4, $5, $5)
               ON CONFLICT (clerk_user_id) DO NOTHING`,
              [identityId, existingUser.id, clerkUserId, clerkEnv, new Date().toISOString()]
            );

            const updated = await tx.get('SELECT * FROM users WHERE id = $1', [existingUser.id]);
            return res.json({ user: formatUser(updated) });
          });
        } else if (matches.length > 1) {
          return res.status(409).json({
            error: 'Multiple accounts match this email address. Please contact an administrator.',
            code: 'MULTIPLE_ACCOUNTS_MATCH',
            user: null
          });
        }
      }

      // Create new user record with role = 'pending' (or 'admin' if auto admin email)
      const newInternalId = `user-${Date.now()}-${randomBytes(4).toString('hex')}`;
      const createdAt = new Date().toISOString();
      const initialRole = isAutoAdmin ? 'admin' : 'pending';
      const initialVerified = isAutoAdmin;

      return await db.transaction(async (tx: any) => {
        await tx.run(
          `INSERT INTO users (
            id, "clerkUserId", name, email, phone, role, verified, suspended, "createdAt", availability, "avatarUrl"
          ) VALUES ($1, $2, $3, $4, NULL, $5, $6, false, $7, 'available', $8)`,
          [newInternalId, clerkUserId, displayName, normalizedEmail || null, initialRole, initialVerified, createdAt, clerkImageUrl]
        );

        const identityId = `identity-${Date.now()}-${randomBytes(4).toString('hex')}`;
        await tx.run(
          `INSERT INTO user_auth_identities (id, user_id, clerk_user_id, environment, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $5)
           ON CONFLICT (clerk_user_id) DO NOTHING`,
          [identityId, newInternalId, clerkUserId, clerkEnv, createdAt]
        );

        const newUser = await tx.get('SELECT * FROM users WHERE id = $1', [newInternalId]);
        return res.json({ user: formatUser(newUser) });
      });
    } catch (err: any) {
      console.error('Error in /api/auth/me sync:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/notifications', async (req, res) => {
    const actor = authenticated(req, res);
    if (!actor) return;
    const notifications = await db.all('SELECT * FROM notifications WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT 50', [actor.id]);
    res.json(notifications);
  });

  app.get('/api/notifications/stream', async (req, res) => {
    const actor = authenticated(req, res);
    if (!actor) return;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    if (typeof res.flushHeaders === 'function') {
      res.flushHeaders();
    }

    if (!activeSseClients.has(actor.id)) {
      activeSseClients.set(actor.id, new Set());
    }
    const clientSet = activeSseClients.get(actor.id)!;
    clientSet.add(res);

    // Initial connection confirmation event
    res.write(`data: ${JSON.stringify({ type: 'connected', userId: actor.id, timestamp: new Date().toISOString() })}\n\n`);

    // Keep-alive heartbeat ping every 25 seconds
    const keepAliveInterval = setInterval(() => {
      try {
        res.write(': ping\n\n');
      } catch {
        // ignore write error
      }
    }, 25000);

    const cleanup = () => {
      clearInterval(keepAliveInterval);
      clientSet.delete(res);
      if (clientSet.size === 0) {
        activeSseClients.delete(actor.id);
      }
    };

    req.on('close', cleanup);
    req.on('end', cleanup);
    res.on('finish', cleanup);
  });

  app.post('/api/notifications/:id/read', async (req, res) => {
    const actor = authenticated(req, res);
    if (!actor) return;
    await db.run('UPDATE notifications SET "readAt" = COALESCE("readAt", $1) WHERE id = $2 AND "userId" = $3', [new Date().toISOString(), req.params.id, actor.id]);
    res.json({ success: true });
  });

  app.post('/api/admin/users/:id/role', async (req, res) => {
    try {
      const actor = req.authUser?.role === 'admin' ? req.authUser : null;
      if (!actor) return res.status(403).json({ error: 'Admin access required.' });
      const { id } = req.params;
      const { role } = req.body;
      if (!validRoles.includes(role) || role === 'pending') return res.status(400).json({ error: 'Invalid role.' });
      const user = await getUserById(id);
      if (!user) return res.status(404).json({ error: 'User not found.' });
      if (user.role === 'admin' && role !== 'admin') return res.status(403).json({ error: 'Admin role cannot be removed here.' });
      await db.run('UPDATE users SET role = $1 WHERE id = $2', [role, id]);
      res.json({ success: true, user: formatUser(await getUserById(id)) });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.get('/api/verification-messages/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const actor = req.authUser;
      if (!actor || (actor.id !== userId && actor.role !== 'admin')) {
        return res.status(403).json({ error: 'You cannot view this verification message.' });
      }
      const message = await db.get('SELECT * FROM verification_messages WHERE "userId" = $1', [userId]);
      res.json({ message: formatVerificationMessage(message) });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post('/api/admin/users/:id/verification-message', async (req, res) => {
    try {
      const actor = req.authUser?.role === 'admin' ? req.authUser : null;
      if (!actor) return res.status(403).json({ error: 'Admin access required.' });

      const { id } = req.params;
      const target = await getUserById(id);
      if (!target) return res.status(404).json({ error: 'User not found.' });
      if (target.verified) return res.status(400).json({ error: 'This account is already verified.' });

      const incomingFields = Array.isArray(req.body?.missingFields) ? req.body.missingFields : [];
      if (!incomingFields.every(isProfileFieldKey)) {
        return res.status(400).json({ error: 'One or more profile fields are invalid.' });
      }
      const missingFields = [...new Set(incomingFields)];
      const note = typeof req.body?.note === 'string' ? req.body.note.trim() : '';
      if (note.length > 500) return res.status(400).json({ error: 'The admin note must be 500 characters or fewer.' });
      if (missingFields.length === 0 && !note) {
        return res.status(400).json({ error: 'Select at least one missing field or add a note.' });
      }

      const sentAt = new Date().toISOString();
      await db.run(
        'INSERT INTO verification_messages ("userId", "adminId", "adminName", "missingFields", note, "sentAt", "readAt") VALUES ($1, $2, $3, $4::jsonb, $5, $6, NULL) ON CONFLICT ("userId") DO UPDATE SET "adminId" = EXCLUDED."adminId", "adminName" = EXCLUDED."adminName", "missingFields" = EXCLUDED."missingFields", note = EXCLUDED.note, "sentAt" = EXCLUDED."sentAt", "readAt" = NULL',
        [id, actor.id, actor.name, JSON.stringify(missingFields), note || null, sentAt]
      );
      const message = await db.get('SELECT * FROM verification_messages WHERE "userId" = $1', [id]);
      res.json({ success: true, message: formatVerificationMessage(message) });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post('/api/verification-messages/:userId/read', async (req, res) => {
    try {
      const { userId } = req.params;
      const actor = req.authUser;
      if (!actor || actor.id !== userId) {
        return res.status(403).json({ error: 'Only the message recipient can mark it as read.' });
      }
      const readAt = new Date().toISOString();
      await db.run(
        'UPDATE verification_messages SET "readAt" = COALESCE("readAt", $1) WHERE "userId" = $2',
        [readAt, userId]
      );
      const message = await db.get('SELECT * FROM verification_messages WHERE "userId" = $1', [userId]);
      res.json({ success: true, message: formatVerificationMessage(message) });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });
  app.post('/api/admin/users/:id/verify', async (req, res) => {
    try {
      const actor = req.authUser?.role === 'admin' ? req.authUser : null;
      if (!actor) return res.status(403).json({ error: 'Admin access required.' });
      const { id } = req.params;
      const { verified } = req.body;
      await db.run('UPDATE users SET verified = $1 WHERE id = $2', [!!verified, id]);
      if (verified) await db.run('DELETE FROM verification_messages WHERE "userId" = $1', [id]);
      res.json({ success: true, user: formatUser(await getUserById(id)) });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post('/api/admin/users/:id/suspend', async (req, res) => {
    try {
      const actor = req.authUser?.role === 'admin' ? req.authUser : null;
      if (!actor) return res.status(403).json({ error: 'Admin access required.' });
      const { id } = req.params;
      const { suspended } = req.body;
      await db.run('UPDATE users SET suspended = $1 WHERE id = $2', [!!suspended, id]);
      res.json({ success: true, user: formatUser(await getUserById(id)) });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post('/api/admin/users/:id/delete', async (req, res) => {
    try {
      const actor = req.authUser?.role === 'admin' ? req.authUser : null;
      if (!actor) return res.status(403).json({ error: 'Admin access required.' });
      const { id } = req.params;
      const user = await getUserById(id);
      if (!user) return res.status(404).json({ error: 'User not found.' });
      if (user.role === 'admin' && actor.role !== 'admin') return res.status(403).json({ error: 'Admin cannot be removed by non-admins.' });
      await db.transaction((tx: any) => deleteUserCascade(id, tx));
      res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post('/api/admin/jobs/:id/status', async (req, res) => {
    try {
      const actor = req.authUser?.role === 'admin' ? req.authUser : null;
      if (!actor) return res.status(403).json({ error: 'Admin access required.' });
      const { id } = req.params;
      const { status } = req.body;
      const job = await db.get('SELECT * FROM jobs WHERE id = $1', [id]);
      if (!job) return res.status(404).json({ error: 'Job not found.' });
      await db.run('UPDATE jobs SET status = $1 WHERE id = $2', [status, id]);
      res.json({ success: true, job: await db.get('SELECT * FROM jobs WHERE id = $1', [id]) });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post('/api/admin/jobs/:id/delete', async (req, res) => {
    try {
      const actor = req.authUser?.role === 'admin' ? req.authUser : null;
      if (!actor) return res.status(403).json({ error: 'Admin access required.' });
      const { id } = req.params;
      const job = await db.get('SELECT * FROM jobs WHERE id = $1', [id]);
      if (!job) return res.status(404).json({ error: 'Job not found.' });
      await db.run('DELETE FROM jobs WHERE id = $1', [id]);
      res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post('/api/admin/reviews/:id/delete', async (req, res) => {
    try {
      const actor = req.authUser?.role === 'admin' ? req.authUser : null;
      if (!actor) return res.status(403).json({ error: 'Admin access required.' });
      const { id } = req.params;
      const review = await db.get('SELECT * FROM reviews WHERE id = $1', [id]);
      if (!review) return res.status(404).json({ error: 'Review not found.' });
      await db.run('DELETE FROM reviews WHERE id = $1', [id]);
      res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post('/api/account/delete', requireClerkAuth, async (req: any, res: any) => {
    try {
      const auth = getAuth(req);
      const clerkUserId = auth.userId;
      if (!clerkUserId) return res.status(401).json({ error: 'Please sign in to continue.' });

      if (req.body?.confirmation !== 'I confirm') return res.status(400).json({ error: 'Type I confirm exactly to delete your account.' });

      const platformUser = await db.get('SELECT * FROM users WHERE "clerkUserId" = $1', [clerkUserId]);
      if (!platformUser) return res.status(404).json({ error: 'Platform account not found.' });

      if (platformUser.role === 'admin') {
        const adminCountRow = await db.get("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
        if (Number(adminCountRow.count) <= 1) {
          return res.status(403).json({ error: 'Cannot delete the final administrator account.' });
        }
      }

      await db.transaction((tx: any) => deleteUserCascade(platformUser.id, tx));

      let clerkDeleted = false;
      try {
        await clerkClient.users.deleteUser(clerkUserId);
        clerkDeleted = true;
      } catch (clerkErr) {
        console.error('Failed to delete Clerk user:', clerkErr);
      }

      if (!clerkDeleted) {
        return res.json({ success: true, warning: 'PostgreSQL platform account deleted, but Clerk identity deletion failed.' });
      }

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Post Job
  app.post('/api/jobs', requireRole('employer'), async (req, res) => {
    const { id, title, location, description, requirements, category, workType, expectedDuration, rate, pricingType, pricingAmount, pricingCurrency, pricingNote } = req.body;
    try {
      const employer = authenticated(req, res);
      if (!employer) return;
      if (employer.role !== 'employer' && employer.role !== 'admin') return res.status(403).json({ error: 'Only employers can post jobs.' });
      if ([title, location, description, requirements].some(isBlank)) return res.status(400).json({ error: 'Title, location, description, and requirements are required.' });
      if (cleanText(description).length < 30) return res.status(400).json({ error: 'Job description must be at least 30 characters.' });
      if (cleanText(requirements).length < 30) return res.status(400).json({ error: 'Requirements must be at least 30 characters.' });
      if (pricingType && !validPricingTypes.includes(pricingType)) return res.status(400).json({ error: 'Invalid pricing type.' });
      if (!validNonNegativeAmount(pricingAmount)) return res.status(400).json({ error: 'Budget cannot be negative.' });

      const newId = id || `job-${Date.now()}`;
      const createdAt = new Date().toISOString();
      await db.run(
        'INSERT INTO jobs (id, title, "employerId", "employerName", location, description, requirements, category, "workType", "expectedDuration", rate, phone, "pricingType", "pricingAmount", "pricingCurrency", "pricingNote", status, "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)',
        [newId, cleanText(title, 160), employer.id, employer.name, cleanText(location, 120), cleanText(description, 5000), cleanText(requirements, 3000), cleanText(category, 120) || null, cleanText(workType, 120) || null, cleanText(expectedDuration, 120) || null, cleanText(rate, 120) || 'Negotiable', employer.whatsappPhone || employer.phone, pricingType || null, pricingAmount === '' || pricingAmount === undefined ? null : Number(pricingAmount), cleanText(pricingCurrency, 8) || 'USD', cleanText(pricingNote, 500) || null, 'open', createdAt]
      );
      const job = await db.get('SELECT * FROM jobs WHERE id = $1', [newId]);
      res.json({ success: true, job });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/jobs/:id/status', requireRole('employer', 'worker'), async (req, res) => {
    const { id } = req.params;
    const { status, note } = req.body;

    if (!validJobStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid job status.' });
    }

    try {
      const actor = authenticated(req, res);
      if (!actor) return;
      const job = await db.get('SELECT * FROM jobs WHERE id = $1', [id]);
      if (!job) {
        return res.status(404).json({ error: 'Job not found.' });
      }

      const actorIsEmployer = job.employerId === actor.id;
      const actorIsAssignedWorker = job.assignedWorkerId === actor.id;
      if (!actorIsEmployer && !actorIsAssignedWorker && actor.role !== 'admin') {
        return res.status(403).json({ error: 'Only the job owner or assigned worker can update this job status.' });
      }
      if (job.status === 'completed' && status !== 'completed') {
        return res.status(400).json({ error: 'Completed jobs cannot be reopened from the dashboard.' });
      }
      const now = new Date().toISOString();
      const activeStatuses = ['active', 'in_progress'];
      if (status === 'completion_requested_by_worker' || status === 'completion_requested_by_employer') {
        if (!activeStatuses.includes(job.status)) return res.status(400).json({ error: 'Only active jobs can request completion.' });
        const expected = actorIsAssignedWorker ? 'completion_requested_by_worker' : actorIsEmployer ? 'completion_requested_by_employer' : null;
        if (!expected || status !== expected) return res.status(403).json({ error: 'Completion request does not match your participant role.' });
        await db.run('UPDATE jobs SET status = $1, "completionRequestedAt" = $2, "completionRequestedBy" = $3, "completionRequestedRole" = $4 WHERE id = $5', [status, now, actor.id, actorIsAssignedWorker ? 'worker' : 'employer', id]);
        await db.run('INSERT INTO completion_events (id, "jobId", "actorId", action, note, "createdAt") VALUES ($1, $2, $3, $4, $5, $6)', [`completion-${Date.now()}`, id, actor.id, 'requested', cleanText(note, 500) || null, now]);
        const otherId = actorIsAssignedWorker ? job.employerId : job.assignedWorkerId;
        if (otherId) await addNotification(otherId, 'completion_requested', 'Completion requested', `${actor.name} requested completion for "${job.title}".`, `/dashboard?job=${encodeURIComponent(job.id)}`);
      } else if (status === 'completed') {
        const requestedByOther = (job.status === 'completion_requested_by_worker' && actorIsEmployer) || (job.status === 'completion_requested_by_employer' && actorIsAssignedWorker);
        if (!requestedByOther && actor.role !== 'admin') return res.status(403).json({ error: 'The other participant must confirm this completion request.' });
        await db.run('UPDATE jobs SET status = $1, "completionConfirmedBy" = $2, "completionConfirmedAt" = $3, "workerCompletedAt" = CASE WHEN $4 THEN $3 ELSE "workerCompletedAt" END WHERE id = $5', ['completed', actor.id, now, actorIsAssignedWorker, id]);
        await db.run('INSERT INTO completion_events (id, "jobId", "actorId", action, note, "createdAt") VALUES ($1, $2, $3, $4, $5, $6)', [`completion-${Date.now()}`, id, actor.id, 'confirmed', cleanText(note, 500) || null, now]);
        await addNotification(job.employerId, 'job_completed', 'Job completed', `"${job.title}" is now marked completed.`, `/dashboard?job=${encodeURIComponent(job.id)}`);
        if (job.assignedWorkerId) await addNotification(job.assignedWorkerId, 'job_completed', 'Job completed', `"${job.title}" is now marked completed.`, `/dashboard?job=${encodeURIComponent(job.id)}`);
      } else if (status === 'completion_disputed') {
        const requestedByOther = (job.status === 'completion_requested_by_worker' && actorIsEmployer) || (job.status === 'completion_requested_by_employer' && actorIsAssignedWorker);
        if (!requestedByOther) return res.status(403).json({ error: 'Only the other participant can dispute this request.' });
        await db.run('UPDATE jobs SET status = $1, "completionDisputedBy" = $2, "completionDisputedAt" = $3 WHERE id = $4', [status, actor.id, now, id]);
        await db.run('INSERT INTO completion_events (id, "jobId", "actorId", action, note, "createdAt") VALUES ($1, $2, $3, $4, $5, $6)', [`completion-${Date.now()}`, id, actor.id, 'disputed', cleanText(note, 500) || null, now]);
        const otherId = actorIsAssignedWorker ? job.employerId : job.assignedWorkerId;
        if (otherId) await addNotification(otherId, 'completion_disputed', 'Completion needs review', `${actor.name} reported an issue with "${job.title}".`, `/dashboard?job=${encodeURIComponent(job.id)}`);
      } else {
        if (actor.role !== 'admin' && !actorIsEmployer) return res.status(403).json({ error: 'Only the employer can change this job status.' });
        if (['active', 'in_progress'].includes(status) && !job.assignedWorkerId) return res.status(400).json({ error: 'Assign a worker before activating this job.' });
        await db.run('UPDATE jobs SET status = $1 WHERE id = $2', [status, id]);
      }

      const updatedJob = await db.get('SELECT * FROM jobs WHERE id = $1', [id]);
      res.json({ success: true, job: updatedJob });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  // Connection Requests
  app.post('/api/connections', requireRole('employer'), async (req, res) => {
    const { id, toUserId, message, jobId, expectedTimeline } = req.body;
    if (!toUserId) return res.status(400).json({ error: 'Target worker ID is required.' });

    try {
      const fromUser = authenticated(req, res);
      if (!fromUser) return;
      if (fromUser.id === toUserId) {
        return res.status(400).json({ error: 'Employers cannot send a hire request to themselves.' });
      }
      const toUser = await db.get('SELECT * FROM users WHERE id = $1', [toUserId]);
      if (!toUser) return res.status(404).json({ error: 'Target worker not found.' });

      const existing = await db.get('SELECT * FROM connections WHERE "fromUserId" = $1 AND "toUserId" = $2 AND status IN ($3, $4)', [fromUser.id, toUser.id, 'pending', 'accepted']);
      if (existing) return res.status(409).json({ error: 'An active hire request already exists for this worker.' });
      const job = jobId ? await db.get('SELECT * FROM jobs WHERE id = $1 AND "employerId" = $2', [jobId, fromUser.id]) : null;

      const newId = id || `conn-${Date.now()}`;
      const createdAt = new Date().toISOString();
      await db.run(
        'INSERT INTO connections (id, "fromUserId", "fromUserName", "toUserId", "toUserName", status, message, phone, "jobId", "jobTitle", "expectedTimeline", "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)',
        [newId, fromUser.id, fromUser.name, toUser.id, toUser.name, 'pending', cleanText(message, 1200) || null, fromUser.whatsappPhone || fromUser.phone, job?.id || null, job?.title || null, cleanText(expectedTimeline, 200) || null, createdAt]
      );
      await addNotification(toUser.id, 'hire_request', 'New hiring request', `${fromUser.name} sent you a hiring request${job ? ` for "${job.title}"` : ''}.`, '/dashboard');
      const connection = await db.get('SELECT * FROM connections WHERE id = $1', [newId]);
      res.json({ success: true, connection });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/connections/:id/status', requireRole('worker'), async (req, res) => {
    const { id } = req.params;
    const { status, reason } = req.body;
    if (!validRequestStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid connection status.' });
    }
    try {
      const actor = authenticated(req, res);
      if (!actor) return;
      const connection = await db.get('SELECT * FROM connections WHERE id = $1', [id]);
      if (!connection) {
        return res.status(404).json({ error: 'Connection not found.' });
      }
      if (connection.toUserId !== actor.id && actor.role !== 'admin') {
        return res.status(403).json({ error: 'Only the target worker can update this request.' });
      }
      if (connection.status !== 'pending' && connection.status !== 'pending_worker_response') {
        return res.status(409).json({ error: 'This request has already been answered or is no longer active.' });
      }
      await db.run('UPDATE connections SET status = $1 WHERE id = $2', [status, id]);
      if (status === 'accepted' && connection.jobId) {
        await db.run(
          'UPDATE jobs SET status = $1, "assignedWorkerId" = $2, "assignedWorkerName" = $3 WHERE id = $4 AND status = $5',
          ['active', connection.toUserId, connection.toUserName, connection.jobId, 'open']
        );
      }
      const reasonText = reason ? ` (Reason: ${reason})` : '';
      await addNotification(
        connection.fromUserId,
        `hire_request_${status}`,
        `Hiring request ${status}`,
        `${connection.toUserName} ${status} your hiring request.${reasonText}`,
        '/dashboard'
      );
      const updatedConnection = await db.get('SELECT * FROM connections WHERE id = $1', [id]);
      res.json({ success: true, connection: updatedConnection });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Application Actions
  app.post('/api/applications', requireRole('worker'), async (req, res) => {
    const { id, jobId, message, proposedPricingType, proposedAmount, proposedCurrency, proposedNote, expectedTimeline } = req.body;
    try {
      const applicant = authenticated(req, res);
      if (!applicant) return;
      const job = await db.get('SELECT * FROM jobs WHERE id = $1', [jobId]);
      if (applicant.role !== 'worker') return res.status(403).json({ error: 'Only workers can apply for jobs.' });
      if (!job) return res.status(404).json({ error: 'Job not found.' });
      if (job.employerId === applicant.id) return res.status(400).json({ error: 'You cannot apply to your own job.' });
      if (job.status !== 'open') {
        return res.status(400).json({ error: 'This job is not open for applications.' });
      }
      if (isBlank(message)) return res.status(400).json({ error: 'Add a short application message.' });
      if (proposedPricingType && !validPricingTypes.includes(proposedPricingType)) return res.status(400).json({ error: 'Invalid proposed pricing type.' });
      if (!validNonNegativeAmount(proposedAmount)) return res.status(400).json({ error: 'Proposed price cannot be negative.' });
      const existingApplication = await db.get(
        'SELECT * FROM applications WHERE "jobId" = $1 AND "applicantId" = $2',
        [jobId, applicant.id]
      );
      if (existingApplication) {
        return res.status(400).json({ error: 'You have already applied to this job.' });
      }

      const newId = id || `app-${Date.now()}`;
      const createdAt = new Date().toISOString();
      await db.run(
        'INSERT INTO applications (id, "jobId", "jobTitle", "employerId", "applicantId", "applicantName", "applicantSkill", message, phone, location, status, "proposedPricingType", "proposedAmount", "proposedCurrency", "proposedNote", "expectedTimeline", "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)',
        [newId, job.id, job.title, job.employerId, applicant.id, applicant.name, applicant.skill || 'General Laborer', cleanText(message, 1600), applicant.whatsappPhone || applicant.phone, applicant.location || 'Qardho', 'pending', proposedPricingType || null, proposedAmount === '' || proposedAmount === undefined ? null : Number(proposedAmount), cleanText(proposedCurrency, 8) || 'USD', cleanText(proposedNote, 500) || null, cleanText(expectedTimeline, 200) || null, createdAt]
      );
      await addNotification(job.employerId, 'application_received', 'New job application', `${applicant.name} applied for "${job.title}".`, `/dashboard?job=${encodeURIComponent(job.id)}`);
      const application = await db.get('SELECT * FROM applications WHERE id = $1', [newId]);
      res.json({ success: true, application });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/applications/:id/status', requireRole('employer'), async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!validRequestStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid application status.' });
    }
    try {
      const actor = authenticated(req, res);
      if (!actor) return;
      const application = await db.get('SELECT * FROM applications WHERE id = $1', [id]);
      if (!application) {
        return res.status(404).json({ error: 'Application not found.' });
      }
      if (application.employerId !== actor.id && actor.role !== 'admin') {
        return res.status(403).json({ error: 'Only the job owner can update this application.' });
      }
      if (application.status !== 'pending') return res.status(409).json({ error: 'This application has already been answered.' });
      if (status === 'accepted') {
        const existingAccepted = await db.get(
          'SELECT * FROM applications WHERE "jobId" = $1 AND status = $2 AND id <> $3',
          [application.jobId, 'accepted', id]
        );
        if (existingAccepted) {
          return res.status(400).json({ error: 'This job already has an accepted worker.' });
        }
        await db.run('UPDATE applications SET status = $1 WHERE id = $2', [status, id]);
        await db.run('UPDATE applications SET status = $1 WHERE "jobId" = $2 AND id <> $3 AND status = $4', ['declined', application.jobId, id, 'pending']);
        await db.run(
          'UPDATE jobs SET status = $1, "assignedWorkerId" = $2, "assignedWorkerName" = $3 WHERE id = $4 AND status = $5',
          ['active', application.applicantId, application.applicantName, application.jobId, 'open']
        );
      } else {
        await db.run('UPDATE applications SET status = $1 WHERE id = $2', [status, id]);
      }
      await addNotification(application.applicantId, `application_${status}`, `Application ${status}`, `Your application for "${application.jobTitle}" was ${status}.`, `/dashboard?job=${encodeURIComponent(application.jobId)}`);
      const updatedApplication = await db.get('SELECT * FROM applications WHERE id = $1', [id]);
      res.json({ success: true, application: updatedApplication });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  // Reviews - Employer reviewing Worker
  app.post('/api/reviews', requireRole('employer'), async (req, res) => {
    const { id, workerId, jobId, rating, comment } = req.body;
    try {
      const employer = authenticated(req, res);
      if (!employer) return;
      if ([workerId, jobId, comment].some(isBlank) || typeof rating !== 'number' || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Completed job, worker, employer, rating 1-5, and comment are required.' });
      }
      const worker = await db.get('SELECT * FROM users WHERE id = $1', [workerId]);
      const completedJob = await db.get(
        'SELECT * FROM jobs WHERE id = $1 AND "employerId" = $2 AND status IN (\'completed\', \'closed\')',
        [jobId, employer.id]
      );
      const acceptedApplication = await db.get(
        'SELECT * FROM applications WHERE "jobId" = $1 AND "employerId" = $2 AND "applicantId" = $3 AND status = $4',
        [jobId, employer.id, workerId, 'accepted']
      );
      const acceptedConnection = await db.get(
        'SELECT * FROM connections WHERE "jobId" = $1 AND "fromUserId" = $2 AND "toUserId" = $3 AND status = $4',
        [jobId, employer.id, workerId, 'accepted']
      );

      const existingReview = await db.get(
        'SELECT * FROM reviews WHERE "jobId" = $1 AND "reviewerRole" = $2',
        [jobId, 'employer']
      );
      if (!worker || worker.role !== 'worker') {
        return res.status(400).json({ error: 'Reviews can only target workers.' });
      }
      if (!completedJob || (!acceptedApplication && !acceptedConnection && completedJob.assignedWorkerId !== workerId)) {
        return res.status(403).json({ error: 'Reviews require a completed job with an accepted engagement for this worker.' });
      }
      if (existingReview) {
        return res.status(400).json({ error: 'This completed job has already been reviewed by the employer.' });
      }

      const newId = id || `rev-${Date.now()}`;
      const createdAt = new Date().toISOString();
      await db.run(
        'INSERT INTO reviews (id, "workerId", "workerName", "employerId", "employerName", "jobId", "jobTitle", rating, "reviewerRole", "revieweeRole", comment, "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)',
        [newId, workerId, worker.name, employer.id, employer.name, completedJob.id, completedJob.title, rating, 'employer', 'worker', cleanText(comment, 1200), createdAt]
      );
      const review = await db.get('SELECT * FROM reviews WHERE id = $1', [newId]);

      // Check if worker review also exists to close job
      const workerReview = await db.get(
        'SELECT * FROM reviews WHERE "jobId" = $1 AND "reviewerRole" = $2',
        [jobId, 'worker']
      );

      let isClosed = false;
      if (workerReview) {
        await db.run('UPDATE jobs SET status = $1 WHERE id = $2', ['closed', jobId]);
        isClosed = true;
        await addNotification(workerId, 'job_closed', 'Work Engagement Closed', 'Both reviews were submitted. This work engagement is now closed.', '/dashboard');
        await addNotification(employer.id, 'job_closed', 'Work Engagement Closed', 'Both reviews were submitted. This work engagement is now closed.', '/dashboard');
      }

      res.json({ success: true, review, isClosed });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Worker reviewing Employer
  app.post('/api/reviews/employer', requireRole('worker'), async (req, res) => {
    const {
      id, jobId, employerId, overallRating, rating, communicationRating,
      fairnessRating, paymentReliabilityRating, jobAccuracyRating, comment
    } = req.body;
    try {
      const worker = authenticated(req, res);
      if (!worker) return;

      const finalOverallRating = typeof overallRating === 'number' ? overallRating : (typeof rating === 'number' ? rating : 0);

      if (!jobId || finalOverallRating < 1 || finalOverallRating > 5) {
        return res.status(400).json({ error: 'Job ID and overall rating (1-5) are required.' });
      }

      if (
        (typeof communicationRating === 'number' && (communicationRating < 1 || communicationRating > 5)) ||
        (typeof fairnessRating === 'number' && (fairnessRating < 1 || fairnessRating > 5)) ||
        (typeof paymentReliabilityRating === 'number' && (paymentReliabilityRating < 1 || paymentReliabilityRating > 5)) ||
        (typeof jobAccuracyRating === 'number' && (jobAccuracyRating < 1 || jobAccuracyRating > 5))
      ) {
        return res.status(400).json({ error: 'All rating criteria must be between 1 and 5 stars.' });
      }

      const completedJob = await db.get(
        'SELECT * FROM jobs WHERE id = $1 AND status IN (\'completed\', \'closed\')',
        [jobId]
      );

      if (!completedJob) {
        return res.status(403).json({ error: 'Reviews require a confirmed completed work engagement.' });
      }

      // Verify worker assignment
      const acceptedApp = await db.get(
        'SELECT * FROM applications WHERE "jobId" = $1 AND "applicantId" = $2 AND status = $3',
        [jobId, worker.id, 'accepted']
      );
      const acceptedConn = await db.get(
        'SELECT * FROM connections WHERE "jobId" = $1 AND "toUserId" = $2 AND status = $3',
        [jobId, worker.id, 'accepted']
      );

      const isAssignedWorker = completedJob.assignedWorkerId === worker.id || !!acceptedApp || !!acceptedConn;
      if (!isAssignedWorker) {
        return res.status(403).json({ error: 'Only the assigned worker can submit a review for this engagement.' });
      }

      const targetEmployerId = employerId || completedJob.employerId;
      if (targetEmployerId !== completedJob.employerId) {
        return res.status(400).json({ error: 'Invalid employer specified for this engagement.' });
      }

      const existingReview = await db.get(
        'SELECT * FROM reviews WHERE "jobId" = $1 AND "reviewerRole" = $2',
        [jobId, 'worker']
      );
      if (existingReview) {
        return res.status(400).json({ error: 'You have already reviewed the employer for this engagement.' });
      }

      const newId = id || `rev-w-${Date.now()}`;
      const createdAt = new Date().toISOString();

      await db.run(
        `INSERT INTO reviews (
          id, "workerId", "workerName", "employerId", "employerName", "jobId", "jobTitle",
          rating, "reviewerRole", "revieweeRole", "communicationRating", "fairnessRating",
          "paymentReliabilityRating", "jobAccuracyRating", comment, "createdAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [
          newId, worker.id, worker.name, targetEmployerId, completedJob.employerName,
          completedJob.id, completedJob.title, finalOverallRating, 'worker', 'employer',
          communicationRating || finalOverallRating, fairnessRating || finalOverallRating,
          paymentReliabilityRating || finalOverallRating, jobAccuracyRating || finalOverallRating,
          cleanText(comment || '', 1000), createdAt
        ]
      );

      const review = await db.get('SELECT * FROM reviews WHERE id = $1', [newId]);

      // Notification to employer
      await addNotification(
        targetEmployerId,
        'review_submitted',
        'Verified Review Received',
        `${worker.name} submitted a verified review for your completed work.`,
        `/profile?userId=${targetEmployerId}`
      );

      // Check if employer review also exists
      const employerReview = await db.get(
        'SELECT * FROM reviews WHERE "jobId" = $1 AND "reviewerRole" = $2',
        [jobId, 'employer']
      );

      let isClosed = false;
      if (employerReview) {
        await db.run('UPDATE jobs SET status = $1 WHERE id = $2', ['closed', jobId]);
        isClosed = true;

        await addNotification(
          worker.id,
          'job_closed',
          'Work Engagement Closed',
          'Both reviews were submitted. This work engagement is now closed.',
          '/dashboard'
        );
        await addNotification(
          targetEmployerId,
          'job_closed',
          'Work Engagement Closed',
          'Both reviews were submitted. This work engagement is now closed.',
          '/dashboard'
        );
      }

      res.json({ success: true, review, isClosed });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  // --- Vite & Production Static File Serving Middleware ---
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

async function startServerWithRetry() {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await startServer();
      return;
    } catch (err) {
      if (attempt === 3) throw err;
      await new Promise(resolve => setTimeout(resolve, attempt * 2000));
    }
  }
}

startServerWithRetry().catch(err => {
  console.error("Failed to start server", err);
});
