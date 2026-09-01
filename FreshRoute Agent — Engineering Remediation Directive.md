# FreshRoute Agent — Engineering Remediation Directive

**To:** Implementation agent (coding agent)
**Subject:** Convert the current scripted demo into a genuine agentic system on the Google Agent Development Kit (ADK), without regressing existing correct functionality
**Priority:** P0 — the current build presents simulated behaviour as real behaviour
**Mode of work:** Incremental, additive-first refactor. No rewrites. No deletion of working code without a replacement already passing tests.

---

## 1. Why this directive exists

The delivered build is a **scripted mock wearing the vocabulary of an agentic system**. The architecture nouns are present (orchestrator, guardrails, state machine, recommendation engine) but the verbs are fake: timers stand in for events, string literals stand in for messages, and a static file stands in for a marketplace.

The following defects are confirmed and must all be resolved:

| # | Defect | Current implementation | Why it is unacceptable |
|---|---|---|---|
| D1 | No real agent runtime | Hand-rolled prompt/if-else flow, no Google ADK agent, no real tool-calling loop | The core requirement was an ADK-based agent with an orchestrator that plans and calls tools |
| D2 | Order tracking (pickup → GPS → delivery, "98% accepted") | Four `setTimeout()` calls emitting pre-written messages | No real events, no GPS, no state transitions driven by reality; the "98%" is a literal |
| D3 | Storage / depart-early controls in chat | Values stored, never read by any downstream logic | Dead UI. User input has zero effect on recommendations or bookings |
| D4 | "Offer sent to buyer on WhatsApp" | A text string rendered in the UI | Nothing is sent anywhere. This is a false claim to the user |
| D5 | "Buyer is typing…" then a reply | Timer plus a scripted response | Fabricates a counterparty that does not exist |
| D6 | Buyers / transporters / storage | 4 / 3 / 1 hardcoded entries in `market.ts` | No accounts, no vendor records, no availability, no capacity, no lifecycle |
| D7 | "Recommendation engine" | Real math, but ranks only the hardcoded entries; no live data, no reasoning layer | Correct math over fake inputs is still a fake output |
| D8 | Market/price intelligence | Hardcoded responses "because the API takes too long" | Latency is an engineering problem to be solved with caching, async jobs and adapters — not by faking data |

**The goal state:** every user-visible claim in the product is backed by a real execution — a real model call, a real tool invocation, a real database row, a real outbound message, or a real inbound webhook event. Where real-world data is genuinely unavailable, it must be served through an explicitly-labelled adapter (see §7), never disguised as live.

---

## 2. What is already correct — DO NOT BREAK IT

The following components are correct in intent and largely correct in implementation. **Preserve them, keep their public interfaces stable, and wire them into the new agent runtime instead of rewriting them.**

1. **Rate limiter** — keep. Re-scope it to apply per-user, per-tool and per-outbound-channel (WhatsApp especially, which has its own quota rules).
2. **Circuit breaker** — keep. Attach it to every external dependency: model API, price sources, WhatsApp Cloud API, maps/routing, SMS fallback. Ensure open-circuit produces a degraded-but-honest response, never a fabricated one.
3. **Order state machine (14 states)** — keep the state set and the legal-transition table. What changes is only the **trigger source**: transitions must be caused by real events (webhooks, driver pings, vendor actions, operator actions, timeouts-as-SLA-breach), not by `setTimeout` in the UI layer.
4. **Prompt-injection sanitizer** — keep. Extend it to sanitize *inbound* untrusted content too: WhatsApp replies, vendor-supplied text, OCR'd document text, image captions.
5. **Domain guardrail check** — keep. Keep it as a pre- and post-model gate on the orchestrator, and add tool-level authorization (see §5.4).
6. **Recommendation math** — keep the scoring/expected-value logic. Replace only its **inputs** (real vendor records, real prices, real routing/ETA) and add a reasoning/explanation layer on top.
7. **System prompts** — keep, but restructure into per-agent instruction files (§5.1) with versioning.
8. All existing UI screens, routes, design system, i18n (English/Urdu/Roman Urdu), auth, and DB schema that currently work must continue to work at every commit.

**Hard rule:** if a change would break an existing working screen or flow, you introduce an adapter/shim and migrate behind it. The app must build, boot and pass tests after every phase.

---

## 3. Non-negotiable constraints

1. **No `setTimeout` / `setInterval` / `sleep` may ever be used to simulate a real-world event, a counterparty action, or a state transition.** Timers are permitted only for genuine UI concerns (debounce, animation, polling intervals, retry backoff) and for SLA/no-response timeouts that are themselves modelled as real domain events.
2. **No hardcoded business data in source files.** Buyers, transporters, storage facilities, prices, capacities, acceptance rates, ETAs and GPS coordinates all live in the database or come from an integration. `market.ts` is deleted at the end of the migration.
3. **No fabricated metrics.** Any number shown to the user ("98% accepted", "spoilage risk 12%", "ETA 4h 20m") must be computed from stored data or a live provider, and must carry provenance (source, timestamp, confidence). If it cannot be computed, the UI must say so.
4. **No claim of an action that did not happen.** "Offer sent" may only render after the messaging provider returns a message ID that is persisted.
5. **Every LLM decision goes through the ADK agent + tool loop**, not through bespoke string handling.
6. **Human-in-the-loop preserved.** Outbound commitments (offers, bookings, cancellations) require explicit user approval, and the approval is persisted with actor, timestamp and payload hash.
7. **Full observability.** Every agent run, tool call, model call, guardrail verdict, state transition and outbound message is written to a structured trace store and is retrievable per order.
8. **Secrets** in environment/secret manager only. No keys in the repo, no keys in client bundles.

---

## 4. Target architecture

```
Client (Next.js / React Native)
        │  auth, approvals, chat, order timeline (SSE / WebSocket — no fake timers)
        ▼
API layer (FastAPI or Node) ── AuthZ ── RateLimiter ── PromptInjectionSanitizer ── DomainGuardrail
        ▼
Google ADK Orchestrator Agent  ("FreshRoute Coordinator")
        ├── IntakeAgent            (multimodal parse, clarifying questions, lot object)
        ├── QualityAgent           (Gemini vision: crop, grade, defects, confidence)
        ├── MarketIntelAgent       (prices, demand, trend; multi-source with provenance)
        ├── RiskAgent              (spoilage risk, time/temp/route/packaging)
        ├── MatchmakingAgent       (buyer/transporter/storage candidates from DB + constraints)
        ├── NegotiationAgent       (offer drafting, inbound reply interpretation)
        └── LogisticsAgent         (routing, ETA, booking, tracking)
        ▼
Tool layer (typed, authorized, idempotent, circuit-broken)
  price_lookup · vendor_search · capacity_check · route_eta · spoilage_forecast ·
  send_whatsapp_message · create_offer · accept_offer · book_transport · book_storage ·
  order_transition · notify_user · request_human_approval · fetch_order_state
        ▼
Durable workflow engine (Temporal, or a queue + scheduler equivalent)
        ▼
PostgreSQL (system of record) · Redis (cache/locks) · Object storage (images/docs) · pgvector
        ▼
External: Gemini API · WhatsApp Cloud API (+ SMS fallback) · Maps/Routing · Price sources · Weather
```

Key architectural rules:
- The orchestrator **plans and delegates**; it never performs side effects directly. All side effects are tools.
- Long-running order lifecycle lives in the **durable workflow**, not in an HTTP request, not in the browser.
- The client is a **projection** of server state. It renders what the timeline table says, and nothing else.

---

## 5. Work packages

### 5.1 WP-1 — Real Google ADK agent runtime (resolves D1)

**Do:**
1. Add the Google ADK dependency and stand up a root `LlmAgent` named `freshroute_coordinator` backed by Gemini, with the sub-agents listed in §4 registered as ADK sub-agents/agent-tools.
2. Move all system prompts into versioned instruction files (`agents/<name>/instruction.md`) with a header block: purpose, allowed tools, refusal rules, output contract. Load them at startup; log the prompt version with every run.
3. Define every capability as a **typed ADK function tool** with a JSON schema, docstring, explicit error type, and an idempotency key. The model must never receive free-form shell/DB access.
4. Implement a real tool-calling loop with: max-iteration cap, per-run token/cost budget, tool-call timeout, retry-with-backoff, and a final-answer validator that rejects responses claiming actions with no corresponding tool result in the trace.
5. Use ADK **session + state** for conversation memory, and persist sessions to PostgreSQL so a conversation survives restarts. Structured lot/order data lives in domain tables, not in prompt text.
6. Wire the existing guardrails as ADK before/after callbacks: sanitizer → domain guardrail → rate limiter → tool authorization → post-response guardrail.
7. Emit an ADK-level trace per run (run id, agent path, tool calls with args/results, latency, cost, verdicts) into a `agent_runs` / `agent_tool_calls` table, and expose it in an internal ops view.

**Acceptance:** a repo-wide search shows no bespoke intent-routing if/else chains driving business logic; every business action in the chat flow appears in `agent_tool_calls` with a real result payload.

---

### 5.2 WP-2 — Real marketplace entities (resolves D6)

**Do:**
1. Create real schemas: `organizations`, `users` (with roles: farmer, trader, buyer, transporter, storage_operator, ops_admin), `buyer_profiles`, `transporters`, `vehicles`, `storage_facilities`, `storage_units`, `vendor_service_areas`, `vendor_availability`, `vendor_credentials/documents`, `vendor_ratings`, `capacity_reservations`.
2. Model the things the demo faked: crop/grade preferences, min/max lot size, price bands, payment terms, cold-chain capability, temperature range, vehicle type/tonnage, service radius, working hours, blackout dates, and **historical acceptance rate computed from actual offer outcomes** (this is where a real "98%" would come from — as a computed, timestamped, sample-size-qualified statistic, or `null` when there is insufficient data).
3. Build vendor onboarding: self-serve signup + ops-assisted creation, phone/WhatsApp verification, document upload, and an approval workflow. A vendor is only matchable when `status = active` and verification is complete.
4. Build a vendor portal (or, minimally, a WhatsApp-based vendor interface): receive offers, accept/decline/counter, update availability, confirm pickup and delivery. **The counterparty side must be actionable by a real human.**
5. Seed data policy: seed records are permitted for development and demo, but they must be inserted as **normal database rows** via a seed script, flagged `is_demo = true`, and excluded from production. They must never be imported from source code at runtime.
6. Delete `market.ts` once all reads go through the repository/service layer. Keep a temporary `MarketRepository` interface so existing callers compile during migration.

**Acceptance:** `market.ts` no longer exists; matchmaking returns rows from PostgreSQL; a demo vendor can log in (or reply on WhatsApp) and change an order's fate.

---

### 5.3 WP-3 — Real WhatsApp messaging (resolves D4 and D5)

**Do:**
1. Integrate the **WhatsApp Business Cloud API**: outbound template messages for first contact, session messages within the 24-hour window, media messages for produce photos and documents, and SMS/voice fallback when WhatsApp delivery fails.
2. Register approved message templates for: buyer offer, transporter booking request, storage booking request, pickup confirmation, delivery confirmation, exception alert. Store template names/versions in config, not inline strings.
3. Persist a `messages` table: direction, channel, template, rendered body, recipient, provider message id, status (`queued/sent/delivered/read/failed`), failure reason, related order/offer, and the approval record that authorized it.
4. Implement the **inbound webhook**: signature verification, replay protection, idempotent processing, status callbacks, and inbound message ingestion. Inbound text goes through the prompt-injection sanitizer before reaching any model.
5. Interpret inbound replies with the `NegotiationAgent` (accept / decline / counter-price / ask question / unparseable → route to ops). A counter-offer creates a real `offers` row with a real price; an unparseable reply escalates, it does not get a scripted answer.
6. Replace "Buyer is typing…" with **honest, event-driven presence**: show `Offer delivered ✓ 14:03`, `Read ✓ 14:05`, `Awaiting reply — median response 22 min`, and `No response — SLA breach in 18 min`. Drive these from webhook status events over SSE/WebSocket. If you want a live indicator, it must come from a real inbound webhook event, never a timer.
7. The UI string "Offer sent to buyer on WhatsApp" renders only from a persisted `sent` status with a provider message id, and links to the message record.

**Acceptance:** an end-to-end test (against the WhatsApp sandbox/test number) sends a real offer, receives a real reply, and moves the order state. No user-facing "sent"/"typing" string is produced without a corresponding row in `messages`.

---

### 5.4 WP-4 — Real order tracking, GPS and state machine (resolves D2)

**Do:**
1. Keep the 14 states and the transition table. Move them into a server-side `OrderStateMachine` service that is the **only** writer of `orders.state`, guarded by a DB transaction plus optimistic locking, and that rejects illegal transitions with a typed error.
2. Every transition requires an **event**: `event_type`, `source` (whatsapp_webhook | driver_app | vendor_portal | ops_action | user_action | scheduled_sla_check | provider_callback), `actor`, `payload`, `received_at`, and idempotency key. Persist all of them in `order_events` (append-only). The timeline UI is rendered from this table.
3. Implement real location tracking: a driver-facing interface (PWA or WhatsApp location sharing) posting `location_pings` (lat, lng, accuracy, speed, heading, recorded_at, device/battery). Compute ETA and progress from a real routing/directions provider, with geofence-based arrival detection at pickup and drop points. If no ping has arrived within the freshness window, the UI must show `Location stale — last update 12 min ago`, never a synthesized position.
4. Model the lifecycle in the durable workflow engine: pickup window, in-transit monitoring, delay detection, exception handling, delivery confirmation with proof (photo, signature, or OTP), and settlement. Timers here are legitimate — they represent SLA deadlines and produce real `sla_breached` events.
5. Delete the four `setTimeout()` calls and their scripted message strings. The chat/timeline subscribes to server events instead.
6. Alerting: price move beyond threshold, transporter delay, storage temperature excursion, buyer withdrawal — each an event, each producing a real notification through WP-3.

**Acceptance:** grep confirms zero timer-driven business messages; the order timeline for a test order shows only rows from `order_events`; killing and restarting the server does not lose or duplicate an in-flight order lifecycle.

---

### 5.5 WP-5 — Make user inputs actually matter (resolves D3)

**Do:**
1. Enumerate every input in the chat and forms (storage available yes/no, storage type/temperature, depart-early, urgency, ready-by date/time, minimum acceptable price, preferred markets, packaging type, quality overrides, payment terms).
2. For each one, define and implement its **downstream consumer**, and document it in a traceability table (`docs/input-traceability.md`): input → validation → persisted field → the specific agent/tool/scoring term that reads it → the visible effect.
3. Concretely: `storage_available` must change the sell-now-vs-store branch and the spoilage curve; `depart_early` must change the pickup window, the routing/ETA request, and transporter filtering; `min_price` must bound offer generation and auto-decline thresholds; `urgency` must reweight the ranking objective.
4. Add tests that flip each input and assert the recommendation, candidate set, or generated plan **changes in the expected direction**. Any input with no consumer is either wired up or removed from the UI — no decorative controls.

**Acceptance:** the traceability table is complete, every row has a passing test, and no input in the UI lacks a consumer.

---

### 5.6 WP-6 — Real market intelligence and a real recommendation engine (resolves D7 and D8)

**Do:**
1. Build a `PriceSource` adapter interface with concrete implementations, each declaring `source_id`, `coverage`, `freshness`, `reliability`: (a) official/government mandi price publications, (b) partner/vendor-submitted quotes, (c) crowd-sourced trader submissions with moderation, (d) historical model-based estimate. Persist every observation in `price_observations` with source, crop, grade, market, unit, currency, observed_at, ingested_at.
2. Solve the latency complaint properly: ingestion runs as **scheduled background jobs**, not in the request path. Serve from PostgreSQL/Redis with a documented freshness SLA; the request path reads cache and never blocks on a third party. Stale-while-revalidate, plus circuit breaker per source.
3. Every price shown to the user carries provenance: value, source label, observed timestamp, and a freshness badge (`live` / `today` / `stale` / `estimated`). An estimate is labelled as an estimate with a confidence interval.
4. Feed the existing scoring math with real inputs: real vendor candidates and their constraints, real routing distance/duration, real price distributions, real weather/temperature for the spoilage model, real historical acceptance rates. Keep the deterministic math — deterministic math is a feature, not a bug.
5. Add the missing AI layer *on top of* the math, not instead of it: the `MatchmakingAgent` re-ranks and explains the shortlist using constraints, history and free-text vendor requirements; the coordinator produces a natural-language plan with tradeoffs in the user's language. Deterministic scores remain the primary signal and the explanation must cite the actual numbers it was given.
6. Add a fallback contract: when live data is unavailable, return a clearly-labelled estimate plus an explicit statement of what is missing. Never silently substitute a constant.

**Acceptance:** every recommendation response includes a `provenance` block enumerating the data sources and timestamps used; a forced source outage produces a labelled degraded recommendation, not a fabricated one.

---

### 5.7 WP-7 — Hardening the guardrails you already have

1. Rate limiter: per-user, per-tool, per-vendor and per-channel buckets; WhatsApp quota-aware; returns structured 429 with retry-after; covered by tests.
2. Circuit breaker: wrap all six external dependency classes; expose state in health checks; half-open probes; degraded-mode responses reviewed for honesty.
3. Prompt-injection sanitizer: apply to user input **and** all untrusted inbound content (WhatsApp replies, vendor text, OCR, image captions); maintain a test corpus of injection attempts including Urdu/Roman-Urdu and instruction-in-image cases; log every verdict.
4. Domain guardrail: pre-model topical gate plus post-model output check (no medical/legal/financial advice beyond scope, no unapproved commitments, no invented vendor or price). Add **tool-level authorization**: the agent may only call tools permitted for the current user role and current order state.
5. Add an **anti-fabrication validator** as a final response callback: if the response text asserts a completed side effect (sent, booked, confirmed, dispatched) that has no matching successful tool call in this run's trace, the response is blocked and regenerated.

---

## 6. Execution plan (phased, always-green)

| Phase | Scope | Exit criteria |
|---|---|---|
| P0 | Audit: inventory every fake (file + line), every hardcoded constant, every timer, every dead input. Produce `docs/fake-inventory.md` and a migration map. | Inventory reviewed; no code changes yet |
| P1 | Schema + repositories + seed script; `MarketRepository` shim; existing UI reads through it | App behaves identically, data now from DB |
| P2 | ADK runtime, sub-agents, typed tools, guardrail callbacks, tracing | Chat flow runs through ADK; traces visible |
| P3 | WhatsApp outbound + webhook + messages table + honest presence | Real offer sent and reply received in sandbox |
| P4 | Event-driven state machine, `order_events`, durable workflow, GPS pings, ETA | Timers deleted; timeline from events; restart-safe |
| P5 | Input traceability wiring + tests | Every input has a consumer and a test |
| P6 | Price adapters, ingestion jobs, provenance, AI re-ranking layer | Provenance on every number; degraded mode honest |
| P7 | `market.ts` deleted, dead code removed, load/chaos/e2e tests, docs | All acceptance criteria met |

Rules of engagement:
- One work package per branch, small reviewable commits, conventional commit messages.
- Do not start a phase before the previous phase's exit criteria pass.
- Feature-flag every new path (`FEATURE_ADK_RUNTIME`, `FEATURE_REAL_WHATSAPP`, `FEATURE_EVENT_TRACKING`, `FEATURE_LIVE_PRICES`) so the old path can be restored instantly.
- Regression protection: capture the current working screens/flows as e2e tests **before** refactoring them.

---

## 7. Demo/simulation policy (read carefully)

Simulation is allowed. **Deception is not.**

- If a real integration is impossible in the timeframe (e.g. no public mandi price API for a district), implement it as a **named adapter** (`SimulatedPriceSource`, `SimulatedDriverPings`) that (a) implements the same interface as the real adapter, (b) is enabled only by an explicit environment flag, (c) is registered in a `/health/integrations` endpoint that reports each integration as `live | sandbox | simulated`, and (d) causes the UI to render a visible `Simulated data` badge.
- Simulated adapters must still produce **real events through the real pipeline**: a simulated driver posts real `location_pings` to the real endpoint; a simulated buyer replies through the real webhook path. The system under test must be indistinguishable from production except for the data origin.
- Hardcoded strings inside UI components, timer-driven fake progress, and invented statistics are never acceptable, in any mode.

---

## 8. Definition of done

The work is complete when all of the following are demonstrably true:

1. `rg -n "setTimeout|setInterval" src/` returns only debounce/animation/backoff/polling uses, each with a comment justifying it.
2. `market.ts` and every other hardcoded business-data module are deleted; no business constants remain in source.
3. Buyers, transporters and storage operators exist as verified accounts with capacity and availability, and at least one of each can act on an order through a real interface.
4. A live end-to-end run completes: photo + text intake → vision grading → real price lookup with provenance → risk forecast → real candidate shortlist → user approval → real WhatsApp offer → real vendor reply → real booking → real GPS-tracked transit → delivery confirmation with proof → settlement record, with a full trace retrievable for the order.
5. Every number in the UI has provenance metadata; nothing displays a fabricated statistic.
6. Every state transition in the 14-state machine is caused by a persisted event, and illegal transitions are rejected with tests proving it.
7. Every chat/form input has a documented and tested downstream consumer.
8. Guardrails (rate limiter, circuit breaker, sanitizer, domain check, tool authorization, anti-fabrication validator) are enforced in the ADK callback chain with tests, including adversarial cases.
9. Restart/crash mid-order loses nothing and duplicates nothing (idempotency and durability tests pass).
10. All pre-existing working screens, flows and languages still work; regression suite green.
11. Documentation delivered: architecture diagram, agent/tool catalogue with schemas, state machine diagram with event sources, integration status matrix, input traceability table, runbook, and `.env.example`.

---

## 9. Reporting requirements

Before writing code, reply with:
1. The completed **fake inventory** (file, line, defect id, replacement plan).
2. Any place where a real integration is genuinely blocked, with the specific blocker (missing credential, no public API, cost, approval time) and your proposed adapter.
3. The final phase plan with sequencing and the tests you will write first.

Then, after each phase, report: what changed, which acceptance criteria now pass, test results, feature flag states, and remaining risks.

**Do not** report a task complete while any part of it is still simulated, and do not describe simulated behaviour with language that implies it is real. If you cannot make something real, say so explicitly and label it in the product.
