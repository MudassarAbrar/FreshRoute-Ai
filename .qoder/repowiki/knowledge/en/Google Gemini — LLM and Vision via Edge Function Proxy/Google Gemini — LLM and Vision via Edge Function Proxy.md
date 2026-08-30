---
kind: external_dependency
name: Google Gemini — LLM and Vision via Edge Function Proxy
slug: google-gemini
category: external_dependency
category_hints:
    - sdk_real_api
    - client_constraint
scope:
    - '**'
---

All Gemini traffic goes through the `gemini-proxy` Supabase Edge Function; the API key is never shipped to the browser. The function calls `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent` with `X-goog-api-key` and structured `systemInstruction` + `contents` payloads. Three actions are exposed: `extract` (text → structured lot JSON), `vision` (inline base64 image → quality grade JSON), and `chat` (conversation history + context → agent reply). Errors (invalid key, model not available, rate limit) are surfaced as `{ ok: false, error }` responses so the frontend can fall back to deterministic offline logic. When no key is configured the proxy reports `mode: demo` and the client falls back to hardcoded responses.