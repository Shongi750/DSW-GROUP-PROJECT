# Deploy the LoyaltyHub proxy (Supabase Edge Function)

The LoyaltyHub API key used to live in the app (`EXPO_PUBLIC_LOYALTYHUB_KEY`). Anything starting with
`EXPO_PUBLIC_` is bundled into the app, so anyone could pull it out. Now the key lives on Supabase and the
app calls `supabase/functions/loyaltyhub-proxy` instead. Until you deploy it, the app keeps working:
it uses the old key from `.env` if it is still there, otherwise estimated prices.

Run these in PowerShell from the `Ufitness` folder. `npx supabase` downloads the CLI the first time
(no global install needed).

## 1. Log in to the Supabase CLI
```powershell
npx supabase login
```
A browser window opens; approve it with the Supabase account that owns the project.

## 2. Link this folder to the project
Your project ref is the part before `.supabase.co` in `EXPO_PUBLIC_SUPABASE_URL`
(Supabase dashboard → Project Settings → General → Reference ID).
```powershell
# Only if supabase/config.toml does not exist yet (answer "N" to the VS Code / IntelliJ questions):
npx supabase init

npx supabase link --project-ref YOUR_PROJECT_REF
```
It asks for the database password (dashboard → Project Settings → Database). Nothing in the database changes.

## 3. Store the LoyaltyHub key as a secret
Use the same value that is in your `.env` (don't paste it into chats or commits).
```powershell
npx supabase secrets set LOYALTYHUB_KEY=paste-the-key-here
npx supabase secrets list   # shows LOYALTYHUB_KEY (only a hash, not the value)
```
`SUPABASE_URL` and `SUPABASE_ANON_KEY` are provided to the function automatically.

## 4. Deploy the function
```powershell
npx supabase functions deploy loyaltyhub-proxy
```
Keep JWT verification ON (the default). The function also checks the token belongs to a real
signed-in user, so the public anon key alone is refused.

## 5. Test it
1. Restart Expo (`npx expo start --web --port 8082`), sign in, open Meals → grocery search or price quotes.
2. Prices should show "LoyaltyHub" prices instead of estimates.
3. Dashboard → Edge Functions → loyaltyhub-proxy → Logs shows the calls (200 = OK, 401 = not signed in,
   502 "key rejected" = wrong secret, 503 = secret not set).

## 6. Remove the key from the app
After step 5 works, **delete the `EXPO_PUBLIC_LOYALTYHUB_KEY=...` line from `.env`** and restart Expo with
`-c` (`npx expo start --web --port 8082 -c`) so the old value is no longer bundled.
If the key was ever committed or shared, ask LoyaltyHub for a new one and repeat step 3.

## What the function allows
| Endpoint | App sends | Rules |
|----------|-----------|-------|
| `prices` | `{ endpoint: 'prices', params: { search, limit } }` | search 2–80 chars, limit 1–10 |
| `products` | `{ endpoint: 'products', params: { barcode } }` | barcode 6–14 digits |

Anything else gets 400. Only POST is accepted.

## Updating later
Edit `supabase/functions/loyaltyhub-proxy/index.ts`, then run step 4 again. Change the key with step 3
(no redeploy needed).
