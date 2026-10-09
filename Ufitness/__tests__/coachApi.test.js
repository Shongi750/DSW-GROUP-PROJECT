// askCoach() with a fake Supabase client: checks how function errors reach the screen.
const mockInvoke = jest.fn();
let mockOnline = true;

jest.mock('../src/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: { functions: { invoke: (...args) => mockInvoke(...args) } },
}));
jest.mock('../src/lib/autoSync', () => ({ isOnline: () => mockOnline }));

const { askCoach } = require('../src/features/coach/lib/coachApi');

function httpError(status, body) {
  return {
    name: 'FunctionsHttpError',
    message: 'Edge Function returned a non-2xx status code',
    context: { status, json: async () => body },
  };
}

beforeEach(() => {
  mockInvoke.mockReset();
  mockOnline = true;
});

test('sends the chat to the ai-coach function and returns the reply', async () => {
  mockInvoke.mockResolvedValue({ data: { reply: 'Eat pap and eggs.', plan: null, usage: { used: 1, limit: 30, remaining: 29 } }, error: null });
  const result = await askCoach([{ id: '1', role: 'assistant', text: 'Hi' }], 'What should I eat after gym?');
  expect(mockInvoke).toHaveBeenCalledWith('ai-coach', {
    body: { messages: [{ role: 'user', content: 'What should I eat after gym?' }] },
  });
  expect(result.reply).toBe('Eat pap and eggs.');
  expect(result.usage.remaining).toBe(29);
});

test('offline: does not call the function', async () => {
  mockOnline = false;
  const result = await askCoach([], 'hi');
  expect(mockInvoke).not.toHaveBeenCalled();
  expect(result.error.kind).toBe('offline');
});

test('rate limit from the function', async () => {
  mockInvoke.mockResolvedValue({ data: null, error: httpError(429, { code: 'rate_limit', usage: { used: 30, limit: 30, remaining: 0 } }) });
  const result = await askCoach([], 'hi');
  expect(result.error.kind).toBe('rate_limit');
  expect(result.error.usage.remaining).toBe(0);
});

test('function not deployed (404) → not set up', async () => {
  mockInvoke.mockResolvedValue({ data: null, error: httpError(404, { message: 'Requested function was not found' }) });
  expect((await askCoach([], 'hi')).error.kind).toBe('not_setup');
});

test('missing Gemini key (503 not_setup) → not set up', async () => {
  mockInvoke.mockResolvedValue({ data: null, error: httpError(503, { code: 'not_setup', error: 'GEMINI_API_KEY missing' }) });
  expect((await askCoach([], 'hi')).error.kind).toBe('not_setup');
});

test('request never reached Supabase → offline', async () => {
  mockInvoke.mockResolvedValue({ data: null, error: { name: 'FunctionsFetchError', message: 'Failed to send a request to the Edge Function', context: new TypeError('Network request failed') } });
  expect((await askCoach([], 'hi')).error.kind).toBe('offline');
});

test('invoke throwing never crashes the screen', async () => {
  mockInvoke.mockRejectedValue(new Error('boom'));
  const result = await askCoach([], 'hi');
  expect(result.error.kind).toBe('error');
});
