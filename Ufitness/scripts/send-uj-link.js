const fs = require('fs');
const path = require('path');

function loadEnv(file) {
  const env = {};
  const text = fs.readFileSync(file, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
  }
  return env;
}

const env = loadEnv(path.join(__dirname, '..', '.env'));
const apiKey = env.EXPO_PUBLIC_FIREBASE_API_KEY;
if (!apiKey) {
  console.error('Missing EXPO_PUBLIC_FIREBASE_API_KEY in Ufitness/.env');
  process.exit(1);
}

const email = '223222161@student.uj.ac.za';
const continueUrl = `http://localhost:8090/?signup=1&email=${encodeURIComponent(email)}`;

(async () => {
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requestType: 'EMAIL_SIGNIN',
      email,
      continueUrl,
      canHandleCodeInApp: true,
    }),
  });
  const data = await response.json();
  if (data.error) {
    console.error('Firebase refused the send:', data.error.message);
    if (String(data.error.message).includes('OPERATION_NOT_ALLOWED')) {
      console.error('Enable Email link (passwordless sign-in) in Authentication → Sign-in method.');
    }
    process.exit(1);
  }
  console.log('Sign-up link requested for', email);
  console.log('Continue URL host: localhost:8090');
  console.log('If the inbox is empty, SMTP is still Firebase noreply — set Gmail SMTP in the console.');
})().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
