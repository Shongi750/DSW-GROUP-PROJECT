// Request handler for ai-coach. Dependencies (AI SDK, Supabase, the model) are passed in so the
// whole flow can be tested with a mock model (see handler_test.ts). index.ts wires the real ones.
import {
  cleanPlan,
  DAILY_LIMIT,
  pickProfile,
  sanitizeMessages,
  summarizeMealPlan,
  summarizeProgress,
  summarizeWorkouts,
  systemPrompt,
  todayInSA,
} from './coach.ts';

// gemini-2.5-* is limited to keys that already used it, so new keys get errors. Use a current model.
export const DEFAULT_MODEL = 'gemini-3.5-flash-lite';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export type Deps = {
  env: (name: string) => string | undefined;
  createClient: (url: string, key: string, options?: any) => any;
  generateText: (options: any) => Promise<any>;
  tool: (definition: any) => any;
  stepCountIs: (n: number) => any;
  z: any;
  makeModel: (apiKey: string, modelId: string) => any;
  now?: () => Date;
};

function isMissing(error: any) {
  const code = String(error?.code || '').toUpperCase();
  return ['42P01', 'PGRST202', 'PGRST205'].includes(code) ||
    /does not exist|could not find the (table|function)|schema cache/i.test(String(error?.message || ''));
}

export async function handle(req: Request, deps: Deps): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'use POST', code: 'bad_request' }, 405);

  const apiKey = deps.env('GEMINI_API_KEY') ?? '';
  if (!apiKey) return json({ error: 'AI coach is not set up yet (GEMINI_API_KEY missing)', code: 'not_setup' }, 503);

  // 1) Must be a signed-in UFitness user.
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return json({ error: 'sign in first', code: 'auth' }, 401);
  const url = deps.env('SUPABASE_URL') ?? '';
  const anon = deps.env('SUPABASE_ANON_KEY') ?? '';
  // This client acts AS the student (their JWT), so row-level security limits every read to their own rows.
  const db = deps.createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userData, error: userError } = await db.auth.getUser(token);
  const uid = userData?.user?.id;
  if (userError || !uid) return json({ error: 'sign in first', code: 'auth' }, 401);

  // 2) Validate the chat.
  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'send JSON', code: 'bad_request' }, 400);
  }
  const cleaned = sanitizeMessages(body?.messages);
  if ('error' in cleaned) return json({ error: cleaned.error, code: 'bad_request' }, 400);

  // 3) Daily limit (counted in the database, per student, per SA day).
  const { data: quota, error: quotaError } = await db.rpc('ai_coach_take');
  if (quotaError) {
    if (isMissing(quotaError)) {
      return json({ error: 'AI coach is not set up yet (run the ai-coach migration)', code: 'not_setup' }, 503);
    }
    return json({ error: 'could not check your daily limit', code: 'error' }, 500);
  }
  const usage = {
    used: Number(quota?.used) || 0,
    limit: Number(quota?.limit) || DAILY_LIMIT,
    remaining: Math.max(0, Number(quota?.remaining) || 0),
  };
  if (!quota?.allowed) {
    return json({ error: `daily limit of ${usage.limit} coach messages reached`, code: 'rate_limit', usage }, 429);
  }

  // 4) Read-only tools over the student's own data.
  const { z, tool } = deps;
  const now = deps.now ? deps.now() : new Date();
  const docCache: Record<string, any> = {};
  async function doc(name: string) {
    if (name in docCache) return docCache[name];
    const { data } = await db.from('user_docs').select('data').eq('user_id', uid).eq('doc', name).maybeSingle();
    docCache[name] = data?.data ?? null;
    return docCache[name];
  }
  let profileRow: any;
  async function profile() {
    if (profileRow !== undefined) return profileRow;
    const { data } = await db.from('profiles').select('profile').eq('id', uid).maybeSingle();
    profileRow = data?.profile ?? null;
    return profileRow;
  }
  let proposed: any = null;

  const tools = {
    get_my_profile: tool({
      description: "The student's profile: first name, campus, goal, experience, training days, food budget, diet filters.",
      inputSchema: z.object({}),
      execute: async () => pickProfile(await profile()) ?? { note: 'No profile saved yet.' },
    }),
    get_my_workouts: tool({
      description: 'Recent workout sessions (date, minutes, exercises, sets) plus goal, equipment, schedule and injuries.',
      inputSchema: z.object({ days: z.number().int().min(1).max(60).optional().describe('How many days back (default 14)') }),
      execute: async ({ days }: { days?: number }) =>
        summarizeWorkouts(await doc('workout'), days ?? 14, now) ?? { note: 'No workouts logged yet.' },
    }),
    get_my_meal_plan: tool({
      description: 'Weekly food budget in rand, diet filters, meal-plan goal and the current grocery list with prices.',
      inputSchema: z.object({}),
      execute: async () => summarizeMealPlan(await doc('mealPlans'), await profile()),
    }),
    get_my_progress: tool({
      description: 'Progress numbers: sessions and minutes in the last 7/30 days, food log (kcal, protein) for 7 days, achievements.',
      inputSchema: z.object({}),
      execute: async () => summarizeProgress(await doc('workout'), await doc('eaten'), await doc('achievements'), now),
    }),
    propose_plan: tool({
      description:
        'Send a structured plan the app shows as a card (meal week on a budget, a workout, or a weekly schedule). ' +
        'Use rand for costRand. Keep it realistic for a UJ student.',
      inputSchema: z.object({
        kind: z.enum(['meals', 'workout', 'week']),
        title: z.string().max(80),
        budgetRand: z.number().optional(),
        days: z.array(z.object({
          day: z.string().describe('e.g. "Monday" or "Today"'),
          items: z.array(z.object({
            name: z.string().describe('Meal or exercise'),
            detail: z.string().optional().describe('Portion, or sets x reps / rest'),
            costRand: z.number().optional(),
          })).max(8),
        })).min(1).max(7),
        tips: z.array(z.string()).max(5).optional(),
      }),
      execute: async (input: any) => {
        proposed = cleanPlan(input);
        return proposed ? { shown: true } : { shown: false, reason: 'plan was empty' };
      },
    }),
  };

  // 5) Ask Gemini (tool calls are run automatically, up to 5 steps).
  try {
    const result = await deps.generateText({
      model: deps.makeModel(apiKey, deps.env('GEMINI_MODEL') || DEFAULT_MODEL),
      system: systemPrompt(todayInSA(now)),
      messages: cleaned.messages,
      tools,
      stopWhen: deps.stepCountIs(5),
      maxOutputTokens: 1200,
      temperature: 0.6,
    });
    const reply = String(result?.text || '').trim() ||
      (proposed ? 'Here is a plan for you. General guidance only, not medical advice.' : 'Sorry, I could not answer that. Try asking another way.');
    return json({ reply, plan: proposed, usage });
  } catch (error: any) {
    // AI SDK wraps retried failures (429/5xx) in a RetryError; the real API error is lastError.
    const inner = error?.lastError ?? error;
    const status = Number(inner?.statusCode || inner?.status || error?.statusCode || 0);
    const message = String(inner?.message || error?.message || '') + ' ' + String(inner?.responseBody || '').slice(0, 300);
    console.error('ai-coach model error', status, message.slice(0, 300));
    if (status === 400 && /api key/i.test(message) || status === 401 || status === 403) {
      return json({ error: 'AI coach is not set up yet (Gemini key rejected)', code: 'not_setup' }, 503);
    }
    if (status === 429 || status === 503) {
      return json({ error: 'the AI is busy right now, try again in a minute', code: 'ai_busy', usage }, 503);
    }
    return json({ error: 'the AI could not answer, try again', code: 'ai_error', usage }, 502);
  }
}
