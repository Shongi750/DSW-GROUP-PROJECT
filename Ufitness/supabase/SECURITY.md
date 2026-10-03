# Security hardening (must re-run SQL)

Apply `schema.sql` in the Supabase SQL editor after pull. Client changes alone are not enough.

| # | Control | What it does |
|---|---------|----------------|
| 1 | `enforce_uj_email` trigger on `auth.users` | Blocks non-`9digits@student.uj.ac.za` signups |
| 2 | Buddy request policies + `buddy_request_guard` | Insert always `pending`; only receiver accepts/rejects; parties end; parties/name immutable |
| 3 | `groups` + member-only RLS | Chat/members readable only if joined; author + body length enforced |
| 4 | `admin_emails` + `is_campus_admin()` | Admin from verified auth email, not profile fields |
| 5 | `delete_own_account()` | Deletes buddies, DMs, groups membership/messages, docs, profile, `auth.users` |
| 6 | `direct_messages` | 1:1 buddy/mentor chat; parties-only RLS + realtime |

Seeded campus admin email: `223222161@student.uj.ac.za` (edit `admin_emails` to change).

Re-run `schema.sql` after pull so `direct_messages` exists.
