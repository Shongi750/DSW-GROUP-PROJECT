# Workout Buddy System - with Firebase Authentication

React Native + Firebase (Auth + Firestore) implementation covering account
creation, login, and UFitness module **6. Workout Buddy System** (FR-31
through FR-35).

## What's new

- **Sign Up** (`screens/auth/SignUpScreen.js`) creates a Firebase Auth
  account *and* the matching `students` Firestore profile doc in one step,
  using the auth user's `uid` as the profile's document id.
- **Log In** (`screens/auth/LoginScreen.js`) signs an existing user in.
- **RootNavigator** (`navigation/RootNavigator.js`) listens to Firebase Auth
  state and automatically shows the Auth flow when signed out, or the main
  app (with the signed-in student's real profile loaded) when signed in.
  No manual "navigate after login" code needed - it's reactive.
- **Profile tab** (`screens/ProfileScreen.js`) shows the student's own info
  and a **Log Out** button.
- `currentStudent` is no longer a hardcoded mock - it's the real signed-in
  user's Firestore profile, loaded automatically by `RootNavigator`.

## Structure

```
workout-buddy-system/
├── App.js
├── config/firebaseConfig.js          # Firebase init - fill in your keys
├── services/
│   ├── authService.js                # sign up / log in / log out / auth listener
│   └── buddyService.js               # Firestore reads/writes + matching logic
├── components/
│   ├── BuddyCard.js
│   └── ChipSelector.js               # tap-to-select chips (campus, goal, etc.)
├── screens/
│   ├── auth/
│   │   ├── LoginScreen.js
│   │   └── SignUpScreen.js
│   ├── FindBuddiesScreen.js          # FR-31, FR-32, FR-33
│   ├── BuddyRequestsScreen.js        # FR-34 (real-time listener)
│   ├── MatchedBuddiesScreen.js       # FR-35
│   └── ProfileScreen.js              # view own profile + log out
├── navigation/
│   ├── RootNavigator.js              # auth-state switch (NEW - entry point)
│   ├── AuthNavigator.js              # Login <-> Sign Up toggle
│   └── BuddySystemNavigator.js       # bottom tabs for signed-in users
└── scripts/seedStudents.js           # optional test data helper
```

## Firestore schema

**`students`** collection - doc id = Firebase Auth `uid`
```js
{
  name: 'Jane D.',
  campus: 'APK',                // 'APK' | 'APB' | 'DFC' | 'SW'
  fitnessGoal: 'General fitness',
  experienceLevel: 'Beginner',  // 'Beginner' | 'Intermediate' | 'Advanced'
  preferredSchedule: ['Mon', 'Wed', 'Fri'],
  workoutLocation: 'Gym',       // 'Gym' | 'Home'
}
```

**`buddyRequests`** collection - auto id
```js
{
  fromStudentId: 'uid1',
  toStudentId: 'uid2',
  status: 'pending',   // 'pending' | 'accepted' | 'rejected'
  createdAt: <server timestamp>,
}
```

## Setup

### 1. Install dependencies
```bash
npm install firebase
npx expo install @react-native-async-storage/async-storage react-native-vector-icons \
  react-native-screens react-native-safe-area-context react-native-gesture-handler
npm install @react-navigation/native @react-navigation/bottom-tabs
```
(Use `expo install` for anything with native code so Expo picks a version
compatible with your SDK - see earlier note about the `react-native-screens`
codegen error if you skip this.)

### 2. Enable Firebase Authentication
In the Firebase Console: **Build → Authentication → Sign-in method →
Email/Password → Enable**.

### 3. Enable Firestore
**Build → Firestore Database → Create database** (test mode while developing).

### 4. Add your config
Fill in `config/firebaseConfig.js` with your project's values (Project
Settings → General → Your apps → SDK setup and configuration).

### 5. Run it
```bash
npx expo start
```
You should land on the Login screen. Tap "Don't have an account? Sign up"
to create one - this immediately creates both the Auth user and their
Firestore profile, and `RootNavigator` will automatically switch you into
the main app once sign-up completes.

## Firestore security rules (once you're ready to lock it down)

Test mode allows open read/write - fine for development, **not for
production**. Once you're testing with real accounts, apply something like:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /students/{studentId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == studentId;
    }
    match /buddyRequests/{requestId} {
      allow read: if request.auth != null &&
        (request.auth.uid == resource.data.fromStudentId ||
         request.auth.uid == resource.data.toStudentId);
      allow create: if request.auth != null &&
        request.auth.uid == request.resource.data.fromStudentId;
      allow update: if request.auth != null &&
        request.auth.uid == resource.data.toStudentId;
    }
  }
}
```

This ensures a student can only edit their own profile, and can only see
or respond to buddy requests that involve them.

## Notes

- Password reset / email verification aren't wired up yet - `firebase/auth`
  exposes `sendPasswordResetEmail` and `sendEmailVerification` if you want
  to add those next.
- `SignUpScreen` uses a simple `ChipSelector` component instead of a picker
  library, so there's nothing extra to install for the campus/goal/level/
  day selectors.
- `scripts/seedStudents.js` (from the earlier mock-data step) is no longer
  needed for testing profiles, since Sign Up now creates real ones - but
  it's harmless to keep around if you want to quickly seed extra test
  accounts without going through the UI each time.
