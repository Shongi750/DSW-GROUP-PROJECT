# What is still left for a real UFitness phone app

The five tabs work on a phone in Expo Go: Home, Meals, Workout, Community, and Profile. Sign-up asks for a 9-digit UJ student number and an 8-digit email code. Grocery and gym reminders can appear as phone notifications.

A full phone app is more than screens. Students need an installable app, mail that reaches a UJ inbox, and data that follows them when they change phones. The items below are what is still open.

## 1. Install it as UFitness, not inside Expo Go

Right now the Android test runs inside Expo Go. That is a host app, not UFitness itself.

- Add an Android package name and an iOS bundle id in `app.json`. Neither is set.
- Make a development build (`npx expo run:android`) so the app icon, splash, and notification color are UFitness’s.
- Expo Go can show local reminders. It cannot do Android push. A development build is required before any remote notification work.
- For other students, produce an installable Android build (an APK or a Play internal-test track). There is no EAS config yet.
- iOS has not been built or tested.

## 2. Make the UJ code email reliable

Create Account sends an 8-digit code through Supabase, using Gmail as the sender. Gmail accepts the message. UJ has rejected that sender before it reaches the student Inbox or Junk.

- Keep custom SMTP on. The numeric code template only sends when custom SMTP is on. With it off, Supabase sends a sign-in link instead.
- To land in `@student.uj.ac.za`, send from a domain you control (not a personal Gmail account). That means a domain, DNS records, and a mail provider such as Resend pointed at that domain.
- Confirm email must stay on. The code is checked with `verifyOtp`, type `email`.
- The code proves the student can open that inbox. It does not prove they are enrolled. There is no UJ enrolment API.

## 3. Keep the student’s data when they change phones

Signed-in meals, community, reminders, eaten plates, and the workout plan now save to Supabase `user_docs` under that student’s id. This starts working after `supabase/schema.sql` is run once in the SQL editor. Until then the phone keeps a local copy and the cloud write is skipped.

## 4. Features that are screens with no people in them

Buddies, mentors, and Campus Admin read `list_students()`, which is every student who finished setup. Buddy requests are stored in Supabase. Group member lists are the students who tapped Join.

A brand-new account shows up for other people only after setup is saved and the SQL script has been run. There is still no separate mentor-request inbox.

## 5. Fix the account and setup gaps

Done in the app: confirm password is checked, a name is required at sign-up and on fitness setup, Terms and Privacy open as pages, and the Firebase wording in privacy, delete-account, and auth errors now says Supabase. `HOW-IT-WORKS.md` now states that the backend is Supabase. Older Firebase paragraphs further down that file are leftover and should not be followed.

## 6. Groups and Home numbers

Group pages have a live chat. Messages are stored in `group_messages` and new ones appear without refreshing, after the SQL script is run and Realtime is on for that table (the script adds it).

Home calories and active minutes are still only what this student logged. Those logs are included in the cloud documents from section 3, so they can follow the account to another phone once the script has been run.

## Suggested order

1. Run `Ufitness/supabase/schema.sql` in the Supabase SQL editor so cloud save, buddies, and group chat have tables.
2. Mail from a real domain, so the 8-digit code reaches UJ inboxes.
3. Installable build with a package name, so the phone shows UFitness instead of Expo Go.
