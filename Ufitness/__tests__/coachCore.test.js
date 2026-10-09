import {
  buildCoachRequest,
  coachErrorFor,
  formatRand,
  historyKey,
  makeMessage,
  parseCoachReply,
  planTotal,
  QUICK_PROMPTS,
  trimHistory,
  usageLabel,
  validateInput,
} from '../src/features/coach/lib/coachCore';

describe('AI Coach request building', () => {
  test('sends only user/assistant turns plus the new question', () => {
    const history = [
      makeMessage('user', 'Hi'),
      makeMessage('assistant', 'Hey! How can I help?'),
      makeMessage('notice', 'You’re offline', { kind: 'offline' }),
      makeMessage('assistant', '   '),
    ];
    expect(buildCoachRequest(history, '  Workout for today ')).toEqual({
      messages: [
        { role: 'user', content: 'Hi' },
        { role: 'assistant', content: 'Hey! How can I help?' },
        { role: 'user', content: 'Workout for today' },
      ],
    });
  });

  test('keeps the last 12 turns and always starts with the user', () => {
    const history = [];
    for (let i = 0; i < 20; i += 1) {
      history.push(makeMessage('user', `q${i}`));
      history.push(makeMessage('assistant', `a${i}`));
    }
    const { messages } = buildCoachRequest(history, 'last');
    expect(messages.length).toBeLessThanOrEqual(12);
    expect(messages[0].role).toBe('user');
    expect(messages[messages.length - 1]).toEqual({ role: 'user', content: 'last' });
  });

  test('validates input', () => {
    expect(validateInput('   ').ok).toBe(false);
    expect(validateInput('x'.repeat(1001)).ok).toBe(false);
    expect(validateInput('  Plan my week on R300 ')).toEqual({ ok: true, text: 'Plan my week on R300' });
  });

  test('quick prompts include the agreed ones', () => {
    expect(QUICK_PROMPTS).toEqual(
      expect.arrayContaining(['Plan my week on R300', 'Workout for today', 'What should I eat after gym?'])
    );
  });
});

describe('AI Coach error mapping', () => {
  test('offline', () => {
    expect(coachErrorFor({ offline: true }).kind).toBe('offline');
    expect(coachErrorFor({ message: 'Network request failed' }).kind).toBe('offline');
  });

  test('rate limit keeps the usage and says when it resets', () => {
    const error = coachErrorFor({ status: 429, code: 'rate_limit', usage: { used: 30, limit: 30, remaining: 0 } });
    expect(error.kind).toBe('rate_limit');
    expect(error.message).toMatch(/30 AI Coach messages/);
    expect(error.usage).toEqual({ used: 30, limit: 30, remaining: 0 });
  });

  test('not deployed (404), no key / no migration (503 not_setup)', () => {
    expect(coachErrorFor({ status: 404 }).kind).toBe('not_setup');
    expect(coachErrorFor({ status: 503, code: 'not_setup' }).kind).toBe('not_setup');
    expect(coachErrorFor({ code: 'not_setup' }).message).toMatch(/DEPLOY-AI-COACH/);
  });

  test('busy is not "not set up"', () => {
    expect(coachErrorFor({ status: 503, code: 'ai_busy' }).kind).toBe('busy');
  });

  test('auth and generic errors', () => {
    expect(coachErrorFor({ status: 401, code: 'auth' }).kind).toBe('auth');
    expect(coachErrorFor({ status: 502, code: 'ai_error' }).kind).toBe('error');
    // Unknown errors go through cloudErrors' friendly text.
    expect(coachErrorFor({ message: 'new row violates row-level security policy' }).message).toBe(
      'You are not allowed to do that.'
    );
  });
});

describe('AI Coach replies and helpers', () => {
  const plan = {
    kind: 'meals',
    title: 'R300 week',
    budgetRand: 300,
    days: [
      { day: 'Monday', items: [{ name: 'Pap & eggs', costRand: 12.5 }, { name: 'Beans' }] },
      { day: 'Tuesday', items: [{ name: 'Lentil stew', costRand: 20 }] },
    ],
  };

  test('parses a good reply', () => {
    const result = parseCoachReply({ reply: ' Hi ', plan, usage: { used: 2, limit: 30, remaining: 28 } });
    expect(result).toEqual({ reply: 'Hi', plan, usage: { used: 2, limit: 30, remaining: 28 } });
  });

  test('empty reply is an error; empty plan is dropped', () => {
    expect(parseCoachReply({ reply: '' }).error.kind).toBe('error');
    expect(parseCoachReply('{"reply":"ok","plan":{"days":[]}}')).toEqual({ reply: 'ok', plan: null, usage: null });
  });

  test('plan total and rand format', () => {
    expect(planTotal(plan)).toBe(32.5);
    expect(formatRand(32.5)).toBe('R32.50');
    expect(formatRand(300)).toBe('R300');
    expect(formatRand('x')).toBe('');
  });

  test('usage label', () => {
    expect(usageLabel({ used: 3, limit: 30, remaining: 27 })).toBe('27 of 30 messages left today');
    expect(usageLabel({ used: 30, limit: 30, remaining: 0 })).toBe('No AI Coach messages left today');
    expect(usageLabel(null)).toBe('');
  });

  test('history is saved per student and trimmed', () => {
    expect(historyKey('abc')).toBe('ufitness.coach.v1.abc');
    expect(historyKey(null)).toBe('ufitness.coach.v1.device');
    const many = Array.from({ length: 80 }, (_, i) => makeMessage('user', `m${i}`));
    const kept = trimHistory(many);
    expect(kept).toHaveLength(60);
    expect(kept[59].text).toBe('m79');
    expect(trimHistory([null, { text: 'no id' }])).toEqual([]);
  });
});
