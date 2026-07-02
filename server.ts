import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { createServer as createViteServer } from 'vite';

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.use(express.json());

  const PORT = 3000;

  // Initialize SQLite database
  const db = await open({
    filename: path.join(__dirname, 'database.sqlite'),
    driver: sqlite3.Database
  });

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
      createdAt TEXT,
      smsNotificationsEnabled INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      employerId TEXT NOT NULL,
      employerName TEXT NOT NULL,
      location TEXT NOT NULL,
      description TEXT NOT NULL,
      rate TEXT NOT NULL,
      phone TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS connections (
      id TEXT PRIMARY KEY,
      fromUserId TEXT NOT NULL,
      fromUserName TEXT NOT NULL,
      toUserId TEXT NOT NULL,
      toUserName TEXT NOT NULL,
      status TEXT NOT NULL,
      message TEXT,
      phone TEXT,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      jobId TEXT NOT NULL,
      jobTitle TEXT NOT NULL,
      employerId TEXT NOT NULL,
      applicantId TEXT NOT NULL,
      applicantName TEXT NOT NULL,
      applicantSkill TEXT NOT NULL,
      message TEXT NOT NULL,
      phone TEXT NOT NULL,
      location TEXT NOT NULL,
      status TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      workerId TEXT NOT NULL,
      employerId TEXT NOT NULL,
      employerName TEXT NOT NULL,
      rating INTEGER NOT NULL,
      comment TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
  `);

  // Seed data if empty
  const usersCount = await db.get('SELECT COUNT(*) as count FROM users');
  if (usersCount.count === 0) {
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
        location: 'Wadajir',
        bio: 'Certified solar energy installer with over 5 years of experience in installing household panels and system repairs around Qardho.',
        rate: '$20 / day',
        createdAt: new Date().toISOString()
      },
      {
        id: 'worker-2',
        name: 'Halima Farah Gure',
        email: 'halima.farah@example.com',
        phone: '+252 90 655 4321',
        role: 'worker',
        skill: 'Professional Tailor',
        location: 'Horseed',
        bio: 'Expert tailor specializing in traditional Somali garments, school uniforms, and custom embroidery. Fast turnaround and reliable quality.',
        rate: '$15 / day',
        createdAt: new Date().toISOString()
      },
      {
        id: 'worker-3',
        name: 'Yusuf Barre Omar',
        email: 'yusuf.barre@example.com',
        phone: '+252 90 711 9988',
        role: 'worker',
        skill: 'Mason & Builder',
        location: 'Gashan',
        bio: 'Experienced construction mason specializing in blockwork, plastering, and water reservoir/berked construction for homes and agricultural land.',
        rate: '$25 / day',
        createdAt: new Date().toISOString()
      },
      {
        id: 'worker-4',
        name: 'Fartun Said Jama',
        email: 'fartun.said@example.com',
        phone: '+252 90 782 5566',
        role: 'worker',
        skill: 'Primary School Teacher',
        location: 'Bulsho',
        bio: 'Dedicated primary school teacher specializing in Mathematics and Somali literature tutoring. Passionate about helping children succeed.',
        rate: '$12 / day',
        createdAt: new Date().toISOString()
      },
      {
        id: 'worker-5',
        name: 'Jama Duale Abdi',
        email: 'jama.duale@example.com',
        phone: '+252 90 733 4455',
        role: 'worker',
        skill: 'Plumber & Pipefitter',
        location: 'Wadajir',
        bio: 'Reliable plumber with expertise in household piping, solar water heating systems, and water pumps installation.',
        rate: '$18 / day',
        createdAt: new Date().toISOString()
      }
    ];

    for (const w of SAMPLE_WORKERS) {
      await db.run(
        'INSERT INTO users (id, name, email, phone, role, skill, location, bio, rate, createdAt, smsNotificationsEnabled) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)',
        [w.id, w.name, w.email, w.phone, w.role, w.skill, w.location, w.bio, w.rate, w.createdAt]
      );
    }

    // Sample Jobs
    const SAMPLE_JOBS = [
      {
        id: 'job-1',
        title: 'Solar Panel System Installer Needed',
        employerId: 'employer-1',
        employerName: 'Qardho Agricultural Co.',
        location: 'Wadajir',
        description: 'We are looking for an experienced Solar Technician to install a 5KW solar pump system for a local farm outside Qardho. Panels and equipment are provided on site.',
        rate: '$250 Total',
        phone: '+252 90 700 1122',
        createdAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 'job-2',
        title: 'Custom Uniform Tailoring',
        employerId: 'employer-2',
        employerName: 'Darul-Hikmah School',
        location: 'Horseed',
        description: 'Needs a professional tailor to sew 45 sets of student school uniforms. Material will be delivered to your workshop. Looking for high quality stitching.',
        rate: '$150 Total',
        phone: '+252 90 600 3344',
        createdAt: new Date(Date.now() - 172800000).toISOString()
      },
      {
        id: 'job-3',
        title: 'Concrete Plastering Work for Berked',
        employerId: 'employer-3',
        employerName: 'Hassan Gure Farms',
        location: 'Gashan',
        description: 'Mason needed to complete plastering work on a newly built underground concrete water reservoir (berked) to ensure water-tight finish.',
        rate: '$30 / day',
        phone: '+252 90 790 9900',
        createdAt: new Date().toISOString()
      }
    ];

    for (const j of SAMPLE_JOBS) {
      await db.run(
        'INSERT INTO jobs (id, title, employerId, employerName, location, description, rate, phone, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [j.id, j.title, j.employerId, j.employerName, j.location, j.description, j.rate, j.phone, j.createdAt]
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
        'INSERT INTO connections (id, fromUserId, fromUserName, toUserId, toUserName, status, message, phone, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
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
        message: 'Hi, I am extremely interested in this project. I have installed three similar agricultural pump systems in the past year in Wadajir and Gashan.',
        phone: '+252 90 779 1234',
        location: 'Wadajir',
        status: 'pending',
        createdAt: new Date().toISOString()
      }
    ];

    for (const a of SAMPLE_APPLICATIONS) {
      await db.run(
        'INSERT INTO applications (id, jobId, jobTitle, employerId, applicantId, applicantName, applicantSkill, message, phone, location, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
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
        'INSERT INTO reviews (id, workerId, employerId, employerName, rating, comment, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [r.id, r.workerId, r.employerId, r.employerName, r.rating, r.comment, r.createdAt]
      );
    }
  }

  // --- API Routes ---

  // Get all workers (users with role = 'worker')
  app.get('/api/workers', async (req, res) => {
    try {
      const workers = await db.all("SELECT * FROM users WHERE role = 'worker'");
      const formattedWorkers = workers.map(w => ({
        ...w,
        smsNotificationsEnabled: !!w.smsNotificationsEnabled
      }));
      res.json(formattedWorkers);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get all jobs
  app.get('/api/jobs', async (req, res) => {
    try {
      const jobs = await db.all('SELECT * FROM jobs ORDER BY createdAt DESC');
      res.json(jobs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get all connections
  app.get('/api/connections', async (req, res) => {
    try {
      const connections = await db.all('SELECT * FROM connections ORDER BY createdAt DESC');
      res.json(connections);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get all applications
  app.get('/api/applications', async (req, res) => {
    try {
      const applications = await db.all('SELECT * FROM applications ORDER BY createdAt DESC');
      res.json(applications);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get all reviews
  app.get('/api/reviews', async (req, res) => {
    try {
      const reviews = await db.all('SELECT * FROM reviews ORDER BY createdAt DESC');
      res.json(reviews);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Auth Operations
  app.post('/api/auth/register', async (req, res) => {
    const { id, name, email, phone, role, skill, location, bio, rate, smsNotificationsEnabled } = req.body;
    try {
      const existingUser = await db.get('SELECT * FROM users WHERE phone = ? OR (email IS NOT NULL AND email = ?)', [phone, email]);
      if (existingUser) {
        return res.status(400).json({ error: 'A user with this phone or email already exists.' });
      }
      
      const newId = id || `user-${Date.now()}`;
      const createdAt = new Date().toISOString();
      await db.run(
        'INSERT INTO users (id, name, email, phone, role, skill, location, bio, rate, createdAt, smsNotificationsEnabled) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [newId, name, email || null, phone, role || 'pending', skill || null, location || null, bio || null, rate || null, createdAt, smsNotificationsEnabled ? 1 : 0]
      );

      const user = await db.get('SELECT * FROM users WHERE id = ?', [newId]);
      res.json({
        success: true,
        user: { ...user, smsNotificationsEnabled: !!user.smsNotificationsEnabled }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { identifier } = req.body;
    try {
      const user = await db.get(
        'SELECT * FROM users WHERE LOWER(email) = LOWER(?) OR phone = ?',
        [identifier, identifier]
      );
      if (user) {
        return res.json({
          success: true,
          user: { ...user, smsNotificationsEnabled: !!user.smsNotificationsEnabled }
        });
      }
      res.status(444).json({ success: false, error: 'User not found.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update profile
  app.post('/api/profile/update', async (req, res) => {
    const { id, name, email, phone, role, skill, location, bio, rate, smsNotificationsEnabled } = req.body;
    try {
      await db.run(
        `UPDATE users SET 
          name = ?, 
          email = ?, 
          phone = ?, 
          role = ?, 
          skill = ?, 
          location = ?, 
          bio = ?, 
          rate = ?, 
          smsNotificationsEnabled = ? 
        WHERE id = ?`,
        [name, email || null, phone, role, skill || null, location || null, bio || null, rate || null, smsNotificationsEnabled ? 1 : 0, id]
      );

      const user = await db.get('SELECT * FROM users WHERE id = ?', [id]);
      res.json({
        success: true,
        user: { ...user, smsNotificationsEnabled: !!user.smsNotificationsEnabled }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Post Job
  app.post('/api/jobs', async (req, res) => {
    const { id, title, employerId, employerName, location, description, rate, phone } = req.body;
    try {
      const newId = id || `job-${Date.now()}`;
      const createdAt = new Date().toISOString();
      await db.run(
        'INSERT INTO jobs (id, title, employerId, employerName, location, description, rate, phone, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [newId, title, employerId, employerName, location, description, rate, phone, createdAt]
      );
      const job = await db.get('SELECT * FROM jobs WHERE id = ?', [newId]);
      res.json({ success: true, job });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Connection Requests
  app.post('/api/connections', async (req, res) => {
    const { id, fromUserId, fromUserName, toUserId, toUserName, message, phone } = req.body;
    try {
      const newId = id || `conn-${Date.now()}`;
      const createdAt = new Date().toISOString();
      await db.run(
        'INSERT INTO connections (id, fromUserId, fromUserName, toUserId, toUserName, status, message, phone, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [newId, fromUserId, fromUserName, toUserId, toUserName, 'pending', message || null, phone || null, createdAt]
      );
      const connection = await db.get('SELECT * FROM connections WHERE id = ?', [newId]);
      res.json({ success: true, connection });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/connections/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
      await db.run('UPDATE connections SET status = ? WHERE id = ?', [status, id]);
      const connection = await db.get('SELECT * FROM connections WHERE id = ?', [id]);
      res.json({ success: true, connection });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Application Actions
  app.post('/api/applications', async (req, res) => {
    const { id, jobId, jobTitle, employerId, applicantId, applicantName, applicantSkill, message, phone, location } = req.body;
    try {
      const newId = id || `app-${Date.now()}`;
      const createdAt = new Date().toISOString();
      await db.run(
        'INSERT INTO applications (id, jobId, jobTitle, employerId, applicantId, applicantName, applicantSkill, message, phone, location, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [newId, jobId, jobTitle, employerId, applicantId, applicantName, applicantSkill, message, phone, location, 'pending', createdAt]
      );
      const application = await db.get('SELECT * FROM applications WHERE id = ?', [newId]);
      res.json({ success: true, application });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/applications/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
      await db.run('UPDATE applications SET status = ? WHERE id = ?', [status, id]);
      const application = await db.get('SELECT * FROM applications WHERE id = ?', [id]);
      res.json({ success: true, application });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Reviews
  app.post('/api/reviews', async (req, res) => {
    const { id, workerId, employerId, employerName, rating, comment } = req.body;
    try {
      const newId = id || `rev-${Date.now()}`;
      const createdAt = new Date().toISOString();
      await db.run(
        'INSERT INTO reviews (id, workerId, employerId, employerName, rating, comment, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [newId, workerId, employerId, employerName, rating, comment, createdAt]
      );
      const review = await db.get('SELECT * FROM reviews WHERE id = ?', [newId]);
      res.json({ success: true, review });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- Vite & Production Static File Serving Middleware ---
  if (process.env.NODE_ENV !== "production") {
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
