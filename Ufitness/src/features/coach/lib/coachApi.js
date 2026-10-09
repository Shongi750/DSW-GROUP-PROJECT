import { isSupabaseConfigured, supabase } from '../../../lib/supabase';
import { isOnline } from '../../../lib/autoSync';
import { isOfflineError } from '../../../lib/syncQueueCore';
import { buildCoachRequest, COACH_FUNCTION, coachErrorFor, parseCoachReply } from './coachCore';

/**
 * Ask the AI Coach (Supabase Edge Function 'ai-coach').
 * Returns { reply, plan, usage } or { error: { kind, message, usage? } }. Never throws.
 */
export async function askCoach(history, text) {
  if (!isSupabaseConfigured || !supabase) {
    return { error: coachErrorFor({ code: 'not_setup' }) };
  }
  if (!isOnline()) return { error: coachErrorFor({ offline: true }) };

  const body = buildCoachRequest(history, text);
  try {
    const { data, error } = await supabase.functions.invoke(COACH_FUNCTION, { body });
    if (!error) return parseCoachReply(data);

    // FunctionsHttpError: the function answered with an error status (JSON body has code/error/usage).
    // FunctionsFetchError: the request never reached Supabase (no signal / DNS).
    const status = Number(error?.context?.status) || 0;
    let details = null;
    if (typeof error?.context?.json === 'function') {
      try {
        details = await error.context.json();
      } catch {
        details = null;
      }
    }
    const offline = error?.name === 'FunctionsFetchError' || isOfflineError(error?.context);
    return {
      error: coachErrorFor({
        status,
        code: details?.code,
        message: details?.error || error?.message,
        usage: details?.usage,
        offline,
      }),
    };
  } catch (caught) {
    return { error: coachErrorFor({ message: caught?.message, offline: isOfflineError(caught) }) };
  }
}
