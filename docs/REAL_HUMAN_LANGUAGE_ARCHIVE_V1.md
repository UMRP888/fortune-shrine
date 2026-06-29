# Fortune Shrine Real Human Language Archive V1

Date: 2026-06-22  
Status: Research framework and seed archive  
Scope: Trader-state language, not marketing copy and not a blessing corpus

## Purpose

Fortune Shrine needs to understand how people speak before it decides how to answer.

This archive studies language used by people living through:

- waiting;
- loss;
- regret;
- fear;
- hope;
- discipline;
- re-entry;
- patience;
- luck;
- faith;
- recovery.

The archive must preserve the difference between:

1. what a person actually expressed;
2. what the researcher inferred;
3. what Fortune Shrine might eventually say.

These must never be collapsed into one field.

## Evidence Boundary

### X

Public X Posts may be collected through the official X API under the applicable developer terms. X Recent Search covers the previous seven days and supports keywords, phrases, language filters, and exclusion of reposts/replies.

For research records:

- preserve the Post ID and URL;
- keep the exact text only where permitted and necessary;
- record collection time;
- periodically check whether the Post still exists;
- do not store private messages;
- do not treat a keyword match as contact permission.

### Telegram

Telegram’s API terms currently prohibit using, accessing, or aggregating Telegram platform data to develop, enhance, or deploy AI/ML systems.

Therefore:

- Codex must not ingest copied Telegram group messages by default;
- no Telegram scraping, export, API ingestion, or automated summarization is proposed;
- a human observer may keep aggregate counts and operator-authored, non-identifying research notes;
- exact Telegram language must not be placed into an AI workflow without explicit, informed, continuing consent from the relevant rights holders or separate platform authorization and legal review.

This archive can contain exact language from compliant X collection. Telegram contributes only manual aggregate observations unless the consent boundary changes.

## Source Labels

Every record must carry one:

- `X_OFFICIAL_API`
- `X_MANUAL_PUBLIC`
- `TELEGRAM_MANUAL_AGGREGATE`
- `CONSENTED_INTERVIEW`
- `USER_SUBMITTED`
- `HYPOTHESIS_ONLY`

`HYPOTHESIS_ONLY` phrases are search seeds, not evidence.

## Record Schema

```json
{
  "archive_id": "RHL-000001",
  "source_type": "X_OFFICIAL_API",
  "source_id": "post-id",
  "source_url": "https://x.com/.../status/...",
  "captured_at": "ISO-8601",
  "created_at": "ISO-8601",
  "exact_text": "Stored only when permitted",
  "normalized_pattern": "I got stopped out again",
  "state_primary": "loss",
  "state_secondary": ["regret", "re-entry"],
  "time_orientation": "after",
  "agency": "active",
  "intensity": 3,
  "continuation_signal": true,
  "contact_safety": "safe",
  "research_note": "Operator-authored observation",
  "consent_basis": "public-post-research",
  "retention_review_at": "ISO-8601"
}
```

## Category Structure

### 1. Waiting

What it sounds like:

- time becomes the subject;
- the person repeatedly checks for resolution;
- action has already happened and control is low;
- short phrases often carry more emotion than long analysis.

Seed phrase families:

- “still waiting”
- “any minute now”
- “this is taking forever”
- “when does this resolve?”
- “I can’t stop checking”
- “just need the result”
- “the wait is worse than the trade”
- “nothing to do now but wait”
- “please let this settle”

Repeated pattern:

```text
Action completed
→ control lost
→ repeated checking
→ time feels heavier
```

### 2. Loss

What it sounds like:

- blunt numeric statements;
- disbelief before grief;
- humor or memes used to soften pain;
- identity can become fused with the loss.

Seed phrase families:

- “got liquidated”
- “stopped out again”
- “gave it all back”
- “that wiped me”
- “portfolio got destroyed”
- “lost the whole move”
- “round-tripped everything”
- “that one hurt”
- “I’m cooked”
- “back to zero”

Repeated pattern:

```text
Event
→ immediate number
→ disbelief
→ self-judgment or dark humor
```

### 3. Regret

What it sounds like:

- counterfactual language;
- replaying the moment of entry or exit;
- anger toward the earlier self;
- “knew better” is a common moral frame.

Seed phrase families:

- “I knew I should’ve waited”
- “why did I chase that?”
- “should have taken profit”
- “I saw the risk and did it anyway”
- “one more trade was one too many”
- “I broke my own rule”
- “I had the exit and ignored it”
- “never doing that again”

Repeated pattern:

```text
Known rule
→ rule broken
→ cost becomes visible
→ self-punishment
```

### 4. Fear

What it sounds like:

- physical language: sleep, stomach, breath, shaking;
- fear may be disguised as certainty or aggression;
- fear before action differs from fear after exposure.

Seed phrase families:

- “not gonna lie, I’m nervous”
- “can’t sleep with this open”
- “this position is too big”
- “my hands are shaking”
- “I don’t like how this feels”
- “scared to look”
- “I can’t take another loss”
- “this could go very wrong”

Repeated pattern:

```text
Exposure
→ bodily reaction
→ attempt to appear calm
→ request for reassurance
```

### 5. Hope

What it sounds like:

- hope is often compressed into “need,” “please,” or “one time”;
- hopeful language can become outcome dependency;
- genuine hope may coexist with acknowledged risk.

Seed phrase families:

- “hope this works”
- “please let this be the one”
- “I really need this”
- “maybe this is finally it”
- “fingers crossed”
- “one good break”
- “still believe”
- “trying to stay hopeful”

Repeated pattern:

```text
Desired outcome
→ emotional need
→ awareness of uncertainty
→ appeal to luck or time
```

### 6. Discipline

What it sounds like:

- rules, size, exits, and stopping;
- successful restraint is often quiet;
- people describe discipline most clearly after failing to maintain it.

Seed phrase families:

- “sticking to the plan”
- “size down”
- “no trade is also a trade”
- “done for the day”
- “not chasing”
- “taking the loss and walking away”
- “waiting for my setup”
- “protect the account”
- “I need to stop”

Repeated pattern:

```text
Urge
→ named rule
→ pause
→ either restraint or confession of failure
```

### 7. Re-entry

What it sounds like:

- tension between courage and revenge;
- attempts to recover identity through another position;
- phrases often include “again,” “back,” or “one more.”

Seed phrase families:

- “thinking about getting back in”
- “one more try”
- “running it back”
- “back at it tomorrow”
- “trying again, smaller this time”
- “do I re-enter?”
- “I can make it back”
- “fresh start”

Repeated pattern:

```text
Loss or exit
→ unresolved emotion
→ desire to re-enter
→ unclear boundary between plan and revenge
```

### 8. Patience

What it sounds like:

- patience is described as work, not passivity;
- boredom creates pressure to act;
- the speaker may seek permission not to move.

Seed phrase families:

- “waiting for confirmation”
- “letting it come to me”
- “no setup yet”
- “trying not to force it”
- “cash is a position”
- “I’ve waited this long”
- “the hard part is doing nothing”
- “need to be patient”

Repeated pattern:

```text
No clear opportunity
→ boredom or urgency
→ deliberate non-action
→ self-reminder
```

### 9. Luck

What it sounds like:

- ordinary ritual language;
- acknowledgment that control is incomplete;
- sometimes playful, sometimes deeply sincere.

Seed phrase families:

- “wish me luck”
- “good luck to everyone in this”
- “need a little luck”
- “pray for me”
- “send luck”
- “fingers crossed”
- “may the odds be kind”

Research caution:

Luck language is not permission to bless winning. Fortune Shrine may recognize the need for steadiness while leaving the outcome untouched.

### 10. Faith

What it sounds like:

- conviction after evidence becomes incomplete;
- identity and community may reinforce belief;
- “faith” can describe patience or denial.

Seed phrase families:

- “still holding conviction”
- “trust the process”
- “I believe in the thesis”
- “keeping faith”
- “not giving up yet”
- “the thesis hasn’t changed”

Repeated pattern:

```text
Uncertainty rises
→ evidence becomes contested
→ belief sustains action
→ doubt remains underneath
```

### 11. Recovery

What it sounds like:

- rebuilding rather than erasing;
- smaller size, slower pace, new rules;
- the strongest continuation signal.

Seed phrase families:

- “starting over”
- “rebuilding slowly”
- “back after taking a break”
- “learning to trade smaller”
- “one day at a time”
- “not trying to make it back overnight”
- “new account, new rules”
- “still here”

Repeated pattern:

```text
Cost acknowledged
→ identity separated from loss
→ behavior adjusted
→ continuation without certainty
```

## Cross-Category Language Patterns

### Compression

High-emotion language becomes short:

- “I’m cooked.”
- “Need this.”
- “Still waiting.”
- “One more.”
- “Not again.”

### Humor as armor

Memes, crying emojis, and exaggeration may hide real loss. Humor alone must not be interpreted as distress.

### Number before feeling

Traders frequently state the dollar amount, leverage, entry, or liquidation before naming emotion.

### Counterfactual loops

Regret repeatedly uses:

- should have;
- could have;
- knew better;
- if only;
- why didn’t I.

### Control language

Before risk:

- plan;
- conviction;
- size;
- setup.

After risk:

- hope;
- please;
- wait;
- need.

### Identity fusion

Unsafe interpretation begins when a person describes the outcome as proof of personal worth:

- “I’m a failure.”
- “I always ruin everything.”

Such language increases contact sensitivity. Severe crisis language must be excluded from outreach.

## Annotation Rules

1. Label the expressed state, not the market direction.
2. Preserve ambiguity when a phrase may be humor.
3. Do not infer financial condition from a number alone.
4. Separate `pain_intensity` from `contact_safety`.
5. Record whether the person is still acting, reflecting, or rebuilding.
6. Never label a person with a diagnosis.
7. Never convert severe vulnerability into a sales opportunity.
8. Do not treat “all in” as permission to encourage the move.

## Research Metrics

For each source and week:

- examples reviewed;
- valid state expressions;
- categories represented;
- exact vs inferred expressions;
- first-person vs commentary;
- continuation signals;
- excluded crisis expressions;
- false-positive patterns;
- phrases that generated human replies;
- phrases that appeared performative or promotional.

## Archive Acceptance Test

A phrase enters the verified archive only if:

- it comes from an allowed source;
- its URL or consent record is retained;
- its state is genuinely first-person or clearly contextual;
- it is not an advertisement, headline, or bot;
- it does not expose private information;
- a researcher can explain why it belongs without referring to a marketing objective.

## Current Seed Status

The phrases in this document are a **search and annotation seed set**. They are not frequency claims and must not be described as Telegram findings.

The next evidence milestone is:

- 100 compliant X examples;
- at least 10 examples in each core state;
- manual aggregate observations from the GMX study;
- a false-positive log;
- no Telegram message ingestion into AI.

## Official References

- [X Search Posts](https://docs.x.com/x-api/posts/search/introduction)
- [X Automation Rules](https://help.x.com/en/rules-and-policies/x-automation)
- [Telegram API Terms](https://core.telegram.org/api/terms)

