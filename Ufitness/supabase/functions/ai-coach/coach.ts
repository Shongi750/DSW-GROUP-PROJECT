// Pure helpers for the ai-coach Edge Function (no Deno / npm imports, easy to test).

export const MAX_MESSAGES = 12; // conversation turns sent to the model
export const MAX_CHARS_PER_MESSAGE = 2000;
export const MAX_TOTAL_CHARS = 12000;
export const DAILY_LIMIT = 30; // must match ai_coach_take() in the migration (it caps at 30)

export type ChatMessage = { role: 'user' | 'assistant'; content: string };

export function systemPrompt(today: string): string {
  return [
    'You are "UFitness Coach", a friendly fitness and nutrition coach inside the UFitness app for',
    'University of Johannesburg (UJ) students. Today is ' + today + ' (South Africa).',
    '',
    'How you help:',
    '- Workouts: practical plans for students (campus gym, res room or outdoor). Respect their goal,',
    '  experience, training days and any injuries they listed. Give sets x reps and rest times.',
    '- Food: cheap, filling South African meals (pap, eggs, beans, lentils, chicken livers, pilchards,',
    '  samp, oats, peanut butter, bananas, mince, soya mince, cabbage...). Money is ALWAYS in South African',
    '  rand (R). Keep to their weekly food budget; if it is very tight, say so kindly and give the cheapest',
    '  protein options. Use realistic Shoprite / Pick n Pay / Checkers prices and say they are estimates.',
    '- Use the tools to read THEIR data (profile, recent workouts, meal plan, progress) before giving',
    '  personal advice. Never invent data you did not get from a tool. If a tool returns nothing, ask.',
    '- When they ask for a plan (week of meals, a workout, a weekly schedule), call propose_plan with the',
    '  structured plan AND give a short friendly summary in your reply. Do not repeat the whole plan in text.',
    '',
    'Style: warm, short and clear (under ~180 words unless they ask for detail). Plain sentences and short',
    'lists. Use local, student-friendly language. Encourage, never shame bodies or food choices.',
    '',
    'Safety rules (always follow):',
    '- You are not a doctor or dietitian. Do NOT diagnose, name conditions, or advise on medication or',
    '  supplements doses. For pain, injury, dizziness, chest pain, eating-disorder signs, pregnancy or any',
    '  medical condition, tell them to stop and see Campus Health (UJ Campus Health Service) or a doctor.',
    '- If someone mentions self-harm or a crisis, respond with care and share: SADAG 0800 567 567 (24h),',
    '  UJ PsyCaD, or emergency 10111 / 112. Do not continue with fitness advice in that message.',
    '- No extreme diets: never suggest below ~1500 kcal/day for men or ~1200 for women, fasting longer than',
    '  a normal overnight fast, or losing more than about 1% of body weight per week.',
    '- Add a one-line reminder that this is general guidance, not medical advice, when you give a plan.',
    '- Only talk about fitness, food, sleep, study-life balance and using the app. Politely decline other topics.',
  ].join('\n');
}

/** Clean the chat the app sent: only user/assistant text, trimmed, last N turns, ends with the user. */
export function sanitizeMessages(input: unknown): { messages: ChatMessage[] } | { error: string } {
  if (!Array.isArray(input)) return { error: 'messages must be a list' };
  const cleaned: ChatMessage[] = [];
  for (const item of input) {
    const role = (item as any)?.role;
    const content = String((item as any)?.content ?? '').trim();
    if ((role !== 'user' && role !== 'assistant') || !content) continue;
    cleaned.push({ role, content: content.slice(0, MAX_CHARS_PER_MESSAGE) });
  }
  let recent = cleaned.slice(-MAX_MESSAGES);
  // Drop the oldest turns until the total fits.
  while (recent.length > 1 && recent.reduce((sum, m) => sum + m.content.length, 0) > MAX_TOTAL_CHARS) {
    recent = recent.slice(1);
  }
  while (recent.length && recent[0].role !== 'user') recent = recent.slice(1);
  if (!recent.length || recent[recent.length - 1].role !== 'user') {
    return { error: 'the last message must be from the user' };
  }
  return { messages: recent };
}

function num(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Only what the coach needs from profiles.profile (no email, student number, avatar...). */
export function pickProfile(profile: any) {
  if (!profile || typeof profile !== 'object') return null;
  const diet = profile.dietFilters && typeof profile.dietFilters === 'object'
    ? Object.keys(profile.dietFilters).filter((k) => profile.dietFilters[k])
    : [];
  return {
    firstName: String(profile.name || profile.public?.name || '').split(' ')[0] || null,
    campus: profile.campus || profile.public?.campus || null,
    yearOfStudy: profile.yearOfStudy || null,
    fitnessGoal: profile.fitnessGoal || null,
    experienceLevel: profile.experienceLevel || null,
    workoutPreference: profile.workoutPreference || null,
    daysPerWeek: num(profile.daysPerWeek),
    gender: profile.gender || null,
    fundingType: profile.fundingType || null,
    monthlyFoodBudgetRand: num(profile.foodBudgetAmount),
    weeklyFoodBudgetRand: num(profile.weeklyFoodBudget),
    dietFilters: diet,
  };
}

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysAgo(now: Date, days: number): string {
  return dateKey(new Date(now.getTime() - days * 86400000));
}

/** user_docs 'workout' → goal, schedule, injuries and the last N days of sessions. */
export function summarizeWorkouts(doc: any, days = 14, now = new Date()) {
  if (!doc || typeof doc !== 'object') return null;
  const since = daysAgo(now, Math.min(Math.max(Math.round(days) || 14, 1), 60));
  const history = Array.isArray(doc.history) ? doc.history : [];
  const sessions = history
    .filter((h: any) => typeof h?.date === 'string' && h.date >= since)
    .slice(0, 30)
    .map((h: any) => ({
      date: h.date,
      minutes: num(h.minutes) ?? 0,
      exercises: Array.isArray(h.exerciseIds) ? h.exerciseIds.length : 0,
      program: h.programId || null,
      sets: Array.isArray(h.setsLog)
        ? h.setsLog.slice(0, 8).map((e: any) => ({
            exercise: e?.name || e?.id || 'exercise',
            sets: Array.isArray(e?.sets) ? e.sets.length : 0,
            topWeightKg: Array.isArray(e?.sets)
              ? Math.max(0, ...e.sets.map((s: any) => num(s?.weightKg) ?? 0))
              : 0,
          }))
        : [],
    }));
  return {
    goal: doc.goal || null,
    experience: doc.experience || null,
    equipment: doc.equipmentTier || null,
    daysPerWeek: num(doc.daysPerWeek),
    trainWeekdays: Array.isArray(doc.trainWeekdays) ? doc.trainWeekdays : [],
    bodyWeightKg: num(doc.weightKg),
    injuries: Array.isArray(doc.injuries) ? doc.injuries.slice(0, 10) : [],
    sinceDate: since,
    sessions,
  };
}

/** user_docs 'mealPlans' (+ profile budget) → budget, diet and grocery list. */
export function summarizeMealPlan(doc: any, profile: any) {
  const plan = doc && typeof doc === 'object' ? doc : {};
  const groceries = Array.isArray(plan.groceries) ? plan.groceries : [];
  const needed = groceries.filter((g: any) => g && g.needed !== false);
  const groceryTotal = Math.round(needed.reduce((sum: number, g: any) => sum + (num(g.price) ?? 0), 0));
  const weekly = num(plan.budget) ?? num(profile?.weeklyFoodBudget);
  return {
    weeklyBudgetRand: weekly,
    monthlyBudgetRand: num(profile?.foodBudgetAmount),
    goal: plan.goal || null,
    dietFilters: plan.dietFilters && typeof plan.dietFilters === 'object'
      ? Object.keys(plan.dietFilters).filter((k) => plan.dietFilters[k])
      : [],
    store: plan.storeId || null,
    groceryItems: needed.slice(0, 25).map((g: any) => ({
      name: String(g.name || g.title || 'item'),
      priceRand: num(g.price),
    })),
    groceryTotalRand: groceryTotal,
    leftAfterGroceriesRand: weekly != null ? Math.max(0, Math.round(weekly - groceryTotal)) : null,
    hasPlan: Boolean(doc),
  };
}

/** Workouts + food log + achievements → simple progress numbers. */
export function summarizeProgress(workoutDoc: any, eatenDoc: any, achievementsDoc: any, now = new Date()) {
  const history = Array.isArray(workoutDoc?.history) ? workoutDoc.history : [];
  const within = (days: number) => {
    const since = daysAgo(now, days);
    return history.filter((h: any) => typeof h?.date === 'string' && h.date >= since);
  };
  const last7 = within(7);
  const last30 = within(30);
  const minutes = (list: any[]) => list.reduce((s, h) => s + (num(h.minutes) ?? 0), 0);
  const kcalDays: { date: string; kcal: number; proteinG: number }[] = [];
  if (eatenDoc && typeof eatenDoc === 'object') {
    for (let i = 0; i < 7; i += 1) {
      const key = daysAgo(now, i);
      const items = Array.isArray(eatenDoc[key]) ? eatenDoc[key] : [];
      if (!items.length) continue;
      kcalDays.push({
        date: key,
        kcal: Math.round(items.reduce((s: number, it: any) => s + (num(it?.kcal) ?? 0), 0)),
        proteinG: Math.round(items.reduce((s: number, it: any) => s + (num(it?.protein) ?? 0), 0)),
      });
    }
  }
  const unlocked = achievementsDoc && typeof achievementsDoc === 'object'
    ? Object.keys(achievementsDoc.unlocked || achievementsDoc).length
    : 0;
  return {
    sessionsLast7Days: new Set(last7.map((h: any) => h.date)).size,
    minutesLast7Days: minutes(last7),
    sessionsLast30Days: new Set(last30.map((h: any) => h.date)).size,
    minutesLast30Days: minutes(last30),
    targetDaysPerWeek: num(workoutDoc?.daysPerWeek),
    foodLogLast7Days: kcalDays,
    achievementsUnlocked: unlocked,
  };
}

/** Keep a proposed plan small and well-formed before it goes back to the app. */
export function cleanPlan(input: any) {
  if (!input || typeof input !== 'object') return null;
  const kind = ['meals', 'workout', 'week'].includes(input.kind) ? input.kind : 'week';
  const days = (Array.isArray(input.days) ? input.days : []).slice(0, 7).map((d: any) => ({
    day: String(d?.day || '').slice(0, 30),
    items: (Array.isArray(d?.items) ? d.items : []).slice(0, 8).map((it: any) => ({
      name: String(it?.name || '').slice(0, 80),
      detail: String(it?.detail || '').slice(0, 160),
      costRand: num(it?.costRand),
    })).filter((it: any) => it.name),
  })).filter((d: any) => d.day && d.items.length);
  if (!days.length) return null;
  return {
    kind,
    title: String(input.title || 'Your plan').slice(0, 80),
    budgetRand: num(input.budgetRand),
    days,
    tips: (Array.isArray(input.tips) ? input.tips : []).slice(0, 5).map((t: any) => String(t).slice(0, 160)),
  };
}

/** Today's date in South Africa, e.g. "Thursday 8 October 2026". */
export function todayInSA(now = new Date()): string {
  return new Intl.DateTimeFormat('en-ZA', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Johannesburg',
  }).format(now);
}
