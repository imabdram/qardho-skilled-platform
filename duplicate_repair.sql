-- =============================================================================
-- duplicate_repair.sql
-- Repair plan for duplicate Neon users found during the Dev→Prod audit.
-- =============================================================================
-- IMPORTANT: Read every section carefully before executing.
-- Run queries in order. Each block is wrapped in a transaction so you can
-- roll back if the results look wrong before COMMIT.
--
-- Identified duplicate pairs
-- ─────────────────────────────────────────────────────────────────────────────
-- Email: dhomdesign1@gmail.com
--   ORIGINAL:   user-1785349899757-d0ce3df7  (admin, created 2026-07-29T18:31:39Z)
--   DUPLICATE:  user-1785362828013-e48753ee  (admin, created 2026-07-29T22:07:08Z)
--   Both have 0 jobs / 0 apps / 0 connections. Identity rows are dev-only.
--
-- Email: go.wi.be@gmail.com  (3 records)
--   ORIGINAL:   user-1785158927047-d2775307  (employer, created 2026-07-27T13:28:47Z)
--                                             → has 1 job, 1 app, 1 connection
--   EMPTY:      user-1785155115895-7d76c921  (pending,  created 2026-07-27T12:25:15Z)
--   DUPLICATE:  user-1785366186092-ed2de25c  (pending,  created 2026-07-29T23:03:06Z)
--   The two empty/pending records have 0 platform data.
-- =============================================================================


-- =============================================================================
-- STEP 0 – Verify state before touching anything
-- =============================================================================

SELECT
  u.id,
  u.name,
  u.email,
  u.role,
  u.verified,
  u.suspended,
  u."createdAt",
  uai.clerk_user_id,
  uai.environment
FROM users u
LEFT JOIN user_auth_identities uai ON u.id = uai.user_id
WHERE LOWER(TRIM(u.email)) IN ('dhomdesign1@gmail.com', 'go.wi.be@gmail.com')
ORDER BY LOWER(u.email), u."createdAt";

-- Verify related record counts for every affected user ID
SELECT
  'jobs'         AS table_name,
  "employerId"   AS user_id,
  COUNT(*)       AS cnt
FROM jobs
WHERE "employerId" IN (
  'user-1785349899757-d0ce3df7','user-1785362828013-e48753ee',
  'user-1785155115895-7d76c921','user-1785158927047-d2775307','user-1785366186092-ed2de25c'
)
GROUP BY "employerId"

UNION ALL

SELECT
  'applications' AS table_name,
  "applicantId"  AS user_id,
  COUNT(*)       AS cnt
FROM applications
WHERE "applicantId" IN (
  'user-1785349899757-d0ce3df7','user-1785362828013-e48753ee',
  'user-1785155115895-7d76c921','user-1785158927047-d2775307','user-1785366186092-ed2de25c'
)
GROUP BY "applicantId"

UNION ALL

SELECT
  'connections'  AS table_name,
  "fromUserId"   AS user_id,
  COUNT(*)       AS cnt
FROM connections
WHERE "fromUserId" IN (
  'user-1785349899757-d0ce3df7','user-1785362828013-e48753ee',
  'user-1785155115895-7d76c921','user-1785158927047-d2775307','user-1785366186092-ed2de25c'
)
GROUP BY "fromUserId";


-- =============================================================================
-- STEP 1 – Repair dhomdesign1@gmail.com
--           ORIGINAL  = user-1785349899757-d0ce3df7  (keep)
--           DUPLICATE = user-1785362828013-e48753ee  (delete after verifying 0 data)
-- =============================================================================

BEGIN;

-- 1a. Confirm the duplicate has no platform data
DO $$
DECLARE
  job_count  INTEGER;
  app_count  INTEGER;
  conn_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO job_count  FROM jobs        WHERE "employerId"  = 'user-1785362828013-e48753ee';
  SELECT COUNT(*) INTO app_count  FROM applications WHERE "applicantId" = 'user-1785362828013-e48753ee';
  SELECT COUNT(*) INTO conn_count FROM connections  WHERE "fromUserId"  = 'user-1785362828013-e48753ee'
                                                       OR "toUserId"    = 'user-1785362828013-e48753ee';
  IF job_count > 0 OR app_count > 0 OR conn_count > 0 THEN
    RAISE EXCEPTION 'Duplicate user-1785362828013-e48753ee still has platform data. Aborting.';
  END IF;
END $$;

-- 1b. Remove identity row for the duplicate
DELETE FROM user_auth_identities WHERE user_id = 'user-1785362828013-e48753ee';

-- 1c. Soft-delete the duplicate user
--     (We mark it deleted instead of hard-DELETE for safety)
UPDATE users
  SET role = 'deleted', suspended = true, name = '[DUPLICATE REMOVED] ' || name
  WHERE id = 'user-1785362828013-e48753ee';

-- 1d. Verify original is intact
SELECT id, name, email, role, verified, suspended FROM users WHERE id = 'user-1785349899757-d0ce3df7';

-- ── REVIEW RESULTS ABOVE BEFORE COMMITTING ────────────────────────────────
-- COMMIT;
-- ROLLBACK;  -- ← use this if anything looks wrong


-- =============================================================================
-- STEP 2 – Repair go.wi.be@gmail.com
--           ORIGINAL  = user-1785158927047-d2775307  (keep – has real data)
--           EMPTY     = user-1785155115895-7d76c921  (delete – pending, 0 data)
--           DUPLICATE = user-1785366186092-ed2de25c  (delete – pending, 0 data)
-- =============================================================================

BEGIN;

-- 2a. Confirm both "to-delete" users have no platform data
DO $$
DECLARE
  cnt INTEGER;
BEGIN
  SELECT COUNT(*) INTO cnt
  FROM (
    SELECT "employerId" AS uid FROM jobs        WHERE "employerId"  IN ('user-1785155115895-7d76c921','user-1785366186092-ed2de25c')
    UNION ALL
    SELECT "applicantId"       FROM applications WHERE "applicantId" IN ('user-1785155115895-7d76c921','user-1785366186092-ed2de25c')
    UNION ALL
    SELECT "fromUserId"        FROM connections  WHERE "fromUserId"  IN ('user-1785155115895-7d76c921','user-1785366186092-ed2de25c')
    UNION ALL
    SELECT "toUserId"          FROM connections  WHERE "toUserId"    IN ('user-1785155115895-7d76c921','user-1785366186092-ed2de25c')
  ) sub;
  IF cnt > 0 THEN
    RAISE EXCEPTION 'One of the pending duplicates still has platform data. Aborting.';
  END IF;
END $$;

-- 2b. Remove identity rows for the two pending duplicates
DELETE FROM user_auth_identities
  WHERE user_id IN ('user-1785155115895-7d76c921','user-1785366186092-ed2de25c');

-- 2c. Soft-delete the two pending duplicates
UPDATE users
  SET role = 'deleted', suspended = true, name = '[DUPLICATE REMOVED] ' || name
  WHERE id IN ('user-1785155115895-7d76c921','user-1785366186092-ed2de25c');

-- 2d. Verify the original employer is intact with all data
SELECT
  u.id, u.name, u.email, u.role, u.verified, u.suspended,
  (SELECT COUNT(*) FROM jobs        WHERE "employerId"  = u.id) AS jobs,
  (SELECT COUNT(*) FROM applications WHERE "applicantId" = u.id) AS apps,
  (SELECT COUNT(*) FROM connections  WHERE "fromUserId" = u.id OR "toUserId" = u.id) AS connections
FROM users u
WHERE u.id = 'user-1785158927047-d2775307';

-- ── REVIEW RESULTS ABOVE BEFORE COMMITTING ────────────────────────────────
-- COMMIT;
-- ROLLBACK;  -- ← use this if anything looks wrong


-- =============================================================================
-- ROLLBACK SQL (if you already committed but need to revert)
-- =============================================================================

-- Restore dhomdesign1 duplicate (if accidentally committed):
-- UPDATE users SET role = 'admin', suspended = false, name = 'Abdirahman' WHERE id = 'user-1785362828013-e48753ee';
-- INSERT INTO user_auth_identities (id, user_id, clerk_user_id, environment, created_at, updated_at)
--   VALUES ('identity-1785362828134-6eb7ea3c','user-1785362828013-e48753ee','user_3HCCmaOc0y9qP5nIEadCeCqNNni','development','2026-07-29T22:07:08.013Z','2026-07-29T22:07:08.013Z');

-- Restore go.wi.be empty/duplicate users (if accidentally committed):
-- UPDATE users SET role = 'pending', suspended = false WHERE id IN ('user-1785155115895-7d76c921','user-1785366186092-ed2de25c');


-- =============================================================================
-- STEP 3 – Post-cleanup verification
-- =============================================================================

-- Should show exactly 1 row per email address
SELECT LOWER(TRIM(email)) AS norm_email, COUNT(*) AS cnt
FROM users
WHERE LOWER(TRIM(email)) IN ('dhomdesign1@gmail.com', 'go.wi.be@gmail.com')
  AND role != 'deleted'
GROUP BY LOWER(TRIM(email));

-- Should show 0 rows (no active duplicates)
SELECT LOWER(TRIM(email)) AS norm_email, COUNT(*) AS cnt
FROM users
WHERE email IS NOT NULL AND TRIM(email) != '' AND role != 'deleted'
GROUP BY LOWER(TRIM(email))
HAVING COUNT(*) > 1;
