<div align="center">

![FreshRoute Agent](public/images/hero-banner.png)

# FreshRoute Agent

### AI-Powered Produce Trading Assistant for Pakistani Farmers

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres_17-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-AI_Vision-4285F4?logo=google&logoColor=white)](https://ai.google.dev)
[![Firebase Auth](https://img.shields.io/badge/Firebase-Auth_+_Firestore-FFCA28?logo=firebase&logoColor=white)](https://firebase.google.com)
[![Zustand](https://img.shields.io/badge/Zustand-State-FF6B6B)](https://github.com/pmndrs/zustand)
[![Recharts](https://img.shields.io/badge/Recharts-Charts-FF8C00)](https://recharts.org)
[![License](https://img.shields.io/badge/License-MIT-green)](./LICENSE)

*An intelligent operating system for fresh-produce selling — from harvest to payment.*

[Features](#-features) • [Architecture](#-architecture) • [Setup Guide](#-setup-guide) • [Project Structure](#-project-structure) • [Database Schema](#-database-schema) • [API Reference](#-api-reference) • [Wiki](#-wiki--documentation)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Setup Guide](#-setup-guide)
- [Project Structure](#-project-structure)
- [Core Modules](#-core-modules)
- [Database Schema](#-database-schema)
- [API Reference](#-api-reference)
- [Admin Portal](#-admin-portal)
- [AI Integration](#-ai-integration)
- [Internationalization](#-internationalization)
- [Development](#-development)
- [Troubleshooting](#-troubleshooting)
- [Wiki & Documentation](#-wiki--documentation)

---

## 🌾 Overview

**FreshRoute Agent** is an AI-powered produce trading platform designed for Pakistani farmers and produce traders. It transforms a simple message like:

> *"I have 800 kg tomatoes in Multan. They will be ready tomorrow."*

...into a structured produce lot, analyzes visible quality via AI vision, checks real-time mandi prices across 5 cities, estimates spoilage risk, finds matching buyers and logistics providers, compares sell-now vs store-and-sell-later outcomes, and recommends an execution plan — **all within a single WhatsApp-style chat conversation.**

### The Problem It Solves

Pakistan's fresh-produce supply chain loses an estimated **30–40% of fruit and vegetable output** across the value chain due to:

- Incomplete, delayed, or informal market information
- No spoilage-adjusted price comparison across markets
- Fragmented coordination via WhatsApp messages and phone calls
- Uncertain transport, storage, and cold-chain availability
- Buyer rejection due to grade mismatch

**FreshRoute Agent** replaces this fragmented workflow with a single AI-driven conversation that handles analysis, comparison, outreach, booking, tracking, and alerting — with **explicit user approval at every financial step.**

---

## ✨ Features

### 🤖 AI-Powered Trading Assistant

| Feature | Description |
|---|---|
| **Text Extraction** | Converts natural language messages (English, Urdu, Roman Urdu) into structured lot data — crop, quantity, location, ready date |
| **Vision Analysis** | Analyzes produce photos for grade (A/B/C), ripeness level, defect rate, and quality notes using Google Gemini Vision |
| **Conversational Chat** | Free-form Q&A about markets, prices, logistics with full context awareness |
| **Market Scenarios** | Generates ranked sell-options comparing net revenue, spoilage risk, transport cost, and timing |
| **Smart Recommendations** | AI selects the best buyer + transporter combo based on net earnings, reliability, and urgency |

### 📱 Farmer App

| Feature | Description |
|---|---|
| **Chat Interface** | WhatsApp-style conversation with typed agent/user bubbles and interactive cards |
| **Voice Input** | Web Speech API-powered voice-to-text for hands-free messaging |
| **Photo Upload** | Attach produce photos for AI quality grading |
| **Dashboard** | Active orders, earnings summary, customer score, quick actions |
| **Order Tracking** | Step-by-step delivery progress — pickup → transit → delivery → payment |
| **Notifications** | Real-time alerts for delays, price changes, and order updates |
| **Revenue Analytics** | Earnings history with per-crop and per-market breakdowns |
| **Profile Management** | Contact details, customer code, transparency score |
| **Settings** | Language toggle, AI mode status, account management |

### 🔐 Approval-First Design

Every financial action requires **explicit user approval** before execution:

```
Lot Intake → Quality Analysis → Market Comparison → Buyer Outreach (APPROVE) → 
Transport Booking (APPROVE) → Delivery Tracking → Payment Confirmation
```

- The agent **never** sends messages, books transport, or commits funds without approval
- All actions are timestamped in the **Action Log** for full audit trail
- Approve/Reject buttons on every critical decision point

### 🌍 Bilingual Support

| Language | Script | Font |
|---|---|---|
| **English** | Latin | Plus Jakarta Sans |
| **اردو (Urdu)** | Nastaliq | Noto Nastaliq Urdu (RTL) |

- One-tap language toggle in chat header or settings
- All agent messages, quick replies, and UI elements switch language
- Urdu chat bubbles render right-to-left
- Gemini AI responses match selected language

### 🏪 Admin Portal

| Feature | Description |
|---|---|
| **System Overview** | Total users, orders, active orders, total revenue at a glance |
| **User Management** | View all users with search, customer scores, order counts |
| **Order Management** | Filter by status, search across all orders |
| **Analytics Dashboard** | Revenue charts (Recharts), orders by status (pie), revenue by crop/destination, top customers |
| **AI Monitoring** | Live/Demo/Error status badge, recent AI usage with latency tracking |
| **System Settings** | Backend connection status, AI configuration monitoring |

### 🛡️ Transparent Scoring

Customer transparency score computed as a Postgres materialized view:

```
Score = 50% × Avg Rating + 30% × Completion Rate + 20% × Non-Cancellation Rate
```

Visible in user profile and admin dashboard — builds trust between farmers and buyers.

---

## 🛠️ Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| **React** | 19 | UI component library |
| **TypeScript** | 6 | Type-safe development |
| **Vite** | 8 | Build tool & dev server |
| **Tailwind CSS** | 3.4 | Utility-first styling |
| **Zustand** | 5 | Lightweight state management |
| **React Router** | 7 | Client-side routing |
| **Recharts** | 3 | Data visualization (admin analytics) |
| **Lucide React** | 1 | Icon library |
| **class-variance-authority** | 0.7 | Component variant management |
| **tailwind-merge** | 3 | Smart Tailwind class merging |

### Backend

| Technology | Purpose |
|---|---|
| **Supabase** | PostgreSQL database, storage, Edge Functions |
| **Firebase Auth** | Email/Password + Google Sign-in authentication |
| **Google Gemini AI** | Text extraction, vision analysis, conversational chat |
| **Google Cloud Firestore** | Real-time AI usage logging, user profiles, live admin telemetry |
| **Deno (Edge Function)** | Server-side Gemini API proxy with JWT verification |

### Development Tools

| Tool | Purpose |
|---|---|
| **OXLint** | Fast JavaScript/TypeScript linting |
| **PostCSS** | CSS transformation pipeline |
| **Autoprefixer** | Vendor prefix automation |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (React 19)                        │
│                                                                  │
│  ┌──────────┐  ┌────────────┐  ┌───────────┐  ┌──────────────┐ │
│  │  Pages   │  │ Components │  │   Store   │  │    Libs      │ │
│  │ (Routes) │──│   (UI)     │──│ (Zustand) │──│ (Business)   │ │
│  └──────────┘  └────────────┘  └───────────┘  └──────────────┘ │
│       │                         │           │         │          │
│       │              ┌──────────┘           │    ┌────┘          │
│       │              │                      │    │               │
│       ▼              ▼                      ▼    ▼               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              director.ts  (State Machine)                 │   │
│  │  welcome → intake → analyze → scenarios → outreach →     │   │
│  │  approve → book → track → complete                        │   │
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

### Key Architectural Principles

1. **Approval-First Workflow** — No financial action without explicit user consent
2. **Graceful Degradation** — Demo mode with fallback data when AI is unavailable
3. **Honest AI Status** — LIVE / DEMO / AI ERROR badge always visible
4. **Server-Side Key Security** — Gemini API key never exposed to the browser
5. **Row-Level Security** — Every database table protected by Supabase RLS
6. **Audit Trail** — All actions logged with timestamps and actors
7. **Google Cloud Firestore** — Mirrors AI usage events in real-time for live admin monitoring

---

## 🚀 Setup Guide

### Prerequisites

- **Node.js** 18+ and **npm**
- A free [Supabase](https://supabase.com) account
- *(Optional)* A [Google Gemini API key](https://aistudio.google.com/apikey) for live AI features

### Step 1 — Supabase Project

1. Create a free project at [supabase.com](https://supabase.com) (any name, any region)
2. Open **SQL Editor** and run the two migration files in order:
   - [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) — Tables, Row Level Security, triggers, views, storage bucket
   - [`supabase/migrations/0002_seed.sql`](supabase/migrations/0002_seed.sql) — 18 demo customers with ~40 orders and reviews
3. Copy your **Project URL** and **anon/public key** from **Settings → API**

### Step 2 — Frontend Environment

Create `.env.local` in the `freshroute/` folder:

```env
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-public-key>
```

> **Note:** These values are safe to expose in the browser — every table is protected by Row Level Security.

### Step 3 — Install & Run

```bash
cd freshroute
npm install
npm run dev
```

The app opens at `http://localhost:5173`.

### Step 4 — Gemini API Key *(Optional, for live AI)*

The API key lives only in the Edge Function secret — it **never** touches the frontend:

```bash
supabase secrets set GEMINI_API_KEY=<your-gemini-api-key>
supabase functions deploy gemini-proxy
```

> **Security:** If you previously pasted a Gemini key anywhere in the repo, revoke it at [aistudio.google.com](https://aistudio.google.com/apikey) and issue a fresh one.

### Step 5 — Create Your Accounts

1. **Sign up** through the app's Sign Up page — the `handle_new_user()` trigger auto-creates your profile
2. **Make yourself an admin** in Supabase SQL Editor:
   ```sql
   UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';
   ```
3. **Sign out and back in** — the Admin Portal link appears in the sidebar

### Step 6 — Verify

| Check | Expected |
|---|---|
| **AI badge** in chat header | `LIVE` = real Gemini, `DEMO` = fallback mode |
| **Language toggle** | اردو switch flips UI to RTL with Noto Nastaliq Urdu |
| **Voice input** | Mic icon → speak → transcript fills input (Chrome/Edge) |
| **Admin portal** | `/admin` shows users, orders, analytics, AI usage |

### Step 7 — Firebase Auth + Firestore *(Google Cloud integration)*

FreshRoute uses **Firebase Auth** for authentication and **Cloud Firestore** for real-time AI telemetry:

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and open your project (e.g. `freshroute-agent`)
2. **Enable Authentication providers:**
   - Go to **Authentication → Sign-in method**
   - Enable **Email/Password**
   - Enable **Google** sign-in
3. **Enable Firestore Database** (start in test mode for development)
4. Add a **Web app** (if not already created) and copy the config values into `.env.local`:
   ```env
   VITE_FIREBASE_API_KEY=<your-key>
   VITE_FIREBASE_AUTH_DOMAIN=<project>.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=<project-id>
   VITE_FIREBASE_STORAGE_BUCKET=<project>.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=<sender-id>
   VITE_FIREBASE_APP_ID=<app-id>
   ```
4. Deploy these Firestore security rules:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /user_profiles/{uid} {
         allow read: if request.auth != null && request.auth.uid == uid;
         allow write: if request.auth != null && request.auth.uid == uid;
       }
       match /ai_usage/{doc} {
         allow read: if true;
         allow create: if request.auth != null;
         allow update, delete: if false;
       }
     }
   }
   ```

Every sign-in/sign-up goes through **Firebase Auth**, user profiles are stored in **Firestore** (`user_profiles/{uid}`), and every Gemini call writes an AI usage log to Firestore. The admin dashboard at `/admin/settings` shows live-updating AI usage via Firestore `onSnapshot()`.

---

## 📁 Project Structure

```
freshroute/
├── public/                          # Static assets
│   ├── images/                      # App images and photos
│   ├── favicon.svg                  # App favicon
│   └── icons.svg                    # SVG icon sprites
│
├── src/
│   ├── components/                  # React components
│   │   ├── auth/
│   │   │   └── ProtectedRoute.tsx   # Route guard for authenticated users
│   │   ├── cards/                   # Chat message card components
│   │   │   ├── AlertSummaryCards.tsx # Alert & completion summary cards
│   │   │   ├── ApprovalCard.tsx     # Approve/reject action buttons
│   │   │   ├── ClarifyCard.tsx      # Follow-up question form
│   │   │   ├── LotCard.tsx          # Produce lot details + vision results
│   │   │   ├── OffersCard.tsx       # Buyer offers + transport options
│   │   │   ├── OrderCard.tsx        # Order confirmation + tracking steps
│   │   │   └── ScenariosCard.tsx    # Ranked market comparison scenarios
│   │   ├── layout/
│   │   │   ├── AdminLayout.tsx      # Admin portal sidebar layout
│   │   │   └── AppLayout.tsx        # Main app layout with navigation
│   │   ├── ui/
│   │   │   ├── button.tsx           # CVA-based button with variants
│   │   │   └── card.tsx             # Reusable card component
│   │   ├── AuditDrawer.tsx          # Action log slide-out drawer
│   │   ├── Bubbles.tsx              # Chat bubble renderer (agent/user)
│   │   ├── ChatBody.tsx             # Scrollable message list
│   │   ├── ChatHeader.tsx           # Chat top bar with AI badge + lang toggle
│   │   ├── ChatInput.tsx            # Text input + voice + photo actions
│   │   ├── PhoneFrame.tsx           # Mobile phone frame wrapper
│   │   ├── PhotoSheet.tsx           # Photo picker bottom sheet
│   │   ├── PriceTicker.tsx          # Live mandi price ticker bar
│   │   ├── QuickReplies.tsx         # Contextual quick-reply buttons
│   │   └── SettingsSheet.tsx        # Settings bottom sheet
│   │
│   ├── data/
│   │   └── market.ts               # Market data (prices, buyers, transporters, distances)
│   │
│   ├── lib/                         # Business logic & utilities
│   │   ├── auth.ts                  # Supabase auth (signup, login, reset, session)
│   │   ├── copy.ts                  # Copy-to-clipboard utility
│   │   ├── db.ts                    # Database operations layer
│   │   ├── engine.ts                # Pricing/spoilage/scenario calculation engine
│   │   ├── auth.ts                  # Firebase Auth service (email, Google, reset password)
│   │   ├── firebase.ts              # Firebase app init + Auth + Firestore client
│   │   ├── firebaseAuth.ts          # Standalone Firebase Auth helpers
│   │   ├── firestore.ts             # Firestore AI usage logging + real-time subscriptions
│   │   ├── format.ts                # Currency (PKR), time, ID formatting
│   │   ├── gemini.ts                # Gemini AI client (text, vision, chat)
│   │   ├── supabase.ts              # Supabase client initialization
│   │   └── utils.ts                 # General utilities (cn class merger)
│   │
│   ├── pages/                       # Route pages
│   │   ├── admin/                   # Admin portal pages
│   │   │   ├── AdminAnalyticsPage.tsx  # Revenue & order charts
│   │   │   ├── AdminDashboardPage.tsx  # System overview stats
│   │   │   ├── AdminOrdersPage.tsx     # All orders management
│   │   │   ├── AdminSettingsPage.tsx   # AI status & config
│   │   │   └── AdminUsersPage.tsx      # User management
│   │   ├── ChatPage.tsx             # Main agent chat interface
│   │   ├── DashboardPage.tsx        # User dashboard
│   │   ├── ForgotPasswordPage.tsx   # Password reset request
│   │   ├── LoginPage.tsx            # Login form
│   │   ├── NotificationsPage.tsx    # Notification feed
│   │   ├── OrdersPage.tsx           # User order history
│   │   ├── ProfilePage.tsx          # User profile
│   │   ├── ResetPasswordPage.tsx    # Password reset form
│   │   ├── RevenuePage.tsx          # Earnings analytics
│   │   ├── SettingsPage.tsx         # App settings
│   │   ├── SignupPage.tsx           # Registration form
│   │   └── TrackOrderPage.tsx       # Order delivery tracking
│   │
│   ├── store/                       # State management
│   │   ├── director.ts             # Conversation director (946-line state machine)
│   │   └── useApp.ts               # Zustand global store
│   │
│   ├── App.tsx                      # Root component
│   ├── App.css                      # Global styles
│   ├── i18n.ts                      # English/Urdu translation dictionary
│   ├── index.css                    # Tailwind base styles
│   ├── main.tsx                     # React entry point
│   ├── types.ts                     # TypeScript type definitions
│   └── vite-env.d.ts               # Vite environment types
│
├── supabase/
│   ├── functions/
│   │   └── gemini-proxy/
│   │       └── index.ts            # Deno Edge Function — Gemini API proxy
│   └── migrations/
│       ├── 0001_init.sql           # Schema + RLS + triggers + views + storage
│       └── 0002_seed.sql           # Demo data (18 customers, ~40 orders)
│
├── .env.example                    # Environment variable template
├── .env.local                      # Local environment (gitignored)
├── .gitignore                      # Git ignore rules
├── .oxlintrc.json                  # OXLint configuration
├── index.html                      # HTML entry point
├── package.json                    # Dependencies & scripts
├── postcss.config.js               # PostCSS pipeline
├── tailwind.config.ts              # Tailwind theme configuration
├── tsconfig.json                   # TypeScript config (root)
├── tsconfig.app.json               # TypeScript config (app)
├── tsconfig.node.json              # TypeScript config (node)
└── vite.config.ts                  # Vite build configuration
```

---

## ⚙️ Core Modules

### Director (`store/director.ts`)

The **conversation director** is a 946-line state machine that orchestrates the entire trading workflow:

```
boot()              → Initialize session, greet user
intakeFlow()        → Parse user message → extract lot data (via Gemini)
onPhotosChosen()    → Trigger vision analysis (via Gemini)
onClarifyConfirm()  → Generate market scenarios (via engine.ts)
proceedWith()       → Draft buyer outreach for approval
onApproveFinal()    → Book order, initiate tracking
scheduleTracking()  → Simulate delivery progress with alerts
```

### Engine (`lib/engine.ts`)

Deterministic calculation engine for:

| Function | Purpose |
|---|---|
| **Market Scenarios** | Builds sell-options per destination city with pricing |
| **Spoilage Estimation** | Calculates expected spoilage % based on crop, distance, storage |
| **Scenario Scoring** | Ranks options by net revenue, risk, and timing |
| **Transport Options** | Generates transporter quotes with vehicle types and costs |

### State Store (`store/useApp.ts`)

Zustand-based global store managing:

```typescript
{
  stage: "welcome" | "awaiting-intake" | "analyzing" | "options" | "tracking" | "completed" | ...,
  msgs: Msg[],              // Chat message history
  lot: Lot | null,          // Current produce lot
  scenarios: Scenario[],    // Generated market options
  audit: AuditEntry[],      // Action log
  lang: "en" | "ur",       // Current language
  aiMode: "checking" | "live" | "demo" | "error",
  session: Session | null,  // Auth session
  profile: Profile | null,  // User profile
}
```

---

## 🗄️ Database Schema

### Tables

| Table | Purpose | RLS |
|---|---|---|
| **profiles** | User accounts (farmer/admin), contact info, customer code | Read own or admin, update own |
| **orders** | Transaction records — crop, quantity, pricing, status, tracking steps | Read own or admin, insert/update own |
| **reviews** | User ratings (1–5) and feedback on completed orders | Read own or admin, insert own |
| **notifications** | In-app alerts (delay, price, info, order) | Read/update own |
| **audit_log** | Timestamped action history (Agent/You/System) | Read own or admin, insert own |
| **chat_messages** | Persistent chat message history | All own, admin read |
| **chat_state** | Current conversation state for session recovery | All own |
| **image_analyses** | Vision analysis results (grade, ripeness, defects) | Read own or admin, insert own |
| **ai_usage** | AI API call logs for monitoring (model, latency, status) | Read own or admin |

### Views

| View | Description |
|---|---|
| **customer_metrics** | Aggregated user performance — total orders, earned, avg rating, transparency score |

### Storage

| Bucket | Access |
|---|---|
| **lot-photos** | Public read, authenticated upload |

### Key Database Features

- **Row Level Security** on every table
- **Auto-profile creation** via `handle_new_user()` trigger on auth signup
- **Transparent scoring** via `customer_metrics` materialized view
- **`is_admin()` helper** used across RLS policies for admin-level access

---

## 🔌 API Reference

### Gemini Proxy Edge Function

**Endpoint:** `POST /functions/v1/gemini-proxy`

All Gemini AI calls go through a server-side Deno Edge Function that:

1. Verifies the caller's Supabase JWT
2. Reads `GEMINI_API_KEY` from Supabase secrets (never exposed to browser)
3. Proxies the request to Google Gemini
4. Logs usage metrics to `ai_usage` table

| Action | Input | Output |
|---|---|---|
| `extract` | Raw text message (English/Urdu/Roman Urdu) | Structured lot: `{ crop, quantity_kg, city, readyDate }` |
| `vision` | Base64 image + crop hint | `{ grade, ripeness, defectRate, notes[], confidence }` |
| `chat` | User message + conversation context | AI-generated response in selected language |

### Supported Crops

Tomato, Potato, Onion, Mango, Kinnow, Banana, Green Chili, Okra, Leafy Vegetables

### Supported Markets

Multan, Lahore, Faisalabad, Islamabad, Karachi

### Crop Alias System

Supports local names: ٹماٹر (tomato), آلو (potato), پیاز (onion), آم (mango), aloo, tamatar, pyaaz, mirch, etc.

---

## 🔧 Admin Portal

Access: `/admin` (requires `role = 'admin'` in profiles table)

### Dashboard
- System-wide stats: total users, total orders, active orders, total revenue
- Quick links to all admin sections

### Analytics
- **Revenue over time** — bar chart (Recharts)
- **Orders by status** — pie chart (active / completed / cancelled)
- **Revenue by crop** — horizontal bar chart
- **Revenue by destination** — city-wise breakdown
- **Top customers** — sortable table with metrics

### User Management
- Searchable user list
- Customer scores, order counts, total earned
- Role indicators (farmer / admin)

### Order Management
- All orders with status filter (active / completed / cancelled)
- Search by order ID, crop, buyer name
- Full order details with tracking steps

### AI Settings
- AI mode status: LIVE / DEMO / ERROR
- Recent AI usage log with action type, model, status, latency (ms)
- Backend connection health indicator

---

## 🤖 AI Integration

### Three AI Modes

| Mode | Badge | Description |
|---|---|---|
| **LIVE** | 🟢 `LIVE` | Real Google Gemini responses via Edge Function |
| **DEMO** | 🟡 `DEMO` | Fallback to deterministic local calculations |
| **ERROR** | 🔴 `AI ERROR` | Gemini failed, error message shown in chat |

### Vision Analysis

When a user uploads produce photos:

1. Image sent to Gemini Vision via Edge Function
2. Returns: grade (A/B/C), ripeness (%), defect rate (%), quality notes
3. Results displayed in `LotCard` with confidence score
4. Falls back to description-only estimation if no photos provided

### Fallback Architecture

```
User Message → Gemini Extract → Success? → Structured Lot Data
                                    ↓ Fail
                              Demo Extract → Regex/keyword parsing

Photo Upload → Gemini Vision → Success? → Quality Analysis
                                    ↓ Fail
                          Description-only → Lower confidence estimate

Chat Query → Gemini Chat → Success? → AI Response
                                  ↓ Fail
                           Scripted Response → Context-aware fallback
```

---

## 🌍 Internationalization

Full bilingual support via `src/i18n.ts` dictionary:

| Key | English | اردو |
|---|---|---|
| `inputPlaceholder` | Message FreshRoute… | FreshRoute کو پیغام لکھیں… |
| `aiAgent` | AI Selling Agent | AI سیلنگ ایجنٹ |
| `approve` | Approve & send | منظور اور بھیجیں |
| `attach` | Attach photos | تصاویر بھیجیں |
| `checkingPrices` | Checking prices in 5 markets… | 5 منڈیوں میں ریٹ چیک کر رہا ہوں… |
| `analyzingPhotos` | Analyzing photos… | تصاویر کا تجزیہ کر رہا ہوں… |

- **40+ translated keys** covering all UI elements and agent messages
- Urdu text renders **right-to-left** with **Noto Nastaliq Urdu** font
- Gemini prompts automatically switch to selected language

---

## 💻 Development

### Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server with HMR at `localhost:5173` |
| `npm run build` | TypeScript check + production build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run OXLint for code quality checks |

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | ✅ | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Supabase anon/public key |
| `VITE_FIREBASE_API_KEY` | ✅ | Firebase API key (Auth + Firestore) |
| `VITE_FIREBASE_AUTH_DOMAIN` | ✅ | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | ✅ | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | ✅ | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ✅ | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | ✅ | Firebase app ID |

> ✅ Firebase vars are **required** for authentication (Email/Password + Google Sign-in) and Firestore AI monitoring.

### What's Real vs. Demo

| Area | Status |
|---|---|
| Auth (signup/login/reset) | **Real** — Supabase Auth + RLS |
| Orders, revenue, metrics, reviews | **Real** — PostgreSQL, seeded demo history |
| Gemini text/vision/chat | **Real** — via Edge Function, key server-side only |
| Market prices | **Demo** — Static table with timestamps/sources |
| Buyer WhatsApp replies, transport quotes | **Simulated** — Labeled as demo |
| Voice input | **Real** — Web Speech API (Chrome/Edge) |

---

## 🔧 Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| "Backend is not connected yet" on login | `.env.local` values missing | Add Supabase URL + anon key, restart dev server |
| `auth/configuration-not-found` on login/signup | Email/Password provider not enabled in Firebase | Firebase Console → **Authentication → Sign-in method** → enable **Email/Password** (and **Google**) |
| `auth/operation-not-allowed` on Google sign-in | Google provider not enabled | Firebase Console → **Authentication → Sign-in method** → enable **Google** + set support email |
| Firestore writes fail (`permission-denied`) | Security rules not deployed | Deploy the rules from [Step 7](#-step-7--firebase-auth--firestore-google-cloud-integration) in Firestore → Rules |
| AI badge says `AI ERROR` | Edge Function not deployed or secret missing | Run `supabase secrets set` then `supabase functions deploy gemini-proxy` |
| Empty dashboard after signup | Seed data not loaded | Run `0002_seed.sql` in SQL Editor, or place your first lot via chat |
| Admin link missing | Role change requires re-login | Sign out and back in after running the `UPDATE profiles` SQL |
| Voice input not working | Browser doesn't support Web Speech API | Use Chrome or Edge (Safari/Firefox not supported) |

---

## 📚 Wiki & Documentation

The `wiki/` directory contains comprehensive project documentation:

| Document | Description |
|---|---|
| [Project Overview](../wiki/Project%20Overview.md) | High-level product vision and goals |
| [Architecture Overview](../wiki/Architecture%20Overview/Architecture%20Overview.md) | System architecture and design decisions |
| [API Reference](../wiki/API%20Reference.md) | Complete API documentation |
| [Database Schema](../wiki/Database%20Schema%20%26%20Migrations.md) | Schema reference and migration guide |
| [Getting Started](../wiki/Getting%20Started.md) | Quick start guide |
| [Deployment & Production](../wiki/Deployment%20%26%20Production.md) | Production deployment guide |
| [Testing Strategy](../wiki/Testing%20Strategy.md) | Testing approach and coverage |
| [Contributing Guide](../wiki/Contributing%20Guide.md) | How to contribute |
| [Business Glossary](../wiki/knowledge/Business%20Glossary.md) | Domain terminology reference |

### Knowledge Base

| Module | Description |
|---|---|
| [AI Integration](../wiki/AI%20Integration/AI%20Integration.md) | Gemini integration architecture |
| [Business Logic Engine](../wiki/Business%20Logic%20Engine/Business%20Logic%20Engine.md) | Pricing, spoilage, and scenario engine |
| [Core Components](../wiki/Core%20Components/Core%20Components.md) | Component architecture |
| [State Management](../wiki/State%20Management.md) | Zustand store design |

---

## 📄 License

This project is built as an MVP for produce trading intelligence in Pakistan's agricultural market.

---

<div align="center">

**Built with ❤️ for Pakistan's farmers**

*From harvest to payment — one conversation.*

</div>
