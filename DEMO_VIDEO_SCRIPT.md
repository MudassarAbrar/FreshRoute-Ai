# FreshRoute Agent — Demo Video Script

> **Target length:** 3 min 30 sec (under the 4-minute cap)  
> **Pace:** ~150 words/minute — comfortable, clear, not rushed  
> **Format:** Screen recording with voiceover narration  
> **Language:** English  

---

## Segment 1 — The Problem (0:00 – 0:35)

**[SCREEN: Landing page hero → scroll to Problem section with stats]**

> "Pakistan grows some of the best tomatoes, mangoes, and citrus in the world —  
> yet loses thirty to forty percent of that harvest before it ever reaches a consumer.  
>
> The reason isn't farming. It's the selling process.  
>
> A farmer picks a crop in the morning and has hours — not days — to decide where to  
> sell it. But the information they need is scattered across phone calls, WhatsApp  
> messages, and word of mouth. By the time their truck reaches the mandi, every  
> better option is already gone.  
>
> FreshRoute Agent exists to close that gap."

---

## Segment 2 — Value Proposition (0:35 – 0:55)

**[SCREEN: Landing page hero headline + floating cards — "Lahore PKR 96/kg", "Truck booked", "PKR 330,330 net"]**

> "FreshRoute is an AI-powered produce trading assistant.  
>
> A farmer sends one message — in English or Urdu — and the agent grades their lot,  
> compares five wholesale markets after transport cost, spoilage, and commission,  
> finds matching buyers, drafts the outreach, books the truck, and tracks delivery —  
> all inside a single chat conversation, with explicit approval at every financial step.  
>
> Nothing is sent, booked, or spent without the farmer saying yes first."

---

## Segment 3 — Live App Demo (0:55 – 2:40)

### 3a — Login & Dashboard (0:55 – 1:10)

**[SCREEN: Login page → sign in → Dashboard]**

> "I'll sign in with my account. Authentication runs through Firebase Auth —  
> Email and Password plus Google Sign-in are both supported.  
>
> This is the farmer dashboard — active orders, earnings summary, customer  
> transparency score, and quick actions."

### 3b — The Chat: Lot Intake (1:10 – 1:30)

**[SCREEN: Chat page → type message → AI extracts lot]**

> "Let's open the chat and tell the agent what we have.  
>
> I'll type: *'I have 800 kg tomatoes in Multan. They will be ready tomorrow.'*  
>
> The agent sends this to Google Gemini through a server-side Edge Function —  
> Gemini extracts the crop, quantity, city, and ready date into structured data.  
> Notice the green LIVE badge — that means we're talking to real Gemini, not a demo fallback."

### 3c — Vision Analysis (1:30 – 1:50)

**[SCREEN: Photo upload → Gemini vision result → LotCard with grade/ripeness/defects]**

> "Now I'll attach a photo of the tomatoes.  
>
> Gemini Vision analyzes the image and returns a quality grade — in this case Grade B —  
> along with ripeness level, estimated defect rate, and quality notes.  
>
> This is critical because the grade directly affects the price the farmer will get  
> at each market."

### 3d — Market Scenarios (1:50 – 2:10)

**[SCREEN: Scenarios card — 5 mandis ranked by net revenue]**

> "With the lot and grade locked in, the agent generates ranked market scenarios.  
>
> Each option shows the net revenue — that's the headline price minus mandi  
> commission, transport cost, spoilage loss, and platform fee.  
>
> Lahore pays the highest headline rate, but after accounting for the 350-kilometer  
> transport and spoilage on the route, the agent tells us the true net figure.  
>
> The recommendation engine selects the best option and highlights it."

### 3e — Approval & Outreach (2:10 – 2:25)

**[SCREEN: Approval card → Approve button → offers appear]**

> "Here's the approval gate. The agent has drafted a buyer outreach message —  
> but nothing sends until I tap Approve.  
>
> Once approved, matching buyers respond with offers. Each offer includes a price,  
> quantity, and a transport quote.  
>
> Every action is timestamped in the audit log — full transparency."

### 3f — Order Tracking & Bilingual (2:25 – 2:40)

**[SCREEN: Order tracking steps → toggle language to Urdu → UI switches to RTL]**

> "After the final approval, the order moves through pickup, transit, delivery,  
> and payment — with real-time status updates.  
>
> And the entire experience — agent messages, UI labels, quick replies — switches  
> to Urdu with one tap. Gemini responds in the selected language automatically."

---

## Segment 4 — Google Cloud Proof (2:40 – 3:15)

**[SCREEN: Switch to browser tab with Google Cloud / Firebase Console]**

> "Let me show you the Google Cloud infrastructure running behind the scenes."

### 4a — Firebase Console (2:45 – 2:55)

**[SCREEN: Firebase Console → Authentication → Users list]**

> "This is the Firebase Console. Authentication — both Email/Password and Google  
> Sign-in — is handled here. You can see our registered users."

### 4b — Firestore AI Telemetry (2:55 – 3:05)

**[SCREEN: Firestore → ai_usage collection → live documents]**

> "Every Gemini API call writes a telemetry event to Cloud Firestore in real-time.  
> Here you can see the AI usage log — action type, model name, status, and  
> latency in milliseconds. This powers the live monitoring in our admin dashboard."

### 4c — Supabase Edge Function (3:05 – 3:15)

**[SCREEN: Supabase dashboard → Edge Functions → gemini-proxy → logs showing .run URL]**

> "The Gemini proxy runs as a Supabase Edge Function — deployed on a .run URL.  
> The Gemini API key lives only in server-side secrets and is never exposed to  
> the browser. Every request verifies the caller's JWT before proxying to Google's  
> generative language API."

---

## Segment 5 — Closing (3:15 – 3:30)

**[SCREEN: Back to app — landing page or dashboard]**

> "FreshRoute Agent turns a single WhatsApp-style message into a complete selling  
> workflow — powered by Google Gemini for intelligence, Firebase for auth and  
> real-time telemetry, and Supabase for the database and secure server-side AI proxy.  
>
> One conversation. From harvest to payment."

**[SCREEN: Title card — "FreshRoute Agent" + GitHub repo URL + "Built with Google AI"]**

---

## Production Notes

### Recording checklist

- [ ] Browser at 1280×720 or 1920×1080, zoom at 100%
- [ ] Hide browser bookmarks bar (Ctrl+Shift+B in Chrome)
- [ ] Disable OS notifications / Do Not Disturb
- [ ] Close all unrelated tabs — only show the app and Google Cloud Console
- [ ] Use Chrome or Edge (voice input only works there)
- [ ] Have demo data pre-loaded (run seed migrations)
- [ ] Pre-stage a tomato photo ready for upload
- [ ] Have Firebase Console and Supabase dashboard open in background tabs

### What NOT to show

- No third-party logos visible on screen (blur if needed)
- No API keys, passwords, or secrets in any config panel
- No other people's faces, names, or personal data
- No content that could be construed as discriminatory

### Timing guide

| Segment | Duration | Cumulative |
|---|---|---|
| 1 — Problem | 35 sec | 0:35 |
| 2 — Value prop | 20 sec | 0:55 |
| 3 — Live demo | 1 min 45 sec | 2:40 |
| 4 — Cloud proof | 35 sec | 3:15 |
| 5 — Closing | 15 sec | 3:30 |

### Subtitle note

If recording with a non-English accent, add English subtitles. YouTube's auto-captions  
are acceptable, but review them for accuracy — especially technical terms like  
"mandi", "Gemini", and "Firestore".

### Upload settings

- **Platform:** YouTube (Public) or Vimeo (Public)
- **Title suggestion:** `FreshRoute Agent — AI Produce Trading Assistant | Built with Google Gemini`
- **Description:** Include the hosted URL, GitHub repo link, and `#AllThingsAgentic`
- **Thumbnail:** Use the hero banner from `public/images/hero-banner.png`
