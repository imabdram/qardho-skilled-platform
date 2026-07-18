import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { Pool } from 'pg';

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
  });

  return {
    async exec(sql: string) {
      await pool.query(sql);
    },
    async run(sql: string, params: any[] = []) {
      return pool.query(sql, params);
    },
    async get(sql: string, params: any[] = []) {
      const result = await pool.query(sql, params);
      return result.rows[0];
    },
    async all(sql: string, params: any[] = []) {
      const result = await pool.query(sql, params);
      return result.rows;
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
    `UPDATE users
      SET "passwordHash" = $1
      WHERE id IN ('worker-1', 'employer-1')`,
    [demoPasswordHash]
  );
}

async function startServer() {
  const app = express();
  app.use(express.json());

  const PORT = Number(process.env.PORT || 3000);
  const isProduction = process.env.NODE_ENV === 'production' || path.basename(__dirname) === 'dist';

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required. Set it to your Neon PostgreSQL connection string.');
  }

  // Initialize PostgreSQL database
  const db = createPostgresDb(process.env.DATABASE_URL);

  // Create tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT NOT NULL,
      role TEXT,
      skill TEXT,
      location TEXT,
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
  `);

  await db.exec(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS "passwordHash" TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS availability TEXT DEFAULT 'available';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;
    ALTER TABLE jobs ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'open';
    ALTER TABLE jobs ADD COLUMN IF NOT EXISTS "assignedWorkerId" TEXT;
    ALTER TABLE jobs ADD COLUMN IF NOT EXISTS "assignedWorkerName" TEXT;
    ALTER TABLE jobs ADD COLUMN IF NOT EXISTS "completionRequestedAt" TEXT;
    ALTER TABLE jobs ADD COLUMN IF NOT EXISTS "workerCompletedAt" TEXT;
    ALTER TABLE reviews ADD COLUMN IF NOT EXISTS "jobId" TEXT;
    ALTER TABLE reviews ADD COLUMN IF NOT EXISTS "jobTitle" TEXT;
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
  for (const [oldLocation, newLocation] of locationMappings) {
    await db.run('UPDATE users SET location = $1 WHERE location = $2', [newLocation, oldLocation]);
    await db.run('UPDATE jobs SET location = $1 WHERE location = $2', [newLocation, oldLocation]);
    await db.run('UPDATE applications SET location = $1 WHERE location = $2', [newLocation, oldLocation]);
  }

  const formatUser = (user: any) => ({
    ...sanitizeUser(user),
    smsNotificationsEnabled: !!user.smsNotificationsEnabled,
    verified: !!user.verified,
  });

  const validRoles = ['worker', 'employer', 'pending'];
  const validJobStatuses = ['open', 'in_progress', 'completed', 'closed'];
  const validRequestStatuses = ['accepted', 'declined'];
  const validAvailability = ['available', 'busy', 'unavailable'];
  const isBlank = (value: any) => typeof value !== 'string' || value.trim().length === 0;

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
        'INSERT INTO users (id, name, email, phone, role, skill, location, bio, rate, "createdAt", "smsNotificationsEnabled", "passwordHash", availability, verified) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, false, $11, $12, $13)',
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

  await ensureDemoCredentials(db);

  // --- API Routes ---

  // Get all workers (users with role = 'worker')
  app.get('/api/workers', async (req, res) => {
    try {
      const workers = await db.all("SELECT * FROM users WHERE role = 'worker'");
      res.json(workers.map(formatUser));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get all jobs
  app.get('/api/jobs', async (req, res) => {
    try {
      const jobs = await db.all('SELECT * FROM jobs ORDER BY "createdAt" DESC');
      res.json(jobs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get all connections
  app.get('/api/connections', async (req, res) => {
    try {
      const connections = await db.all('SELECT * FROM connections ORDER BY "createdAt" DESC');
      res.json(connections);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get all applications
  app.get('/api/applications', async (req, res) => {
    try {
      const applications = await db.all('SELECT * FROM applications ORDER BY "createdAt" DESC');
      res.json(applications);
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


  app.post('/api/demo/reset', async (_req, res) => {
    try {
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
  // Auth Operations
  app.post('/api/auth/register', async (req, res) => {
    const { id, name, email, phone, password, role, skill, location, bio, rate, smsNotificationsEnabled, availability } = req.body;
    try {
      if (isBlank(name) || isBlank(phone)) {
        return res.status(400).json({ error: 'Name and phone are required.' });
      }
      if (isBlank(password)) {
        return res.status(400).json({ error: 'Password is required.' });
      }
      if (role && !validRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid user role.' });
      }
      if (availability && !validAvailability.includes(availability)) {
        return res.status(400).json({ error: 'Invalid availability value.' });
      }

      const existingUser = await db.get('SELECT * FROM users WHERE phone = $1 OR (email IS NOT NULL AND email = $2)', [phone, email]);
      if (existingUser) {
        return res.status(400).json({ error: 'A user with this phone or email already exists.' });
      }

      const newId = id || `user-${Date.now()}`;
      const createdAt = new Date().toISOString();
      const passwordHash = hashPassword(password);
      await db.run(
        'INSERT INTO users (id, name, email, phone, role, skill, location, bio, rate, "createdAt", "smsNotificationsEnabled", "passwordHash", availability, verified) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, false)',
        [newId, name.trim(), email || null, phone.trim(), role || 'pending', skill || null, location || null, bio || null, rate || null, createdAt, !!smsNotificationsEnabled, passwordHash, availability || 'available']
      );

      const user = await db.get('SELECT * FROM users WHERE id = $1', [newId]);
      res.json({
        success: true,
        user: formatUser(user)
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { identifier, password } = req.body;
    try {
      if (!identifier || !password) {
        return res.status(400).json({ success: false, error: 'Email/phone and password are required.' });
      }

      const trimmedIdentifier = String(identifier).trim();
      const normalizedPhoneIdentifier = trimmedIdentifier.replace(/[\s-]/g, '');
      const user = await db.get(
        `SELECT * FROM users
          WHERE LOWER(email) = LOWER($1)
            OR phone = $2
            OR REPLACE(REPLACE(phone, ' ', ''), '-', '') = $3`,
        [trimmedIdentifier, trimmedIdentifier, normalizedPhoneIdentifier]
      );
      if (user && verifyPassword(password, user.passwordHash)) {
        return res.json({
          success: true,
          user: formatUser(user)
        });
      }
      res.status(401).json({ success: false, error: 'Invalid email/phone or password.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update profile
  app.post('/api/profile/update', async (req, res) => {
    const { id, name, email, phone, role, skill, location, bio, rate, smsNotificationsEnabled, availability } = req.body;
    try {
      if (isBlank(id) || isBlank(name) || isBlank(phone)) {
        return res.status(400).json({ error: 'User id, name, and phone are required.' });
      }
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid user role.' });
      }
      if (availability && !validAvailability.includes(availability)) {
        return res.status(400).json({ error: 'Invalid availability value.' });
      }

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
          availability = $10
        WHERE id = $11`,
        [name, email || null, phone, role, skill || null, location || null, bio || null, rate || null, !!smsNotificationsEnabled, availability || 'available', id]
      );

      const user = await db.get('SELECT * FROM users WHERE id = $1', [id]);
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

  // Post Job
  app.post('/api/jobs', async (req, res) => {
    const { id, title, employerId, employerName, location, description, rate, phone, actorId } = req.body;
    try {
      if ([title, employerId, employerName, location, description, rate, phone].some(isBlank)) {
        return res.status(400).json({ error: 'Title, employer, location, description, rate, and phone are required.' });
      }
      const employer = await db.get('SELECT * FROM users WHERE id = $1', [actorId || employerId]);
      if (!employer || employer.role !== 'employer' || employer.id !== employerId) {
        return res.status(403).json({ error: 'Only the employer account can post this job.' });
      }

      const newId = id || `job-${Date.now()}`;
      const createdAt = new Date().toISOString();
      await db.run(
        'INSERT INTO jobs (id, title, "employerId", "employerName", location, description, rate, phone, status, "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
        [newId, title, employerId, employerName, location, description, rate, phone, 'open', createdAt]
      );
      const job = await db.get('SELECT * FROM jobs WHERE id = $1', [newId]);
      res.json({ success: true, job });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/jobs/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status, actorId } = req.body;

    if (!validJobStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid job status.' });
    }

    try {
      const job = await db.get('SELECT * FROM jobs WHERE id = $1', [id]);
      if (!job) {
        return res.status(404).json({ error: 'Job not found.' });
      }

      const actorIsEmployer = job.employerId === actorId;
      const actorIsAssignedWorker = job.assignedWorkerId === actorId;
      if (!actorIsEmployer && !actorIsAssignedWorker) {
        return res.status(403).json({ error: 'Only the job owner or assigned worker can update this job status.' });
      }
      if (status === 'completed' && (job.status !== 'in_progress' || !job.assignedWorkerId)) {
        return res.status(400).json({ error: 'Only assigned in-progress jobs can be completed.' });
      }
      if (status === 'in_progress' && (!actorIsEmployer || !job.assignedWorkerId)) {
        return res.status(400).json({ error: 'Accept a worker application before marking this job in progress.' });
      }
      if (job.status === 'completed' && status !== 'completed') {
        return res.status(400).json({ error: 'Completed jobs cannot be reopened from the dashboard.' });
      }

      if (status === 'completed' && actorIsEmployer) {
        await db.run('UPDATE jobs SET "completionRequestedAt" = $1 WHERE id = $2', [new Date().toISOString(), id]);
      } else if (status === 'completed' && actorIsAssignedWorker) {
        if (!job.completionRequestedAt) {
          return res.status(400).json({ error: 'Employer must request completion before the worker confirms.' });
        }
        await db.run('UPDATE jobs SET status = $1, "workerCompletedAt" = $2 WHERE id = $3', [status, new Date().toISOString(), id]);
      } else {
        await db.run('UPDATE jobs SET status = $1, "completionRequestedAt" = NULL, "workerCompletedAt" = NULL WHERE id = $2', [status, id]);
      }

      const updatedJob = await db.get('SELECT * FROM jobs WHERE id = $1', [id]);
      res.json({ success: true, job: updatedJob });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  // Connection Requests
  app.post('/api/connections', async (req, res) => {
    const { id, fromUserId, fromUserName, toUserId, toUserName, message, phone, actorId } = req.body;
    try {
      if ([fromUserId, fromUserName, toUserId, toUserName, phone].some(isBlank)) {
        return res.status(400).json({ error: 'Connection requester, target worker, and phone are required.' });
      }
      const fromUser = await db.get('SELECT * FROM users WHERE id = $1', [actorId || fromUserId]);
      const toUser = await db.get('SELECT * FROM users WHERE id = $1', [toUserId]);
      if (!fromUser || fromUser.role !== 'employer' || fromUser.id !== fromUserId) {
        return res.status(403).json({ error: 'Only employers can initiate hire connections.' });
      }
      if (!toUser || toUser.role !== 'worker') {
        return res.status(400).json({ error: 'Connection target must be a worker.' });
      }

      const newId = id || `conn-${Date.now()}`;
      const createdAt = new Date().toISOString();
      await db.run(
        'INSERT INTO connections (id, "fromUserId", "fromUserName", "toUserId", "toUserName", status, message, phone, "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [newId, fromUserId, fromUserName, toUserId, toUserName, 'pending', message || null, phone || null, createdAt]
      );
      const connection = await db.get('SELECT * FROM connections WHERE id = $1', [newId]);
      res.json({ success: true, connection });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/connections/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status, actorId } = req.body;
    if (!validRequestStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid connection status.' });
    }
    try {
      const connection = await db.get('SELECT * FROM connections WHERE id = $1', [id]);
      if (!connection) {
        return res.status(404).json({ error: 'Connection not found.' });
      }
      if (connection.toUserId !== actorId) {
        return res.status(403).json({ error: 'Only the target worker can update this request.' });
      }
      await db.run('UPDATE connections SET status = $1 WHERE id = $2', [status, id]);
      const updatedConnection = await db.get('SELECT * FROM connections WHERE id = $1', [id]);
      res.json({ success: true, connection: updatedConnection });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Application Actions
  app.post('/api/applications', async (req, res) => {
    const { id, jobId, jobTitle, employerId, applicantId, applicantName, applicantSkill, message, phone, location, actorId } = req.body;
    try {
      if ([jobId, jobTitle, employerId, applicantId, applicantName, applicantSkill, message, phone, location].some(isBlank)) {
        return res.status(400).json({ error: 'Application details, message, phone, and location are required.' });
      }
      const applicant = await db.get('SELECT * FROM users WHERE id = $1', [actorId || applicantId]);
      const job = await db.get('SELECT * FROM jobs WHERE id = $1', [jobId]);
      if (!applicant || applicant.role !== 'worker' || applicant.id !== applicantId) {
        return res.status(403).json({ error: 'Only workers can apply for jobs.' });
      }
      if (!job || job.employerId !== employerId) {
        return res.status(404).json({ error: 'Job not found.' });
      }
      if (job.status !== 'open') {
        return res.status(400).json({ error: 'This job is not open for applications.' });
      }
      const existingApplication = await db.get(
        'SELECT * FROM applications WHERE "jobId" = $1 AND "applicantId" = $2',
        [jobId, applicantId]
      );
      if (existingApplication) {
        return res.status(400).json({ error: 'You have already applied to this job.' });
      }

      const newId = id || `app-${Date.now()}`;
      const createdAt = new Date().toISOString();
      await db.run(
        'INSERT INTO applications (id, "jobId", "jobTitle", "employerId", "applicantId", "applicantName", "applicantSkill", message, phone, location, status, "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)',
        [newId, jobId, jobTitle, employerId, applicantId, applicantName, applicantSkill, message, phone, location, 'pending', createdAt]
      );
      const application = await db.get('SELECT * FROM applications WHERE id = $1', [newId]);
      res.json({ success: true, application });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/applications/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status, actorId } = req.body;
    if (!validRequestStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid application status.' });
    }
    try {
      const application = await db.get('SELECT * FROM applications WHERE id = $1', [id]);
      if (!application) {
        return res.status(404).json({ error: 'Application not found.' });
      }
      if (application.employerId !== actorId) {
        return res.status(403).json({ error: 'Only the job owner can update this application.' });
      }
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
          ['in_progress', application.applicantId, application.applicantName, application.jobId, 'open']
        );
      } else {
        await db.run('UPDATE applications SET status = $1 WHERE id = $2', [status, id]);
      }
      const updatedApplication = await db.get('SELECT * FROM applications WHERE id = $1', [id]);
      res.json({ success: true, application: updatedApplication });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  // Reviews
  app.post('/api/reviews', async (req, res) => {
    const { id, workerId, employerId, employerName, jobId, jobTitle, rating, comment, actorId } = req.body;
    try {
      if ([workerId, employerId, employerName, jobId, jobTitle, comment].some(isBlank) || typeof rating !== 'number' || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Completed job, worker, employer, rating 1-5, and comment are required.' });
      }
      const employer = await db.get('SELECT * FROM users WHERE id = $1', [actorId || employerId]);
      const worker = await db.get('SELECT * FROM users WHERE id = $1', [workerId]);
      const completedJob = await db.get(
        'SELECT * FROM jobs WHERE id = $1 AND "employerId" = $2 AND status = $3',
        [jobId, employerId, 'completed']
      );
      const acceptedApplication = await db.get(
        'SELECT * FROM applications WHERE "jobId" = $1 AND "employerId" = $2 AND "applicantId" = $3 AND status = $4',
        [jobId, employerId, workerId, 'accepted']
      );
      const existingReview = await db.get(
        'SELECT * FROM reviews WHERE "jobId" = $1 AND "workerId" = $2 AND "employerId" = $3',
        [jobId, workerId, employerId]
      );
      if (!employer || employer.role !== 'employer' || employer.id !== employerId) {
        return res.status(403).json({ error: 'Only employers can submit worker reviews.' });
      }
      if (!worker || worker.role !== 'worker') {
        return res.status(400).json({ error: 'Reviews can only target workers.' });
      }
      if (!completedJob || !acceptedApplication) {
        return res.status(403).json({ error: 'Reviews require a completed job with an accepted application for this worker.' });
      }
      if (existingReview) {
        return res.status(400).json({ error: 'This completed job has already been reviewed.' });
      }

      const newId = id || `rev-${Date.now()}`;
      const createdAt = new Date().toISOString();
      await db.run(
        'INSERT INTO reviews (id, "workerId", "employerId", "employerName", "jobId", "jobTitle", rating, comment, "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [newId, workerId, employerId, employerName, completedJob.id, completedJob.title || jobTitle, rating, comment, createdAt]
      );
      const review = await db.get('SELECT * FROM reviews WHERE id = $1', [newId]);
      res.json({ success: true, review });
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
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server", err);
});








