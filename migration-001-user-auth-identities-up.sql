-- =============================================================================
-- Migration 001 UP: Create user_auth_identities Table & Backfill Dev Identities
-- Description: Creates the environment-aware user_auth_identities table to support
--              dual Clerk identities (development and production) per Neon user.
--              Backfills existing users."clerkUserId" as 'development' environment identities.
-- =============================================================================

-- 1. Create user_auth_identities table safely
CREATE TABLE IF NOT EXISTS user_auth_identities (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL UNIQUE,
  environment TEXT NOT NULL CHECK (environment IN ('development', 'production')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP::text,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP::text,
  CONSTRAINT uai_user_env_unique UNIQUE (user_id, environment)
);

-- 2. Create required indexes for fast identity resolution
CREATE INDEX IF NOT EXISTS idx_uai_clerk_user_id ON user_auth_identities(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_uai_user_id ON user_auth_identities(user_id);
CREATE INDEX IF NOT EXISTS idx_uai_environment ON user_auth_identities(environment);
CREATE INDEX IF NOT EXISTS idx_uai_user_id_environment ON user_auth_identities(user_id, environment);

-- 3. Backfill existing non-null users."clerkUserId" values as 'development' identities
INSERT INTO user_auth_identities (id, user_id, clerk_user_id, environment, created_at, updated_at)
SELECT 
  'identity-' || id,
  id,
  "clerkUserId",
  'development',
  COALESCE("createdAt", CURRENT_TIMESTAMP::text),
  CURRENT_TIMESTAMP::text
FROM users
WHERE "clerkUserId" IS NOT NULL AND TRIM("clerkUserId") != ''
ON CONFLICT (clerk_user_id) DO NOTHING;
