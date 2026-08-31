# FreshRoute Agent — How I Built an AI-Powered Produce Trading Assistant for Pakistani Farmers

> Built for the Google AI Hackathon · #AllThingsAgentic

---

## The Problem

Pakistan is one of the world's top producers of mangoes, citrus, tomatoes, and onions — yet it loses an estimated **30–40% of its fresh produce** between the farm gate and the consumer's plate.

The root cause isn't agriculture. It's information asymmetry.

Here's how it works today: a farmer in Multan picks 800 kg of tomatoes in the morning. By noon, they need to decide which wholesale market (mandi) to send them to — Lahore, Karachi, Faisalabad, Islamabad, or sell locally. Each mandi has a different price, but those prices aren't published in real-time. They're discovered through phone calls to commission agents, WhatsApp groups, and word of mouth.

By the time a truck arrives at the mandi, every better option has already closed.

The farmer also doesn't know:
- How much the produce will spoil on a 350 km drive in 40°C heat
- What the net price is after mandi commission (6%), transport, and loading costs
- Which buyers are actively looking for Grade B tomatoes right now
- Whether storing for 2 days and selling later would yield more

All of these calculations currently happen in the farmer's head, with incomplete information and a ticking clock.

---

## The Solution: One Conversation, Complete Sale

**FreshRoute Agent** replaces all of that with a single WhatsApp-style chat.

The farmer types (or speaks, in English or Urdu):

> *"I have 800 kg tomatoes in Multan. They will be ready tomorrow."*

And the agent handles everything else — in one continuous conversation:

1. **Extracts the lot** — Gemini parses the message and returns structured data: crop, quantity, city, ready date
2. **Analyzes quality** — The farmer uploads a photo; Gemini Vision grades it (A/B/C), estimates ripeness and defect rate
3. **Generates market scenarios** — The engine compares all 5 mandis ranked by *net revenue* — not headline price, but price after spoilage, transport, commission, and platform fees
4. **Matches buyers** — Weighted scoring finds buyers whose commodity preferences, region, and reliability match the lot
5. **Drafts outreach** — A message to the best-matched buyer is drafted — but nothing sends until the farmer taps **Approve**
6. **Books transport** — Transporter quotes are generated with cost, vehicle type, and estimated arrival
7. **Tracks delivery** — Step-by-step progress from pickup to payment confirmation

The entire flow lives in a single chat thread. No app switching, no phone calls, no mental math.

---

## How It Works — The Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    BROWSER (React 19 + Vite)                     │
│                                                                  │
│  ┌──────────┐  ┌────────────┐  ┌───────────┐  ┌──────────────┐ │
│  │  Pages   │  │ Components │  │   Store   │  │    Libs      │ │
│  │ (Routes) │──│   (UI)     │──│ (Zustand) │──│ (Business)   │ │
│  └──────────┘  └────────────┘  └───────────┘  └──────────────┘ │
│       │                         │           │         │          │
│       ▼                         ▼           ▼         ▼          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              director.ts  (State Machine)                 │   │
│  │  intake → analyze → scenarios → outreach → book → track  │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────────┘
                       │
              ┌────────┴────────┐
              ▼                 ▼
    ┌─────────────┐    ┌──────────────────┐
    │  Supabase   │    │  Gemini Proxy    │
    │  Auth + DB  │    │  (Edge Function)  │
    │  + Storage  │    │  JWT-verified     │
    └─────────────┘    └────────┬─────────┘
                               │
                               ▼
                      ┌─────────────────┐
                      │  Google Gemini   │
                      │  API (server-    │
                      │  side key only)  │
                      └─────────────────┘
```

### The State Machine

At the heart of FreshRoute is a **989-line conversation director** (`director.ts`) — a finite state machine that orchestrates the entire trading workflow:

```
welcome → awaiting-intake → analyzing → awaiting-photos → awaiting-clarify
→ options → outreach-approval → outreach → offers → final-approval
→ tracking → completed
```

The director decides what the agent says next, when to call Gemini, when to show interactive cards (scenarios, approvals, offers), and when to persist data to the database.

### Gemini Integration

All Gemini traffic flows through a **server-side Edge Function** (`gemini-proxy`) deployed on Supabase. The API key lives exclusively in server secrets — it is never exposed to the browser.

Every request:
1. Verifies the caller's JWT (Supabase Auth token)
2. Reads `GEMINI_API_KEY` from environment secrets
3. Proxies to Google's Generative Language API
4. Logs usage metrics (action, model, status, latency) to both Supabase and Firestore

The proxy supports four actions:
- **`extract`** — Farmer message → structured JSON (crop, quantity, city, ready date)
- **`vision`** — Base64 image → quality grade, ripeness, defect rate, notes
- **`chat`** — Free-form conversation with full lot/scenario context
- **`agent-turn`** — Full ADK agent loop with function calling

### Graceful Degradation

The system has three modes, always visible via a badge in the chat header:

| Badge | Meaning |
|---|---|
| 🟢 **LIVE** | Real Gemini responses via Edge Function |
| 🟡 **DEMO** | Fallback to deterministic local calculations |
| 🔴 **AI ERROR** | Gemini failed — error surfaced in chat |

If Gemini is unavailable, the agent doesn't crash. It falls back to regex-based lot extraction, description-only quality estimation, and scripted responses. The farmer can still complete a transaction — just with less AI assistance.

---

## The Calculation Engine

The **business logic engine** (`engine.ts`) is fully deterministic — it doesn't need AI to do math.

### Spoilage Model

An exponential decay model calculates expected loss based on:
- **Per-crop perishability** — Leafy vegetables decay at 1.2%/hr; potatoes at 0.2%/hr
- **Temperature deviation** — Each crop has an ideal range; deviation increases decay
- **Transport mode** — Refrigerated (1.0×), ambient (1.4×), none (1.8×)
- **Humidity** — Ideal humidity range per crop with deviation penalties

### Net Revenue Calculation

For each market scenario:
```
Net = (Price × Quantity × GradeFactor)
    - Mandi Commission (6%)
    - Platform Fee (1.5%)
    - Transport Cost (rate × distance)
    - Spoilage Loss (decay model)
    - Loading Cost (PKR 800)
    - Local Cartage (PKR 1,200)
```

The farmer sees every deduction broken out — no hidden numbers.

### Buyer Matching

Weighted scoring across five dimensions:
- **Price fit** (30%) — How close to the asking price
- **Quantity fit** (20%) — Can they take the full lot
- **Proximity** (20%) — Distance to buyer's location
- **Reliability** (15%) — Historical completion rate
- **Urgency** (15%) — How soon they need the commodity

---

## Technologies Used

### Frontend
| Technology | Purpose |
|---|---|
| React 19 | UI component library |
| TypeScript 6 | Type-safe development |
| Vite 8 | Build tool and dev server |
| Tailwind CSS 3.4 | Utility-first styling |
| Zustand 5 | Lightweight state management |
| React Router 7 | Client-side routing |
| Recharts 3 | Admin analytics charts |

### Backend & Cloud (Google)
| Technology | Purpose |
|---|---|
| **Google Gemini AI** | Text extraction, vision analysis, conversational chat, ADK agent |
| **Firebase Auth** | Email/Password + Google Sign-in authentication |
| **Cloud Firestore** | Real-time AI usage telemetry, user profile storage |
| **Supabase** | PostgreSQL database, storage, Edge Functions runtime |
| **Deno (Edge Function)** | Server-side Gemini API proxy with JWT verification |

### Why This Stack?

- **Gemini** was chosen for its strong multilingual capabilities — it handles English, Urdu, and Roman Urdu (Urdu written in Latin script) in a single prompt, and its Vision model can grade produce quality from a phone camera photo.
- **Firebase Auth** provides frictionless authentication with Google Sign-in, critical for a market where many users already have Google accounts.
- **Firestore** enables real-time telemetry — every Gemini call writes to Firestore, and the admin dashboard subscribes via `onSnapshot()` for live-updating AI usage monitoring without polling.
- **Supabase Edge Functions** provide a secure, serverless runtime for the Gemini proxy — the API key never leaves the server.

---

## Data Sources

| Data | Source | Status |
|---|---|---|
| Market prices (5 cities, 9 crops) | Simulated pilot feed | Demo — static table with timestamps |
| City distances | Hardcoded distance matrix | Demo |
| Buyer/transporter/storage profiles | Database seed data | Demo — 4 buyers, 3 transporters, 1 storage |
| Weather data | Static per-city | Demo |
| Crop perishability profiles | Research-based constants | Real — exponential decay parameters |
| AI text/vision/chat responses | Google Gemini API | Real — via Edge Function |
| User auth and profiles | Firebase Auth + Firestore | Real |
| Orders, reviews, metrics | Supabase PostgreSQL | Real — seeded with 18 demo customers |

The system is designed so that demo data (prices, buyers) can be replaced with live API feeds as the pilot expands — without changing the engine or UI.

---

## What I Learned Building This

### 1. AI as an Assistant, Not a Decision-Maker

The most important design decision was making the agent **approval-first**. Every financial action — sending a message to a buyer, booking a truck, confirming a sale — requires explicit user consent. The AI drafts, calculates, and recommends; the human decides.

This isn't just ethics. It's practical. A farmer who doesn't trust the system won't use it. The timestamped audit log and visible approval gates build that trust.

### 2. Graceful Degradation Is Non-Negotiable

In rural Pakistan, internet connectivity is unreliable. If the AI is down, the farmer still needs to sell today's tomatoes. The three-mode system (LIVE / DEMO / ERROR) ensures the app is always usable — just with varying levels of intelligence.

Building this forced me to think about every Gemini call as "what happens if this fails?" and have a deterministic fallback ready.

### 3. Multilingual AI Is Harder Than It Looks

Getting Gemini to respond naturally in Urdu — not just translate English to Urdu — required careful prompt engineering. The system instruction explicitly tells the model to keep numbers in Western digits (not Eastern Arabic numerals) and to preserve buyer/city names in their original form. Small details that make the difference between usable and confusing.

### 4. The Net Number Is the Product

Farmers don't care about the headline mandi rate. They care about what lands in their pocket. Building the deduction engine — commission, transport, spoilage, fees — was more valuable than any AI feature. The AI helps find the options; the math helps choose between them.

### 5. State Machines Beat Ad-Hoc Logic

The conversation director started as a series of if-statements. It quickly became unmanageable. Refactoring to an explicit state machine with named transitions made the code readable, testable, and — most importantly — debuggable when the agent did something unexpected.

### 6. Real-Time Telemetry Changes Everything

Adding Firestore for AI usage logging (alongside the durable Supabase table) gave instant visibility into system health. The admin dashboard updates live without polling — you can watch Gemini calls appear in real-time as users interact with the agent. This proved invaluable during development and will be essential at scale.

---

## What's Next

- **Live price feeds** from actual mandi auctions (API integration with Punjab Agriculture Department)
- **WhatsApp integration** so farmers don't need a browser
- **Gemma for offline mode** — on-device inference when connectivity is poor
- **Veo for video listings** — farmers record a 10-second video of their lot, and Gemini analyzes it
- **Multi-crop lot splitting** — one harvest, graded and sold as multiple lots to different markets
- **Payment integration** — mobile money (JazzCash, Easypaisa) for instant settlement

---

## Try It

- **Live app:** [your-vercel-url.vercel.app](#)
- **Source code:** [github.com/MudassarAbrar/FreshRoute-Ai](https://github.com/MudassarAbrar/FreshRoute-Ai)
- **Setup guide:** See README.md in the repo — 10-minute setup with free Supabase + Firebase accounts

---

*Built with Google Gemini, Firebase, and Supabase — for Pakistan's farmers, from harvest to payment.*
