// ai-coach — Supabase Edge Function (Deno).
// UFitness AI Coach: Gemini via the Vercel AI SDK, with read-only tools over the student's own data.
//
// The app calls: supabase.functions.invoke('ai-coach', { body: { messages: [{ role, content }] } })
// and gets back: { reply, plan, usage: { used, limit, remaining } }.
//
// - Needs a signed-in user's JWT. All database reads use THEIR token, so RLS only shows their rows.
// - 30 messages per student per day (ai_coach_take() in supabase/migrations/2026-10-08-ai-coach.sql).
// - The Gemini key comes from the GEMINI_API_KEY secret (npx supabase secrets set ...). Never put it in the app.
// - Optional secret GEMINI_MODEL (default gemini-3.5-flash-lite, see handler.ts).
// Deploy steps: DEPLOY-AI-COACH.md.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { generateText, stepCountIs, tool } from 'npm:ai@7';
import { createGoogleGenerativeAI } from 'npm:@ai-sdk/google@4';
import { z } from 'npm:zod@4';
import { handle } from './handler.ts';

Deno.serve((req) =>
  handle(req, {
    env: (name) => Deno.env.get(name),
    createClient,
    generateText,
    tool,
    stepCountIs,
    z,
    makeModel: (apiKey, modelId) => createGoogleGenerativeAI({ apiKey })(modelId),
  })
);
