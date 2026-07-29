-- =============================================================================
-- Migration 001 DOWN: Rollback user_auth_identities Table & Indexes
-- Description: Safely drops the user_auth_identities table and associated indexes.
--              Does NOT modify or remove columns from the original users table.
-- =============================================================================

DROP INDEX IF EXISTS idx_uai_user_id_environment;
DROP INDEX IF EXISTS idx_uai_environment;
DROP INDEX IF EXISTS idx_uai_user_id;
DROP INDEX IF EXISTS idx_uai_clerk_user_id;

DROP TABLE IF EXISTS user_auth_identities CASCADE;
