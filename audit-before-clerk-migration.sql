-- =============================================================================
-- Suuqa Xirfadaha - Pre-Migration Read-Only Database Audit Script
-- Purpose: Read-only safety checks to identify account anomalies, duplicate emails,
--          unlinked Clerk IDs, and orphaned records before Clerk production migration.
-- NOTE: ALL QUERIES ARE STRICTLY READ-ONLY (SELECT STATEMENTS). NO WRITES OR DELETIONS.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- CHECK 1: Total Users
-- Expectation: Total count of records in users table.
-- Manual Review Action: Verify against expected database user count.
-- -----------------------------------------------------------------------------
SELECT COUNT(*) AS total_users FROM users;


-- -----------------------------------------------------------------------------
-- CHECK 2: Users with Missing Email
-- Expectation: Identifies profiles created without an email address.
-- Manual Review Action: Accounts with missing email cannot be auto-linked to Clerk
--                       by email matching. Note IDs for manual verification.
-- -----------------------------------------------------------------------------
SELECT id, name, role, "clerkUserId", "createdAt"
FROM users
WHERE email IS NULL OR TRIM(email) = '';


-- -----------------------------------------------------------------------------
-- CHECK 3: Users with Duplicate Email Addresses
-- Expectation: Identifies multiple database profiles sharing the same email address.
-- Manual Review Action: CRITICAL. If count > 1, auto-linking returns 409 Conflict.
--                       Owner must decide which account to keep before migration.
-- -----------------------------------------------------------------------------
SELECT LOWER(TRIM(email)) AS normalized_email, COUNT(*) AS duplicate_count, ARRAY_AGG(id) AS user_ids, ARRAY_AGG(role) AS roles
FROM users
WHERE email IS NOT NULL AND TRIM(email) != ''
GROUP BY LOWER(TRIM(email))
HAVING COUNT(*) > 1;


-- -----------------------------------------------------------------------------
-- CHECK 4: Users with Missing clerkUserId
-- Expectation: Unlinked accounts (legacy database profiles not yet linked to Clerk).
-- Manual Review Action: Normal prior to migration. When users log in via Clerk,
--                       backend auto-links matching emails or creates new records.
-- -----------------------------------------------------------------------------
SELECT id, name, email, role, "createdAt"
FROM users
WHERE "clerkUserId" IS NULL OR TRIM("clerkUserId") = '';


-- -----------------------------------------------------------------------------
-- CHECK 5: Duplicate clerkUserId Values
-- Expectation: Should return 0 rows due to UNIQUE index on users("clerkUserId").
-- Manual Review Action: CRITICAL. Any duplicates indicate database corruption or
--                       dual identity binding. Must resolve before proceeding.
-- -----------------------------------------------------------------------------
SELECT "clerkUserId", COUNT(*) AS duplicate_count, ARRAY_AGG(id) AS user_ids, ARRAY_AGG(role) AS roles
FROM users
WHERE "clerkUserId" IS NOT NULL AND TRIM("clerkUserId") != ''
GROUP BY "clerkUserId"
HAVING COUNT(*) > 1;


-- -----------------------------------------------------------------------------
-- CHECK 6: Admin and Super-Admin Accounts
-- Expectation: Lists elevated platform administrator accounts.
-- Manual Review Action: Confirm only authorized platform admins possess role='admin'.
-- -----------------------------------------------------------------------------
SELECT id, name, email, role, verified, suspended, "clerkUserId"
FROM users
WHERE role IN ('admin', 'super_admin');


-- -----------------------------------------------------------------------------
-- CHECK 7: Suspended Accounts
-- Expectation: Lists users whose accounts are marked suspended = true.
-- Manual Review Action: Verify these accounts remain blocked from logging in.
-- -----------------------------------------------------------------------------
SELECT id, name, email, role, suspended, "clerkUserId"
FROM users
WHERE suspended = true;


-- -----------------------------------------------------------------------------
-- CHECK 8: Deleted or Deactivated Accounts
-- Expectation: Identifies soft-deleted or deactivated users.
-- Manual Review Action: Confirm legacy deactivated accounts should not be reactivated.
-- -----------------------------------------------------------------------------
SELECT id, name, email, role, availability, suspended, "clerkUserId"
FROM users
WHERE role IN ('deleted', 'deactivated') OR availability = 'deactivated';


-- -----------------------------------------------------------------------------
-- CHECK 9: Users Without Worker or Employer Profile Data
-- Expectation: Users with role 'worker' or 'employer' missing location or skills.
-- Manual Review Action: Incomplete profiles may require user to complete onboarding.
-- -----------------------------------------------------------------------------
SELECT id, name, email, role, skill, location, bio
FROM users
WHERE role IN ('worker', 'employer')
  AND (location IS NULL OR TRIM(location) = '' OR (role = 'worker' AND (skill IS NULL OR TRIM(skill) = '')));


-- -----------------------------------------------------------------------------
-- CHECK 10: Jobs with Missing Employer References
-- Expectation: Orphaned jobs where employerId does not match any user in users table.
-- Manual Review Action: If rows exist, job post belongs to a deleted employer ID.
-- -----------------------------------------------------------------------------
SELECT j.id AS job_id, j.title, j."employerId", j."employerName", j.status
FROM jobs j
LEFT JOIN users u ON j."employerId" = u.id
WHERE u.id IS NULL;


-- -----------------------------------------------------------------------------
-- CHECK 11: Applications with Missing Worker References
-- Expectation: Applications where applicantId does not match any user in users table.
-- Manual Review Action: Identifies orphaned application entries from deleted workers.
-- -----------------------------------------------------------------------------
SELECT a.id AS application_id, a."jobId", a."applicantId", a."applicantName", a.status
FROM applications a
LEFT JOIN users u ON a."applicantId" = u.id
WHERE u.id IS NULL;


-- -----------------------------------------------------------------------------
-- CHECK 12: Direct Offers with Missing Worker or Employer References
-- Expectation: Connection offers where fromUserId or toUserId is missing from users.
-- Manual Review Action: Identifies broken direct hire connections.
-- -----------------------------------------------------------------------------
SELECT c.id AS connection_id, c."fromUserId", c."fromUserName", c."toUserId", c."toUserName", c.status
FROM connections c
LEFT JOIN users u_from ON c."fromUserId" = u_from.id
LEFT JOIN users u_to ON c."toUserId" = u_to.id
WHERE u_from.id IS NULL OR u_to.id IS NULL;


-- -----------------------------------------------------------------------------
-- CHECK 13: Reviews with Missing Reviewer or Reviewee References
-- Expectation: Reviews referencing non-existent employerId or workerId.
-- Manual Review Action: Identifies orphaned review records.
-- -----------------------------------------------------------------------------
SELECT r.id AS review_id, r."employerId" AS reviewer_id, r."workerId" AS reviewee_id, r.rating
FROM reviews r
LEFT JOIN users u_reviewer ON r."employerId" = u_reviewer.id
LEFT JOIN users u_reviewee ON r."workerId" = u_reviewee.id
WHERE u_reviewer.id IS NULL OR u_reviewee.id IS NULL;


-- -----------------------------------------------------------------------------
-- CHECK 14: Orphaned Application Records (Missing Job)
-- Expectation: Applications pointing to a jobId that no longer exists in jobs table.
-- Manual Review Action: Identifies dangling applications for deleted job posts.
-- -----------------------------------------------------------------------------
SELECT a.id AS application_id, a."jobId", a."applicantName"
FROM applications a
LEFT JOIN jobs j ON a."jobId" = j.id
WHERE j.id IS NULL;


-- -----------------------------------------------------------------------------
-- CHECK 15: Actual Data Type of users.id Column
-- Expectation: Returns column metadata (data_type, is_nullable) for users.id.
-- Manual Review Action: Verify users.id is text/varchar type.
-- -----------------------------------------------------------------------------
SELECT column_name, data_type, character_maximum_length, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'id';


-- -----------------------------------------------------------------------------
-- CHECK 16: Actual Name and Type of the Clerk ID Column
-- Expectation: Returns column metadata for "clerkUserId".
-- Manual Review Action: Verify "clerkUserId" column exists as text type with NULL allowed.
-- -----------------------------------------------------------------------------
SELECT column_name, data_type, character_maximum_length, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'clerkUserId';
