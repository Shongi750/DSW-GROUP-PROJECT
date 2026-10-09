// AI Coach: pure helpers (no React Native imports, so they are easy to unit test).
// The coach itself runs on Supabase (supabase/functions/ai-coach) — see DEPLOY-AI-COACH.md.
import { cloudErrorMessage } from '../../../lib/cloudErrors';
import { isOfflineError } from '../../../lib/syncQueueCore';

export const COACH_FUNCTION = 'ai-coach';
export const COACH_HISTORY_PREFIX = 'ufitness.coach.v1.';
export const MAX_INPUT_CHARS = 1000;
export const MAX_SENT_MESSAGES = 12; // the server also keeps only the last 12
export const MAX_STORED_MESSAGES = 60;
export const DAILY_LIMIT = 30;

export const QUICK_PROMPTS = [
  'Plan my week on R300',
  'Workout for today',
  'What should I eat after gym?',
  'Cheap high-protein meals',
  'How am I doing this week?',
];

export function historyKey(uid) {
  return `${COACH_HISTORY_PREFIX}${uid || 'device'}`;
}

let counter = 0;
/** A chat bubble. role: 'user' | 'assistant' | 'notice' (local status messages, never sent). */
export function makeMessage(role, text, extra = {}, now = Date.now()) {
  counter += 1;
  return { id: `${now}-${counter}`, role, text: String(text || ''), at: now, ...extra };
}

/** Check what the student typed before sending. */
export function validateInput(text) {
  const clean = String(text || '').trim();
  if (!clean) return { ok: false, error: 'Type a question first.' };
  if (clean.length > MAX_INPUT_CHARS) {
    return { ok: false, error: `Keep it under ${MAX_INPUT_CHARS} characters.` };
  }
  return { ok: true, text: clean };
}

/** Body for supabase.functions.invoke('ai-coach'): the last few turns + the new question. */
export function buildCoachRequest(history, text) {
  const turns = (Array.isArray(history) ? history : [])
    .filter((m) => (m?.role === 'user' || m?.role === 'assistant') && String(m.text || '').trim())
    .map((m) => ({ role: m.role, content: String(m.text).trim().slice(0, 2000) }));
  const question = String(text || '').trim();
  if (question) turns.push({ role: 'user', content: question.slice(0, MAX_INPUT_CHARS) });
  let messages = turns.slice(-MAX_SENT_MESSAGES);
  while (messages.length && messages[0].role !== 'user') messages = messages.slice(1);
  return { messages };
}

/** Keep the saved chat small. */
export function trimHistory(list, max = MAX_STORED_MESSAGES) {
  const items = Array.isArray(list) ? list.filter((m) => m && m.id && m.role) : [];
  return items.slice(-max);
}

function cleanUsage(usage) {
  if (!usage || typeof usage !== 'object') return null;
  const limit = Number(usage.limit) || DAILY_LIMIT;
  const used = Math.max(0, Number(usage.used) || 0);
  const remaining = Number.isFinite(Number(usage.remaining))
    ? Math.max(0, Number(usage.remaining))
    : Math.max(0, limit - used);
  return { used, limit, remaining };
}

/** Check the function's success JSON: { reply, plan, usage }. */
export function parseCoachReply(data) {
  const body = typeof data === 'string' ? safeJson(data) : data;
  const reply = String(body?.reply || '').trim();
  if (!reply) return { error: coachErrorFor({ message: 'The coach sent an empty answer. Try again.' }) };
  const plan = body?.plan && Array.isArray(body.plan.days) && body.plan.days.length ? body.plan : null;
  return { reply, plan, usage: cleanUsage(body?.usage) };
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * Turn a failed call into something the screen can show.
 * kind: 'offline' | 'not_setup' | 'rate_limit' | 'auth' | 'busy' | 'error'
 */
export function coachErrorFor({ status = 0, code = '', message = '', usage = null, offline = false } = {}) {
  const st = Number(status) || 0;
  const c = String(code || '');
  const cleanedUsage = cleanUsage(usage);
  if (offline || (!st && isOfflineError({ message }))) {
    return { kind: 'offline', message: 'You’re offline. The AI Coach needs internet — your chat is saved here.' };
  }
  if (c === 'rate_limit' || st === 429) {
    const limit = cleanedUsage?.limit || DAILY_LIMIT;
    return {
      kind: 'rate_limit',
      message: `You’ve used all ${limit} AI Coach messages for today. They reset at midnight.`,
      usage: cleanedUsage || { used: limit, limit, remaining: 0 },
    };
  }
  if (c === 'not_setup' || st === 404 || (st === 503 && c !== 'ai_busy')) {
    return {
      kind: 'not_setup',
      message: 'The AI Coach isn’t set up yet. Your team needs to deploy it (see DEPLOY-AI-COACH.md).',
    };
  }
  if (c === 'auth' || st === 401 || st === 403) {
    return { kind: 'auth', message: 'Please sign out and sign in again to use the AI Coach.' };
  }
  if (c === 'ai_busy') {
    return { kind: 'busy', message: 'The AI is busy right now. Try again in a minute.', usage: cleanedUsage };
  }
  if (c === 'ai_error' || st >= 500) {
    return { kind: 'error', message: 'The coach couldn’t answer that. Try again.', usage: cleanedUsage };
  }
  return { kind: 'error', message: cloudErrorMessage({ message }) };
}

/** "27 of 30 messages left today" */
export function usageLabel(usage) {
  const u = cleanUsage(usage);
  if (!u) return '';
  if (!u.remaining) return 'No AI Coach messages left today';
  return `${u.remaining} of ${u.limit} messages left today`;
}

/** Total rand for a proposed plan (items with a costRand). */
export function planTotal(plan) {
  const days = Array.isArray(plan?.days) ? plan.days : [];
  const total = days.reduce(
    (sum, day) =>
      sum + (Array.isArray(day?.items) ? day.items : []).reduce((s, item) => s + (Number(item?.costRand) || 0), 0),
    0
  );
  return Math.round(total * 100) / 100;
}

/** Rand format used in the app: R12 or R12.50. */
export function formatRand(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  return Number.isInteger(n) ? `R${n}` : `R${n.toFixed(2)}`;
}
