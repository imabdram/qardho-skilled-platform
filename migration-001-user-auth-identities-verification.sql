-- =============================================================================
-- Migration 001 VERIFICATION: Post-Migration Verification Queries
-- Description: Read-only queries to verify correct table creation, constraint
--              enforcement, index presence, and dev identity backfilling.
-- =============================================================================

-- 1. Verify user_auth_identities table structure and metadata
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'user_auth_identities'
ORDER BY ordinal_position;

-- 2. Verify all constraints on user_auth_identities
SELECT conname, contype, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'user_auth_identities'::regclass;

-- 3. Verify created indexes on user_auth_identities
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'user_auth_identities';

-- 4. Count identities grouped by environment
SELECT environment, COUNT(*) AS count
FROM user_auth_identities
GROUP BY environment;

-- 5. Verify backfill consistency: Compare non-null users."clerkUserId" count with user_auth_identities
SELECT 
  (SELECT COUNT(*) FROM users WHERE "clerkUserId" IS NOT NULL AND TRIM("clerkUserId") != '') AS original_users_with_clerk_id,
  (SELECT COUNT(*) FROM user_auth_identities WHERE environment = 'development') AS backfilled_dev_identities;

-- 6. Check for any duplicate clerk_user_id in user_auth_identities (Must return 0 rows)
SELECT clerk_user_id, COUNT(*) AS duplicate_count
FROM user_auth_identities
GROUP BY clerk_user_id
HAVING COUNT(*) > 1;

-- 7. Check for multiple identities per user per environment (Must return 0 rows)
SELECT user_id, environment, COUNT(*) AS duplicate_count
FROM user_auth_identities
GROUP BY user_id, environment
HAVING COUNT(*) > 1;
