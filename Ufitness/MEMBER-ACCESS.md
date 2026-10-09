# UFitness: how members run the app (branch `test3`)

Repo: https://github.com/Shongi750/DSW-GROUP-PROJECT (branch **test3**)
The app lives in the `Ufitness/` folder. Everyone uses the **same shared Supabase project**. The database migrations and the AI Coach Edge Function are already deployed, so you don't need to set up anything on Supabase.

---

## 1. One-time setup on your laptop

You need **Node.js 20 or newer** (https://nodejs.org) and **Git**.

```bash
# first time
git clone https://github.com/Shongi750/DSW-GROUP-PROJECT.git
cd DSW-GROUP-PROJECT
git checkout test3

# already cloned? just update
git fetch origin
git checkout test3
git pull origin test3
```

Then install packages:

```bash
cd Ufitness
npm install
```

### The `.env` file (required, never committed)

1. Copy `Ufitness/.env.example` to `Ufitness/.env`.
2. Ask **Karabo** for the two values (send them privately on WhatsApp, not in the repo or group chat):
   ```
   EXPO_PUBLIC_SUPABASE_URL=...
   EXPO_PUBLIC_SUPABASE_ANON_KEY=...
   ```
3. Never commit `.env`. It's already in `.gitignore`.

## 2. On your phone

- Install **Expo Go** from the Play Store or App Store and **update it**. It must support **SDK 57**.
- Android: open Expo Go and scan the QR, or tap **Enter URL**.
- iPhone: scan the QR with the **Camera** app.

## 3. Start the app

**Easiest (Windows):** double-click `Ufitness/start-ufitness.bat`.
(Run `start-ufitness.bat tunnel` from a terminal if the hotspot/Wi-Fi method doesn't work.)

**Or from a terminal** inside `Ufitness/`:

```bash
npx expo start --lan --go --clear      # same Wi-Fi or hotspot (fastest, most reliable)
npx expo start --tunnel --go --clear   # different networks / campus Wi-Fi that blocks devices
```

## 4. Connect the phone

1. Put the phone and laptop on the **same network**. The most reliable option is to turn on the **laptop's Mobile Hotspot** (Windows Settings → Network → Mobile hotspot) and connect the phone to it.
2. In Expo Go, tap **Enter URL** and type the address the terminal shows, for example:
   - hotspot: `exp://192.168.137.1:8081`
   - Wi-Fi: `exp://<your-laptop-IP>:8081`
   - tunnel: `exp://xxxx-anonymous-8081.exp.direct`
3. The first load takes 1–3 minutes while it builds. After that it's quick.
4. Sign in, or create an account with your student email.

Keep the terminal open while you use the app. Closing it stops the app.

---

## 5. If something goes wrong

| What you see | What to do |
|---|---|
| **"Project is incompatible with this version of Expo Go"** or Expo Go closes straight after scanning | Update Expo Go from the store so it supports **SDK 57**. Then run `npm install` again in `Ufitness/`. |
| **"Uncaught Error: java.io.IOException: Failed to download remote update"** | The phone can't reach the laptop. Use the **laptop hotspot** with `--lan` and enter `exp://192.168.137.1:8081`. If that still fails, restart with `--tunnel`. Turn off VPNs. Allow Node.js through Windows Firewall (Private networks) if Windows asks. |
| **"Something went wrong"** screen | Tap **View error log** and send a screenshot of the first red line to Karabo. |
| **Red "Render Error"** screen | Shake the phone → **Reload**. If it comes back, stop the terminal (Ctrl+C) and restart with `--clear`, then send a screenshot. |
| Can't sign in / "Network request failed" | Check `Ufitness/.env` has both Supabase values, then restart Expo (`--clear`). The phone also needs internet (mobile data on the hotspot is fine). |
| **AI Coach: "Coach couldn't respond"** | Make sure you're **signed in**: sign out and back in. The coach is already deployed on the shared Supabase, so nothing needs setting up. There's a limit of **30 messages a day** per person. If it still fails, send a screenshot to Karabo. |
| **AI Coach says it is "not set up"** | Nothing to deploy on your side. It runs on the shared Supabase project. Check that your `.env` uses the **shared** project's URL and key (not your own project), then reload. |
| **Notifications don't appear** | Profile → Notifications → **Send a test notification** and allow permission. If you blocked it before: phone **Settings → Apps → Expo Go → Notifications → Allow**. On Samsung, also set Battery → **Unrestricted** for Expo Go. In Expo Go only **local reminders** work. Server push needs the APK build later. |
| Pictures missing / all meals show the same photo | Make sure you pulled the latest `test3` and reload. The phone needs internet for photos. |
| Tab bar covers the phone's buttons | Pull the latest `test3` (safe-area fix) and reload. |
| `npm install` errors | Make sure Node.js is 20 or newer (`node -v`). Run `npx expo install --fix`, then `npm install` again. If it still fails, send the error to Karabo. |
| Port 8081 in use | Close other Expo terminals, or press `y` when Expo offers another port, and type the new port in the URL. |

**Still stuck?** Send Karabo (1) a screenshot of the phone error, (2) the last ~20 lines of the terminal, and (3) your phone model and Expo Go version.

## Notes

- Don't commit `.env`, `node_modules/`, `dist-*/` or `.expo/`.
- Everyone shares one Supabase project, so test accounts and data are shared. Be kind with test posts.
- An installable APK (no Expo Go needed) is planned. Until then, use the Expo Go steps above.
