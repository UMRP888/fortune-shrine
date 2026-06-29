# Fortune Shrine GMX Observation Framework

Date: 2026-06-22  
Duration: Seven days  
Mode: Observation only

## Objective

Test whether the Unofficial GMX Trading Chat is genuinely:

- human;
- conversational;
- emotionally honest;
- helpful;
- safe for a future low-frequency presence.

This is not a customer-acquisition experiment.

No posting, reacting, replying, direct messaging, link sharing, automation, exporting, scraping, or AI ingestion is permitted during the seven-day study.

Backup community: Santiment.

## Compliance Boundary

Telegram’s API terms prohibit using Telegram platform data in the development, enhancement, or deployment of AI systems.

Therefore the observer must not:

- paste messages into Codex;
- export chat history;
- take a machine-readable archive;
- run sentiment analysis;
- send screenshots containing identifiable member messages for AI analysis;
- store full-text messages in the project.

The observer may record:

- aggregate counts;
- broad state categories;
- operator-authored paraphrases that cannot identify a member;
- community-level observations;
- rule and moderation observations.

If exact quotations later become necessary, obtain appropriate consent and legal/platform review first.

## Research Questions

1. Are at least ten human members visibly recurring?
2. Do members respond to one another rather than broadcast?
3. Are questions answered without immediate selling?
4. Do people admit uncertainty, loss, or restraint?
5. Is emotional expression accepted, mocked, ignored, or exploited?
6. Are conversations mostly signals, charts, memes, support, or real experience?
7. Would one useful human contribution be socially appropriate?
8. Could a state-focused blessing eventually feel natural without implying a better outcome?

## Observation Window

Use two fixed 15-minute windows daily:

- one during an active market period;
- one during a quieter period.

The same windows should be used across seven days where practical. Consistency matters more than total reading time.

Do not remain continuously present. The study measures ordinary community behavior, not exceptional events selected after the fact.

## Daily Observation Record

```json
{
  "date": "YYYY-MM-DD",
  "community": "Unofficial GMX Trading Chat",
  "window": "active|quiet",
  "duration_minutes": 15,
  "messages_sampled_estimate": 0,
  "unique_active_members_estimate": 0,
  "recurring_members_seen": 0,
  "human_conversation_threads": 0,
  "helpful_responses": 0,
  "bot_or_promotion_messages": 0,
  "state_counts": {
    "waiting": 0,
    "loss": 0,
    "fear": 0,
    "hope": 0,
    "regret": 0,
    "discipline": 0,
    "reentry": 0,
    "recovery": 0
  },
  "moderation_events": 0,
  "operator_paraphrase": "No names, handles, exact quotes, or identifying details",
  "quality_score": 0,
  "emotional_honesty_score": 0,
  "relationship_potential_score": 0
}
```

## Counting Rules

### Active member

Count a member once per observation window when they produce a non-bot, non-forwarded message.

### Recurring member

Count a person as recurring only after seeing them on at least two separate days.

### Human conversation thread

At least two members exchange contextually connected messages. Parallel price calls do not count.

### Helpful response

A member answers, clarifies, reassures, warns, or shares relevant experience without attaching a referral or sales pitch.

### Emotional expression

Count only first-person or clearly personal context.

Do not count:

- headlines;
- generic market labels such as “fear index”;
- memes without personal context;
- price predictions;
- promotional urgency;
- copied liquidation news about another person.

## Emotional-Honesty Rubric

### 1–2

Only bots, price calls, promotions, or one-way broadcasting.

### 3–4

Some human conversation, but emotion is mocked, suppressed, or converted into signals.

### 5–6

Members admit mistakes or uncertainty occasionally; interaction remains mostly technical.

### 7–8

Members openly discuss losses, hesitation, patience, or hope and receive human responses.

### 9–10

Emotional honesty is common, safe, contextual, and supported without exploitation.

## Discussion-Quality Rubric

Evaluate:

- continuity across messages;
- specificity;
- mutual help;
- recurring identities;
- tolerance for disagreement;
- moderation quality;
- low referral pressure;
- low bot density.

Do not reward volume alone.

## Seven-Day Plan

### Day 1 — Authenticity and rules

Record:

- whether the public link leads to the expected group;
- pinned rules;
- moderation identities;
- anti-scam warnings;
- group purpose;
- obvious bots and recurring promotions;
- whether the group is truly a trading chat.

Decision gate:

Stop and mark `UNSAFE` if ownership appears deceptive, impersonation is rampant, or joining triggers unsolicited DMs.

### Day 2 — Conversation structure

Measure:

- unique active members;
- recurring exchanges;
- questions answered;
- monologues vs dialogue;
- chart/signal ratio;
- bot/promotion ratio.

Do not score emotional honesty yet unless the evidence is clear.

### Day 3 — Waiting and uncertainty

Count first-person expressions of:

- waiting for a move or resolution;
- uncertainty about acting;
- boredom and pressure to trade;
- difficulty doing nothing;
- requests for perspective.

Record only aggregate counts and non-identifying paraphrases.

### Day 4 — Loss, regret, and fear

Count:

- disclosed losses;
- liquidation or stop-out experiences;
- regret about breaking rules;
- fear expressed physically or behaviorally;
- reactions from other members.

Distinguish support from mockery and exploitation.

### Day 5 — Discipline and restraint

Count:

- stepping away;
- reducing size;
- refusing to chase;
- stopping for the day;
- waiting for a setup;
- members reinforcing restraint.

This day is particularly important because the Shrine blesses the state, not the move.

### Day 6 — Re-entry, recovery, and hope

Count:

- revenge-trading language;
- considered re-entry;
- rebuilding after loss;
- smaller sizing or new rules;
- hope that remains grounded;
- “still here” continuation signals.

Mark severe vulnerability as excluded from any future outreach.

### Day 7 — Community judgment

Complete:

- average discussion quality;
- average emotional honesty;
- bot ratio;
- helpfulness rate;
- recurring-member count;
- relationship-potential score;
- risk notes;
- final recommendation.

Recommendations:

- `CULTIVATE_30_DAYS`
- `OBSERVE_ONLY`
- `REPLACE_WITH_SANTIMENT`
- `UNSAFE_OR_LOW_QUALITY`

## Success Thresholds

Recommend `CULTIVATE_30_DAYS` only if:

- at least 10 recurring human members are observed;
- at least 25% of sampled activity forms real conversation threads;
- helpful responses outnumber promotional replies;
- bot/promotion ratio appears below 30%;
- at least five authentic state expressions appear across seven days;
- at least two state expressions receive respectful human responses;
- ordinary non-promotional participation would fit the rules;
- no serious impersonation or harassment risk is observed.

These thresholds are provisional research gates, not production scoring.

## Failure Conditions

Move to Santiment if:

- the room is dominated by price calls or referrals;
- authentic emotion is routinely mocked;
- support emergencies dominate;
- moderation is absent or deceptive;
- recurring identities cannot be distinguished;
- uncertainty language is mostly performative;
- a normal participant would not enjoy spending time there.

## Final Report Template

```text
Community:
Observation dates:
Windows completed:
Estimated unique active members:
Recurring human members:
Discussion quality:
Emotional honesty:
Bot/promotion ratio:
Waiting frequency:
Loss frequency:
Fear frequency:
Hope frequency:
Recovery/restart frequency:
Helpful-response examples (paraphrased):
Safety concerns:
Would a normal human stay?
Would a blessing eventually feel natural?
Decision:
Confidence:
```

## Official Reference

- [Telegram API Terms](https://core.telegram.org/api/terms)

