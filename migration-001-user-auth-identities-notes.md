# Migration Notes: Environment-Aware Clerk Identity System (`user_auth_identities`)

## 1. Overview & Purpose
This migration introduces the `user_auth_identities` table to enable seamless coexistence of Development and Production Clerk identities for every Neon PostgreSQL user profile.

- **Neon User Primary Key**: `users.id` (Type: `TEXT`).
- **Original Clerk ID Column**: `users."clerkUserId"` (Type: `TEXT`, preserved untouched).
- **New Multi-Tenant Identity Table**: `user_auth_identities`.

---

## 2. Table Schema Definition
```sql
CREATE TABLE IF NOT EXISTS user_auth_identities (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL UNIQUE,
  environment TEXT NOT NULL CHECK (environment IN ('development', 'production')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP::text,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP::text,
  CONSTRAINT uai_user_env_unique UNIQUE (user_id, environment)
);
```

### Constraints Enforced:
1. `clerk_user_id` MUST be globally unique across all records.
2. `(user_id, environment)` MUST be unique (exactly ONE Clerk identity per environment per Neon user).
3. `environment` MUST be strictly `'development'` or `'production'`.
4. `user_id` references `users(id)` with `ON DELETE CASCADE`.

---

## 3. Required Indexes
- `idx_uai_clerk_user_id` on `clerk_user_id`
- `idx_uai_user_id` on `user_id`
- `idx_uai_environment` on `environment`
- `idx_uai_user_id_environment` on `(user_id, environment)`

---

## 4. Backfill Strategy
Existing non-empty `users."clerkUserId"` entries are backfilled into `user_auth_identities` as `environment = 'development'` records without altering or removing `users."clerkUserId"`.

---

## 5. Risk Assessment & Safety Guarantees
- **No Deletions**: `users."clerkUserId"` column is NOT dropped.
- **No Overwrites**: Existing user rows, roles, and profile attributes remain completely unchanged.
- **Duplicate Protection**: Uses `ON CONFLICT (clerk_user_id) DO NOTHING` during backfill to fail safely if duplicate Clerk IDs exist.
- **Reversibility**: Full rollback script provided in `migration-001-user-auth-identities-down.sql`.
