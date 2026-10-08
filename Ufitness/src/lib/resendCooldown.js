// "Send a new code" cooldown + friendly resend errors.
// No React Native imports, so this is easy to unit test.

export const RESEND_COOLDOWN_SECONDS = 60;

/** Whole seconds left before another code can be sent (0 = can send now). */
export function secondsLeft(lastSentAt, now = Date.now(), cooldown = RESEND_COOLDOWN_SECONDS) {
  if (!lastSentAt) return 0;
  const waitedMs = now - Number(lastSentAt);
  if (!Number.isFinite(waitedMs) || waitedMs < 0) return cooldown;
  return Math.max(0, Math.ceil(cooldown - waitedMs / 1000));
}

export function canResend(lastSentAt, now = Date.now(), cooldown = RESEND_COOLDOWN_SECONDS) {
  return secondsLeft(lastSentAt, now, cooldown) === 0;
}

/** Button label: "Send a new code" or "Send a new code in 0:42". */
export function resendLabel(seconds) {
  if (!seconds) return 'Send a new code';
  const mins = Math.floor(seconds / 60);
  const secs = String(seconds % 60).padStart(2, '0');
  return `Send a new code in ${mins}:${secs}`;
}

/**
 * Supabase says "For security purposes, you can only request this after 42 seconds."
 * Returns 42, or null when the message has no wait time.
 */
export function retryAfterSeconds(error) {
  const message = String(error?.message || error || '');
  const match = message.match(/after (\d+) seconds?/i);
  return match ? Number(match[1]) : null;
}

/** True for any Supabase rate-limit style error (429, over_*_rate_limit, "too many"). */
export function isRateLimitError(error) {
  const code = String(error?.code || '');
  const message = String(error?.message || error || '');
  return (
    Number(error?.status) === 429 ||
    /rate_limit/i.test(code) ||
    /rate limit|too many|security purposes/i.test(message)
  );
}

/**
 * What to show when resending fails.
 * Returns { message, waitSeconds } — waitSeconds restarts the cooldown (0 = none).
 */
export function resendErrorInfo(error) {
  const message = String(error?.message || error || '');
  const wait = retryAfterSeconds(error);
  if (wait) {
    return { message: `Please wait ${wait} seconds before asking for another code.`, waitSeconds: wait };
  }
  if (/email rate limit|over_email_send_rate_limit/i.test(`${error?.code || ''} ${message}`)) {
    return {
      message:
        'We have sent too many emails for now. Check Junk for the last code, or try again in a few minutes.',
      waitSeconds: RESEND_COOLDOWN_SECONDS,
    };
  }
  if (isRateLimitError(error)) {
    return { message: 'Too many tries. Wait a minute, then try again.', waitSeconds: RESEND_COOLDOWN_SECONDS };
  }
  if (/failed to fetch|network|load failed|timeout/i.test(message)) {
    return { message: 'No connection. Check Wi‑Fi or mobile data, then try again.', waitSeconds: 0 };
  }
  return { message: '', waitSeconds: 0 };
}
