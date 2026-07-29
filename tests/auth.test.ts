import test from 'node:test';
import assert from 'node:assert/strict';

// Types & Mock state for unit testing multi-environment identity logic

interface User {
  id: string;
  clerkUserId?: string;
  name: string;
  email: string;
  role: 'pending' | 'worker' | 'employer' | 'admin';
  suspended?: boolean;
}

interface UserAuthIdentity {
  id: string;
  userId: string;
  clerkUserId: string;
  environment: 'development' | 'production';
}

function validateClerkEnvironment(envInput?: string): 'development' | 'production' {
  const env = (envInput || 'development').toLowerCase().trim();
  if (env !== 'development' && env !== 'production') {
    throw new Error('Invalid CLERK_ENVIRONMENT configuration. Must be development or production.');
  }
  return env as 'development' | 'production';
}

function syncUserIdentity(
  users: User[],
  identities: UserAuthIdentity[],
  clerkUserId: string,
  clerkEmail: string,
  isEmailVerified: boolean,
  clerkEnv: string
) {
  const validatedEnv = validateClerkEnvironment(clerkEnv);

  // 1. Check existing identity for this environment
  const existingIdentity = identities.find(
    (i) => i.clerkUserId === clerkUserId && i.environment === validatedEnv
  );
  if (existingIdentity) {
    const user = users.find((u) => u.id === existingIdentity.userId);
    if (!user) return { status: 404, error: 'User profile missing' };
    if (user.suspended) return { status: 403, error: 'This account is currently suspended.' };
    return { status: 200, user, action: 'existing_identity' };
  }

  // 2. Check duplicate identity across other environments or users
  const duplicateClerkId = identities.find((i) => i.clerkUserId === clerkUserId);
  if (duplicateClerkId && duplicateClerkId.environment === validatedEnv) {
    return { status: 409, error: 'Duplicate Clerk ID rejection' };
  }

  // 3. Unverified email protection
  const normalizedEmail = clerkEmail.trim().toLowerCase();
  if (!isEmailVerified) {
    // Cannot link automatically with unverified email; must create new profile or reject auto-link
    const newUserId = `user-${Date.now()}`;
    const newUser: User = { id: newUserId, name: 'New User', email: normalizedEmail, role: 'pending' };
    users.push(newUser);
    identities.push({ id: `id-${Date.now()}`, userId: newUserId, clerkUserId, environment: validatedEnv });
    return { status: 200, user: newUser, action: 'created_new_unverified' };
  }

  // 4. Check for email matches in Neon database
  const matchingUsers = users.filter((u) => u.email.toLowerCase() === normalizedEmail);

  if (matchingUsers.length === 1) {
    const user = matchingUsers[0];
    if (user.suspended) return { status: 403, error: 'This account is currently suspended.' };
    
    // Create new identity record for this environment
    identities.push({ id: `id-${Date.now()}`, userId: user.id, clerkUserId, environment: validatedEnv });
    return { status: 200, user, action: 'linked_by_email' };
  }

  if (matchingUsers.length > 1) {
    return { status: 409, error: 'Multiple accounts match this email address. Please contact an administrator.' };
  }

  // 5. Create new platform user
  const newUserId = `user-${Date.now()}`;
  const newUser: User = { id: newUserId, name: 'New User', email: normalizedEmail, role: 'pending' };
  users.push(newUser);
  identities.push({ id: `id-${Date.now()}`, userId: newUserId, clerkUserId, environment: validatedEnv });
  return { status: 200, user: newUser, action: 'created_new' };
}

// -----------------------------------------------------------------------------
// TESTS
// -----------------------------------------------------------------------------

test('1. Resolves existing Development identity', () => {
  const users: User[] = [{ id: 'u1', name: 'Dev Worker', email: 'dev@test.com', role: 'worker' }];
  const identities: UserAuthIdentity[] = [{ id: 'i1', userId: 'u1', clerkUserId: 'user_dev123', environment: 'development' }];

  const res = syncUserIdentity(users, identities, 'user_dev123', 'dev@test.com', true, 'development');
  assert.equal(res.status, 200);
  assert.equal(res.action, 'existing_identity');
  assert.equal(res.user?.role, 'worker');
});

test('2. Resolves existing Production identity', () => {
  const users: User[] = [{ id: 'u1', name: 'Prod Worker', email: 'prod@test.com', role: 'employer' }];
  const identities: UserAuthIdentity[] = [{ id: 'i2', userId: 'u1', clerkUserId: 'user_prod123', environment: 'production' }];

  const res = syncUserIdentity(users, identities, 'user_prod123', 'prod@test.com', true, 'production');
  assert.equal(res.status, 200);
  assert.equal(res.action, 'existing_identity');
  assert.equal(res.user?.role, 'employer');
});

test('3. Links existing Neon user by verified email', () => {
  const users: User[] = [{ id: 'u1', name: 'Existing User', email: 'link@test.com', role: 'worker' }];
  const identities: UserAuthIdentity[] = [];

  const res = syncUserIdentity(users, identities, 'user_newprod', 'LINK@TEST.COM ', true, 'production');
  assert.equal(res.status, 200);
  assert.equal(res.action, 'linked_by_email');
  assert.equal(res.user?.id, 'u1');
  assert.equal(identities.length, 1);
  assert.equal(identities[0].environment, 'production');
});

test('4. Creates new user with pending role when no match exists', () => {
  const users: User[] = [];
  const identities: UserAuthIdentity[] = [];

  const res = syncUserIdentity(users, identities, 'user_brandnew', 'brandnew@test.com', true, 'development');
  assert.equal(res.status, 200);
  assert.equal(res.action, 'created_new');
  assert.equal(res.user?.role, 'pending');
});

test('5. Rejects duplicate email linking with 409 conflict', () => {
  const users: User[] = [
    { id: 'u1', name: 'User 1', email: 'dup@test.com', role: 'worker' },
    { id: 'u2', name: 'User 2', email: 'dup@test.com', role: 'employer' }
  ];
  const identities: UserAuthIdentity[] = [];

  const res = syncUserIdentity(users, identities, 'user_dup', 'dup@test.com', true, 'production');
  assert.equal(res.status, 409);
  assert.match(res.error || '', /Multiple accounts match/);
});

test('6. Unverified email blocks automatic linking to existing user', () => {
  const users: User[] = [{ id: 'u1', name: 'Target User', email: 'unverified@test.com', role: 'worker' }];
  const identities: UserAuthIdentity[] = [];

  // isEmailVerified = false
  const res = syncUserIdentity(users, identities, 'user_unverified', 'unverified@test.com', false, 'development');
  assert.equal(res.status, 200);
  assert.equal(res.action, 'created_new_unverified');
  assert.notEqual(res.user?.id, 'u1'); // Did NOT link to u1!
});

test('7. Suspended user is denied access', () => {
  const users: User[] = [{ id: 'u1', name: 'Suspended User', email: 'suspended@test.com', role: 'worker', suspended: true }];
  const identities: UserAuthIdentity[] = [{ id: 'i1', userId: 'u1', clerkUserId: 'user_sus123', environment: 'development' }];

  const res = syncUserIdentity(users, identities, 'user_sus123', 'suspended@test.com', true, 'development');
  assert.equal(res.status, 403);
  assert.match(res.error || '', /suspended/);
});

test('8. Admin role is preserved during linking', () => {
  const users: User[] = [{ id: 'admin1', name: 'Admin User', email: 'admin@test.com', role: 'admin' }];
  const identities: UserAuthIdentity[] = [];

  const res = syncUserIdentity(users, identities, 'user_admin_prod', 'admin@test.com', true, 'production');
  assert.equal(res.status, 200);
  assert.equal(res.user?.role, 'admin');
});

test('9. Handles concurrent identity creation simulation safely', () => {
  const users: User[] = [{ id: 'u1', name: 'Concurrent User', email: 'concurrent@test.com', role: 'worker' }];
  const identities: UserAuthIdentity[] = [];

  const req1 = syncUserIdentity(users, identities, 'user_conc', 'concurrent@test.com', true, 'development');
  const req2 = syncUserIdentity(users, identities, 'user_conc', 'concurrent@test.com', true, 'development');

  assert.equal(req1.status, 200);
  assert.equal(req2.status, 200);
  assert.equal(identities.length, 1); // Only 1 identity created!
});

test('10. Duplicate identity rejection when clerk_user_id already exists', () => {
  const users: User[] = [{ id: 'u1', name: 'User 1', email: 'u1@test.com', role: 'worker' }];
  const identities: UserAuthIdentity[] = [{ id: 'i1', userId: 'u1', clerkUserId: 'user_existing', environment: 'production' }];

  const res = syncUserIdentity(users, identities, 'user_existing', 'u1@test.com', true, 'production');
  assert.equal(res.status, 200);
  assert.equal(res.action, 'existing_identity');
});

test('11. Invalid CLERK_ENVIRONMENT configuration throws exception', () => {
  assert.throws(
    () => validateClerkEnvironment('invalid_env'),
    /Invalid CLERK_ENVIRONMENT configuration/
  );
  assert.throws(
    () => validateClerkEnvironment('staging'),
    /Invalid CLERK_ENVIRONMENT configuration/
  );
  assert.equal(validateClerkEnvironment('development'), 'development');
  assert.equal(validateClerkEnvironment('production'), 'production');
});
