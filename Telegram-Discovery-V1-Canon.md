# Telegram Discovery V1 Canon

Version: 2026-06-24
Status: V1 Lite validated locally

This document is the recovery canon for Fortune Shrine Telegram Discovery V1
Lite. If later memory or chat history conflicts with this document, verify the
current code and then update this canon deliberately.

## Governing Principle

```text
Do not discover people talking about markets.
Discover people waiting for fate to answer.
```

The engine serves the person before uncertainty, not the market around them.

Fortune Shrine remains governed by:

```text
Bless the state.
Never bless the outcome.
```

The engine must never predict, promise, advise, encourage a risky action, or
automatically send a reply.

## Run HUD Protocol

The official activation phrase is:

```text
Run HUD
```

HUD means:

```text
Human Uncertainty Detector
人类不确定性检测器
```

The command means:

```text
Run the existing engine.
Observe the real world.
Report what it found.
```

It does not mean:

```text
Develop the engine.
Change the detector.
Expand the search.
```

### Default execution

`Run HUD` runs Telegram Discovery V1 Lite against:

- GMX
- Gains Network / gTrade
- Bitget English
- Bybit English

It uses the current implementation without modification and reports:

- raw match count
- qualified count at the current threshold
- Prayer count
- Waiting count
- Anxiety count
- Uncertainty count
- Hope count
- Regret / Loss count
- Top Highest Score
- Top Prayer
- Top Waiting / Uncertainty
- the current `latest.json` path

### Queue Auto Generation Canon

Every successful `Run HUD` cycle is one atomic operational pipeline:

```text
Discovery
-> latest.json
-> reply_queue.json
-> Reply Queue V2.1 Top10
-> operator-visible queue
```

HUD must not report success unless all stages complete from the same run.

Forbidden states:

- HUD succeeds but the reply queue is not generated
- `latest.json` is newer than `reply_queue.json`
- the UI data source points to an older HUD run
- the generated queue or Top10 is empty

Any forbidden state is:

```text
Pipeline Failed
```

Every successful cycle must report:

- effective result count
- generated queue count
- candidates with DOM-derived message URLs
- Top10 candidates with usable original URLs
- `reply_queue.json` update time
- Top1 score, category, group, and message preview

Original message URLs are evidence. They must come from a real DOM `href` in
the Telegram search result. The engine must never construct or guess a message
URL from `messageId`, `peerId`, group name, or any inferred username.

If the Top10 contains no DOM-derived original URL, the cycle is:

```text
Pipeline Failed
```

### Default prohibitions

Unless separately and explicitly authorized, `Run HUD` must not:

- modify code
- add a platform
- add a community
- add a keyword
- alter scoring
- alter reply suggestions
- send a Telegram message
- react, join, post, or operate the account

Empty categories must be reported as zero. Results must not be padded from
older runs.

### System relationship

```text
Run Shrine Search
  = the future full cross-platform Shrine discovery system

Run HUD
  = the Telegram Human Uncertainty Detector
  = one core module inside Shrine Search
```

The purpose of HUD is not keyword detection. Its purpose is to recognize a
person who is waiting, anxious, praying, hesitant, hopeful, carrying regret or
loss, or bearing personal risk before an unknown answer.

## V1 Boundary

V1 Lite is Telegram only.

Active communities:

- GMX
- Gains Network / gTrade
- Bitget English
- Bybit English

Excluded from V1 Lite:

- Discord
- X / Twitter
- Reddit
- Farcaster
- additional Telegram communities
- automatic sending
- automatic account actions
- production deployment

Hyperliquid remains an S-tier community in the wider research model, but it is
Discord and therefore outside V1 Lite.

## Current Architecture

```text
Dedicated Chromium profile
        |
Standalone Playwright
        |
Telegram Web search
        |
Four-community allowlist
        |
Raw message extraction
        |
Human Uncertainty Detector
        |
Score >= 0.70
        |
Curated Fortune Shrine reply suggestion
        |
Local JSON review files
        |
Human decides whether to send manually
```

The runtime does not use Codex Browser.

## Project Files

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

Responsibilities:

- `config.mjs`: keywords, group allowlist, aliases, thresholds, paths
- `collector.mjs`: login, Telegram search, read-only extraction
- `signal-engine.mjs`: Human Uncertainty Detector and reply selection
- `lib.mjs`: normalization, deduplication, atomic JSON writes
- `run.mjs`: one-shot and ten-minute loop orchestration
- `run.sh`: portable local Node launcher
- `test.mjs`: detector and data-behavior tests

## Recovery and Operation

Install:

```bash
cd "/Users/lixiaole/Documents/Fortune Shrine"
npm install
npx playwright install chromium
```

First login or login recovery:

```bash
scripts/telegram-discovery/run.sh --login-only
```

Complete login manually in Chromium.

Persistent profile:

```text
scripts/telegram-discovery/state/browser-profile/
```

The profile is sensitive, local-only, and ignored by Git.

Run once:

```bash
scripts/telegram-discovery/run.sh --once --headless
```

Run continuously every ten minutes:

```bash
scripts/telegram-discovery/run.sh --watch --headless
```

Stop:

```text
Ctrl+C
```

Current output:

```text
scripts/telegram-discovery/output/latest.json
scripts/telegram-discovery/output/results.json
scripts/telegram-discovery/output/run-<timestamp>.json
```

## Human Uncertainty Detector

The detector is deterministic. It does not call an AI model.

It asks:

```text
Is this sentence about an external topic?
Or is a person revealing that they are waiting, afraid, hopeful, exposed,
uncertain, regretful, or asking to be held before an unknown result?
```

### Signal families

#### Prayer

Examples:

- `wish me luck`
- `pray for me`

This is the clearest direct request for symbolic support.

#### Waiting

Examples:

- `waiting for results`
- `waiting for approval`
- `still waiting`
- `we keep waiting`

Waiting becomes stronger when the awaited object is consequential: a result,
reward, decision, approval, or outcome.

#### Anxiety

Examples:

- `I am nervous today`
- `I'm anxious about the result`
- `I am worried this will not work`

The emotion must belong to the speaker. Statements such as `the market feels
nervous` are market narration, not personal anxiety.

#### Uncertainty

Examples:

- `I'm not sure`
- `I feel uncertain`
- `I don't know what will happen`

First-person ownership matters.

#### Hope

Examples:

- `hope it works`
- `fingers crossed`
- `hopefully`

Hope without clear personal stakes remains a medium signal, not a top signal.

#### Regret and Loss

Target states include:

- personal regret
- missed opportunity
- liquidation
- loss that is emotionally owned by the speaker

This family is part of the next validation focus. It must not be confused with
generic discussion of losses or liquidation statistics.

## Current Scoring Rules

### 0.90–0.98: high-value state

- explicit `wish me luck`
- explicit `pray for me`
- first-person `all in`
- waiting for a meaningful result
- personal liquidation
- direct personal anxiety combined with waiting, hope, or clear exposure

Examples:

```text
Wish me luck.
Pray for me.
I am all in.
Waiting for results.
```

### 0.70–0.89: meaningful uncertainty

- direct personal nervousness, anxiety, worry, or uncertainty
- direct personal waiting without a named major result
- hope or fingers crossed without explicit prayer

Examples:

```text
I am nervous today.
I am still waiting.
Hope it works.
Fingers crossed.
```

### Below 0.50: context, not a target state

- ordinary social greetings
- ordinary coordination
- market narration
- news commentary
- educational or analytical language
- price analysis
- generic `long`, `short`, `trade`, `win`, or `lose`

Examples:

```text
Hope you slept well.
Waiting for you.
The market feels nervous.
Risk management is important in uncertain markets.
```

### Context penalties and caps

- social hope is capped below review level
- waiting for another person in ordinary conversation is capped below review
- market narration is capped below review
- educational/analytical uncertainty is capped below review
- announcement language receives a penalty
- phrase matching uses word boundaries so `win` does not match `window`

The review threshold is:

```text
score >= 0.70
```

## Reply Rule

Replies are deterministic selections from a small curated corpus.

They may bless:

- patience
- courage
- restraint
- steadiness
- the person during waiting

They must never bless:

- winning
- profit
- market direction
- recovery of money
- success of a trade
- a guaranteed outcome

Example:

```text
May patience remain beside you while the answer is still forming.
```

The engine never sends this text. It is only a suggestion for human review.

## Real Validated Samples

```json
{
  "group": "Bybit English",
  "message": "When are waiting for Season 2 rewards? Today is 7th working day",
  "score": 0.94,
  "reason": "waiting for a meaningful result",
  "reply": "May patience remain beside you while the answer is still forming."
}
```

```json
{
  "group": "Bitget English",
  "message": "Plz help and pray for me 🙏",
  "score": 0.90,
  "reason": "explicit request for luck or prayer + first-person personal stakes"
}
```

```json
{
  "group": "Bybit English",
  "message": "Have my board exam tomorrow,wish me luck 🤞,any students who trade crypto 😄",
  "score": 0.90,
  "reason": "explicit request for luck or prayer + first-person personal stakes"
}
```

```json
{
  "group": "Bitget English",
  "message": "I am kind of nervous today",
  "score": 0.86,
  "reason": "direct personal anxiety or uncertainty + first-person personal stakes"
}
```

## June 23, 2026 Validation Statistics

Latest reference cycle:

```text
Raw matches: 225
Qualified at score >= 0.70: 124
Prayer: 34
Hope without explicit Prayer: 79
Direct Waiting: 5
Direct Anxiety: 4
Strong personal-risk matches: 0
```

Community distribution:

```text
Bitget English:
  Qualified: 103
  Score 0.90+: 32
  Prayer: 32
  Hope: 62
  Waiting: 4
  Anxiety: 4

Bybit English:
  Qualified: 21
  Score 0.90+: 3
  Prayer: 2
  Hope: 17
  Waiting: 1
  Anxiety: 0

GMX:
  Qualified in this cycle: 0

Gains Network:
  Qualified in this cycle: 0
```

These figures describe one search cycle, not daily rates. Search results include
historical messages, so they must not be interpreted as four-hour or daily
unique-user estimates.

## Validated Conclusions

1. The engine can run independently of Codex.
2. Telegram login persistence works.
3. The four-community allowlist works.
4. Real Telegram messages flow through extraction, scoring, reply suggestion,
   and JSON output.
5. Direct prayer is currently the strongest and most common high-value signal.
6. Personal waiting for an answer is highly aligned with Fortune Shrine.
7. Personal anxiety is valuable only when the emotion belongs to the speaker.
8. Market narration is not human uncertainty.
9. Bitget English had the highest observed signal volume in the reference run.
10. The deepest product user is not merely a trader. It is a person waiting for
    fate to answer.

## Known Limitations

1. The configured 21:00–01:00 watch window is not enforced by `run.mjs`.
2. Telegram search returns historical messages.
3. Display timestamps are not converted to absolute dates.
4. No freshness filter exists.
5. Results are search samples, not a complete message export.
6. Telegram DOM changes can require selector maintenance.
7. The persistent profile may expire and require manual login.
8. Four-hour category-rate validation has not yet been completed.
9. Regret/Loss needs further real-sample validation.
10. Human review remains mandatory before any reply.

## Next Approved Work

### P1

Deepen Human Uncertainty Detector around:

- Prayer
- Waiting
- Anxiety
- Uncertainty
- Hope
- Regret / Loss

The goal is emotional-state recognition, not keyword expansion.

### P2

Run a controlled four-hour observation and report:

- raw matches
- qualified matches
- Prayer
- Waiting
- Anxiety
- Uncertainty
- Hope
- Regret
- category proportions

Do not use historical search results as if they were new events. Freshness must
be handled explicitly before claiming a real-world hourly or daily rate.

### P3

Build the user profile from high-value emotional states:

- waiting for exam results
- waiting for rewards or airdrops
- waiting for a trade outcome
- waiting for an interview
- waiting for approval
- waiting for any consequential answer

The user profile is psychological, not occupational.

## Final Reminder

```text
The Shrine does not serve the market.
The Shrine serves the person standing before uncertainty.
```
# Run HUD Standard Output — Frozen

Run HUD is an operations workspace, not an engineering log.

Every successful run must print these sections in this exact order:

```text
========== RUN HUD ==========

Fresh Candidates
Seen Again
Reply Queue
Top10

========== TOP10 ==========

#1 through #10, each containing:
Score
Community
Category
Post
Reason
Blessing
Original Post Link

========== BLESSING QUEUE ==========

1 through 10 in actual operating order, each containing:
Community
Blessing
Original Post

========== HUMAN REVIEW ==========
No Auto Send
```

Do not replace real queue content with status summaries such as “complete” or
“already output.” Do not add engineering paths, debug state, internal timing,
or implementation details.

This format is frozen. It may only change after an explicit user request.

## Operation Queue Freeze — 2026-06-27

This section supersedes earlier terminal-output preferences.

The primary production output of Telegram Discovery V1 is the local Operation
Queue page:

```text
http://127.0.0.1:4196/
```

The page must render from:

```text
reply_queue_v2.json -> /api/reply-queue -> UI
```

The page must remain a human operator queue:

- user card
- original post
- three reply drafts
- copy reply
- open original post
- view profile
- mark as manually sent
- no auto-send
- no batch-open
- no background account operation

Frozen modules:

- Operation Queue page
- Queue Builder Top10 rules
- Discovery / Detector
- Writer v2
- API
- Operator Queue format

Final Top10 priority:

```text
Waiting -> Trading -> Risk -> Anxiety -> Other
```

Other categories must not outrank these states.

Macro/news/announcement discovery is not a V1 target. Do not search broad macro
or generic terms such as:

- announcement
- trade
- win
- lose
- market crash

After this freeze, do not modify these modules unless a real production bug is
observed during operation.
