# Fortune Shrine

Fortune Shrine is a V0 prototype for a digital blessing ritual before uncertain moments.

The current implementation is the first working shrine: a Next.js, React, Tailwind CSS single page ritual.

Canonical project documents:

- [Agent Instructions](./AGENTS.md)
- [Handoff For Future Sessions](./HANDOFF.md)
- [Fortune Shrine Recovery Canon](./docs/FORTUNE_SHRINE_CANON.md)
- [Blessing Corpus v1.0](./docs/BLESSING_CORPUS_V1.md)
- [Fortune Shrine Canon](./docs/CANON.md)
- [Master Specification](./docs/MASTER_SPEC.md)
- [Symbol Atlas](./docs/SYMBOL_ATLAS.md)
- [Blessing Engine](./docs/BLESSING_ENGINE.md)
- [Offering System](./docs/OFFERING_SYSTEM.md)
- [MVP Revenue & Offering Specification](./docs/MVP_REVENUE_OFFERING_SPEC.md)
- [Presence And Restraint Laws](./docs/PRESENCE_AND_RESTRAINT_LAWS.md)
- [Blessing Language Framework V2](./docs/BLESSING_LANGUAGE_FRAMEWORK_V2.md)
- [Blessing Taxonomy](./docs/BLESSING_TAXONOMY.md)
- [Blessing Ritual System](./docs/BLESSING_RITUAL_SYSTEM.md)
- [Iteration Strategy](./docs/ITERATION_STRATEGY.md)
- [Security Model](./docs/SECURITY_MODEL.md)
- [Security Implementation Plan](./docs/SECURITY_IMPLEMENTATION_PLAN.md)

Users are not buying predictions, trading advice, or certainty. They are placing a symbolic votive offering and receiving:

- a blessing
- an oracle line
- a short ritual pause before making their own choice

## Founder’s Insight

Fortune Shrine is not a prediction product.

It does not tell people what will happen.

It does not tell people what to do.

It does not make decisions for them.

A person may arrive feeling:

- anxious
- excited
- uncertain
- hopeful
- afraid

The Shrine does not remove uncertainty.

The Shrine does not reveal the future.

The Shrine offers something older and more human:

- a blessing
- a ritual
- a moment of reflection

After leaving the Shrine, the user may not know more. They may not become richer. They may not have clearer answers.

But they should feel:

- I have received a blessing.
- I have completed the ritual.
- The decision is now mine.

This is how temples, shrines, sanctuaries, and sacred places have served people for thousands of years. People rarely leave with certainty. They leave with courage, peace, hope, or conviction.

The Shrine is not a character, priest, oracle, avatar, or AI guide.

The Shrine itself responds.

The Shrine itself blesses.

The Shrine is for the moment before risk: when the hand pauses, the mind grows loud, and the future has not yet answered.

The Shrine welcomes them all.

The purpose of the Shrine is simple:

To offer a blessing before an important moment.

The future belongs to the user.

The blessing belongs to the Shrine.

## V0.2 Design Direction

The Shrine should feel less like a pantheon catalog and more like a threshold.

The user does not choose a god, priest, oracle, or guide.

The user enters, places the offering, and waits.

No visible speaker appears.

One blessing appears.

The Shrine responds.

This protects the mystery of the ritual. Users do not meet a character. They receive a blessing.

## Run

```bash
npm install
npm run dev
```

Then open:

```text
http://127.0.0.1:4188
```

If using pnpm:

```bash
pnpm install
pnpm dev
```

## Product Boundary

The Shrine must never say:

- buy
- sell
- enter
- exit
- invest
- wait
- act now

The Shrine must never promise:

- wealth
- success
- profit
- returns
- winning

The user makes decisions. The Shrine offers blessings.

## V0 Scope

- Next.js single page app.
- Curated blessing corpus with no visible character.
- Four named ritual offerings: Traveler's, Keeper's, Sacred, and Eternal.
- Simulated payment modal for V0.
- Random blessing and oracle generation.
- No wallet connection yet.
- No financial advice.

## Presence Copy Rule

The app must not create a visible priest, oracle, guru, guide, avatar, or character.

The Shrine itself responds.

Every line should remain:

- hopeful
- symbolic
- open to interpretation
- non-instructional
- non-predictive
- comforting

Avoid definite outcome language such as:

- You will win.
- This will rise.
- Wealth is coming.
- The Shrine says yes.
- The answer is buy.
- The answer is sell.
- The Shrine guarantees.

Prefer open language such as:

- May...
- Perhaps...
- The road...
- A sign...
- The wind...
- The cup...
- The answer remains veiled...
- Something opens...

The best lines are ambiguous enough for the user to complete the meaning, but warm enough to feel like a blessing.

## Plain Language Rule

Most users are not here for philosophy.

They are here because they are nervous before risk and want a blessing.

Keep the user-facing copy simple:

- Choose a flame to light.
- Light the flame.
- The Shrine responds.
- Receive comfort.
- Decide for yourself.

Avoid copy that feels too academic, too wise, too poetic, or too hard to understand.

The Shrine can look sacred and serious, but the words should be easy.

## Next Product Questions

- Did the first user come back?
- Did users feel that something responded without meeting a character?
- Did users share screenshots of their blessing?
- Did users ask to save their shrine history?
- Did users want real USDC payment after trying the ritual?
