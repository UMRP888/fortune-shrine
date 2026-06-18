# Fortune Shrine Human Uncertainty Research

## Risk Before Loss Research v1

Status: Open hypothesis

Date: 2026-06-18

## Research Question

Can public language that signals FOMO, escalation, group contagion, or declining
restraint identify a moment when a person may welcome a pause before risk?

This research does not assume that impulsive language predicts a financial
loss. It tests whether particular expressions precede:

- increased stated risk
- later regret
- later acknowledgment of irrationality
- attempts to reduce or reverse exposure
- deletion or contradiction of the earlier statement
- an explicit desire to pause

The Shrine must never infer:

```text
This person will lose.
This trade will fail.
This person is irrational.
```

The only permissible inference is:

```text
This public expression may contain a risk-before-action state that deserves
careful human review.
```

## Why This Matters

The current discovery model is strongest after loss or during explicit
restraint. That misses an earlier state:

```text
social excitement
-> urgency
-> escalation language
-> reduced reflection
-> action
```

If this state can be recognized safely, Fortune Shrine may offer its most
faithful value before the outcome:

```text
Pause before risk.
Bless the state.
Never bless the outcome.
```

## Evidence Boundary

Existing behavioral-finance research supports several broad premises:

- FOMO can contribute to impulsive financial decisions.
- herding exists in cryptocurrency markets and can intensify around specific
  events and communities
- cryptocurrency discussion contains measurable hope, prediction, and regret
  dynamics
- community activity and emotional language are related to market conditions

These findings do not prove that an individual phrase such as `all in` predicts
that the author will lose. V1 must establish its own evidence before using such
language for prioritization.

## Language Taxonomy

### A. Exposure Escalation

- all in
- full port
- doubling down
- bought more
- going bigger
- one more bet
- loaded more
- added again

### B. Urgency and Scarcity

- last chance
- now or never
- before it is too late
- can't miss this
- this is the moment
- final entry

### C. FOMO and Loss of Restraint

- fomo
- can't resist
- had to ape in
- couldn't stay out
- trying not to buy
- watching everyone else win
- don't want to miss it

### D. Group Contagion and Performance

- send it
- we ride
- conviction
- trust the community
- everyone is buying
- community knows
- join us

### E. Outcome Fantasy

- moon
- 100x
- life changing trade
- generational wealth
- retirement trade
- this changes everything

### F. Self-Awareness Before Action

This is the highest-value family:

- I know this is irrational
- I probably shouldn't
- talk me out of it
- trying not to ape in
- I need to slow down
- I don't trust myself right now
- one more and then I stop
- I know I am chasing

## Interpretation Classes

Every match must be assigned one class before scoring.

### 1. Personal Pre-Risk State

First-person expression of imminent action, urgency, escalation, or declining
restraint.

Example:

```text
I know I shouldn't add more, but I can't resist.
```

Eligible for human review.

### 2. Community Performance

Identity or group language without a personal state.

Example:

```text
Send it. We ride.
```

Not enough for contact.

### 3. Promotion or Manipulation

Language encouraging others to buy, gamble, or join.

Example:

```text
Last chance before 100x.
```

Blocked.

### 4. Humor or Meme

Playful language without evidence of real action or uncertainty.

Not enough for contact.

### 5. Outcome Analysis

Confidence or conviction based on stated analysis.

The Shrine does not arbitrate whether the decision is rational. Unless the
person expresses a state or desire for pause, do not contact.

### 6. Acute Vulnerability

Essential-money loss, desperation, self-harm, debt crisis, or inability to make
a free decision.

Blocked from acquisition contact.

## Risk-Before-Action Score

This score is a research label, not a prediction of loss.

| Dimension | Points |
|---|---:|
| First-person imminent action | 20 |
| Explicit escalation of exposure | 15 |
| Urgency or scarcity | 15 |
| Explicit FOMO or inability to resist | 20 |
| Self-awareness of reduced restraint | 20 |
| Time-bound decision | 10 |

Penalties:

| Signal | Points |
|---|---:|
| Promotion or referral | -50 |
| Generic group slogan | -25 |
| Joke/meme without personal state | -25 |
| Pure outcome analysis | -20 |

Safety blocks are evaluated before this score and cannot be overridden.

## Research Dataset

### Observation Record

```json
{
  "observationId": "uuid",
  "platform": "x",
  "sourceUrl": "https://...",
  "publicHandle": "handle",
  "observedAt": "ISO timestamp",
  "expression": "public text",
  "languageFamilies": ["fomo", "exposure_escalation"],
  "interpretationClass": "personal_pre_risk_state",
  "riskBeforeActionScore": 75,
  "contactSafety": "human_review",
  "contacted": false
}
```

### Follow-up Observation

Follow-up uses only later public statements by the same public account. It must
not infer private trade outcomes from market movement.

Possible labels:

- `later_regret_explicit`
- `later_loss_explicit`
- `later_restraint_explicit`
- `later_escalation_explicit`
- `later_claimed_win`
- `later_acknowledged_irrationality`
- `no_public_follow_up`
- `ambiguous`

The label must be supported by the user's own later public words.

## Study Design

### Phase 1: Baseline Classification

Collect 300 public observations:

- 100 personal pre-risk expressions
- 100 community-performance or meme expressions
- 100 promotion/outcome-analysis controls

Human-review every label.

Questions:

- What percentage of keyword matches are genuine personal states?
- Which phrases have the highest precision?
- Which platforms contain the most self-aware pre-risk language?

### Phase 2: Public Longitudinal Follow-up

Observe later public statements at:

- 24 hours
- 72 hours
- 7 days

Do not contact the user for research purposes.

Measure:

- explicit regret
- explicit loss
- explicit restraint
- explicit acknowledgment of irrationality
- no observable outcome

### Phase 3: Pause Receptivity

Only for safe, human-approved candidates:

- send one state-only reply
- no link
- no Offering
- no second message without a response

Measure:

- reply
- positive/neutral/negative response
- continued conversation
- explicit appreciation of the pause
- invitation permission

The primary outcome is pause receptivity, not subsequent financial performance.

## Candidate Priority

Highest priority:

```text
self-awareness
+ imminent action
+ explicit desire for restraint
+ willingness to continue
+ safe public context
```

Examples:

- "Trying not to ape in."
- "I know I am chasing."
- "I need to slow down before I add more."
- "Talk me out of one more trade."

Low priority:

- "YOLO."
- "Send it."
- "Moon."
- "Conviction."

These are common but ambiguous.

Blocked:

- promotional `100x` claims
- referral marketing
- instructions for others to buy
- essential-money or debt language
- severe desperation

## Appropriate First Responses

### Escalation with self-awareness

> The part of you that noticed the urgency is still present. May it have one
> clear moment before the next decision.

### FOMO

> A crowded room can make stillness feel like missing out. May your own pace
> remain audible.

### Doubling down

> The last decision does not have to choose the next one. May there be room
> between conviction and hunger.

### Group contagion

> A loud crowd can make every direction feel certain. May your own footing
> remain yours.

These responses must never imply that taking or avoiding the trade is the
correct outcome.

## Findings Required Before Product Use

The research hypothesis is supported only if:

1. At least one phrase family identifies personal pre-risk states with useful
   precision.
2. Human reviewers can reliably distinguish those states from memes and
   promotion.
3. State-only replies receive neutral or positive responses without complaints.
4. The process does not disproportionately target vulnerable users.
5. The language improves pause recognition without becoming trading advice.

The hypothesis is rejected or narrowed if:

- most matches are memes or marketing
- later outcomes cannot be observed reliably
- users perceive replies as judgmental or intrusive
- the system encourages risk by treating high-risk language as engagement
  opportunity
- loss prediction cannot be separated from hindsight bias

## V2 Integration

Until validated:

- store `riskBeforeActionScore` as a research field only
- do not include it in Traveler Readiness
- do not use it to trigger automatic replies
- do not use it to prioritize Offering invitations

After validation, it may increase `Reply Opportunity` only when paired with
self-awareness or explicit desire for restraint.

It must never outrank `Continue Intention`. Escalation language without
reflection, waiting, trying, or continued agency is not a high-priority Shrine
signal.

## Current Conclusion

Risk-before-loss is a promising discovery window.

The strongest signal is not:

```text
All in.
```

It is:

```text
I know I am losing restraint before I act.
```

Fortune Shrine should learn to recognize that threshold without claiming to
know what lies beyond it.

The aim is not to find the person nearest collapse. It is to find the person
still moving toward an uncertain future who may welcome one moment of meaning
before continuing.
