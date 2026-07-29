import { createClerkClient } from '@clerk/backend';
import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const clerkSecretKey = process.env.CLERK_SECRET_KEY;
const databaseUrl = process.env.DATABASE_URL;

if (!clerkSecretKey) {
  console.error('CLERK_SECRET_KEY missing');
  process.exit(1);
}

const clerk = createClerkClient({ secretKey: clerkSecretKey });

async function main() {
  const email = 'dhomdesign1@gmail.com';
  const password = 'demo@2026';
  const name = 'Admin Dhom';

  console.log(`Checking if user ${email} exists in Clerk...`);
  const existingUsers = await clerk.users.getUserList({ emailAddress: [email] });

  let clerkUser;
  if (existingUsers.data.length > 0) {
    clerkUser = existingUsers.data[0];
    console.log(`Clerk user already exists with ID: ${clerkUser.id}`);
  } else {
    console.log(`Creating new Clerk user for ${email}...`);
    clerkUser = await clerk.users.createUser({
      emailAddress: [email],
      password: password,
      firstName: 'Admin',
      lastName: 'Dhom',
      skipPasswordRequirement: false,
    });
    console.log(`Successfully created Clerk user: ${clerkUser.id}`);
  }

  // Now sync/upsert into PostgreSQL database with role 'admin'
  if (databaseUrl) {
    console.log('Syncing into PostgreSQL database...');
    const pool = new Pool({ connectionString: databaseUrl });
    const createdAt = new Date().toISOString();

    // Check if postgres user exists with this email or clerkUserId
    const res = await pool.query('SELECT * FROM users WHERE "clerkUserId" = $1 OR LOWER(email) = $2', [clerkUser.id, email.toLowerCase()]);
    
    if (res.rows.length > 0) {
      const existingPgUser = res.rows[0];
      console.log(`Found existing PostgreSQL user: ${existingPgUser.id} (${existingPgUser.role})`);
      await pool.query(
        'UPDATE users SET "clerkUserId" = $1, role = \'admin\', verified = true, name = COALESCE(name, $2) WHERE id = $3',
        [clerkUser.id, name, existingPgUser.id]
      );
      console.log(`Updated user ${existingPgUser.id} role to 'admin' in PostgreSQL.`);
    } else {
      const newId = `admin-dhom-${Date.now()}`;
      await pool.query(
        `INSERT INTO users (
          id, "clerkUserId", name, email, phone, role, verified, suspended, "createdAt", availability
        ) VALUES ($1, $2, $3, $4, $5, 'admin', true, false, $6, 'available')`,
        [newId, clerkUser.id, name, email.toLowerCase(), '+252907000000', createdAt]
      );
      console.log(`Created new PostgreSQL admin user record ${newId}.`);
    }

    await pool.end();
  }

  console.log('DONE!');
}

main().catch(err => {
  console.error('Error creating Clerk admin:', err);
  process.exit(1);
});
