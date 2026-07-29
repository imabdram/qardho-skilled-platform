# First Administrator Production Migration Checklist

Use this checklist when migrating the first platform administrator (`ADMIN_EMAIL`) to Clerk Production (`https://suuqaxirfadaha.app`).

---

## Pre-Migration Verification Checklist

- [ ] **1. Production Invitation Accepted**: Administrator receives and accepts the Clerk Production invitation for `ADMIN_EMAIL`.
- [ ] **2. Production Clerk User Created**: Clerk Production user profile exists in Clerk Dashboard with a valid Clerk `userId` (e.g. `user_2x...`).
- [ ] **3. Verified Email Matches Neon**: Primary email in Clerk Production is verified and matches `LOWER(TRIM(email))` in the Neon PostgreSQL `users` table.

---

## Execution & Linking Verification Checklist

- [ ] **4. Production Identity Linked**: Administrator logs in via production frontend. `/api/auth/me` creates an entry in `user_auth_identities` with `environment = 'production'` linked to the administrator's Neon `user_id`.
- [ ] **5. Development Identity Preserved**: The existing `development` entry in `user_auth_identities` (and legacy `users."clerkUserId"`) remains intact.
- [ ] **6. Admin Role Preserved**: Administrator's role in Neon remains strictly `role = 'admin'` with `verified = true`.
- [ ] **7. Admin Dashboard Accessible**: Accessing `/admin` loads the Admin Portal and Command Center without redirecting to `/onboarding` or `/login`.

---

## Authentication Session & Security Checklist

- [ ] **8. Sign Out Works**: Clicking "Sign Out" cleanly terminates the Clerk session and clears local authentication state.
- [ ] **9. Sign In Works Again**: Signing back in with Clerk Production credentials restores access directly to `/admin`.
- [ ] **10. Protected Route Refresh Works**: Hard refreshing the browser page while on `/admin` or `/dashboard` retains session authentication without forcing a re-login.
- [ ] **11. Suspended-User Restrictions Functional**: Test users marked `suspended = true` in PostgreSQL continue to receive 403 Access Denied upon authentication.
- [ ] **12. No Duplicate Neon User Created**: Verification query confirms `SELECT COUNT(*) FROM users WHERE LOWER(email) = 'ADMIN_EMAIL'` returns exactly 1.
