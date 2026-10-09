# Switch on the AI Coach (Supabase Edge Function + Gemini)

The AI Coach screen (Home → **AI Coach** card, or Profile stack → `AiCoach`) is already in the app. Until the
steps below are done it shows **"AI Coach not set up yet"** — nothing breaks.

How it works: the app sends the chat to the Supabase Edge Function `ai-coach`
(`supabase/functions/ai-coach/`). The function checks the student is signed in, counts the message against a
limit of **30 per student per day**, then asks Google Gemini (`gemini-2.5-flash`) using the Vercel AI SDK. Gemini
can call read-only tools that read **only that student's own** profile, workouts, meal plan and progress (the
function uses the student's own login, so row-level security applies). The Gemini key lives only on Supabase —
never in the app or `.env`.

Do the steps **one at a time**, in PowerShell, from the `Ufitness` folder.

> **Shared with `DEPLOY-EDGE-FUNCTION.md`:** steps 2 and 3 (Supabase CLI login + link) are the same as for the
> LoyaltyHub proxy. If you already did them there, skip to step 4. The access-token login is still pending, so
> doing it here also unblocks the LoyaltyHub deploy.

---

## Step 1 — Get a free Gemini API key
1. Open **https://aistudio.google.com** and sign in with a Google account.
2. Click **Get API key** → **Create API key** (pick or create any Google Cloud project).
3. Copy the key (starts with `AIza…`). Keep it private: don't paste it in chats, `.env`, or commits.

The free tier is enough for testing. Note: on the free tier Google may use prompts to improve its products, so
the app only sends what the coach needs (goal, budget, workouts, food log — never email or student number).

## Step 2 — Log in to the Supabase CLI (shared step)
Either the browser login:
```powershell
npx supabase login
```
or, if the browser login doesn't work, an access token (supabase.com/dashboard/account/tokens → **Generate new
token**, name it `ufitness-cli`):
```powershell
$env:SUPABASE_ACCESS_TOKEN = "paste-the-token-here"
```
(That only lasts for this PowerShell window.)

## Step 3 — Link this folder to the project (shared step)
```powershell
npx supabase link --project-ref YOUR_PROJECT_REF
```
The project ref is the part before `.supabase.co` in `EXPO_PUBLIC_SUPABASE_URL`. It asks for the database
password (dashboard → Project Settings → Database). If it says there is no `supabase/config.toml`, run
`npx supabase init` first (answer "N" to the VS Code / IntelliJ questions).

## Step 4 — Run the migration (daily limit table)
1. Supabase dashboard → **SQL Editor** → **New query**.
2. Paste everything from `supabase/migrations/2026-10-08-ai-coach.sql` → **Run**.
3. You should see "Success. No rows returned". It is safe to run again.

(It is also at the end of `supabase/schema.sql`, part F.)

## Step 5 — Store the Gemini key as a secret
```powershell
npx supabase secrets set GEMINI_API_KEY=paste-the-key-here
```
Check: `npx supabase secrets list` shows `GEMINI_API_KEY` (only a hash). `SUPABASE_URL` and `SUPABASE_ANON_KEY` are
provided to the function automatically.

## Step 6 — Deploy the function
```powershell
npx supabase functions deploy ai-coach
```
Keep JWT verification ON (the default). The function also checks the token itself.

## Step 7 — Test it on the phone
1. Start the app (`start-ufitness.bat` on the Desktop, or `npx expo start --tunnel -c`) and sign in.
2. Home → **AI Coach** → tap **Workout for today**. You should get an answer in a few seconds, with
   "29 of 30 messages left today" under the chips.
3. Tap **Plan my week on R300** — the answer includes a plan card (days, items, rand prices).

| What you see | Meaning / fix |
|---|---|
| "AI Coach not set up yet" | Function not deployed (step 6), secret missing (step 5), migration not run (step 4), or Gemini rejected the key (redo step 1 + 5). |
| "You've used all 30 AI Coach messages for today" | Daily limit. Resets at midnight (SA time). |
| "The AI is busy right now" | Gemini free-tier rate limit. Wait a minute. |
| "Please sign out and sign in again" | Login expired. |
| Yellow "You're offline" bar | No internet. The coach needs internet; old chat still shows. |

Logs: dashboard → Edge Functions → `ai-coach` → Logs.

## Optional
- Use a cheaper/faster model: `npx supabase secrets set GEMINI_MODEL=gemini-2.5-flash-lite` (no redeploy needed).
- Change the daily limit: edit `daily_limit` in `ai_coach_take()` (migration) **and** `DAILY_LIMIT` in
  `supabase/functions/ai-coach/coach.ts` and `src/features/coach/lib/coachCore.js`, re-run step 4 and step 6.
- Edit the coach's personality / safety rules: `systemPrompt()` in `supabase/functions/ai-coach/coach.ts`, then
  step 6 again.
- Developer tests for the function (mock model, no key needed), needs Deno installed:
  ```powershell
  cd supabase\functions\ai-coach
  deno test --config deno.json --allow-env --allow-sys
  ```
