# UFitness notifications

## What works where

| Feature | Expo Go (Android) | Installed APK (EAS build) |
|---|---|---|
| Workout reminder (your days + time) | Yes | Yes |
| Meal reminders (breakfast / lunch / dinner times) | Yes | Yes |
| Grocery day (Sat + Sun 09:00), gym check-in (Mon–Fri 09:00) | Yes | Yes |
| "Send a test notification" | Yes | Yes |
| Push from the server (announcements to all members) | **No** (Expo removed it from Expo Go on Android in SDK 53) | Yes, after the steps below |

Reminders are **local notifications**: the phone schedules them itself, no server or internet needed.
In Expo Go they show under the Expo Go app; in the APK they show as UFitness.

Where: **Profile → Notifications** (or the bell on Home).

## Code map

- `src/lib/notifications/reminderSchedule.js`: rules (what to schedule). Tested in `__tests__/reminderSchedule.test.js`.
- `src/lib/notifications/localNotifications.js`: loads only the local parts of `expo-notifications`.
  Importing the whole package crashes Expo Go on Android, so don't add `import * as Notifications from 'expo-notifications'` anywhere else.
- `src/lib/reminders.js`: permission, save (phone + Supabase `user_docs` doc `reminders`), reschedule.
- `src/lib/notifications/pushNotifications.js`: push token (APK only).
- `src/screens/profile/NotificationsScreen.js`: settings screen.

## Turning on push (APK only), one time

1. `npx eas-cli login` (Expo account)
2. `npx eas-cli init`. This adds `extra.eas.projectId` to `app.json`.
3. Android push needs Firebase: create a Firebase project, add the Android app `za.ac.uj.ufitness`, download
   `google-services.json` into the project root, add `"googleServices": "./google-services.json"` under `expo.android`
   in `app.json`, then upload the FCM V1 service-account key with `npx eas-cli credentials` (Android → Push Notifications).
4. Build the APK: `npm run build:preview:android`. Install it from the link EAS gives you.
5. In the APK: Profile → Notifications → **Turn on push**. The token is saved in Supabase
   (`user_docs`, doc = `reminders`, field `expoPushToken`).
6. Send a test: https://expo.dev/notifications with that token, or later a Supabase Edge Function that reads the tokens and
   POSTs to `https://exp.host/--/api/v2/push/send`.

Reminders don't need any of this. They already work in Expo Go and in any APK.
