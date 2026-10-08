# Security hardening (must re-run SQL)

Apply `schema.sql` in the Supabase SQL editor after pull (or the newest files in `migrations/`, in date order).
Client changes alone are not enough.

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

## Part D review (8 Oct 2026)

Files: `migrations/2026-10-08-security.sql`, then `migrations/2026-10-08-moderation.sql`
(both safe to re-run; also at the end of `schema.sql`).

### Findings fixed
| # | Finding | Fix |
|---|---------|-----|
| 7 | Supabase gives `anon` (not signed in) EXECUTE on every function and ALL on every table by default. `list_students()` had no sign-in check, so the anon key alone could list every student's public card. | All table/sequence rights and function EXECUTE revoked from `anon`; only the app's RPCs are granted to `authenticated`. `list_students()` also checks `auth.uid() is not null`. Default privileges changed so new objects don't go to `anon`. |
| 8 | `is_campus_admin()` trusted the email even before it was confirmed. | Needs `email_confirmed_at is not null`. |
| 9 | Names in `group_members.name`, `mentor_requests.student_name/mentor_name` and `chat_reports.reported_name` came from the client (could be faked). | Triggers fill them from `profiles` (`profile_display_name()`, server-only). |
| 10 | Some policies had no `to authenticated` (the anon role was covered by them). | `profiles`, `mentor_requests` policies now `to authenticated`. |
| 11 | Deleting your own `profiles` row would clear a suspension (the row is re-created clean). | No delete policy on `profiles`; account removal goes through `delete_own_account()`. |
| 12 | Two functions had a mutable `search_path`. | `protect_profile_roles()` and `dm_thread_key()` pin `search_path`. |
| 13 | Group name/description had no length limit. | `groups_text_limits` check (new rows). |
| 14 | LoyaltyHub key bundled in the app (`EXPO_PUBLIC_LOYALTYHUB_KEY`). | Edge Function `loyaltyhub-proxy` keeps it server-side; see `../DEPLOY-EDGE-FUNCTION.md`. |

### New controls (moderation)
| # | Control | What it does |
|---|---------|----------------|
| 15 | `chat_reports.status/resolved_by/resolved_at` + `admin_resolve_report()` | Only Campus Admin resolves / dismisses; `chat_report_guard` forces reporter = you and status = open |
| 16 | `admin_delete_message()` | Admin deletes a group or direct message; open reports on it are resolved |
| 17 | `profiles.suspended` + `protect_profile_suspension` + `admin_set_suspended()` | Only the admin RPC can change it; suspended students can't insert `group_messages`, `direct_messages` or the community doc (RLS uses `is_suspended()`) |
| 18 | `moderation_actions` | Log of every admin action; only the admin can read it |

### Checklist results
- RLS is enabled on every table in `public`, and every policy is `to authenticated` (checked on a local
  Postgres copy). `admin_emails` has RLS with no policies on purpose (only security definer functions read it).
- Every security definer function pins `search_path`; the ones callable by students check `auth.uid()` /
  `is_campus_admin()`. `anon` can execute no `public` function and read no `public` table.
- Storage: the app uses no storage buckets (avatars are built-in pictures), so there are no bucket policies to add.
  If a bucket is added later, give it RLS policies on `storage.objects` before uploading anything.
- Hard-coded secrets: none found in `src/`, `scripts/` or config files. `.env` is git-ignored.

### Known gaps
- `EXPO_PUBLIC_RAPIDAPI_KEY` is still in the client (same fix as LoyaltyHub would work).
- New functions must be granted to `authenticated` explicitly (anon gets nothing by default now).
- A suspended student could delete the account and sign up again with the same student number;
  the admin would need to suspend again.
- No rate limit on `usage_events` / `user_docs` size.
