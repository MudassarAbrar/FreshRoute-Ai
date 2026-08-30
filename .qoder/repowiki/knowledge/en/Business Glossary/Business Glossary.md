---
kind: business_term
name: Business Glossary
category: business_term
scope:
    - '**'
---

### FreshRoute Agent
- Definition：The product name for FreshRoute's AI-powered agricultural market intelligence and transaction-execution platform that helps farmers and produce traders decide where, when, and how to sell perishable produce, then coordinate buyers, transporters, and storage.

### lot
- Definition：A structured record of a single produce offering captured by the system, containing crop type, quantity (kg or maund), origin city, readiness date, and optional photo-derived quality signals. A lot moves through states from draft intake through booked delivery and completion.
- Aliases：produce lot、lot record

### mandi
- Definition：A wholesale produce market in Pakistan where farmers and traders bring crops to sell; used throughout FreshRoute as the reference point for local pricing and destination markets such as Multan mandi or Lahore sabzi mandi.
- Aliases：sabzi mandi

### maund
- Definition：A traditional South Asian weight unit used by farmers; FreshRoute converts it to kilograms using the factor 37.32 kg per maund when parsing farmer messages.
- Aliases：man、من

### grade
- Definition：A produce quality classification of A, B, or C assigned either by Gemini vision analysis or fallback estimation; buyer contracts often specify minimum acceptable grade (e.g., Metro Fresh requires Grade A only).
- Aliases：quality grade、produce grade

### scenario
- Definition：A financial comparison between alternative actions for a lot — sell now locally, sell tomorrow to another market, store overnight, or ship to a premium buyer — each showing gross revenue, transport/storage costs, estimated spoilage, commission, expected net revenue, and risk level.
- Aliases：sell scenarios、scenarios summary

### outreach
- Definition：Any outbound action initiated by the agent — sending a buyer inquiry, requesting transporter quotes, or reserving cold storage — which must be explicitly approved by the user before execution.
- Aliases：buyer outreach、transporter outreach

### demo mode
- Definition：The fallback operating state when the Gemini API key is not configured on the server; the system returns mock extraction, vision, and chat responses while clearly labeling them as non-live.
