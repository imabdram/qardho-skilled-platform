-- =============================================================================
-- Suuqa Xirfadaha - Post-Migration Read-Only Database Verification Script
-- Purpose: Read-only verification checks after executing Clerk Production migration.
-- NOTE: ALL QUERIES ARE STRICTLY READ-ONLY (SELECT STATEMENTS).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- VERIFICATION 1: Linked Clerk Users Summary
-- Expectation: Reports count of users successfully linked to a Clerk ID vs unlinked.
-- Manual Review Action: Ensure active users logging in possess a valid "clerkUserId".
-- -----------------------------------------------------------------------------
SELECT 
  COUNT(CASE WHEN "clerkUserId" IS NOT NULL AND "clerkUserId" != '' THEN 1 END) AS linked_clerk_users,
  COUNT(CASE WHEN "clerkUserId" IS NULL OR "clerkUserId" = '' THEN 1 END) AS unlinked_legacy_users,
  COUNT(*) AS total_users
FROM users;


-- -----------------------------------------------------------------------------
-- VERIFICATION 2: Duplicate clerkUserId Conflict Check
-- Expectation: Must return 0 rows.
-- Manual Review Action: Any row returned indicates a duplicate Clerk ID assignment.
-- -----------------------------------------------------------------------------
SELECT "clerkUserId", COUNT(*) AS duplicate_count, ARRAY_AGG(id) AS user_ids
FROM users
WHERE "clerkUserId" IS NOT NULL AND TRIM("clerkUserId") != ''
GROUP BY "clerkUserId"
HAVING COUNT(*) > 1;


-- -----------------------------------------------------------------------------
-- VERIFICATION 3: Unique Index Existence on "clerkUserId"
-- Expectation: Verifies that users_clerk_user_id_unique index exists on PostgreSQL.
-- Manual Review Action: Confirm index is active and unique.
-- -----------------------------------------------------------------------------
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'users' AND indexname = 'users_clerk_user_id_unique';


-- -----------------------------------------------------------------------------
-- VERIFICATION 4: Admin Role Verification
-- Expectation: Confirms all admin accounts have role = 'admin' and verified = true.
-- Manual Review Action: Ensure no unauthorized accounts hold the 'admin' role.
-- -----------------------------------------------------------------------------
SELECT id, name, email, role, verified, suspended, "clerkUserId"
FROM users
WHERE role = 'admin';


-- -----------------------------------------------------------------------------
-- VERIFICATION 5: Pending Onboarding Users Count
-- Expectation: Reports count of newly registered users currently completing onboarding.
-- Manual Review Action: Monitor pending user conversion to worker or employer role.
-- -----------------------------------------------------------------------------
SELECT id, name, email, role, "createdAt"
FROM users
WHERE role = 'pending';
