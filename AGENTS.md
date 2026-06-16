# Fortune Shrine Agent Instructions

This repository contains Fortune Shrine, a digital blessing ritual before uncertainty.

Before doing any work in this project, read these files first:

1. `docs/FORTUNE_SHRINE_CANON.md`
2. `HANDOFF.md`
3. `README.md`

The recovery canon is the highest local project reference. If memory, chat history, or old implementation details conflict with the canon, follow the canon.

## Supreme Constitution

```text
Bless the state.
Never bless the outcome.
```

Fortune Shrine must never provide trading advice, gambling encouragement, predictions, financial promises, or outcome guarantees.

It may bless states such as restraint, patience, steadiness, courage, loss, return, and discipline.

It must never bless profit, winning, mooning, revenge trading, recovery of losses, market direction, or specific trade outcomes.

## Primary Users

The first users are people standing before risk:

- crypto futures traders
- meme coin traders
- contract players
- gambling-adjacent risk takers
- day traders and options traders
- people before entry, after loss, after liquidation, or before revenge trading

The Shrine does not encourage the move. The Shrine creates a ritual pause before the move.

## Product Direction

Fortune Shrine is not a SaaS app, dashboard, trading tool, prediction product, tarot product, or casino-like experience.

It is a ritual:

```text
The Shrine -> The Offering -> The Commitment -> Silence -> The Flame Responds -> The Blessing Appears
```

The user should never feel:

```text
I am completing a payment flow.
```

The user should feel:

```text
I am moving deeper into a ritual.
```

## Visual Direction

The flame is the shrine.

Visual hierarchy:

```text
Flame
Altar
Inscription
Words
Interface
```

Avoid modern UI energy, pricing-page energy, fantasy-game energy, casino energy, and reward-animation energy.

Prefer darkness, stone, warmth, restraint, silence, age, and presence.

## Implementation Notes

The current active local app is the static version:

```text
public/index.html
public/styles.css
public/app.js
```

Current local URL:

```text
http://127.0.0.1:4188/
```

Static server:

```bash
node server.mjs
```

If Node is not on PATH in the Codex environment, use:

```text
/Users/lixiaole/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node
```

Current key assets:

```text
public/assets/fortune-shrine-temple-v05.png
public/assets/light-the-flame-text-mask.svg
```

Do not delete or replace these without explicit user instruction.

## Collaboration Notes

The user calls the assistant "书童".

Use warm, careful Chinese when discussing product direction with the user.

When editing code, preserve existing work and do not revert unrelated changes.

When making frontend changes, verify the local page when possible.

When in doubt, ask:

```text
Does this feel like software?
Or does this feel like ritual?
```

If it feels like software, refine.
If it feels like ritual, move forward.
