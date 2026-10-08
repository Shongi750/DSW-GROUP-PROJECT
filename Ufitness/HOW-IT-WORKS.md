# UFitness — how everything works

UFitness is one Expo app that combines the DSW group modules: Home, Meals, Workout, Community (including Buddies and Mentors), and Profile.

App folder: `Ufitness/`  
SDK: Expo 54 / React Native 0.81

---

## How to run it

From `Ufitness/`:

```bash
npx expo start
```

- **Web:** `npx expo start --web --port 8090 --localhost` then open http://localhost:8090
- **Android:** Expo Go **54** (not 57). Metro has been used on port **8082** when 8081 is busy.

On web, the page itself does not scroll (`body` is locked). Inner `ScrollView`s must have a height, which is why main screens use `flex: 1` / `minHeight: 0`.

---

## App flow

```
Welcome splash
    → Login or Register
        → 8-digit code to the UJ student inbox (Supabase email OTP)
        → Fitness setup (name required)
        → Main tabs

Accounts use Supabase, not Firebase. Register stores the password only in memory until the code is confirmed. Meals, community, reminders, eaten plates, and the workout plan save to `user_docs` for that user id. Group chat uses `group_messages` and updates live. Run `Ufitness/supabase/schema.sql` once in the Supabase SQL editor before buddies, chat, and cloud save will work.
            → Fitness goal setup (first time only)
                → Main tabs: Home / Meals / Workout / Community / Profile
```

`RootNavigator` decides which stack to show:

1. No user → Auth (Welcome, Login, Register)
2. User, email not verified → Confirm UJ email
3. User, onboarding not finished → Fitness goal screen
4. User + onboarding complete → Main tabs

Session is Firebase Auth when `EXPO_PUBLIC_FIREBASE_*` is set. Register does **not** create the account yet. It emails a sign-in link to the UJ student address. Opening that link is the only way the Firebase user is created. The password from the form is applied after the link so later Login still works. Sign out clears the session.

Firebase Email/Password is **not Gmail**. Google Sign-In would be Gmail. This app only accepts UJ student mail: `223222181@student.uj.ac.za` (8–9 digit student number + `@student.uj.ac.za`). Gmail and `@uj.ac.za` staff addresses are rejected. The student number field must match the email.

Typing that address is not proof. After Register, Firebase emails a **verification link** to that inbox. The app stays on “Confirm your UJ email” until the link is opened. That is the same security as an OTP (you must read the mailbox) without a second mailer or code store. A custom 6-digit OTP would need Cloud Functions + SMTP and would still only prove inbox access.

If the mail never arrives — including junk — UJ is likely dropping Firebase’s default sender (`noreply@<project>.firebaseapp.com`). That is not a bug in the app. Use **custom SMTP** (below). Also confirm the address on screen is YOUR student number.

### SMTP (how we send the verification mail)

The Expo app does **not** send mail and does **not** store SMTP passwords. Firebase Auth sends the verification (and password-reset) email. Custom SMTP is a **Firebase project** setting so the From address is Gmail, which UJ will accept.

**One-time setup (one group Gmail, not a student mailbox):**

1. Create or pick a Gmail the team owns, e.g. `ufitness.uj@gmail.com`. Turn on **2-Step Verification**.
2. Google Account → Security → **App passwords** → generate one for Mail. Copy the 16-character password. Do not use the normal Gmail password.
3. Firebase console → **Authentication** → **Templates** → **SMTP settings** → Enable.
4. Fill:

   | Field | Value |
   |-------|--------|
   | SMTP host | `smtp.gmail.com` |
   | Port | `587` |
   | Security | STARTTLS / TLS |
   | Username | the full Gmail address |
   | Password | the 16-character app password |
   | Sender name | `UFitness` |
   | Sender email | the same Gmail (Gmail will reject a fake From) |

5. Save. Do not put this password in `Ufitness/.env` or git.

**Day-to-day:**

1. Student registers with `223xxxxxx@student.uj.ac.za`.
2. The app calls Firebase `sendEmailVerification`.
3. Firebase sends via that Gmail SMTP to the student inbox. Search for **UFitness** or the Gmail address, not `firebaseapp.com`.
4. Student opens the link → Confirm screen continues. **Resend email** uses the same SMTP.

**Manage it:**

- One person (or shared team Gmail) owns the app password. If it leaks, revoke it in Google Account → App passwords and paste a new one into Firebase SMTP. No app rebuild.
- Personal Gmail allows about **500** sends/day — enough for a class demo, not a campus-wide launch (then use SendGrid / Workspace).
- Authentication → Users shows whether the account exists even if mail was blocked.
- Turn SMTP off in the same panel to fall back to Firebase’s noreply sender (UJ will likely drop those again).

Paste the Firebase **web config as `KEY=value` lines**, not the JavaScript `firebaseConfig` snippet. Expo only inlines `EXPO_PUBLIC_*`.

Without those env keys the app still uses the old local session, but the address must still look like a UJ student email. Prefill is `223222181@student.uj.ac.za` / `ufitness123` — Register that mailbox for real, then open the verification email.

Forgot Password sends a Firebase reset email to the same student address.

In the Firebase console: enable **Authentication → Sign-in method → Email/Password**, and add `localhost` plus `127.0.0.1` under Authorized domains for web.

---

## Onboarding (fitness goal)

One combined screen (Zandile-style), not a long wizard:

- Fitness goal: Weight mgmt / Muscle building / General fitness / Endurance
- Experience level
- Preferred location (gym / home / etc.)
- Campus: APK, APB, DFC, SWC
- **Course of study** — search the UJ 2026 prospectus list (no free typing)
- Year of study
- **How you describe yourself** (optional): Female / Male / Non-binary / Prefer not to say. Not used to change workouts.
- **Profile picture** — upload your own photo, or pick an illustrated avatar
- Monthly food budget slider (R500–R10000)
- Funding source (NSFAS, cash, etc.)

Continue saves the profile and marks `onboardingComplete`. Skip is allowed on first setup. The same screen is reused later from Profile → Edit / Campus / Course / Fitness Goals, where the button reads **Save** and Skip is hidden.

Campus values: **APK**, **APB**, **DFC**, **SWC**.

Course of study is a local searchable list taken from the **UJ 2026 undergraduate prospectus** (no public UJ courses API). Refresh `src/data/ujCourses.js` when the next year’s prospectus is published.

---

## Main tabs

| Tab | What it is |
|-----|------------|
| Home | Dashboard: greeting, calorie/active stats, today's workout card, meal card, campus shortcuts to Mentors / Buddies / Community |
| Meals | South African weekly meal planner + grocery list |
| Workout | Nested workout app (its own Home / Plan / Workouts / Insights) |
| Community | Campus feed, then Buddies and Mentors |
| Profile | Student profile, app settings, appearance, sign out |

Home calories, active minutes, and the today cards read the same meal week and workout session as the Meals and Workout tabs.

### Navigation rule (so the right screen actually opens)

Tabs can contain stacks (Community: Feed → Buddies / Mentors; Profile: home → setup). A raw `navigate('Community', { screen: 'MentorList' })` **replaces** the tab with Mentors, so the board never sits underneath and the Community tab looks like Mentors only.

Always go through `src/navigation/nav.js`:

- `openTab(navigation, 'Community')` — tab home (Feed / Profile home)
- `openNested(navigation, ['Community', 'MentorList'])` — push a child **on top of** that home (`initial: false`)
- Tab icons for Community and Profile reset to that home

Do not add new `navigation.navigate('Tab', { screen: 'Child' })` calls without that helper.

---

## Meals

The meal planner builds a **week of breakfast / lunch / dinner** from a fixed list of South African student staples, then a grocery basket from those meals.

### Budget

Onboarding stores a **monthly** food budget (R500–R10000). The meal planner’s weekly purse is that number ÷ **4.33**, rounded in rands — not snapped to R250 / R340 / R450 / R600. A R5000 month is about **R1155** a week. A R10 000 month is about **R2309**.

The three chips on Meals are labels of **this student’s week**, not a global menu:

| Chip | What it is |
|------|------------|
| Tight week | ~70% of their weekly purse |
| Your week | monthly ÷ 4.33 |
| Flush week | ~130% of their weekly purse |

Changing the monthly slider rematches Meals. An old saved chip (R340) is dropped if it is not one of the new amounts.

**NSFAS** is still collected for the profile. It does **not** freeze the weekly purse at R340. The monthly slider is the source of truth, so a NSFAS student who can put R5000 on food still sees that week’s plates.

Halaal, vegetarian, no-dairy, peanut, and fish chips live under **Profile → Account & Profile → Eat & Allergies**. They still filter the meal cards; Swap stays on that filtered list. Peanut-butter toast drops on Peanuts; pilchards, tuna, and salmon drop on Fish.

Profile **Weekly remaining** is that live weekly amount minus the grocery basket total. Changing a planner chip or the grocery list updates remaining.

Each meal has a `minBudget`. The **default week** prefers plates near the purse (about 28% of weekly and up), so a comfortable month is not stuck on pap and jam toast. **Swap meal** can still cycle cheaper in-budget dishes. Sunday reuses Saturday’s rotation. The rotation also shifts each calendar week.

If the grocery total still exceeds the budget, it drops extras (wors, chicken, eggs, beef, steak, lamb, salmon, avocado, berries) and falls those days back to cheaper plates.

**Swap meal** cycles other options in that slot that the budget allows. If there is only one option, it asks you to raise the budget.

### Goal (Cut / Maintain / Bulk)

This does **not** add new dishes. It only scales portions (leaner carbs on Cut, more carbs on Bulk).

### Food catalogue (50 plates)

Breakfast (16): pap porridge, peanut butter bread, jam bread, banana bread, plain oats, pap with peanut butter, oats with banana, peanut-butter banana toast, yoghurt & banana, eggs on toast, french toast, cheese toastie, avocado toast, avocado-egg toast, yoghurt oats & berries, smoked salmon on toast  

Lunch (16): baked beans on toast, polony sandwich, 2-minute noodles & carrots, cabbage & bean bowl, pilchards on bread, spaghetti & tomato, rice & pilchards, bean bunny chow, egg mayo sandwich, cheese & tomato sandwich, tuna mayo sandwich, chicken mayo sandwich, beef stew & rice, chicken avocado wrap, peri-peri chicken & rice, salmon avocado bowl  

Dinner (18): pap & chakalaka, cabbage & potato stew, pap & spinach, potato & bean curry, rice & beans, samp & beans, lentil & rice stew, pap & pilchards, sweet potato & beans, pap & scrambled eggs, egg fried rice, spaghetti & soya mince, chicken & rice stew, pap & wors, butter chicken, sirloin & potatoes, lamb chops & pap, pan salmon & rice  

A tight week still lives on pap, beans, and pilchards. A R5000 month unlocks avocado, beef stew, peri-peri chicken. A R10 000 month opens smoked salmon, steak, and lamb chops. Swap can still step down to cheaper plates on the same purse.

Staples include maize meal, bread, oats, beans, pilchards, eggs, cabbage, potatoes, rice, chicken, wors, jam, yoghurt, cheese, tuna, polony, pasta, soya mince, samp, lentils, spinach, sweet potato, tomatoes, avocado, beef, steak, lamb, salmon, berries.

Meal cards use a photo of **that plate**, not the first grocery staple. Pap & chakalaka shows pap with a tomato-bean relish, bunny chow is a hollowed loaf, samp & beans is umngqusho, beans on toast is beans on toast.

You can tap a meal for ingredients, cook steps, and a cook-along video. Each recipe stores a YouTube clip whose title matches that dish (pap gets pap, samp & beans gets umngqusho, not a leftover toastie). There is also a **More videos of this meal** link that searches YouTube for the same plate. **I'll cook my own** replaces that slot with a custom dish.

### Grocery list

Built from ingredients used that week. You can pick a store filter, shopping cadence (daily / weekly / monthly), search SA products, add extras, and download a PDF. Live shelf prices try LoyaltyHub / Open Prices when keys are present; otherwise prices are estimates.

The meal plan is persisted locally (saved plan in meal storage helpers). The week grid **rebuilds from the catalogue**, so new meals, videos, and dish photos show up without wiping storage.

---

## Workout

Opening Workout hides the main Home / Meals / Workout / Community / Profile bar and shows the workout buttons instead (Home / Plan / Workouts / Insights). **Home** in the workout header returns to the main Home tab and the original bar. The module still has its own auth/app context and will continue as guest if needed, so it does not reuse the outer UFitness login.

Inner tabs:

- **Home** — today's session, week strip, start workout
- **Plan** — training goal / week layout
- **Workouts** — programs, exercises, builder, plus **Today’s challenges**: three Goggins-style dares / stretch clips that change each day. This is not the Community feed. **Download** saves the session on the phone so **START** still works offline; the YouTube watch still needs data.
- **Insights** — progress / volume

First-time workout users can hit a nested onboarding (optional gender, weight, goal, equipment, days, campus, limits, disclaimer). Gender is never used to pick exercises. After that, **Player** runs the session. Music is a modal.

Workout reads the main setup (goal, campus, experience, gym vs home) so students are not quizzed twice. Training days are the weekdays they tap, not a fixed Mon/Wed/Fri. Miss a day and the next free day becomes that session. Home **START** opens today’s Player when it is a train day. This is **not** Floor 25 unless they never set a goal. Guest continue is wired so the tab opens without a second login wall.

Workout also has its own Firebase app name `ufitness-workouts` in that module; the outer UFitness account is still local.

---

## Community, Buddies, Mentors

Community is a stack:

1. **Feed** — UJ community board: gym busyness, posts, photos, workout logs, **gym recipes + cook videos**, groups, challenges
2. **Connect** — Find buddies (Connect & Grow), campus chips, send requests
3. **Requests** — accept / reject buddy requests
4. **My Buddies** — matched buddies
5. **Find a Mentor / Mentor Match** — campus chips plus year filter: a mentor must be **3rd year or above**, and at or above **your** year of study from setup. 1st/2nd year cards are not offered as mentors.

## Campus Admin

Open **Profile → Campus Admin**. The row and screens only appear for student number `223222161` (that mailbox on login). Other accounts do not see the entry and are sent back if they reach the route. Charts (week, campus, module) are in-app and Power BI-shaped so staff can see how many people use the app and write decisions under the graphs. Campus bars count `students` in Firestore when anyone has finished setup; week bars stay sample until daily events are logged. A live Power BI workspace can take the same measures later — no embed token is in the app.

**Mentor pipeline:** AI only lists students who are 3rd year+ *and* have satisfactory results (workouts, streak, or moves done). Admin sends: “You have done xyz. Would you like to be a mentor?” The student sees that on Profile and can accept (they join the mentor list) or decline.

The feed is seeded with demo posts and groups, then **saved** to `ufitness.community.v1` (posts, gym busyness, recipes, workout logs, group joins) the same way meals and theme persist. Refreshing the app keeps your likes, check-ins, and shared recipes.

**Groups** open a group page after you tap the name or Join. Four campus groups ship with mock members, a next session, and a small board. Join is local for now so it is ready when live members arrive; Leave returns you to the list. Profile name/campus from onboarding is passed in as `communityProfile`. Image picker is used for avatars and post photos.

Meal detail has **Share to Community** on the same button row as Swap. That posts the plate’s ingredients, numbered steps, and cook-along to the feed.

**Share gym recipe** sits under the workout log button. Posts must pick a gym goal, include at least one cook step, and paste a valid YouTube id. Empty recipes are rejected. Users can type their own ingredients and steps, or fill from a protein meal in the planner. Recipe cards on the feed show steps above the player so cooking still works if campus Wi‑Fi blocks YouTube.

**Share workout clip & music** is the next button. Record or pick *your* gym video, name the song on it, and the feed shows an Instagram-style card: the clip plays, tap for sound, and a music sticker sits on the video. We do not mix a Spotify catalogue over the clip — the audio is whatever is in the video you filmed.

Buddy matching uses local buddy services (criteria-based list, not a live campus API). Mentors are a hardcoded list (Sipho, Lerato, Mike, etc.).

---

## Profile and theme

Profile shows avatar, name, course/year, campus pill, fitness goal, remaining food budget (weekly chip minus grocery total), then:

- Account: Edit profile, Campus, **Course of Study**, Fitness goals (setup screen), **Eat & Allergies** (diet chips that filter Meals)
- App settings: **Appearance (Light / Dark)**, Notifications, Privacy
- Sign out

Notifications and Privacy are local: grocery-day (Sat/Sun) and gym check-in (weekdays) reminders on this phone, plus a note that session data stays on device.

### Dark mode

`ThemeContext` (`src/context/ThemeContext.js`) stores `light` or `dark` in `ufitness.theme.v1`.

- Light / Dark buttons live under Profile → App Settings
- Palettes restyle backgrounds, cards, text, tab bar, and navigation
- Choice persists after restart

---

## Data that is saved

| Key | What |
|-----|------|
| `ufitness.session.v1` | Logged-in user + profile + onboarding flag |
| `ufitness.profiles.v1` | Setup saved by email/uid so login after sign-out skips the first-run form |
| `ufitness.theme.v1` | Light or dark |
| `ufitness.meals.plan.v1` | Weekly chip, day, swaps, custom dishes, grocery extras |
| `ufitness.community.v1` | Community posts, gym busyness, recipes, workout logs |
| `ufitness.reminders.v1` | Grocery-day / gym check-in local reminder flags |
| `ufitness.mentor.requests.v1` | Pending mentor connect requests |
| `ufitness.admin.v1` | Admin usage decisions, mentor invites, accepted mentor roster |
| `ufitness.workout.dailyClips.v1` | Today’s three challenge clips |
| `ufitness.workout.savedClips.v1` | Downloaded challenge clips |
| `workoutapp.profile.v1` | Workout plan, history, today’s session |

Clearing app storage / signing out drops the session. Theme may still be saved until that key is cleared too. **Delete account** removes the Firebase Auth user, tries `profiles/{uid}` and `students/{uid}`, then wipes the keys above.

Own Community posts can be deleted from the feed (trash on your posts). Extra grocery rows (custom / specials you added) can be removed. Accepted buddies can be unfriended. Mentor Connect sends or withdraws a local request.

---

## Project map

```
Ufitness/
  App.js                 Theme + navigation shell
  src/context/           App session, theme
  src/navigation/        Root, Auth, Onboarding, Main tabs, Community stack
  src/screens/           Login, Register, Fitness goal, Home, Profile
  src/features/meals/    Meal planner, grocery, SA foods
  src/features/workout/  Nested workout module
  src/features/community Community board
  src/features/buddies   Find / request / matched buddies
  src/features/mentors   Mentor list and match
```

---

## Backend: Supabase

Accounts, profiles, buddy requests, group members, group chat, and per-student documents (`user_docs`) live in the Supabase project named in `Ufitness/.env`. Do not add Firebase back.

Run `supabase/schema.sql` in the SQL editor after pulling these tables. Row level security keeps each student on their own documents. `list_students()` is what Buddies, Mentors, and Campus Admin read, and it does not return email addresses.

The older Firebase sections below are out of date.

### Why Firebase wins *for this repo*

The app already talks to Firebase. There is **one init** now:

- `src/lib/firebase.js` — reads `EXPO_PUBLIC_FIREBASE_*` from `Ufitness/.env`, named app `ufitness`
- `src/config/firebase.js` — re-exports that app (Faheem workout / progress)
- `src/features/workout/lib/firebase.js` — same re-export (updated workout)
- `src/features/buddies/config/firebaseConfig.js` — same re-export (buddies)

Hardcoded project ids were removed from source. If you paste the console’s JavaScript snippet into `.env`, rewrite it as `EXPO_PUBLIC_FIREBASE_*` lines (Expo ignores `const firebaseConfig`). Without env keys the app still runs locally. With keys, Workout and Buddies share Auth + Firestore.

Buddy data that lived only in the old `buddy-12b08` project does not move automatically. Use one Firebase console project, paste its web config into `.env`, enable Email/Password, then restart Expo.

### One login (done)

Register/Login/Sign-out call Firebase Auth in `src/context/AppContext.js`. The uid is the Firebase uid. Workout listens to the same Auth instance and does not auto-guest when Firebase is configured. Sign out clears both.

Fingerprint / Face ID is a second step after the first email-and-password login. `expo-local-authentication` proves it is the same person; `expo-secure-store` keeps the password in the device keystore (not AsyncStorage). Cold start with a saved session shows Unlock first. After sign-out, Login offers **Unlock with fingerprint**. Web has no Face ID — type the password. Turn it off under Profile → Privacy & Security. Delete account wipes the keystore copy.

Onboarding (campus, course, year, goal, budget) writes to Firestore `users/{uid}` and a buddy-facing `students/{uid}` once setup is complete. Login reads that if this device has no cache. AsyncStorage stays the offline copy.

Unifying on Firebase means one Auth user, then attach meals, community, and profile to that uid. Adding Supabase would be a second backend, a second SDK, a second student console, and a rewrite of code that already works.

### When Supabase would have been better

Supabase is the better default **greenfield**: real SQL, joins (student ↔ buddy ↔ mentor), and row-level security that looks like a database course. Grocery lists and week plans are tabular. If this repo had no Firebase at all, Supabase would be the cleaner teaching stack.

That is not this repo. LoyaltyHub stays for live Shoprite/Checkers prices either way; it is not a substitute for auth.

### What is wrong today (not “missing a BaaS”)

There used to be **multiple Firebase apps/projects** plus local AsyncStorage. Configs now re-export `src/lib/firebase.js`. Outer login is Firebase Auth when env keys are set. Workout shares that uid.

### Step-by-step (do in this order)

1. **One Firebase project** — put `EXPO_PUBLIC_FIREBASE_*` in `Ufitness/.env`. Delete hardcoded configs. One named app. **Done.**
2. **One login** — Register/Login call Firebase Auth. Outer `AppContext` uid = Workout uid. Workout does not auto-guest after UFitness login. Sign out clears both. **Done.**
3. **Cloud profile** — onboarding lives under `users/{uid}` (plus `students/{uid}` for buddies). Device cache stays for offline. **Done.**
4. **Sync the local keys** — meals plan, community feed, reminders write to `mealPlans/{uid}`, `communityState/{uid}`, `reminders/{uid}` when signed in; AsyncStorage stays the cache. **Done.**
5. **Offline queue** — if a cloud save fails because the phone is offline, the latest copy waits in `src/lib/syncQueue.js` and is sent when NetInfo (web: online/offline events) says the phone is back, or when the app returns to the foreground. The sync pill shows Offline → Syncing… → Synced. **Done.**
6. **Downloads** — Profile → Downloads (or the download icon on Home). Workouts, the week's meal plan, recipes and the grocery list can be saved for offline use; pictures, mp4 cook videos and the grocery PDF are saved as files on the phone (`src/lib/downloads/`). Screens use the downloaded copy when there is no connection. **Done.**
5. **Rules** — `firestore.rules` in the Ufitness folder: owner-only on users/meals/community/reminders; signed-in read on students; authenticated buddy requests. Deploy with Firebase CLI. **In repo.**
6. **Leave for later** — UJ enrolment API, real NSFAS balance, OS push, Play/App Store. Mentors/buddies can stay seeded until Auth works.

Env keys (never commit the values):

```
# LoyaltyHub key: server secret for the loyaltyhub-proxy Edge Function (DEPLOY-EDGE-FUNCTION.md)
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
```

Restart Expo after saving `.env`. Without Firebase keys the app still runs locally, same as now.

---

## What is still demo / stubbed

- Community groups and challenges stay seeded (the feed itself persists)
- Mentors are a static list
- Buddy data is local service data, not UJ live enrolment
- Meal “live prices” need the `loyaltyhub-proxy` Edge Function deployed with the `LOYALTYHUB_KEY` secret, or they stay estimated
- Firestore rules live in `firestore.rules` — deploy from the Ufitness folder with Firebase CLI (`firebase deploy --only firestore:rules`) after you are logged into the project
- Real Power BI embed, SMTP, and authorized domains stay in the Firebase / Microsoft consoles

---

## Typical student path

1. Register with `studentnumber@student.uj.ac.za`, then open the verification email
2. Set goal, campus, food budget
3. Home overview
4. Meals: pick budget → see that day’s plates → open grocery list
5. Workout: complete nested setup if needed → start today’s session
6. Community: scroll the board → Buddies / Mentors
7. Profile: Light/Dark, then Sign out
8. Login again with the same email and password (Firebase Auth)
