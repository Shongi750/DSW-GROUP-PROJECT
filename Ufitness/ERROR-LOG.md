# UFitness error log

Newest entry first. Each entry is a mistake that showed up while building the app, why it happened, and what was changed to fix it.

## 26 September 2026 — Android bundle failed in reminders.js

**What was wrong**

The Pixel 8 emulator opened Expo Go, then Metro stopped on `reminders.js`: `const CHANNEL` had been pasted inside the reminders object, so the file was not valid JavaScript.

**What changed**

`CHANNEL` is declared once, next to the storage key, and the object only holds grocery and gym fields. The emulator then loaded the app and posted a local “UFitness reminder” notification.

## 26 September 2026 — Home greeting showed the student number

**What was wrong**

Home uses `profile.name`. When that was empty, the app used the part of the email before `@`, so `223222161@student.uj.ac.za` became the name. A later real name was ignored because the student number was already stored.

**What changed**

A 9-digit value is no longer treated as a name. The greeting uses the name saved at sign-up, and otherwise says “there”.

## 26 September 2026 — Setup Continue did nothing when a field was empty

**What was wrong**

Continue on the fitness setup screen stopped if course, year, photo, experience, location, or funding was empty. The warning used `Alert.alert`, which does not show in the browser, so the button looked dead.

**What changed**

`FitnessGoalScreen.js` now shows a red note above Continue naming each missing field.

## 26 September 2026 — App asked for 6 digits while the email code is 8

**What was wrong**

Supabase **Email OTP length** is 8. The code screen stopped at 6 digits, so the number from the email could not be typed in full.

**What changed**

The code box, Confirm button, and checks in `VerifyEmailScreen.js` and `AppContext.js` now require 8 digits.

## 26 September 2026 — Magic link template was still a sign-in link

**What was wrong**

Create Account calls `signInWithOtp`, which sends the Magic link or OTP email. That template was still the default “Your sign-in link” with `{{ .ConfirmationURL }}`, so the inbox got a link.

**What changed**

The Magic link or OTP template was saved. Subject is `UFitness code`. The body shows `{{ .Token }}` and does not include a confirmation link. Custom SMTP stays on so Supabase uses this template.

## 26 September 2026 — Turning custom SMTP off sent a link, not the code

**What was wrong**

Create Account already calls `signInWithOtp` and the app asks for a 6-digit code. With custom SMTP off, Supabase ignores the saved template and sends the default Magic link email. That subject is locked to “Your sign-in link”. The 6-digit `{{ .Token }}` body only sends after custom SMTP is on.

**What changed**

The SMTP form is filled again (`smtp.gmail.com`, port 587, sender `kbman2904@gmail.com`) and is waiting for the Gmail app password before it can be saved. The app was not switched to a link screen.

## 26 September 2026 — Create Account crashed on a missing account, then mail was switched off Gmail

**What was wrong**

Create Account called `account.email` before `account` existed, so the button could throw before any email was sent. Custom SMTP was also still sending through `kbman2904@gmail.com`, which UJ was rejecting.

**What changed**

`RegisterScreen.js` now builds the account from the 9-digit student number before it calls register. Custom SMTP was turned off and saved, so the next message is sent by Supabase. Create Account for `223222161` then opened **Enter the code**. The password typed on that form is applied only after the code is confirmed.

## 26 September 2026 — Gmail Sent has the code, the UJ inbox does not

**What was wrong**

`kbman2904@gmail.com` has the message in Sent. `223222161@student.uj.ac.za` has nothing in Inbox or Junk. Supabase and Gmail both handed the mail off. UJ rejected it before it could reach the student mailbox, so it never appears in Junk either.

**What was not changed**

The app still sends the 6-digit code to the student address. Delivery to that inbox needs a sender UJ will accept. There is no domain for Resend, so SMTP stays on Gmail.

## 26 September 2026 — No domain, so Resend cannot mail UJ

**What was wrong**

A Resend account exists as leonx1903. Resend will not deliver to `@student.uj.ac.za` until a domain is verified. There is no domain to verify. The free sender `onboarding@resend.dev` only mails the Resend account address, `leonx1903@gmail.com`. Supabase SMTP is still Gmail.

**What remains possible**

Check Gmail Sent and the student Junk folder for `UFitness code`. For a demo, send a test from the Resend dashboard to `leonx1903@gmail.com`. Buying a domain later is what unlocks Resend for real UJ inboxes.

## 26 September 2026 — Option 2 is blocked until there is a domain

**What was wrong**

The UJ filter is dropping mail from `kbman2904@gmail.com`. The fix is to keep Supabase and change the SMTP sender to a transactional service on a domain we control. This repo has no domain and no Resend or Brevo account. Resend’s free test sender only delivers to the address that owns the Resend account, not to `@student.uj.ac.za`. The app code does not send the mail, so there is nothing in `AppContext.js` to switch. Supabase SMTP is still Gmail.

**What has to happen next**

Create a Resend or Brevo account, verify a domain, add that service’s SPF and DKIM records, then put its SMTP host, port, username, and password into Supabase → Authentication → Emails → SMTP Settings. Do not put that password in the app or in `.env`.

## 26 September 2026 — UJ inbox stopped showing the code, and Firebase is not the fix

**What was wrong**

Create Account used to deliver a Supabase **Confirm sign up** message to `223222161@student.uj.ac.za`. Later OTP calls also succeed: auth logs show `POST /otp` status 200 and no “error sending email.” The message is sent from `kbman2904@gmail.com` through Gmail’s personal SMTP. Supabase warns that this sender is for personal mail, so delivery can fail. UJ’s filter is dropping those later messages. The app cannot force the student inbox to accept them.

Firebase was already tried for this same inbox. Mail from `noreply@….firebaseapp.com` never arrived. Firebase Authentication sends its own mail. It does not let this app plug in Resend, Brevo, or another SMTP server. Moving the login back to Firebase would hit the filter that already blocked it.

**How to get past it**

Use a transactional mail service and a domain you control, with that service’s SPF and DKIM records, as the Supabase SMTP sender. Until then, check Gmail **Sent** and the student Junk folder for the subject `UFitness code`. For a demo, send the test code to a mailbox you can open. The student-number check in the app can stay.

## 26 September 2026 — OTP requests succeeded and the inbox stayed empty

**What was wrong**

Auth logs at 09:33 and 09:42 show `POST /otp` with status 200 for `223222161@student.uj.ac.za`. There is no mail-send error. The Magic link template subject was still “Your sign-in link,” which filters often drop, and the success note on the code screen used the red error style.

**How it was fixed**

The Magic link template was saved with subject `UFitness code` and `{{ .Token }}` in the body. A successful resend now shows a green note that also says to check Junk.

## 26 September 2026 — Create Account kept sending the link email

**What was wrong**

The 6-digit code was saved on **Magic link or OTP**. Create Account called `signUp`, so Supabase sent **Confirm sign up**, which still says “Follow the link below” and uses `{{ .ConfirmationURL }}`.

**How it was fixed**

Create Account and “Send a new code” now call `signInWithOtp`. That is the email Supabase labels Magic link or OTP. **Enter the code** checks it with `verifyOtp` type `email`. After the code is accepted, the password from the form is saved with `updateUser`, so Log In still uses that password. The password is kept in memory only until the code is accepted.

## 26 September 2026 — `signInWithOtp` is the wrong send for this sign-up

**What was wrong**

A `signInWithOtp` helper would mail the Magic Link template and create a passwordless user. Create Account already calls `signUp` with a password, and **Enter the code** checks that mail with `verifyOtp` type `signup`. A second send would not match the Confirm button. `supabase/schema.sql` also said to turn Confirm email off, which stops any code from being sent.

**How it was fixed**

The resend path is `sendSignupCode` in `AppContext.js`. It calls `resend({ type: 'signup' })` for the same UJ address. The first code is still sent by `signUp`. The SQL note now says Confirm email stays on and the Confirm signup template must include `{{ .Token }}`.

## 26 September 2026 — Waiting screen asked for a link instead of the code

**What was wrong**

The Confirm signup template that was pasted used `{{ .ConfirmationURL }}`, which is a link. The app was then changed to say “open the link.” The required email is a 6-digit code. That number is only inserted when the template contains `{{ .Token }}`.

**How it was fixed**

Create Account and the waiting screen again ask for the 6-digit code. Confirm still calls `verifySignupCode`. The Supabase template must be saved with `{{ .Token }}` in the body, or the inbox will still contain a link.

## 25 September 2026 — The email sends a link, and the app asked for a code

**What was wrong**

The Confirm signup email uses `{{ .ConfirmationURL }}`. That is a one-time link. The app told the student to type a 6-digit code. A code is only in the email when the template contains `{{ .Token }}`.

**How it was fixed**

The waiting screen now says to open the link in the student inbox. Opening that link confirms the account and returns to the app. Create Account no longer mentions a 6-digit code.

## 25 September 2026 — Code screen opened when no code was sent

**What was wrong**

The chart says: send the code, and only a verified code may enter the app. `register` did not check that a code was actually sent. Any `signUp` that did not throw an error opened **Enter the code**.

Two successful responses still send no email:

- A session in the response means **Confirm email** is off. Supabase logs the person in immediately and does not mail a code. The app signed that session out, then still asked for a code that would never arrive.
- An empty `identities` list means that student email is already registered. Supabase hides that and sends nothing. The app still asked for a code.

The separate red notice `Error sending confirmation email` is not this bug. That one is HTTP 500 from Supabase when Gmail rejects the send. No account is created in that case.

**How it was fixed**

`register` now opens the code screen only when Supabase returns a new unconfirmed user and no session. An existing email gets “Use Log In instead.” A session gets a notice to turn **Confirm email** on and save SMTP. The app still does not set the signed-in user until the 6-digit code is accepted.

## 25 September 2026 — `studentNumber is not defined` on Create Account

**What you saw**

Tapping Create Account showed a red notice: `studentNumber is not defined`.

**Why it happened**

`RegisterScreen.js` tried to build the UJ email with this line:

```js
const account = accountFromStudentOrEmail({ studentNumber });
```

`{ studentNumber }` means “use a variable named `studentNumber`.” The screen never created that variable. The only text field it stored was `email`, so JavaScript stopped before sign-up started.

Two related mistakes were in the same change:

- `const account` inside the `try` block hid the `let account` written above it. The account built inside `try` was thrown away, so the later `account.email` would still have been empty.
- The hint under the field called `assertUjStudentAccount`, which was not imported on that screen.
- A spare `registerUser` function had been added at the top of `AppContext.js`. Nothing called it. It used `accountFromStudentOrEmail` the same broken way, and it called `setPendingOtp` from outside the app state, where that function does not exist.

**How it was fixed**

- `RegisterScreen.js` now stores `studentNumber`. The field asks for the 9-digit number. Create Account passes that string: `accountFromStudentOrEmail(studentNumber)`, and saves the result in the outer `account`.
- After 9 digits, the screen shows the address the code will go to, for example `223222161@student.uj.ac.za`.
- `ujEmail.js` accepts exactly 9 digits. An 8-digit number was being turned into an email and then rejected by the 9-digit email check.
- The unused `registerUser` function was removed from `AppContext.js`. Sign-up still goes through the existing `register` function, which keeps the person on the code screen until the 6-digit code is accepted.
