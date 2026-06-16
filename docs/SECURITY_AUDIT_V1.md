# Fortune Shrine Security Audit v1.0

Date: 2026-06-13

Scope:

- Current repository in `/Users/lixiaole/Documents/Fortune Shrine`
- Current local/static deployment shape
- Static server in `server.mjs`
- Frontend ritual code in `public/`
- Next prototype in `app/`

Limit:

- No external production URL was provided, so HTTPS, CDN, DNS, hosting provider settings, and live response headers could not be independently verified.
- This audit reviews the current codebase and current deployment architecture visible in the workspace.

## Executive Summary

Current risk level: Medium.

Current direct financial/API-cost risk: Low.

Reason:

- The current app does not contain OpenAI calls.
- The current app does not contain real payment verification.
- The current app does not contain wallet connection logic.
- The current app does not contain backend API routes.
- The current app stores no server-side user data.

However:

- The payment flow is simulated in the client.
- The blessing corpus is publicly served from `public/assets/blessing-corpus-v1.md`.
- No rate limiting exists.
- No authentication exists.
- No production security headers are configured in the local static server.
- No logging or abuse monitoring exists.
- No `.gitignore` or `.env.example` exists yet.

This is acceptable for a local prototype.

It is not safe enough for real payments, real OpenAI generation, saved user data, or public paid traffic.

## API Key Security

Status: Currently acceptable, but incomplete for future production.

Findings:

- No OpenAI API key was found in the codebase.
- No third-party API key was found in the codebase.
- No `.env` file was found.
- No server-side OpenAI call exists.
- No API route currently consumes secrets.

Evidence:

- `server.mjs` only reads `process.env.PORT`.
- `public/app.js` uses client-side `fetch()` only to load `/assets/blessing-corpus-v1.md`.
- `app/page.jsx` calls local `generateBlessing()` only.

Risks:

- There is no `.gitignore`, so future `.env` files could be accidentally committed.
- There is no `.env.example`, so future secret handling conventions are not documented.

Required before growth:

- Add `.gitignore` with `.env`, `.env.local`, `.env.*.local`, `.next`, `node_modules`, logs, and local database files.
- Add `.env.example` with placeholder names only.
- Keep OpenAI, RPC, database, payment provider, and wallet secrets server-side only.
- Never expose `NEXT_PUBLIC_*` variables for private keys or provider secrets.

## Rate Limiting

Status: Not enabled.

Current limits:

- No IP limit.
- No session limit.
- No wallet limit.
- No payment-intent limit.
- No blessing-generation limit.

Current practical impact:

- Low API-cost impact because there are no paid API calls.
- Low payment impact because payment is simulated.
- Medium content scraping impact because the full public corpus can be repeatedly fetched.

Can a single user or IP generate excessive API costs?

- Today: No, because there is no OpenAI or paid backend endpoint.
- After AI generation is connected: Yes, unless rate limiting and payment gating are implemented first.

Required before growth:

- Rate limit all future dynamic endpoints.
- Minimum limits:
  - `POST /api/payment-intents`: IP + session based.
  - `POST /api/payment-intents/:id/verify`: IP + intent based.
  - `POST /api/blessings/generate`: verified payment-intent based.
  - Any future user-input endpoint: IP + session based.

## Abuse Prevention

Status: Weak.

Can users spam requests?

- Static pages: Yes, but low cost.
- Blessing generation: Yes, but currently client-side and low cost.
- Future AI/payment endpoints: Would be vulnerable unless protected.

Can users automate blessing generation?

- Yes.
- The blessing generation currently runs in the browser.
- The public corpus can be fetched directly.
- `localStorage` recent-repeat protection improves user experience but is not security.

Protections currently present:

- None that count as server-side abuse prevention.

Required before growth:

- Move real blessing selection behind a backend once payments begin.
- Return one blessing per verified offering.
- Add rate limits.
- Add bot detection only if abuse appears.
- Avoid aggressive ritual friction unless necessary.

## Prompt Security

Status: Safe only because AI prompting is not currently implemented.

Can users reveal system prompts?

- Today: No, because there is no model prompt endpoint.
- Future AI version: Yes, if raw user input is sent to an LLM without strict server-side prompt isolation and output filtering.

Can users access internal instructions?

- Today: They can access any file served under `public/`.
- They cannot access `docs/` through `server.mjs` because only `public/` is served.
- If deployed with a framework that serves unexpected files, this must be rechecked.

Can users extract blessing corpus content?

- Yes.
- `public/assets/blessing-corpus-v1.md` exposes the full corpus to the client.
- This is acceptable for prototype testing, but not ideal as a long-term content moat.

Required before growth:

- Keep the complete blessing archive server-side.
- Return only the selected blessing to the client.
- Do not send system prompts or canon instructions to the browser.
- If AI is introduced, enforce:
  - no prediction,
  - no trading advice,
  - no financial promises,
  - no instruction to buy/sell/hold/short/long,
  - fallback to curated blessing on safety failure.

## Authentication

Status: Not implemented.

Are any protected routes publicly accessible?

- There are no protected routes.
- There are no API routes.
- There are no admin routes.

Are admin functions protected?

- No admin functions exist.

Risk:

- Low today.
- High later if admin corpus editing, payment review, analytics, or incident tools are added without auth.

Required before growth:

- Put future admin tools behind authentication.
- Do not ship admin UI in public client bundles unless access-controlled server-side.
- Keep corpus management private.

## Data Security

Status: Low risk today.

Is user data stored?

- No server-side user data is stored.
- Browser `localStorage` stores recent blessing history keys for repetition reduction.

Stored client-side:

- `fortune-shrine-recent-oracle-v1`

Where:

- User browser only.

Is sensitive data exposed through APIs?

- No sensitive user data API exists.
- The full blessing corpus is publicly exposed as a static asset.

Required before growth:

- Store minimal payment data only.
- Do not store private intention text unless absolutely necessary.
- Avoid linking wallet addresses to emotional/intention text.
- Add deletion policy if accounts/history are introduced.

## HTTPS & Infrastructure

Status: Not verifiable externally; local server is HTTP only.

Findings:

- `server.mjs` listens on `127.0.0.1`.
- It serves plain HTTP locally.
- It does not enforce HTTPS.
- It does not set production security headers.
- No deployment platform config was found.

Obvious missing production headers:

- `Content-Security-Policy`
- `Strict-Transport-Security`
- `X-Content-Type-Options`
- `Referrer-Policy`
- `Permissions-Policy`
- `frame-ancestors` or `X-Frame-Options`

Required before growth:

- Deploy behind HTTPS only.
- Redirect HTTP to HTTPS.
- Add HSTS after domain is stable.
- Add CSP that blocks unexpected scripts.
- Add frame protection to reduce clickjacking/phishing risk.

## Logging & Monitoring

Status: Not implemented.

Are errors logged?

- Local static server logs only startup.
- Frontend logs corpus fallback warnings in the browser console.
- There is no structured server logging.

Can abuse be detected?

- No.

Is there a way to investigate incidents?

- No reliable production incident trail exists yet.

Required before growth:

- Log payment-intent creation.
- Log payment verification failures.
- Log reused transaction attempts.
- Log wrong token/wrong chain/wrong recipient/wrong amount.
- Log rate-limit hits.
- Log blessing safety rejections if AI is introduced.
- Do not log secrets, private keys, raw signatures, or sensitive emotional text.

## Cost Attack Risk

Current easiest cost attack:

- None significant, because no paid API endpoint exists.

Current easiest content/asset attack:

- Fetch `/assets/blessing-corpus-v1.md` and copy the blessing corpus.

Future easiest API-cost attack:

- If `/api/blessings/generate` calls OpenAI without payment verification and rate limits, a bot can repeatedly call it and generate unexpected OpenAI costs.

Future easiest payment-flow attack:

- If the current simulated client payment model becomes real without backend verification, a user can fake payment completion by changing browser state.

Recommended mitigations:

- Do not connect OpenAI directly to the browser.
- Do not expose OpenAI keys to client code.
- Require verified payment intent before any paid AI generation.
- Add strict endpoint rate limits.
- Add daily spend caps at provider level.
- Prefer curated corpus for MVP instead of dynamic AI generation.
- If AI is used later, cache and cap output generation.

## Overall Assessment

Risk level today: Medium.

Why not Low:

- No real funds or API keys are exposed, which is good.
- But the architecture has no production abuse controls yet.
- The full corpus is public.
- The payment ritual is client-side simulated.
- No rate limits, auth, logging, security headers, or HTTPS enforcement are visible in code.

Why not High:

- There is no real OpenAI API call.
- There is no real payment/wallet flow.
- There is no database.
- There is no stored personal user data.

## Top 5 Security Weaknesses

1. No backend payment verification.

   The frontend currently controls the ritual/payment state. This is fine for simulation, unsafe for real USDC.

2. No rate limiting.

   Any future dynamic endpoint would be vulnerable to spam and cost attacks.

3. Full blessing corpus is public.

   Useful for testing, but competitors can scrape it easily.

4. No production security headers or HTTPS enforcement in visible config.

   Local server is prototype-only and should not be treated as production infrastructure.

5. No logging or incident visibility.

   Abuse, fake payment attempts, and verification failures cannot be investigated.

## Recommended Fixes Before Growth

Must do before real USDC:

- Add backend payment intents.
- Keep offering prices canonical on the backend.
- Verify chain, token contract, recipient, amount, tx hash, confirmations, and replay status server-side.
- Reject reused transaction hashes.
- Expire unpaid payment intents.
- Unlock blessing only after backend verification.

Must do before AI generation:

- Keep OpenAI key server-side.
- Gate generation behind verified payment or strict free-tier limits.
- Add forbidden phrase filter.
- Add canon safety checks.
- Return fallback curated blessings if AI output fails.
- Add provider spend caps.

Must do before public traffic:

- Add `.gitignore`.
- Add `.env.example`.
- Add rate limiting.
- Add production security headers.
- Add HTTPS-only deployment.
- Add basic structured logs.
- Keep full corpus server-side if content protection matters.

Recommended MVP-safe path:

1. Keep curated blessings.
2. Build backend payment intent verification.
3. Serve only one selected blessing after verified offering.
4. Add rate limits and logs.
5. Delay dynamic AI until there is enough traffic to justify the extra risk.

## Final Judgment

The current Shrine is safe as a local prototype.

It is not yet safe as a paid public product.

The next real security milestone is not enterprise compliance.

The next real security milestone is:

- server-side payment truth,
- server-side blessing delivery,
- rate limits,
- logs,
- HTTPS,
- no exposed secrets.

Until those are built, do not accept real USDC and do not connect real OpenAI generation to public traffic.
