# Input Traceability Matrix

Maps every user input to its downstream consumer. Identifies dead inputs that are collected but not wired, or wired to simulation only.

Per spec Section 32: every user-provided datum must either (a) drive a real downstream computation, (b) be persisted for future use with a documented consumer, or (c) be removed from the UI.

---

## Live Inputs (Wired to Real Computation)

### 1. Crop Type
- **Collected at:** Intake (voice/text/quick reply) → `extractLot()` in `gemini.ts`
- **Stored on:** `Lot.crop` (`src/types.ts` L78)
- **Consumed by:**
  - `engine.ts` L82: `CROP_PRICES[lot.crop]` — selects price table for scenario generation
  - `engine.ts` L83: `CROP_VOLATILITY[lot.crop]` — selects volatility factor
  - `engine.ts` L39-46: `calculateSpoilage({ commodity: lot.crop })` — selects perishability profile
  - `spoilage.ts` L51: `PERISHABILITY_PROFILES[input.commodity]` — decay rate, ideal temp/humidity
  - `matching.ts` L106: `fetchBuyerProfiles({ commodity: lot.crop })` — buyer matching filter
  - `director.ts` L138: `CROP_PRICES[ex.crop]` — crop support check (9 supported crops)
- **Status:** ✅ Fully wired

### 2. Quantity (kg)
- **Collected at:** Intake (voice/text/quick reply) → `extractLot()`
- **Stored on:** `Lot.quantityKg` (`src/types.ts` L79)
- **Consumed by:**
  - `engine.ts` L90: `lot.quantityKg * (1 - loss)` — accepted kg calculation
  - `engine.ts` L91: `price * acceptedKg` — gross revenue
  - `engine.ts` L125-126: buyer min/max kg filter
  - `engine.ts` L184: `lot.quantityKg * COLD_STORAGE_PER_KG_DAY` — storage cost
  - `matching.ts` L47: quantity fit scoring
- **Status:** ✅ Fully wired

### 3. Location (City)
- **Collected at:** Intake (voice/text/quick reply) → `extractLot()`
- **Stored on:** `Lot.location` (`src/types.ts` L80)
- **Consumed by:**
  - `engine.ts` L35: `WEATHER[lot.location]` — weather temp for spoilage
  - `engine.ts` L88: `prices[lot.location]` — local mandi price
  - `engine.ts` L100: market label
  - `engine.ts` L130: `CITY_DISTANCES_KM[lot.location]` — distance to buyer cities
  - `spoilage.ts` L59: effective temperature for decay calculation
  - `matching.ts` L51: proximity scoring
- **Status:** ✅ Fully wired (but distances are hardcoded in `market.ts`)

### 4. Ready Date
- **Collected at:** Intake (voice/text/quick reply) → `extractLot()`
- **Stored on:** `Lot.readyDate` (`src/types.ts` L81) as string ("today", "tomorrow", etc.)
- **Consumed by:**
  - `spoilage.ts` L41: `harvestDate` parameter (currently informational; not used in decay formula directly)
  - `matching.ts` L61: urgency alignment scoring (`"today"` = 0 days, `"tomorrow"` = 1 day, else 3)
  - `engine.ts` L38: `baseDailyExposure * 24 * 10` — indirectly affects spoilage hours
- **Status:** ⚠️ Partially wired — readyDate is stored as free text, not parsed to a Date, limiting its usefulness in the spoilage model

### 5. Packaging (crates / sacks / loose)
- **Collected at:** ClarifyCard (`ClarifyCard.tsx` L14-24) → `onClarifyConfirm()`
- **Stored on:** `Lot.packaging` (`src/types.ts` L82)
- **Consumed by:**
  - `engine.ts` L27-31: `packagingFactor()` — crates=1.0, sacks=1.5, loose=2.2
  - `engine.ts` L49: used in simple spoilage model (`simplePct`)
  - `engine.ts` L163: scenario "why" text mentions crates
- **Status:** ✅ Fully wired

### 6. Storage Available (boolean)
- **Collected at:** ClarifyCard (`ClarifyCard.tsx` L26-34) → mapped from "none"/"shade"/"cold" to boolean (`answers.storage === "cold"`)
- **Stored on:** `Lot.storageAvailable` (`src/types.ts` L83)
- **Consumed by:**
  - `engine.ts` L172: `if (lot.storageAvailable)` — **gates** cold store scenario generation entirely
- **Status:** ✅ Fully wired (binary gate — shade option is silently discarded, mapped to `false`)

### 7. Depart Early (boolean)
- **Collected at:** ClarifyCard (`ClarifyCard.tsx` L36-43) → mapped from "early"/"late" to boolean (`answers.depart === "early"`)
- **Stored on:** `Lot.departEarly` (`src/types.ts` L84)
- **Consumed by:**
  - `engine.ts` L37: `departEarlyFactor = lot.departEarly ? 0.7 : 1.0` — reduces spoilage wait hours by 30%
- **Status:** ✅ Fully wired

### 8. Photos (image URLs)
- **Collected at:** Photo attachment UI → `onPhotosChosen()` in `director.ts` L263
- **Stored on:** `Lot.photos` (`src/types.ts` L85)
- **Consumed by:**
  - `director.ts` L277: `analyzePhoto()` — Gemini vision API for grade/ripeness/defect estimation
  - `gemini.ts`: sent to Gemini as base64 data URL
- **Status:** ✅ Fully wired

### 9. Voice Note Transcript
- **Collected at:** Voice input → `onVoiceNote()` in `director.ts` L235
- **Consumed by:**
  - `director.ts` L236: if transcript exists, used as text input; if empty, falls back to demo text
  - `director.ts` L258: `intakeFlow(text)` — same path as text input
- **Status:** ⚠️ Falls back to hardcoded demo text when no real transcript is available

---

## Dead Inputs (Collected but Not Properly Wired)

### 10. Minimum Price (`min_price`)
- **Not collected in current UI** — no field or input mechanism exists
- **Would be consumed by:** Scenario ranking (reject scenarios below farmer's floor price), negotiation agent
- **Status:** ❌ Missing from UI and computation. Should be added to the intake or clarify step.

### 11. Preferred Markets
- **Not collected in current UI** — no field exists
- **Would be consumed by:** Scenario generation (prioritize/prefer farmer's preferred markets), matching engine
- **Status:** ❌ Missing from UI and computation

### 12. Quality Overrides / Grade Self-Assessment
- **Not collected in current UI** — farmer cannot override the AI vision grade
- **Would be consumed by:** Buyer matching, scenario pricing, outreach message
- **Status:** ❌ Missing — farmer should be able to self-assess grade and have it compared with vision analysis

### 13. Payment Terms Preference
- **Not collected in current UI**
- **Shown in output only:** `engine.ts` L109, L158, L205, L248 display buyer's payment terms from hardcoded data
- **Status:** ❌ Dead — farmer's preference (cash-now vs. net-7 vs. net-15) is never collected. Scenario ranking ignores it.

### 14. Storage Type Preference (shade vs. cold)
- **Partially dead:** ClarifyCard collects "none"/"shade"/"cold" but `ClarifyCard.tsx` L52 maps shade → `false` (same as none)
- **Status:** ⚠️ Shade is a meaningful storage option (reduces temp ~5-8°C) but is silently treated as "no storage". Should map to a 3-value enum or apply a shade factor in spoilage.

### 15. Buyer/Transporter/Storage Preferences
- **Not collected** — farmer cannot express preference for specific buyers or transporters
- **Would be consumed by:** Matching engine as a boost/filter
- **Status:** ❌ Missing (acceptable for MVP, should be added for production)

---

## Implicit Inputs (System-Generated, Not User-Provided)

### AI Vision Analysis
- **Generated at:** `analyzePhoto()` in `gemini.ts` → `director.ts` L277
- **Stored on:** `Lot.vision` (grade, ripeness, defectRate, notes, confidence, source)
- **Consumed by:**
  - `engine.ts` L49: ripeness affects spoilage (`high` → 1.15x)
  - `engine.ts` L124: grade compatibility with buyer
  - `engine.ts` L138: grade price factor
  - `matching.ts` L66: grade compatibility check
- **Status:** ✅ Wired, but falls back to demo model when Gemini is unavailable

### Extraction Confidence
- **Generated at:** `extractLot()` → `director.ts` L289-294
- **Stored on:** `Lot.confidence` (crop, quantity, location, overall)
- **Consumed by:** Audit log only — not used in any computation or UI decision
- **Status:** ⚠️ Should gate scenario confidence messaging or trigger clarification questions when low

---

## Input Flow Diagram

```
User Input               Extraction              Storage          Computation
─────────────────────────────────────────────────────────────────────────────────
Voice/Text ──→ extractLot() ──→ Lot.crop ──────→ spoilage, prices, matching
                    │         Lot.quantityKg ──→ scenarios, pricing
                    │         Lot.location ─────→ distances, weather, mandi
                    │         Lot.readyDate ────→ urgency, spoilage (partial)
                    │
Photos ─────→ analyzePhoto() → Lot.vision ─────→ grade pricing, buyer filter
                                                Lot.confidence ──→ audit only (dead)
                                                Lot.photos ──────→ Gemini input
                    │
ClarifyCard ─→ onClarifyConfirm()
                    │         Lot.packaging ────→ spoilage (packagingFactor)
                    │         Lot.storageAvail ─→ cold store scenario gate
                    │         Lot.departEarly ──→ spoilage (30% reduction)
```

---

## Remediation Priorities

| Priority | Input | Issue | Fix |
|----------|-------|-------|-----|
| High | `min_price` | Not collected | Add to clarify step; use in scenario ranking |
| High | `shade` storage | Silently discarded | Map to 3-value enum; apply shade factor in spoilage |
| Medium | `readyDate` | Free text, not parsed | Parse to Date; use in spoilage time model |
| Medium | `confidence` | Audit-only | Gate low-confidence scenarios with warning UI |
| Medium | Payment preference | Not collected | Add to clarify; use in scenario ranking |
| Low | Preferred markets | Not collected | Add optional field; use as scenario boost |
| Low | Grade self-assess | Not collected | Add optional override; compare with vision |
