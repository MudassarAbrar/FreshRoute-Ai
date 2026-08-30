# FreshRoute — Setup Guide

This app runs as a normal Vite dev build, but the full experience (auth, real Gemini
AI, shared database, admin portal) needs a free Supabase project. Follow the steps
below in order. Total time: ~10 minutes.

---

## 1. Supabase project

1. Create a free project at [supabase.com](https://supabase.com) (any name, any region).
2. Open **SQL Editor** and run the two migration files in order:
   - `supabase/migrations/0001_init.sql` — tables, Row Level Security, `is_admin()`,
     the `handle_new_user()` signup trigger, the `customer_metrics` view, and the
     `lot-photos` storage bucket.
   - `supabase/migrations/0002_seed.sql` — 18 demo customers with ~40 orders and
     reviews (all marked `source='seed'`) so the dashboards and admin analytics are
     populated immediately.
3. Copy your **Project URL** and **anon/public key** from
   **Project Settings → API**.

## 2. Frontend environment

Edit `.env.local` in the `freshroute/` folder:

```
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon public key>
```

These two values are safe to expose in the browser — every table is protected by
Row Level Security. Then:

```
npm install
npm run dev
```

## 3. The Gemini API key (server-side only)

The API key never touches the frontend. It lives only in the Edge Function secret:

```
supabase secrets set GEMINI_API_KEY=<your-gemini-api-key>
```

Then deploy the proxy function:

```
supabase functions deploy gemini-proxy
```

`supabase/functions/gemini-proxy/index.ts` is the only place that reads the key.
It verifies the caller's JWT on every request, so anonymous calls are rejected.

> If you previously pasted a Gemini key into this chat or anywhere in the repo,
> revoke it at [aistudio.google.com](https://aistudio.google.com/apikey) and issue
> a fresh one.

## 4. Create your accounts

1. Sign up through the app's **Sign Up** page — the `handle_new_user()` trigger
   auto-creates your profile row.
2. To make yourself an admin, run this once in the Supabase SQL Editor:

```sql
update profiles set role = 'admin' where email = 'your-email@example.com';
```

3. Sign out and back in — the **Admin Portal** link appears in the sidebar.
   (The `/admin` routes redirect non-admins to the dashboard.)

## 5. Verify it works

- **AI mode badge** in the chat header: `LIVE` means the Edge Function is answering
  with real Gemini responses. `DEMO`/`AI ERROR` appears with an explanation of what
  failed — check the Settings page for the exact error.
- **Urdu**: toggle اردو in the chat header or Settings. Scripted agent lines
  switch to Urdu, agent bubbles render right-to-left in Noto Nastaliq Urdu, and
  Gemini chat replies are prompted to answer in Urdu.
- **Voice input**: uses the browser's Web Speech API (Chrome/Edge). Press the mic,
  speak, press stop — the transcript fills the input for review before sending.
- **Admin portal**: `/admin` — users, orders, analytics (revenue, top buyers,
  crop mix, AI usage), settings.

## What is real vs. demo

| Area | Status |
|---|---|
| Auth (signup/login/reset) | Real — Supabase Auth + RLS |
| Orders, revenue, metrics, reviews | Real — Postgres, seeded demo history |
| Gemini text/vision/chat | Real — via Edge Function, key server-side |
| Market prices | Demo data — static table with timestamps/sources |
| Buyer WhatsApp replies, transport quotes, tracking | Simulated — labeled as demo |
| Voice input | Real STT (Web Speech API); mic unsupported = error shown |

## Common problems

- **"Backend is not connected yet"** on the login form — `.env.local` values are
  missing or the dev server wasn't restarted after editing them.
- **AI badge says AI ERROR** — `gemini-proxy` not deployed, `GEMINI_API_KEY`
  secret not set, or the function was deployed before the secret (redeploy).
- **Empty dashboard after signup** — run `0002_seed.sql`, or place your first lot
  through the AI assistant chat.
- **Admin link missing** — the role change (step 4.2) requires signing out and
  back in, because the profile loads at login.
