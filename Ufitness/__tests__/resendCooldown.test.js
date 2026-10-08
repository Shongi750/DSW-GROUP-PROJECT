import {
  RESEND_COOLDOWN_SECONDS,
  canResend,
  isRateLimitError,
  resendErrorInfo,
  resendLabel,
  retryAfterSeconds,
  secondsLeft,
} from '../src/lib/resendCooldown';

describe('resend cooldown', () => {
  const sent = 1_000_000;

  test('full 60 s right after sending, then counts down', () => {
    expect(RESEND_COOLDOWN_SECONDS).toBe(60);
    expect(secondsLeft(sent, sent)).toBe(60);
    expect(secondsLeft(sent, sent + 1)).toBe(60); // rounds up, never shows 0 too early
    expect(secondsLeft(sent, sent + 18_000)).toBe(42);
    expect(secondsLeft(sent, sent + 59_001)).toBe(1);
  });

  test('can resend after the cooldown, or when nothing was sent', () => {
    expect(secondsLeft(sent, sent + 60_000)).toBe(0);
    expect(canResend(sent, sent + 61_000)).toBe(true);
    expect(canResend(sent, sent + 30_000)).toBe(false);
    expect(secondsLeft(0, sent)).toBe(0);
    expect(canResend(null)).toBe(true);
  });

  test('clock going backwards keeps the full wait', () => {
    expect(secondsLeft(sent, sent - 5_000)).toBe(60);
  });

  test('button label', () => {
    expect(resendLabel(0)).toBe('Send a new code');
    expect(resendLabel(42)).toBe('Send a new code in 0:42');
    expect(resendLabel(65)).toBe('Send a new code in 1:05');
  });
});

describe('resend errors', () => {
  test('reads the wait time Supabase gives', () => {
    const error = { status: 429, message: 'For security purposes, you can only request this after 37 seconds.' };
    expect(retryAfterSeconds(error)).toBe(37);
    expect(resendErrorInfo(error)).toEqual({
      message: 'Please wait 37 seconds before asking for another code.',
      waitSeconds: 37,
    });
  });

  test('email send limit gets its own message and a cooldown', () => {
    const info = resendErrorInfo({ status: 429, code: 'over_email_send_rate_limit', message: 'email rate limit exceeded' });
    expect(info.message).toMatch(/too many emails/);
    expect(info.waitSeconds).toBe(60);
  });

  test('other rate limits', () => {
    expect(isRateLimitError({ status: 429, message: 'x' })).toBe(true);
    expect(isRateLimitError({ code: 'over_request_rate_limit' })).toBe(true);
    expect(isRateLimitError({ message: 'Invalid login credentials' })).toBe(false);
    expect(resendErrorInfo({ status: 429, message: 'Too many requests' }).message).toMatch(/Wait a minute/);
  });

  test('network and unknown errors', () => {
    expect(resendErrorInfo(new Error('TypeError: Failed to fetch'))).toEqual({
      message: 'No connection. Check Wi‑Fi or mobile data, then try again.',
      waitSeconds: 0,
    });
    // empty message → screen falls back to friendlyAuthError
    expect(resendErrorInfo({ message: 'Something odd' })).toEqual({ message: '', waitSeconds: 0 });
  });
});
