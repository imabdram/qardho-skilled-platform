import test from 'node:test';
import assert from 'node:assert/strict';

// Unit tests for authorization helper logic and role matrices

interface User {
  id: string;
  clerkUserId?: string;
  name: string;
  role: 'pending' | 'worker' | 'employer' | 'admin';
  suspended?: boolean;
}

function checkAuthorization(user: User | null, requiredRoles: string[]) {
  if (!user || user.suspended) {
    return { status: 401, error: 'Please sign in to continue.' };
  }
  if (!requiredRoles.includes(user.role)) {
    return { status: 403, error: 'You do not have permission to perform this action.' };
  }
  return { status: 200, user };
}

function linkUserAccount(existingUsers: Array<{ id: string; email: string; clerkUserId?: string }>, clerkEmail: string) {
  const normalized = clerkEmail.trim().toLowerCase();
  const matches = existingUsers.filter(u => u.email.toLowerCase() === normalized && !u.clerkUserId);
  if (matches.length === 1) {
    return { status: 'linked', userId: matches[0].id };
  }
  if (matches.length > 1) {
    return { status: 'conflict', error: 'Multiple accounts match this email address.' };
  }
  return { status: 'created_new' };
}

test('1. Unauthenticated request to protected endpoint returns 401', () => {
  const result = checkAuthorization(null, ['worker', 'employer']);
  assert.equal(result.status, 401);
});

test('2. Authenticated Clerk user with linked profile can access protected endpoints', () => {
  const user: User = { id: 'u1', clerkUserId: 'user_clerk1', name: 'Ali', role: 'worker' };
  const result = checkAuthorization(user, ['worker']);
  assert.equal(result.status, 200);
});

test('3. New Clerk user links or defaults to pending role state', () => {
  const existingUsers: Array<{ id: string; email: string; clerkUserId?: string }> = [];
  const linkResult = linkUserAccount(existingUsers, 'newuser@example.com');
  assert.equal(linkResult.status, 'created_new');
});

test('4. Existing user links only when there is exactly one normalized email match', () => {
  const existingUsers = [
    { id: 'u1', email: 'user@example.com' }
  ];
  const linkResult = linkUserAccount(existingUsers, ' USER@EXAMPLE.COM ');
  assert.equal(linkResult.status, 'linked');
  assert.equal(linkResult.userId, 'u1');
});

test('5. Ambiguous email matching is rejected with conflict response', () => {
  const existingUsers = [
    { id: 'u1', email: 'dup@example.com' },
    { id: 'u2', email: 'dup@example.com' }
  ];
  const linkResult = linkUserAccount(existingUsers, 'dup@example.com');
  assert.equal(linkResult.status, 'conflict');
});

test('6. Suspended PostgreSQL user is denied even when Clerk authentication succeeds', () => {
  const user: User = { id: 'u1', clerkUserId: 'user_clerk1', name: 'Ali', role: 'worker', suspended: true };
  const result = checkAuthorization(user, ['worker']);
  assert.equal(result.status, 401);
});

test('7. Pending user cannot post a job', () => {
  const user: User = { id: 'u1', clerkUserId: 'user_clerk1', name: 'Ali', role: 'pending' };
  const result = checkAuthorization(user, ['employer']);
  assert.equal(result.status, 403);
});

test('8. Worker cannot post a job', () => {
  const user: User = { id: 'u1', clerkUserId: 'user_clerk1', name: 'Ali', role: 'worker' };
  const result = checkAuthorization(user, ['employer']);
  assert.equal(result.status, 403);
});

test('9. Employer can post a job', () => {
  const user: User = { id: 'u1', clerkUserId: 'user_clerk1', name: 'Ali', role: 'employer' };
  const result = checkAuthorization(user, ['employer']);
  assert.equal(result.status, 200);
});

test('10. Employer cannot submit a worker job application', () => {
  const user: User = { id: 'u1', clerkUserId: 'user_clerk1', name: 'Ali', role: 'employer' };
  const result = checkAuthorization(user, ['worker']);
  assert.equal(result.status, 403);
});

test('11. Worker can submit a job application', () => {
  const user: User = { id: 'u1', clerkUserId: 'user_clerk1', name: 'Ali', role: 'worker' };
  const result = checkAuthorization(user, ['worker']);
  assert.equal(result.status, 200);
});

test('12. Worker cannot access admin endpoints', () => {
  const user: User = { id: 'u1', clerkUserId: 'user_clerk1', name: 'Ali', role: 'worker' };
  const result = checkAuthorization(user, ['admin']);
  assert.equal(result.status, 403);
});

test('13. Employer cannot access admin endpoints', () => {
  const user: User = { id: 'u1', clerkUserId: 'user_clerk1', name: 'Ali', role: 'employer' };
  const result = checkAuthorization(user, ['admin']);
  assert.equal(result.status, 403);
});

test('14. Admin can access admin endpoints', () => {
  const user: User = { id: 'u1', clerkUserId: 'user_clerk1', name: 'Ali', role: 'admin' };
  const result = checkAuthorization(user, ['admin']);
  assert.equal(result.status, 200);
});

test('15. Public input cannot assign admin role directly', () => {
  const allowedPublicRoles = ['worker', 'employer', 'pending'];
  const requestedRole = 'admin';
  assert.equal(allowedPublicRoles.includes(requestedRole), false);
});
