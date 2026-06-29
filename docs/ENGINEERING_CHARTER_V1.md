# Fortune Shrine Engineering Charter v1

Date: 2026-06-29

This document defines the long-term engineering direction for Shrine v1.

If implementation ideas, old chat context, or future feature requests conflict with this charter, prefer this charter unless the user explicitly overrides it.

## Supreme Product Rule

```text
Bless the state.
Never bless the outcome.
```

Fortune Shrine must remain precise, small, stable, safe, and high-value.

The system exists to find and respond to people standing inside uncertainty, not to become a large automation platform.

## 1. Human State First

Shrine v1 is no longer search-driven.

Search is only a sampling tool.

The true value of the system is:

```text
Post
↓
Human State
↓
Library Selection
↓
Operator Review
↓
Human Reply
```

The core product question is not:

```text
What keyword did this post match?
```

The core product question is:

```text
What human state is this person inside?
```

## 2. Search Is Only an Entry Point

Search should stay small, stable, and precise.

More search terms do not automatically make the system better.

The search layer may collect samples, but it must not define the product.

Shrine v1 should avoid broad keyword expansion unless real operation proves it is necessary.

## 3. Library Is the Core Asset

The real long-term asset is not a large generic blessing list.

The real asset is:

```text
Human State
↓
Blessing / Reply Library
```

Example future structure:

```text
Library/
  Waiting/
  Decision/
  Pressure/
  Risk/
  Loss/
  Fear/
  Hope/
  Loneliness/
  Regret/
  Patience/
  Courage/
  Beginning Again/
  Healing/
  Forgiveness/
  Uncertainty/
  Gratitude/
  Acceptance/
  Transition/
  Responsibility/
  Silence/
  Faith/
```

Each directory may grow independently.

The engine can change in the future without destroying the Library.

## 4. ChatGPT and Codex Responsibilities

Keep creation and operation separate.

ChatGPT:

- creates Library language
- expands Library categories
- maintains language consistency
- deduplicates and curates blessing/reply material

Codex:

- Detection
- Selection
- Ranking
- Top3 reply selection
- Queue generation
- Operational stability

Codex should not casually invent new blessing language during operations.

If Codex writes language, it must be explicitly requested or limited to controlled Reply Layer integration.

## 5. Freeze the Engine, Grow the Library

Do not continuously redesign:

- Search
- Queue
- Detector
- Ranking
- API
- UI
- Navigation

Once stable, the engine should be frozen.

Future growth should happen primarily through Library expansion and curation.

## 6. Operator Queue Is the Product Surface

The first product is not AI.

The first product is:

```text
Operator Queue
```

Every candidate must preserve:

- user
- platform/source
- original content
- Human State or category
- suggested replies
- review status

The queue must never degrade into a raw blessing list, prompt list, or AI output list.

## 7. Human Review Is Mandatory

Shrine v1 must not auto-send.

Allowed:

- discover candidates
- classify Human State
- generate candidate replies
- export/display queue
- let the human operator choose and send

Forbidden by default:

- auto-reply
- auto-DM
- auto-join
- batch sending
- hidden background account actions

## 8. Safety and Stability Are Higher Than Feature Growth

The system must prioritize:

```text
Stability > Change
Safety > Speed
Precision > Scale
Human Review > Automation
Library Growth > Engine Complexity
```

Any feature that creates operational risk should be delayed unless it fixes a real production bug.

## 9. Freshness Matters

Shrine Discovery is only useful when it finds people in a live state.

Old posts should not be used to fill the queue.

When the system cannot find enough fresh candidates, it should return fewer high-quality candidates rather than pad the queue with stale posts.

## 10. Telegram First, Discord Later

Telegram remains the current v1 operating channel.

Hyperliquid / Discord expansion is a later phase.

Do not expand platforms until Telegram has run stably for multiple real operating windows.

## 11. Language Brand Goal

The long-term goal is not only that a user receives a reply.

The long-term goal is that a user thinks:

```text
I got my blessing today.
```

Eventually, Fortune Shrine should become recognizable by language alone.

No logo, link, or explanation should be required for the tone to feel like Shrine.

## 12. Evolution Principle

Any new idea defaults to not entering the system.

Only consider adding it when all conditions are true:

1. It has been validated through real operation.
2. It significantly improves quality, not just feature count.
3. It does not break existing system stability.
4. It cannot be solved by expanding or improving the Library.

If any condition fails:

```text
Expand Library.
Do not modify Engine.
```

This principle exists to prevent Shrine v1 from becoming complex, unstable, or overbuilt.

## Final Architecture Principle

```text
Engine freezes.
Library grows.
Detector selects.
Operator decides.
Human sends.
```

Fortune Shrine v1 should remain a small, stable system that continuously discovers fresh, high-value human states and helps the operator respond with restraint.
