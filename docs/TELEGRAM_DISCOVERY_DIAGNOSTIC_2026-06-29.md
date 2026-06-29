# Telegram Discovery Diagnostic — 2026-06-29

## Purpose

This note records the operational diagnosis from the 2026-06-29 night session.

The goal is to prevent future sessions from re-debugging the same symptoms or
mistaking an empty operator queue for proof that no target users exist.

## Core Finding

The market is not empty.

Large Telegram groups continue to produce new messages, but the current V1
collector stack depends on Telegram Web, which is not a stable production data
source.

The primary instability is at the Telegram Collector layer, not the Shrine
Detector, Ranking, Queue, Reply, Blessing, or UI layers.

## Confirmed Stable / Mostly Stable Layers

- Human State Detector
- Freshness Gate
- Queue Builder V2
- Reply Queue V2 output
- Empty queue refresh behavior
- Cross-keyword Telegram message deduplication by `peerId + messageId`
- Human review / no auto-send rule
- Reply draft generation and `The Shrine says:` prefixing
- Operation Queue format

These modules should not be changed unless a real production bug appears.

## Confirmed Issues Found Today

### 1. Old Queue Residue

Problem:

When a Run HUD cycle produced zero eligible fresh candidates,
`reply_queue_v2.json` could remain from a previous non-empty run.

Impact:

The UI could show stale operator candidates.

Fix:

An empty run now writes a new empty `reply_queue_v2.json`.

### 2. Telegram Timezone Mismatch

Problem:

Telegram Web displayed message time using the browser timezone, while the
Freshness Gate evaluated timestamps using `Asia/Shanghai`.

Impact:

Fresh messages could be judged stale.

Fix:

The Playwright Telegram context now uses:

```text
timezoneId: Asia/Shanghai
```

### 3. Hidden V2 Queue Threshold

Problem:

The global Detector threshold was `0.70`, but Queue V2 had a hidden operational
threshold of `0.75`.

Impact:

Valid fresh candidates around `0.70–0.74` passed Detector but were excluded from
the operator queue.

Fix:

Queue V2 now uses the V1 operational threshold:

```text
0.70
```

### 4. Risk / Loss Were Not First-Class V2 Categories

Problem:

V2 queue category balancing only allowed:

```text
Prayer / Waiting / Hope / Anxiety / Uncertainty
```

Impact:

Trading risk and loss candidates were excluded or misrepresented, conflicting
with the operational priority:

```text
Waiting -> Trading -> Risk -> Anxiety
```

Fix:

V2 now includes:

```text
Risk / Loss
```

### 5. Recent Chat Collector Is Not Yet Production-Stable

Problem:

Recent Chat Collector can open Telegram Web group views but may land in a
non-message area such as `UPDATE`, or may fail to extract visible message DOM.

Impact:

Recent Chat Collector cannot yet be treated as a reliable production source.

Current status:

It now records collector proof:

- group
- status
- result count
- open method
- selector counts
- body preview
- error reason

But it should remain observational until it passes repeated production runs.

## Current Recommended V1 Runtime Boundary

For near-term stable operation, use:

```text
Telegram Search Collector
Freshness Gate
Human State Detector
Queue Builder V2
Human Operator Queue
```

Do not rely on Recent Chat Collector as the primary production input yet.

Recent Chat Collector may stay in the run as an observed source, but its failure
should not be interpreted as a failure of the whole Shrine engine.

## Recommended Next Test Plan

On the next session:

1. Run HUD once.
2. Confirm `latest.json` and `reply_queue_v2.json` update in the same run.
3. Confirm the operator queue is not stale.
4. Record:
   - Raw Match
   - Detector Passed
   - Fresh Queue Count
   - Reply Queue Count
   - Recent Collector status per group
5. If queue is empty, inspect whether:
   - Search returned only stale results
   - Freshness rejected all results
   - Queue V2 rejected eligible candidates
   - Recent Collector failed to read DOM

Do not change Detector, Ranking, Reply, Blessing, UI, or API during this test.

## Strategic Recommendation

V1 should remain small and stable.

If Telegram becomes the long-term primary acquisition channel, the correct next
infrastructure step is a dedicated Telegram API collector, not endless Telegram
Web DOM patching.

Until then:

```text
Stability > Coverage
Precision > Volume
Fresh real people > full message recall
```

