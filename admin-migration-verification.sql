-- =============================================================================
-- Suuqa Xirfadaha - First Administrator Production Migration Verification
-- Purpose: Read-only verification queries and safe rollback procedure for
--          migrating the first administrator to Clerk Production.
-- NOTE: USE PLACEHOLDER 'ADMIN_EMAIL' IN PLACE OF THE REAL EMAIL ADDRESS.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- QUERY 1: Find the Administrator by Normalized Email
-- Expected Result: Exactly 1 row returning the administrator's Neon user ID,
--                 name, normalized email, role ('admin'), and verified status.
-- -----------------------------------------------------------------------------
SELECT id, name, LOWER(TRIM(email)) AS normalized_email, role, verified, suspended, "createdAt"
FROM users
WHERE LOWER(TRIM(email)) = LOWER(TRIM('ADMIN_EMAIL'));


-- -----------------------------------------------------------------------------
-- QUERY 2: Show Development and Production Clerk Identities
-- Expected Result: Shows all linked Clerk identities for the administrator across
--                 both 'development' and 'production' environments.
-- -----------------------------------------------------------------------------
SELECT 
  u.id AS neon_user_id,
  u.name,
  u.email,
  u.role,
  u."clerkUserId" AS legacy_clerk_id,
  uai.id AS identity_record_id,
  uai.clerk_user_id,
  uai.environment,
  uai.created_at
FROM users u
LEFT JOIN user_auth_identities uai ON u.id = uai.user_id
WHERE LOWER(TRIM(u.email)) = LOWER(TRIM('ADMIN_EMAIL'))
ORDER BY uai.environment;


-- -----------------------------------------------------------------------------
-- QUERY 3: Confirm Current Administrator Role
-- Expected Result: Role must be strictly 'admin'. Returns verified = true.
-- -----------------------------------------------------------------------------
SELECT id, name, email, role, verified
FROM users
WHERE LOWER(TRIM(email)) = LOWER(TRIM('ADMIN_EMAIL'))
  AND role = 'admin';


-- -----------------------------------------------------------------------------
-- QUERY 4: Confirm Account Status is Active (Not Suspended)
-- Expected Result: Exactly 1 row with suspended = false.
-- -----------------------------------------------------------------------------
SELECT id, name, email, role, suspended
FROM users
WHERE LOWER(TRIM(email)) = LOWER(TRIM('ADMIN_EMAIL'))
  AND suspended = false;


-- -----------------------------------------------------------------------------
-- QUERY 5: Detect Duplicate Production Identities
-- Expected Result: 0 rows returned. (If rows are returned, a duplicate identity conflict exists).
-- -----------------------------------------------------------------------------
SELECT clerk_user_id, COUNT(*) AS duplicate_count, ARRAY_AGG(user_id) AS neon_user_ids
FROM user_auth_identities
WHERE environment = 'production'
GROUP BY clerk_user_id
HAVING COUNT(*) > 1;


-- -----------------------------------------------------------------------------
-- QUERY 6: List Platform Records Owned by the Administrator
-- Expected Result: Counts of posted jobs, sent worker verifications, reviews, and connections.
-- -----------------------------------------------------------------------------
SELECT 
  u.id AS admin_user_id,
  u.name,
  u.email,
  (SELECT COUNT(*) FROM jobs WHERE "employerId" = u.id) AS jobs_posted_count,
  (SELECT COUNT(*) FROM verification_messages WHERE "adminId" = u.id) AS verifications_sent_count,
  (SELECT COUNT(*) FROM reviews WHERE "employerId" = u.id) AS reviews_given_count,
  (SELECT COUNT(*) FROM connections WHERE "fromUserId" = u.id OR "toUserId" = u.id) AS connections_count
FROM users u
WHERE LOWER(TRIM(u.email)) = LOWER(TRIM('ADMIN_EMAIL'));


-- -----------------------------------------------------------------------------
-- PROCEDURE 7: Rollback Procedure for Incorrectly Linked Production Identity
-- Purpose: Safely removes an incorrectly linked production Clerk identity without
--          modifying the administrator's Neon profile, roles, or dev identity.
-- -----------------------------------------------------------------------------
/*
-- STEP 1: Verify the identity record ID to be unlinked
SELECT id, user_id, clerk_user_id, environment
FROM user_auth_identities
WHERE environment = 'production'
  AND user_id = (SELECT id FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM('ADMIN_EMAIL')));

-- STEP 2: Delete ONLY the incorrect production identity entry
DELETE FROM user_auth_identities
WHERE environment = 'production'
  AND user_id = (SELECT id FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM('ADMIN_EMAIL')));

-- STEP 3: Confirm Development identity and Neon user profile remain intact
SELECT u.id, u.name, u.role, uai.clerk_user_id, uai.environment
FROM users u
LEFT JOIN user_auth_identities uai ON u.id = uai.user_id
WHERE LOWER(TRIM(u.email)) = LOWER(TRIM('ADMIN_EMAIL'));
*/
