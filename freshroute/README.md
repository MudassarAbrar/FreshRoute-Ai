# FreshRoute Agent

An AI-powered produce-selling platform for Pakistani farmers. A WhatsApp-style
chatting agent compares mandi prices, estimates spoilage-adjusted net earnings,
drafts buyer outreach for explicit approval, and tracks the delivery — backed by
a shared Supabase database with a farmer app and an admin portal.

**Setup instructions: [SETUP.md](./SETUP.md)** (Supabase project, SQL migrations,
Edge Function, server-side Gemini key, admin promotion).

## What's inside

```
src/
  pages/            farmer app (dashboard, orders, revenue, profile) + /admin portal + auth pages
  pages/ChatPage    the agent chat, mounted inside a phone frame
  components/cards  chat message cards: lot, scenarios, offers, approval, order, alerts
  store/director    the conversation director — stage machine that drives the chat
  store/useApp      global state (auth, session, lang, AI mode, messages)
  lib/gemini        all AI calls → Supabase Edge Function `gemini-proxy` (key never in the bundle)
  lib/engine        deterministic pricing/spoilage/transport math
  lib/db            Supabase data layer (orders, metrics, reviews, notifications)
supabase/
  migrations/       schema + RLS, seed data
  functions/gemini-proxy/   server-side Gemini proxy (JWT-verified, usage-logged)
```

## Key behaviors

- **Approval-first outreach** — the agent never sends a message, books transport,
  or commits funds without an explicit approve/decline action. Everything is
  timestamped in the Action Log.
- **Honest AI status** — a mode badge (LIVE / DEMO / AI ERROR) reflects the
  server-reported state; failures surface as chat messages, never silent fallbacks.
- **Bilingual** — English/اردو toggle: scripted lines, quick replies, and Gemini
  prompts all switch language; Urdu bubbles render RTL in Noto Nastaliq Urdu.
- **Transparent scoring** — customer score = 50% avg rating + 30% completion +
  20% non-cancellation, computed in a Postgres view, visible in profile/admin.

## Development

```
npm install
npm run dev      # needs .env.local — see SETUP.md
npm run build
```
