# FreshRoute Implementation Status Ledger

> **Authoritative implementation ledger.** Updated after every major milestone.
> Last updated: Phase 0 baseline (2026-09-01)

---

## 1. AI Agent Runtime (Google ADK / LangGraph)

### Current Status
PARTIAL

### Current Implementation
- Hand-rolled Gemini function-calling loop in `supabase/functions/gemini-proxy/index.ts` L361-618
- Single monolithic agent with 12 tools defined in `src/lib/orchestrator/adkAgent.ts`
- Edge Function comment explicitly states ADK npm package exceeded Edge Runtime size limit
- Client-side `agentTurn()` wrapper in `src/lib/gemini.ts` L297-319

### Known Fake/Mock Behavior
- Not fake per se, but mislabeled as "ADK" when it is native Gemini function calling
- No sub-agent delegation — single agent handles all tasks
- No iteration cap enforcement with cost tracking
- No tool timeout or retry logic
- Sessions stored in-memory `Map` (lost on Edge Function cold start)

### Required Production Behavior
- Real agent framework (LangGraph.js) with 7 sub-agents
- `freshroute_coordinator` root agent that delegates to sub-agents
- Iteration cap, cost budget, tool timeout, retry with backoff
- Final answer anti-fabrication validation
- Sessions persisted to PostgreSQL

### Files Involved
- `supabase/functions/gemini-proxy/index.ts` — Edge Function with agent loop
- `src/lib/gemini.ts` — Client-side agent wrappers
- `src/lib/orchestrator/adkAgent.ts` — Agent definition and tool schemas
- `src/lib/orchestrator/planner.ts` — Rule-based stage-to-tool mapping
- `src/lib/orchestrator/executor.ts` — Tool execution (superseded by Edge Function)
- `src/lib/orchestrator/tools.ts` — Client-side tool registry
- `src/lib/orchestrator/monitor.ts` — Background check functions
- `src/lib/orchestrator/riskClassifier.ts` — Step classification

### Database Dependencies
- `agent_action_log` table (migration 0005) — tool call logging
- `ai_usage` table (migration 0001) — AI call logging

### External Dependencies
- Google Gemini API (`gemini-flash-latest`)
- LangGraph.js (planned)

### Implementation Plan
Phase 4: Install LangGraph.js, create coordinator + 7 sub-agents, implement iteration/cost controls, persist sessions to PostgreSQL.

### Verification
- Test that each sub-agent can be invoked independently
- Test that iteration cap is enforced
- Test that sessions survive Edge Function restart
- Test that tool timeout triggers graceful degradation

### Remaining Risks
- LangGraph.js may not be compatible with Supabase Edge Runtime (Deno). May need separate agent service.

---

## 2. Marketplace Data (Buyers, Transporters, Storage)

### Current Status
PARTIAL — hardcoded

### Current Implementation
- `src/data/market.ts` (241 lines): 4 hardcoded buyers, 3 transporters, 1 storage facility
- `CROP_PRICES` for 9 crops across 5 cities — labeled "simulated live mandi feed (Aug 2026)"
- `buildScenariosAsync()` in `engine.ts` attempts DB fetch, falls back to hardcoded arrays
- Edge Function `executeReadTool` queries `user_roles` + `role_profiles` for buyer/transporter/storage data

### Known Fake/Mock Behavior
- All BUYERS, TRANSPORTERS, STORAGES arrays are static TypeScript constants
- All CROP_PRICES are hardcoded — no live price feeds
- `tickerPrices()` generates random confidence/freshness values
- `buildScenarios()` (sync path) uses only hardcoded data
- Acceptance rates (82%, 65%, 78%, 80%) are hardcoded constants, not computed from persisted outcomes

### Required Production Behavior
- Database is the single source of truth for all marketplace entities
- Typed relational tables (buyer_preferences, transporter_capabilities, storage_facility_details)
- Historical acceptance rates computed from persisted offer outcomes
- Price observations with source, timestamp, confidence, freshness
- "NO_MATCH_DATA" returned when insufficient real data exists

### Files Involved
- `src/data/market.ts` — Hardcoded marketplace data (TO BE REMOVED)
- `src/lib/engine.ts` — Scenario builder (sync + async)
- `src/lib/matching.ts` — Buyer matching scoring
- `src/lib/providerMatching.ts` — Transport/storage ranking
- `src/store/director.ts` — Imports BUYERS, CROP_PRICES directly
- `supabase/functions/gemini-proxy/index.ts` — Edge Function tool implementations

### Database Dependencies
- `user_roles` + `role_profiles` (migration 0003) — generic JSONB profiles
- `listings` (migration 0004) — unified listing model
- No typed buyer/transporter/storage tables yet

### External Dependencies
- None currently (all data is hardcoded)
- Price feed APIs planned

### Implementation Plan
Phase 5: Create typed marketplace tables, seed data, remove market.ts from production paths, update all imports to DB-backed services.

### Verification
- No imports from `src/data/market.ts` in production code
- DB queries return real data for matching
- "No data" state handled honestly (not falling back to seed data silently)

### Remaining Risks
- Seed data must not be silently used as production fallback
- Matching engine needs real buyer/transporter records to be useful

---

## 3. WhatsApp Messaging

### Current Status
NOT STARTED — fully mocked

### Current Implementation
- `sendWhatsApp()` in `src/lib/db.ts` L747-753: explicit mock stub returning `{ delivered: true, messageId: "mock-" + Date.now() }`
- `messages` table (migration 0008) with basic schema (sender, recipient, content, status, channel)
- `createMessage()` and `fetchMessages()` in `db.ts`

### Known Fake/Mock Behavior
- `sendWhatsApp()` always returns success without any API call
- UI renders "Offer sent to X on WhatsApp" (director.ts L502-503) without sending any message
- "Buyer is typing..." (director.ts L514) is timer-driven simulation
- "WhatsApp message delivered · read receipt received" (L510) without actual delivery
- No inbound webhook, no template management, no provider integration

### Required Production Behavior
- Real WhatsApp Business Cloud API integration (or equivalent provider)
- Complete message lifecycle: PENDING -> SENDING -> SENT -> DELIVERED -> READ
- Provider message IDs stored (not `mock-{timestamp}`)
- Inbound webhook with signature verification, idempotency, sanitization
- NegotiationAgent interprets inbound messages
- Template management for first-contact messages
- Honest UI: "Offer sent" only after actual provider confirmation

### Files Involved
- `src/lib/db.ts` L747-753 — Mock `sendWhatsApp()`
- `src/store/director.ts` L498-518 — Fake "sent" and "typing" UI
- `supabase/migrations/0008_messages.sql` — Basic messages table

### Database Dependencies
- `messages` table (migration 0008) — needs enhancement

### External Dependencies
- WhatsApp Business Cloud API (credentials not yet available)
- Webhook endpoint (not yet created)

### Implementation Plan
Phase 6: Build provider abstraction (real + simulated adapters), enhance messages table, create webhook handler, update UI for honest status.

### Verification
- `sendWhatsApp()` calls real provider API when credentials configured
- Messages persisted with provider_message_id
- Webhook processes inbound messages and updates status
- UI shows "Simulated" badge when using simulated adapter

### Remaining Risks
- WhatsApp Business Account approval can take time
- Template approval required by WhatsApp for outbound business messages

---

## 4. Order State Machine

### Current Status
PARTIAL — exists but bypassed

### Current Implementation
- `src/lib/orderStateMachine.ts` (55 lines): 14 states, VALID_TRANSITIONS table, `transition()` function
- `transition()` validates state, updates `orders.status`, logs to `order_events`
- Used in `director.ts` for scripted flow transitions

### Known Fake/Mock Behavior
- Edge Function `executeWriteTool` for `update_order_status` (gemini-proxy L746-752) **bypasses state machine entirely** — directly updates `orders.status`
- No DB-level enforcement — any code path can modify `orders.status`
- No optimistic locking — concurrent transitions can corrupt state
- No idempotency on `order_events` — duplicate events possible
- `order_events` table missing: source, actor, previous_state, new_state, correlation_id, idempotency_key

### Required Production Behavior
- State machine is the ONLY writer of `orders.status`
- PostgreSQL trigger enforces state machine at DB level
- All transitions go through `transitionOrder(orderId, targetState, actor, reason, metadata)`
- Atomic DB transaction: update status + insert event
- Optimistic locking prevents concurrent corruption
- Idempotency keys prevent duplicate events

### Files Involved
- `src/lib/orderStateMachine.ts` — Client-side state machine
- `supabase/functions/gemini-proxy/index.ts` L746-752 — Edge Function bypass
- `src/store/director.ts` — Uses `transition()` in scripted flow

### Database Dependencies
- `orders` table (migration 0001) — `status` column
- `order_events` table (migration 0005) — audit trail (incomplete schema)

### External Dependencies
- None

### Implementation Plan
Phase 1: Fix Edge Function bypass, create shared state machine for server-side, enhance `order_events` schema, add DB-level write protection trigger.

### Verification
- Edge Function `update_order_status` goes through state machine validation
- Illegal transitions rejected at both TypeScript and PostgreSQL level
- Duplicate events handled idempotently
- Tests cover all 14 states and every legal/illegal transition

### Remaining Risks
- DB trigger must not break existing seed scripts or migrations

---

## 5. GPS / Location Tracking

### Current Status
NOT STARTED — fully simulated

### Current Implementation
- `truckStatus()` in `director.ts` L781-819 returns hardcoded location strings
- "Your truck is on the M-3 near Sheikhupura — about 63 km from Lahore. Current ETA 3:10 PM."
- No `location_pings` table, no driver interface, no routing provider

### Known Fake/Mock Behavior
- All GPS coordinates are fabricated strings
- ETA is a hardcoded time ("3:10 PM")
- "Delay alert was already sent to the buyer, who confirmed the window is fine" — no such alert exists
- No real location data anywhere in the system

### Required Production Behavior
- `location_pings` table stores real driver location data
- OSRM routing provider calculates real ETA and distance
- Driver PWA or WhatsApp location-sharing interface for pings
- Stale location detection with "Last known: [location] at [time]" UI
- "Location unavailable" when no pings exist (not fabricated coordinates)
- Geofence-based arrival detection

### Files Involved
- `src/store/director.ts` L781-819 — `truckStatus()` hardcoded responses

### Database Dependencies
- None yet — `location_pings` table needed

### External Dependencies
- OpenStreetMap Nominatim (reverse geocoding, free)
- OSRM (routing/ETA, free)

### Implementation Plan
Phase 3: Create `location_pings` table, routing service with OSRM, location ping endpoint, update `truckStatus()`.

### Verification
- OSRM returns valid route data for Pakistan roads
- Stale detection triggers "outdated" warning
- No fabricated coordinates presented as real
- Location ping endpoint rejects unauthorized requests

### Remaining Risks
- OSRM public API has rate limits — may need self-hosted instance for production
- No driver app exists yet for posting location pings

---

## 6. Market Intelligence / Prices

### Current Status
NOT STARTED — fully hardcoded

### Current Implementation
- `CROP_PRICES` in `market.ts` L14-24: static prices for 9 crops across 5 cities
- `tickerPrices()` generates random confidence/freshness values
- `WEATHER` constant in `market.ts` L184-187: hardcoded weather for 2 cities

### Known Fake/Mock Behavior
- All prices are static constants labeled "simulated live mandi feed"
- Random confidence scores (0.78-0.93) have no basis in actual data quality
- Random freshness values (45-105 min) are not actual timestamps
- Weather data is hardcoded for 2 cities only
- No provenance metadata on any displayed number

### Required Production Behavior
- `price_observations` table with source, crop, city, price, observed_at, confidence
- Scheduled price ingestion from external sources
- Stale-while-revalidate caching
- Per-source circuit breakers
- Every displayed number carries: source, timestamp, confidence, freshness status
- "MARKET_DATA_UNAVAILABLE" when no data exists

### Files Involved
- `src/data/market.ts` L14-24 — Hardcoded prices
- `src/data/market.ts` L173-182 — `tickerPrices()` with random metadata
- `src/lib/engine.ts` — Uses CROP_PRICES for scenario generation

### Database Dependencies
- None yet — `price_observations` table needed

### External Dependencies
- Price data sources (government mandi data, partner APIs) — not yet identified

### Implementation Plan
Phase 5.1: Create `price_observations` table. Phase 5.2: Seed initial data. Full price feed integration requires external data source agreements.

### Verification
- Displayed prices have source and timestamp metadata
- Stale data produces "stale" label, not fabricated freshness
- Missing data produces honest "unavailable" response

### Remaining Risks
- Pakistan mandi price APIs may not be publicly available
- Need to identify actual data sources

---

## 7. Guardrails and Security

### Current Status
PARTIAL — client-side only

### Current Implementation
- Rate limiting: `src/lib/rateLimiter.ts` — client-side localStorage token bucket (30/hr user, 5/order)
- Circuit breaker: `src/lib/circuitBreaker.ts` — wraps Gemini proxy calls only (3 failures, 60s recovery)
- Input sanitization: `sanitizeForLLM()` in `gemini.ts` — strips `<script>` and prompt injection patterns
- Domain guardrail: `isDomainAllowed()` in `orchestrator/planner.ts` — keyword-based topic gate
- Human approval: write tools require approval in Edge Function + client UI

### Known Fake/Mock Behavior
- Rate limiting is entirely client-side — trivially bypassed by clearing localStorage
- Circuit breaker state is in-memory — lost on page refresh
- No server-side rate limiting
- No anti-fabrication validation
- No tool authorization by role or order state
- No post-model output guardrail
- No multilingual injection corpus (Urdu/Roman Urdu)

### Required Production Behavior
- Server-side rate limiting in Edge Function
- Circuit breakers for all external dependencies
- Anti-fabrication validator blocks false action claims
- Tool authorization by user role and order state
- Post-model output validation
- Multilingual injection testing (English, Urdu, Roman Urdu)

### Files Involved
- `src/lib/rateLimiter.ts` — Client-side rate limiter
- `src/lib/circuitBreaker.ts` — Circuit breaker
- `src/lib/gemini.ts` — `sanitizeForLLM()`, circuit breaker usage
- `src/lib/orchestrator/planner.ts` — `isDomainAllowed()`
- `supabase/functions/gemini-proxy/index.ts` — Edge Function (no rate limiting)

### Database Dependencies
- `ai_usage` table — can be used for server-side rate counting

### External Dependencies
- None

### Implementation Plan
Phase 7: Server-side rate limiting, enhanced circuit breakers, input sanitization hardening, tool authorization.

### Verification
- Server-side rate limit enforced even with cleared localStorage
- Circuit breaker state survives Edge Function restart
- Prompt injection attempts in Urdu/Roman Urdu are blocked
- Tool calls rejected when user role doesn't permit them

### Remaining Risks
- Supabase Edge Functions are stateless — circuit breaker state lost on cold start
- May need Redis or similar for persistent rate limiting

---

## 8. User Input Traceability

### Current Status
PARTIAL — some inputs wired, others dead

### Current Implementation
- Chat messages persisted to `chat_messages` table
- Lot details captured in Zustand state and `chat_state` table
- Some lot fields used in scenario generation (`engine.ts`)
- No formal traceability document

### Known Fake/Mock Behavior
- Several inputs collected in UI but have no verified downstream effect
- Storage type, preferred markets, packaging type, quality overrides, payment terms — likely dead inputs
- `departEarly` captured but impact on routing/ETA unverified
- `minPrice` captured but impact on offer generation unverified

### Required Production Behavior
- Every user input has a documented downstream consumer
- Dead inputs either wired to real effects or removed from UI
- Formal traceability document maintained

### Files Involved
- `src/store/director.ts` — Chat flow input handling
- `src/lib/engine.ts` — Scenario generation using lot fields
- `src/store/useApp.ts` — Zustand store with lot state

### Database Dependencies
- `chat_messages` table (migration 0001)
- `chat_state` table (migration 0001)

### Implementation Plan
Phase 0.2: Create `docs/INPUT_TRACEABILITY.md`. Each input either wired or removed during Phase 5 marketplace migration.

### Verification
- Every input in traceability doc has a test proving its downstream effect
- No dead inputs remain in the UI

### Remaining Risks
- Some inputs may need domain decisions about their effect (e.g., payment terms)

---

## 9. Tests and Documentation

### Current Status
NOT STARTED

### Current Implementation
- Zero test files in entire codebase
- No test framework in `package.json` dependencies
- No test scripts configured
- README.md exists with project documentation
- Architecture diagram exists (`architecture-diagram.png`)

### Known Fake/Mock Behavior
- N/A — no tests exist to be fake

### Required Production Behavior
- Vitest framework with full test coverage
- Unit tests for all business logic (state machine, spoilage, matching, etc.)
- Integration tests for Edge Functions
- E2E tests for critical user flows
- Comprehensive documentation (runbooks, ADRs, API docs)

### Files Involved
- `package.json` — needs test dependencies and scripts
- New `tests/` directory
- New `vitest.config.ts`

### Database Dependencies
- None

### External Dependencies
- None

### Implementation Plan
Phase 0.3-0.4: Install Vitest, write baseline tests for existing working code.

### Verification
- `npm test` runs successfully
- All baseline tests pass
- Test coverage report generated

### Remaining Risks
- None — purely additive work
