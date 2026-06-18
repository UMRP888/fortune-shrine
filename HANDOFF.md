# Fortune Shrine Handoff

Last updated: 2026-06-18

This file is for a future Codex session or collaborator who has no memory of the previous conversation.

Read this first, then read:

- `docs/FORTUNE_SHRINE_CANON.md`
- `AGENTS.md`
- `README.md`

## What This Project Is

Fortune Shrine is a digital blessing ritual for people standing before uncertainty, especially traders, meme coin players, leverage users, gamblers, and gambling-adjacent risk takers.

It is not a trading tool.
It is not a prediction tool.
It is not a gambling encouragement product.
It is not a fortune-telling product.

It creates a ritual pause before risk.

Supreme constitution:

```text
Bless the state.
Never bless the outcome.
```

## The Product Boundary

Allowed:

- bless restraint
- bless patience
- bless steadiness
- bless recovery after loss
- bless courage before uncertainty
- bless the ability to pause before action

Forbidden:

- predicting price direction
- saying buy, sell, enter, exit
- blessing profit
- blessing winning
- promising recovery
- encouraging revenge trading
- saying the Shrine knows the outcome

## Current User Thesis

The strongest first users are:

- crypto futures traders
- meme coin traders
- contract players
- gamblers and risk takers
- day traders/options traders
- people before a risky move or after a painful loss

They may not ask for a blessing directly.

They may ask for luck, calm, courage, restraint, or a pause.

The Shrine should answer that emotional state, not the trade.

## Current Ritual Flow

Current desired sequence:

```text
Page One: The Shrine
Page Two: The Offering
Page Three: The Commitment
Page Four: Silence / Flame Response
Page Five: The Blessing Appears
```

Current implemented language:

- Page One: `Light The Flame`
- Page Two: `Make an offering.`
- Page Two CTA: `Offer to the Flame`
- Page Three secondary action: `Step Back`
- Page Three primary action: `Offer The Flame`
- After commitment: `Silence...`
- Response text: `The flame has heard the offering.`

## Current Active Implementation

The active local app is the static app:

```text
public/index.html
public/styles.css
public/app.js
server.mjs
```

There is also a Next.js app structure, but the page currently being tested is:

```text
http://127.0.0.1:4188/
```

Run server:

```bash
node server.mjs
```

If normal `node` is unavailable in Codex:

```bash
/Users/lixiaole/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node server.mjs
```

## Current Visual State

The Shrine background uses:

```text
public/assets/fortune-shrine-temple-v05.png
```

The altar inscription uses:

```text
public/assets/light-the-flame-text-mask.svg
```

The inscription is intentionally subtle.

Current visual target:

```text
Fire first.
Altar second.
Inscription discovered third.
Headline last.
```

Do not make `LIGHT THE FLAME` feel like a modern button.

It should feel like an ancient altar inscription, hidden in plain sight.

## Current Blessing Reveal

Blessings appear in three lines:

```text
Witness
Blessing
Echo
```

The reveal uses three opacity states:

```text
transparent -> semi-visible -> visible
```

This is important. The blessing should feel like it emerges gradually.

It should not appear instantly like a database result.

## Current Offering System

Current offerings:

- Traveler's Offering
- Keeper's Offering
- Sacred Offering
- Eternal Offering

These are not plans or tiers.

They are ritual paths.

Price must remain secondary and visually quiet.

The offering page should not feel like:

```text
Basic / Pro / Business / Enterprise
```

It should feel like:

```text
Traveler / Keeper / Sacred / Eternal
```

## Highest Priority Next Work

Current launch priority:

1. First priority on 2026-06-16: make sure Fortune Shrine is actually online and payable.
2. Do not change the shrine page, blessing language, payment logic, or recovery layer unless a launch-blocking bug appears.
3. After launch is stable, return to promotion and community entry research.

Do not spend too much time polishing borders, spacing, or inscription effects.

Highest-value next work:

1. Launch the current working shrine.
2. Re-test wallet payment once and QR payment once after deployment.
3. Confirm payment succeeds, blessing appears, and no Chinese text leaks into the public flow.
4. Watch the first real payment sessions.
5. Then build a small propagation plan around shareable blessings, not product ads.

## Current Launch Status

As of 2026-06-15:

- Wallet payment path has been tested repeatedly and works.
- QR payment path has been tested repeatedly and works.
- Underpayment test passed: choosing a 15 USDC offering and paying only 5 USDC did not release a blessing.
- English-only public blessing flow has been enforced.
- Order Recovery Layer has been added: if a user refreshes or closes the page during payment verification, the browser should resume listening for the pending payment.
- The current instruction is stability first. Do not add features before launch unless absolutely necessary.

Known launch caveat:

- The Order Recovery Layer protects against frontend refresh/close, but current payment intents still live in server memory. A server restart can still lose in-memory pending intents. Do not refactor this before launch unless it becomes a blocker.

## Current Promotion Notes

Promotion is deferred until after launch stability is confirmed.

Target people:

- Polymarket users
- crypto traders
- meme coin traders
- futures/contract users
- gambling-adjacent risk takers
- people waiting on outcomes, dealing with loss, regret, uncertainty, shame, or risk

Positioning:

```text
A ritual for people who take risk.
Not a prediction.
Not financial advice.
Not a trading tool.
A blessing after uncertainty.
```

Promotion principle:

- Do not spam.
- Do not mass-post.
- Do not sound like a SaaS ad.
- Share blessings and emotional recognition first.
- Let the product link sit quietly behind the words.

Reddit status:

- The first suggested Reddit links, including `r/Polymarket` and `r/CryptoCurrency`, may show "You've been blocked by network security" unless logged in or using an accepted network/session.
- Do not rely on Reddit as the first launch channel until access is confirmed.
- If using Reddit later, prefer official megathreads or story-style posts, not direct advertisement.

Potential first promotion paths after launch:

1. Polymarket market comments/profile, if account access works.
2. X/Twitter short blessing posts for traders and risk takers.
3. Crypto/meme coin Telegram or Discord groups only after observing group rules.
4. Reddit only if access is restored and rules allow posting.

## Distribution Engine Alpha+

The repository now includes an isolated semi-automatic discovery system:

```text
http://127.0.0.1:4188/distribution
```

Files:

```text
distribution-engine.mjs
public/distribution.html
public/distribution.css
public/distribution.js
docs/DISTRIBUTION_ENGINE_ALPHA.md
scripts/test-distribution-engine.mjs
```

The engine:

- imports or searches public X/Reddit posts
- scores uncertainty, emotional intensity, directness, and personal stakes
- keeps 70+ targets in the default review queue
- generates a constitutional blessing reply
- requires human approval
- does not automatically send messages

Production requirements:

```text
DISTRIBUTION_ADMIN_TOKEN
DISTRIBUTION_DATA_DIR=/data/distribution
```

Attach a Railway Volume at `/data` before relying on the engine database across redeploys.

X search requires `X_BEARER_TOKEN`.

Reddit search should use `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, and `REDDIT_USER_AGENT`.

## Distribution Engine Beta Verification

Beta verification is now the active distribution priority.

Implemented:

- searches run one keyword at a time
- every search run records raw, duplicate, created, qualified, pending,
  approved, and rejected counts
- search targets carry a source run ID
- `GET /api/distribution/analytics` returns per-run and per-keyword audit data
- the default keyword set now focuses on crypto, trading, prediction markets,
  poker, and high-risk decisions

Documents:

```text
docs/DISTRIBUTION_ENGINE_BETA_TEST.md
docs/RISK_COMMUNITY_KEYWORDS_V1.md
```

Verification boundary as of 2026-06-18:

- unit and mocked connector tests pass
- X live search is blocked because `X_BEARER_TOKEN` is not configured
- Reddit live search is blocked because OAuth is not configured and the public
  fallback cannot currently reach Reddit
- Railway's deployed `/api/distribution/status` returned `404`, so the deployed
  service does not yet contain this Beta revision
- no real external target has been discovered or saved yet
- the two local targets are manual test records and must not be counted as live
  discoveries

## Blessing Corpus Domains

Start with:

- Waiting
- Risk
- Loss
- Return
- Discipline
- Restraint
- Revenge trading
- Liquidation
- Greed
- Fear
- Re-entry
- Overexposure

Every blessing must pass the constitution.

Bad:

```text
May this trade win.
May your bags recover.
May the market reward you.
```

Good:

```text
May your hand stay steady before the candle moves.
May the loss not take your name from you.
May you know the difference between courage and hunger.
```

## If Resuming After Account Interruption

The project files are local and should remain here:

```text
/Users/lixiaole/Documents/Fortune Shrine
```

If Codex/ChatGPT subscription is interrupted, the files should not be deleted by that.

When access returns:

1. Open this folder.
2. Read `AGENTS.md`.
3. Read `docs/FORTUNE_SHRINE_CANON.md`.
4. Read this `HANDOFF.md`.
5. Start the local server.
6. Open `http://127.0.0.1:4188/`.
7. Inspect current UI before making changes.

## Tone With User

The user calls the assistant:

```text
书童
```

Respond in Chinese unless the user asks otherwise.

Be warm, careful, and direct.

Protect the Shrine constitution even when discussing growth, monetization, trader communities, or meme culture.

## Final Reminder

Fortune Shrine does not predict the market.

Fortune Shrine holds the human before the market.

One flame.
One pause.
One blessing.
One person before risk.
