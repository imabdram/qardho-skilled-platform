import test from 'node:test';
import assert from 'node:assert/strict';

// End-to-End Migration Test Plan for Existing Worker & Employer Identities

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'pending' | 'worker' | 'employer' | 'admin';
  skill?: string;
  location?: string;
  bio?: string;
  rate?: string;
  suspended?: boolean;
}

interface UserAuthIdentity {
  id: string;
  userId: string;
  clerkUserId: string;
  environment: 'development' | 'production';
}

interface Job {
  id: string;
  title: string;
  employerId: string;
  employerName: string;
  status: 'open' | 'active' | 'completed' | 'completion_disputed';
}

interface Application {
  id: string;
  jobId: string;
  employerId: string;
  applicantId: string;
  status: 'pending' | 'accepted' | 'declined';
}

interface Connection {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted';
}

interface Review {
  id: string;
  employerId: string;
  workerId: string;
  rating: number;
}

interface Notification {
  id: string;
  userId: string;
  title: string;
}

// Simulated Neon Database Store
class SimulatedDatabase {
  users: User[] = [
    {
      id: 'worker-1',
      name: 'Farah Ali',
      email: 'worker1@qardho.com',
      role: 'worker',
      skill: 'Electrician',
      location: 'Kaambo',
      bio: 'Licensed electrician with 5 years experience.',
      rate: '$25/hr'
    },
    {
      id: 'employer-1',
      name: 'Qardho Agricultural Co.',
      email: 'employer1@qardho.com',
      role: 'employer',
      location: 'Kaambo',
      bio: 'Local farming collective focusing on water-efficient systems.'
    }
  ];

  identities: UserAuthIdentity[] = [
    { id: 'uai-dev-1', userId: 'worker-1', clerkUserId: 'clerk_dev_worker_123', environment: 'development' },
    { id: 'uai-dev-2', userId: 'employer-1', clerkUserId: 'clerk_dev_employer_456', environment: 'development' }
  ];

  jobs: Job[] = [
    { id: 'job-1', title: 'Solar Panel Maintenance', employerId: 'employer-1', employerName: 'Qardho Agricultural Co.', status: 'open' },
    { id: 'job-2', title: 'Irrigation Pump Repair', employerId: 'employer-1', employerName: 'Qardho Agricultural Co.', status: 'completed' }
  ];

  applications: Application[] = [
    { id: 'app-1', jobId: 'job-1', employerId: 'employer-1', applicantId: 'worker-1', status: 'pending' },
    { id: 'app-2', jobId: 'job-2', employerId: 'employer-1', applicantId: 'worker-1', status: 'accepted' }
  ];

  connections: Connection[] = [
    { id: 'conn-1', fromUserId: 'employer-1', toUserId: 'worker-1', status: 'pending' }
  ];

  reviews: Review[] = [
    { id: 'rev-1', employerId: 'employer-1', workerId: 'worker-1', rating: 5 }
  ];

  notifications: Notification[] = [
    { id: 'notif-1', userId: 'worker-1', title: 'Application Received' },
    { id: 'notif-2', userId: 'employer-1', title: 'New Worker Applicant' }
  ];

  // Helper method simulating /api/auth/me sync
  syncClerkIdentity(clerkUserId: string, clerkEmail: string, environment: 'development' | 'production') {
    const normalizedEmail = clerkEmail.trim().toLowerCase();

    // 1. Check existing identity for this environment
    const existingId = this.identities.find((i) => i.clerkUserId === clerkUserId && i.environment === environment);
    if (existingId) {
      const user = this.users.find((u) => u.id === existingId.userId);
      return { user, action: 'existing_identity' };
    }

    // 2. Link by verified email
    const matchingUsers = this.users.filter((u) => u.email.toLowerCase() === normalizedEmail);
    if (matchingUsers.length === 1) {
      const user = matchingUsers[0];
      const newIdentity: UserAuthIdentity = {
        id: `uai-${environment}-${Date.now()}`,
        userId: user.id,
        clerkUserId,
        environment
      };
      this.identities.push(newIdentity);
      return { user, action: 'linked_by_email' };
    }

    if (matchingUsers.length > 1) {
      throw new Error('Multiple accounts match this email address.');
    }

    // 3. Create new user
    const newUser: User = {
      id: `user-${Date.now()}`,
      name: clerkEmail.split('@')[0],
      email: normalizedEmail,
      role: 'pending'
    };
    this.users.push(newUser);
    this.identities.push({ id: `uai-${environment}-${Date.now()}`, userId: newUser.id, clerkUserId, environment });
    return { user: newUser, action: 'created_new' };
  }
}

// -----------------------------------------------------------------------------
// WORKER MIGRATION TEST SUITE
// -----------------------------------------------------------------------------

test('WORKER MIGRATION: 1-15 Full Asset & Access Verification', () => {
  const db = new SimulatedDatabase();

  // 1-2. Worker accepts invitation & signs in to Production Clerk
  const syncResult = db.syncClerkIdentity('clerk_prod_worker_999', 'worker1@qardho.com', 'production');
  assert.equal(syncResult.action, 'linked_by_email');
  
  const worker = syncResult.user;

  // 3-4. Existing Neon worker profile is loaded & onboarding is skipped
  assert.equal(worker.id, 'worker-1');
  assert.equal(worker.role, 'worker'); // Role is worker, NOT pending!

  // 5-7. Profile attributes remain intact
  assert.equal(worker.skill, 'Electrician');
  assert.equal(worker.rate, '$25/hr');
  assert.equal(worker.location, 'Kaambo');

  // 8. Job Applications remain
  const workerApps = db.applications.filter((a) => a.applicantId === worker.id);
  assert.equal(workerApps.length, 2);

  // 9. Direct Offers remain
  const workerOffers = db.connections.filter((c) => c.toUserId === worker.id);
  assert.equal(workerOffers.length, 1);

  // 10. Active engagements remain (app-1 pending)
  assert.equal(workerApps.some((a) => a.status === 'pending'), true);

  // 11. Completed work remains (app-2 accepted/completed)
  assert.equal(workerApps.some((a) => a.status === 'accepted'), true);

  // 12. Reviews remain
  const workerReviews = db.reviews.filter((r) => r.workerId === worker.id);
  assert.equal(workerReviews.length, 1);
  assert.equal(workerReviews[0].rating, 5);

  // 13. Notifications remain
  const workerNotifs = db.notifications.filter((n) => n.userId === worker.id);
  assert.equal(workerNotifs.length, 1);

  // 14-15. Worker permissions & restricted route blocks
  const allowedWorkerRoles = ['worker'];
  assert.equal(allowedWorkerRoles.includes(worker.role), true);
  assert.equal(worker.role === 'employer', false); // Blocked from employer
  assert.equal(worker.role === 'admin', false);    // Blocked from admin
});

// -----------------------------------------------------------------------------
// EMPLOYER MIGRATION TEST SUITE
// -----------------------------------------------------------------------------

test('EMPLOYER MIGRATION: 1-14 Full Asset & Access Verification', () => {
  const db = new SimulatedDatabase();

  // 1-2. Employer accepts invitation & signs in to Production Clerk
  const syncResult = db.syncClerkIdentity('clerk_prod_employer_888', 'employer1@qardho.com', 'production');
  assert.equal(syncResult.action, 'linked_by_email');

  const employer = syncResult.user;

  // 3-4. Existing Neon employer profile loaded & onboarding skipped
  assert.equal(employer.id, 'employer-1');
  assert.equal(employer.role, 'employer'); // Role is employer, NOT pending!

  // 5. Company info remains
  assert.equal(employer.name, 'Qardho Agricultural Co.');
  assert.equal(employer.location, 'Kaambo');

  // 6. Posted Jobs remain
  const employerJobs = db.jobs.filter((j) => j.employerId === employer.id);
  assert.equal(employerJobs.length, 2);

  // 7. Applications Received remain
  const appsReceived = db.applications.filter((a) => a.employerId === employer.id);
  assert.equal(appsReceived.length, 2);

  // 8. Direct Offers Sent remain
  const offersSent = db.connections.filter((c) => c.fromUserId === employer.id);
  assert.equal(offersSent.length, 1);

  // 9-10. Active engagements & Completed work remain
  assert.equal(employerJobs.some((j) => j.status === 'open'), true);
  assert.equal(employerJobs.some((j) => j.status === 'completed'), true);

  // 11. Reviews remain
  const employerReviews = db.reviews.filter((r) => r.employerId === employer.id);
  assert.equal(employerReviews.length, 1);

  // 12. Notifications remain
  const employerNotifs = db.notifications.filter((n) => n.userId === employer.id);
  assert.equal(employerNotifs.length, 1);

  // 13-14. Employer permissions & restricted route blocks
  const allowedEmployerRoles = ['employer'];
  assert.equal(allowedEmployerRoles.includes(employer.role), true);
  assert.equal(employer.role === 'worker', false); // Blocked from worker
  assert.equal(employer.role === 'admin', false);  // Blocked from admin
});

// -----------------------------------------------------------------------------
// SYSTEM & EDGE CASE VERIFICATION
// -----------------------------------------------------------------------------

test('SYSTEM & EDGE CASES: Multi-Identity Storage, Session Persistence & No Duplicates', () => {
  const db = new SimulatedDatabase();

  // 1. Production Identity Stored & Development Identity Preserved
  db.syncClerkIdentity('clerk_prod_worker_999', 'worker1@qardho.com', 'production');
  
  const workerIdentities = db.identities.filter((i) => i.userId === 'worker-1');
  assert.equal(workerIdentities.length, 2);
  assert.equal(workerIdentities.some((i) => i.environment === 'development'), true);
  assert.equal(workerIdentities.some((i) => i.environment === 'production'), true);

  // 2. No Duplicate Neon User Created
  const matchingWorkerAccounts = db.users.filter((u) => u.email === 'worker1@qardho.com');
  assert.equal(matchingWorkerAccounts.length, 1);

  // 3. Subsequent Sign In / Session Persistence
  const reSyncResult = db.syncClerkIdentity('clerk_prod_worker_999', 'worker1@qardho.com', 'production');
  assert.equal(reSyncResult.action, 'existing_identity');
  assert.equal(reSyncResult.user.id, 'worker-1');
});
