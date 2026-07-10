# Fortune Shrine Handoff

Last updated: 2026-06-24

This file is for a future Codex session or collaborator who has no memory of the previous conversation.

Read this first, then read:

- `docs/FORTUNE_SHRINE_CANON.md`
- `docs/TRUST_PAYMENT_OUTPUT_CANON_V2.md`
- `docs/ENGINEERING_CHARTER_V1.md`
- `docs/DISTRIBUTION_PLAN_1.md`
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

## Planned Growth Layer

`docs/DISTRIBUTION_PLAN_1.md` records the next planned growth experiment.

Do not execute it yet.

It should begin only after:

- the current Telegram Discovery engine passes three evening Run HUD tests
- the current version is frozen
- the user explicitly asks to start Distribution Plan 1

Distribution Plan 1 is a manual outreach tracker for distribution nodes. It must not auto-DM, bulk contact, auto-join groups, or modify the Discovery Engine.

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

## Trust, Payment, and Output Canon

The current permanent reference for website trust language, offering tiers, wallet/payment wording, and Blessing Card output direction is:

```text
docs/TRUST_PAYMENT_OUTPUT_CANON_V2.md
```

Important: this is a canon, not an automatic implementation request.

Do not change payment logic, payment architecture, or output generation unless the user explicitly asks to execute it.

Recommended future sequence:

1. Trust + Payment wording layer first.
2. Minimal shareable Blessing Card second.
3. NFT / SBT ritual record only in a later version, if ever.

Highest-value next work:

1. Launch the current working shrine.
2. Re-test wallet payment once and QR payment once after deployment.
3. Confirm payment succeeds, blessing appears, and no Chinese text leaks into the public flow.
4. Watch the first real payment sessions.
5. Then build a small propagation plan around shareable blessings, not product ads.

## First Flame Invitation Operating Mode

Long-term early-user operating mode approved on 2026-07-10:

```text
First Flame Invitation
```

This is a manual invitation path for early users, testers, and real community feedback.

It is not a public free trial.
It is not a discount system.
It is not a hidden Offering tier.
It must not replace or weaken the four official Offering levels.

Human workflow:

1. A person replies, comments, or DMs on X / Telegram / Discord.
2. The founder manually sends a one-time invitation code or invitation link.
3. The invitee enters the Shrine and receives one free Blessing Card experience.
4. The invitation is recorded manually at first, using a simple list such as:

```text
SHRINE-7KQ2-LIGHT -> @username -> sent
EMBER-4X9M-STILL -> @username -> sent
FLAME-Q8R2-HOLLOW -> @username -> sent
```

Product language:

- call it `First Flame Invitation`
- optionally call the free experience `Guest Blessing`
- do not call it `free trial`
- do not put loud free language on the public homepage

Operating constraints:

- each invitation should be one-use or tightly limited
- invitation unlocks one Blessing Card experience
- no prediction, signal, trading advice, or financial promise
- no change to payment logic unless explicitly requested
- no Run HUD / Queue / Discovery change unless explicitly requested

Current implementation note:

- `server.mjs` accepts `POST /api/invitations/claim`
- accepted codes must be configured through `FIRST_FLAME_INVITATION_CODES`
- there are no default numeric invitation codes
- invitation codes should be random and hard to guess
- if `FIRST_FLAME_INVITATION_CODES` is unset, no invitation code works
- each code is one-use per running server process
- the browser also remembers used invitation codes locally
- invitation events are marked as `INVITATION`, not USDC payment
- the public page accepts either manual code entry or `?invite=SHRINE-7KQ2-LIGHT`

Positioning:

```text
Paid Offering = formal ritual
Invitation = invited first flame
```

This mode is useful for early growth because it lowers the first-use barrier,
creates real feedback, and encourages shareable Blessing Cards while preserving
the Shrine's ritual atmosphere.

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

## Shrine Search Delivery Contract

The activation phrase is:

```text
Run Shrine Search!
```

Every completed run must do all of the following:

1. Search and verify the current candidates.
2. Generate three context-aware reply drafts per candidate.
3. Replace the active sender queue at:

```text
scripts/distribution/v07/data/queue.json
```

4. Verify the live local endpoint:

```text
http://127.0.0.1:4191/queue.json
```

5. Confirm that the returned count and usernames match the new run.
6. Tell the operator to refresh:

```text
http://127.0.0.1:4191/
```

Do not claim that Shrine Search is complete when candidates were only printed in
chat. The queue page is the required deliverable.

### Freshness hard limit

- 0–15 minutes: S
- 15–30 minutes: A
- 30–60 minutes: B
- 60–120 minutes: C
- More than 120 minutes: excluded from the active sending queue
- Older posts may be retained only as research material.
- Never use stale posts to fill a candidate quota.
- If no qualified fresh candidates are available, publish an empty queue.

## Shrine Watch V1.0

The active community-intelligence protocol is recorded at:

```text
docs/SHRINE_WATCH_V1.md
```

Priority observation communities:

- S: Hyperliquid Discord
- A: GMX Telegram
- A: Gains Network / gTrade Telegram
- A: Bitget English Telegram, high observed human activity but noisy
- B: Bybit English, under evaluation
- B: Binance English, pending membership approval

The Shrine observes human uncertainty, not market direction.
No autonomous posting, private-message collection, identity deception, or
permission bypass is allowed.

## Telegram Discovery Engine V1 Lite

Status as of 2026-06-23:

```text
Locally runnable and validated with a real Telegram login.
```

### Run HUD activation contract

The activation phrase is:

```text
Run HUD
```

HUD means:

```text
Human Uncertainty Detector
人类不确定性检测器
```

Unless the operator explicitly requests development, `Run HUD` means:

1. Run the existing Telegram Discovery V1 Lite engine.
2. Observe only the four current allowlisted communities:
   - GMX
   - Gains Network / gTrade
   - Bitget English
   - Bybit English
3. Use the current detector, keywords, scoring rules, and threshold unchanged.
4. Classify Prayer, Waiting, Anxiety, Uncertainty, Hope, and Regret / Loss.
5. Report:
   - raw matches
   - qualified matches
   - category counts
   - Top Highest Score
   - Top Prayer
   - Top Waiting / Uncertainty
   - the path to `latest.json`

`Run HUD` is an operations command, not authorization to:

- modify code
- add platforms
- add communities
- add keywords
- change scoring
- change reply language
- send or reply automatically

If a category has no results, report zero. Never fill a list with historical or
lower-quality records merely to reach a quota.

As of 2026-06-24, `Run HUD` is an atomic pipeline. A cycle is successful only
when the same run has produced:

```text
latest.json
reply_queue.json
reply_queue_v2.json
reply_queue_v2.md
```

The command output must include effective results, generated queue count,
`reply_queue.json` update time, and a Top1 preview. A zero queue, missing queue,
or stale queue source is `Pipeline Failed` and must exit nonzero.

Evidence persistence is P0. Telegram message links must be read from real DOM
`href` values and passed through `latest.json`, `results.json`,
`reply_queue.json`, and `reply_queue_v2.json`. Never guess a link from message
or peer identifiers. If no Top10 candidate has a real original URL, the HUD
cycle is `Pipeline Failed`.

Architecture relationship:

```text
Run Shrine Search = the future cross-platform Shrine discovery system
Run HUD = its Telegram Human Uncertainty Detector module
```

The recovery reference is:

```text
Telegram-Discovery-V1-Canon.md
```

### Purpose

The engine does not search for market opinions. It searches for people who are
waiting for an answer, anxious, uncertain, hopeful, or explicitly asking for
luck or prayer.

It is a local, read-only review tool:

```text
Telegram Web
-> standalone Playwright
-> four-group allowlist
-> keyword retrieval
-> Human Uncertainty Detector
-> constitutional reply suggestion
-> local JSON
-> human review and manual sending
```

It never sends, replies, reacts, joins a group, or operates the Telegram account
beyond read-only search.

### Active Telegram scope

Only these four groups are in V1 Lite:

- GMX
- Gains Network / gTrade
- Bitget English
- Bybit English

Do not add Discord, X, Reddit, Farcaster, new Telegram groups, or new platforms
while V1 Lite validation is active.

### Files

```text
scripts/telegram-discovery/config.mjs
scripts/telegram-discovery/collector.mjs
scripts/telegram-discovery/signal-engine.mjs
scripts/telegram-discovery/lib.mjs
scripts/telegram-discovery/run.mjs
scripts/telegram-discovery/run.sh
scripts/telegram-discovery/test.mjs
scripts/telegram-discovery/README.md
```

### Install and login

```bash
cd "/Users/lixiaole/Documents/Fortune Shrine"
npm install
npx playwright install chromium
scripts/telegram-discovery/run.sh --login-only
```

Complete Telegram login manually in the dedicated Chromium window. The
persistent session is stored locally at:

```text
scripts/telegram-discovery/state/browser-profile/
```

This directory contains sensitive account session data. It is ignored by Git
and must never be copied, committed, or shared.

### Run

One cycle:

```bash
scripts/telegram-discovery/run.sh --once --headless
```

Continuous ten-minute loop:

```bash
scripts/telegram-discovery/run.sh --watch --headless
```

Stop the loop with `Ctrl+C`.

### Output

```text
scripts/telegram-discovery/output/latest.json
scripts/telegram-discovery/output/results.json
scripts/telegram-discovery/output/run-<timestamp>.json
```

- `latest.json`: latest completed cycle
- `results.json`: deduplicated local archive
- `run-<timestamp>.json`: immutable record of one cycle

The output and browser profile directories are intentionally ignored by Git.

### Verified behavior

The following have been validated against the real Telegram account:

- standalone Chromium launches
- Telegram login persists
- the four-group allowlist works
- Telegram search results can be read
- group, author, message, time, and message ID can be extracted
- Human Uncertainty Detector scores real messages
- constitutional reply suggestions are generated
- JSON files are written
- the ten-minute loop runs without overlapping cycles
- the system runs without Codex Browser

Latest reference run on 2026-06-23:

```text
Raw matches: 225
Qualified at score >= 0.70: 124
Prayer: 34
Hope without explicit prayer: 79
Direct waiting: 5
Direct anxiety: 4
Strong personal-risk matches: 0
```

The category counts are detector labels and may overlap except that the
reported Hope count excludes explicit Prayer.

### Current findings

- Bitget English had the highest observed uncertainty density.
- Bybit English produced fewer but still valid waiting and wish-for-luck cases.
- GMX and Gains Network produced no qualified result in the latest search run;
  this is not proof that the communities have no uncertainty signals.
- Explicit `pray for me` and `wish me luck` are the clearest Shrine-fit states.
- Personal waiting for rewards, results, approval, or another consequential
  answer is also a strong signal.
- Ordinary social hope, market narration, educational analysis, and generic
  coordination must remain below the review threshold.

### Known issues

1. `watchStartHour`, `watchEndHour`, and `watchTimeZone` exist in configuration,
   but `run.mjs` does not enforce the 21:00–01:00 window. `--watch` currently
   runs all day until manually stopped.
2. Telegram search returns historical results as well as recent messages.
   Telegram display timestamps such as `Mon`, `Jun 19`, and `01:49` are not yet
   normalized to absolute timestamps.
3. There is no freshness filter. Old high-scoring messages can appear beside
   current ones.
4. Telegram Web DOM changes can break selectors in `collector.mjs`.
5. Search collection is bounded by the visible Telegram search results and the
   configured per-keyword limit. It is not a complete export.
6. Login expiration requires rerunning `--login-only`.
7. The engine creates suggestions only. Every reply remains a human decision
   and must be sent manually in Telegram.

### Current tests

```bash
node --test scripts/telegram-discovery/test.mjs
```

As of 2026-06-23:

```text
16 tests passing
```

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

## Telegram Discovery V1 Freeze — 2026-06-27

Telegram Discovery V1 is now frozen for stable operation.

Frozen modules:

- Operation Queue page
- Queue Builder Top10 rules
- Discovery / Detector
- Writer v2
- API
- Operator Queue format

Operational priority is locked:

```text
Waiting -> Trading -> Risk -> Anxiety -> Other
```

Other categories must not outrank these states in the operator queue.

Macro/news/announcement search is removed from V1 operations. The system should
not search broad macro-news keywords such as generic announcements, generic
trade, win, lose, or market crash. If such content appears upstream, it must not
be allowed to outrank real people in waiting, trading exposure, risk, or anxiety.

Do not change the frozen modules unless a real production bug appears.

Reply language reference added after the freeze:

```text
docs/REPLY_LANGUAGE_SEMANTIC_PACK_V1.md
docs/RESPONSE_PRIORITY_ROUTER_V1.md
```

`REPLY_LANGUAGE_SEMANTIC_PACK_V1.md` is a language-generation reference.

`RESPONSE_PRIORITY_ROUTER_V1.md` is active. All reply drafts must pass through
it before wording selection. If a candidate is Waiting, Trading, Risk, Loss, or
Anxiety, Reality Flow Mode overrides Hope, Prayer, generic empathy, and
blessing-style templates.

## Telegram Discovery Operational Correction — 2026-06-29

Read this diagnostic before resuming Telegram Discovery work:

```text
docs/TELEGRAM_DISCOVERY_DIAGNOSTIC_2026-06-29.md
```

The 2026-06-27 freeze should be treated as a freeze of the stable downstream
operation layers, not as proof that the Telegram Collector layer is fully stable.

Stable / do not casually change:

- Human State Detector
- Freshness Gate
- Queue Builder V2
- Reply Queue V2 output
- Empty queue refresh behavior
- Human review status
- Reply draft system
- Operation Queue format
- UI / API shape

Known unstable / observational:

- Telegram Web Recent Chat Collector

Current recommendation:

```text
Run V1 through Telegram Search Collector + Freshness Gate + Queue.
Do not rely on Recent Chat Collector as the primary production source yet.
Do not keep patching Telegram Web DOM unless a specific production bug blocks operation.
```

Important 2026-06-29 fixes already applied:

- Empty runs now write an empty `reply_queue_v2.json` instead of preserving a
  previous queue.
- Playwright Telegram context uses `Asia/Shanghai` timezone so Telegram time
  labels and Freshness Gate use the same clock.
- Queue V2 threshold is aligned to `0.70`.
- `Risk` and `Loss` are first-class V2 queue categories.
- Telegram messages deduplicate across keywords by `peerId + messageId`.
- Recent Collector now records proof fields when it cannot read message DOM.

Next session should not begin by adding features.

Recommended next action:

1. Run HUD once.
2. Inspect queue quality.
3. If queue exists and is fresh, operate manually.
4. If queue is empty, use the diagnostic checklist instead of guessing that
   no users exist.
5. If repeated Search Collector runs produce acceptable queues, freeze V1 for
   operation and move growth work to Distribution Plan 1 later.
