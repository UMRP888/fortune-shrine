# Fortune Shrine Distribution Engine V2

Status: Design specification

Version: 2.0-draft

Date: 2026-06-18

## Mission

V2 exists to discover real public expressions of uncertainty, identify which
people may welcome a restrained blessing, prepare a relevant first response,
and preserve the complete path from discovery to return.

It does not exist to maximize replies, impressions, or unsolicited contact.

The Shrine does not seek the most distressed person. It seeks the person who
is still moving through uncertainty and may welcome a meaningful pause.

```text
Bless the state.
Never bless the outcome.
```

Discovery thesis:

```text
Uncertainty
-> need for meaning
-> need for ritual
-> Offering
```

The unverified model below is rejected:

```text
Pain
-> pain score
-> Offering
```

Pain remains an important signal. It must be modeled separately from Contact
Safety:

```text
Pain Intensity != Contact Safety
```

A person may have a strong need for meaning and ritual while being unsafe or
inappropriate for unsolicited contact.

## V2 Outcome

The engine must answer:

```text
Which source and query found this person?
What state did the person express?
Why was the person safe or unsafe to contact?
Why might the person welcome the Shrine?
Which response was proposed and approved?
What happened after the response?
Did the person visit, make an Offering, receive a blessing, or return?
```

## Open Research Track

Risk-before-action language is tracked separately from the production scoring
model:

```text
docs/RISK_BEFORE_LOSS_RESEARCH_V1.md
```

Expressions such as `all in`, `YOLO`, `full port`, and `send it` are not
treated as evidence of a likely loss. Until longitudinal research validates
them, they remain ambiguous community-language signals. Only first-person
self-awareness and explicit desire for restraint may qualify for human review.

## 1. Candidate Pool

### Source Priority

1. Polymarket public comments
2. X recent public posts
3. Reddit approved public communities

V2 must use official APIs only. Browser scripting, private-channel collection,
and automatic cold messages are forbidden.

### Query Families

Queries are organized by state rather than by platform slang alone.

#### Waiting

- waiting for resolution
- resolves tomorrow
- can't stop checking
- checking the odds again
- waiting for the result
- not ready for the answer

#### Active Restraint

- need to slow down
- trying not to revenge trade
- shouldn't add more
- taking a break
- entering less
- trying not to chase
- stepping away from the chart

#### Loss Reflection

- forcing trades
- revenge traded
- overtraded today
- let the last loss control me
- trying not to make it worse
- repeated the same mistake

#### Recovery and Continuation

- rebuilding after liquidation
- starting again after loss
- learning from the loss
- trying again more carefully
- reviewing what went wrong
- taking a break and coming back
- rebuilding my account
- not repeating the same mistake
- still moving forward
- beginning again

### Combination Queries

V2 should prioritize combinations over isolated pain terms:

```text
Pain + Reflection
Pain + Recovery
Pain + Continue
```

Examples:

- `liquidated` + `learning`
- `lost` + `rebuilding`
- `blew my account` + `starting again`
- `revenge traded` + `trying not to repeat`
- `loss` + `taking a break`
- `failed` + `still trying`

An isolated pain phrase may signal need, but it does not establish that
unsolicited contact is safe or welcome.

#### Risk Before Action

- don't trust myself right now
- one clear minute before I decide
- talk me out of it
- about to enter again
- nervous about my position

#### Ritual Receptivity

- pray for me
- need some luck
- send prayers
- need a sign
- need a moment

Ritual-receptivity phrases must always be combined with a personal risk or
waiting context. They must not be treated as permission to promise luck.

### Query Lifecycle

Each query has:

- `queryId`
- platform
- family
- exact platform query
- language
- enabled state
- first and last run
- raw result count
- qualified count
- safe-contact count
- response count
- visit count
- Offering count
- false-positive reasons

Queries are promoted or retired using observed outcomes, not intuition.

## 2. Candidate Scoring

V2 replaces the single relevance score with separate safety, fit, continuation,
readiness, and reply-opportunity decisions.

### Traveler State Levels

#### Level 1 — Major Uncertainty

- waiting
- hesitation
- choice
- unresolved result

#### Level 2 — Before Risk

- FOMO
- all in
- YOLO
- doubling down
- escalating exposure

#### Level 3 — After Loss

- loss
- failure
- liquidation
- regret

#### Level 4 — Recovery

- review
- reflection
- rebuilding
- beginning again
- trying not to repeat the pattern

#### Level 5 — Severe Crisis

- despair
- collapse
- loss of agency
- inability to make a free decision

Level 5 is blocked from acquisition contact. It may have high ritual need, but
that does not create permission to approach.

### Working Golden Zone

The current research hypothesis is:

```text
Level 3 + Level 4
=
experienced cost
+ understands uncertainty
+ seeks meaning
+ still intends to continue
```

This is a research hypothesis, not a proven conversion fact.

### A. Shrine Fit — 0 to 100

Measures whether the expression belongs inside the Shrine's purpose.

| Dimension | Weight |
|---|---:|
| Personal first-person state | 20 |
| Uncertainty or waiting | 20 |
| Restraint or desire to pause | 25 |
| Emotional truth without outcome request | 15 |
| Clear risk context | 10 |
| Ritual receptivity | 10 |

### B. Pain Intensity — 0 to 100

Pain Intensity records the apparent weight of the public expression. It helps
the Shrine understand context and ritual need.

Possible signals:

- explicit loss or failure
- regret
- shame
- fear
- exhaustion
- repeated failed attempts
- liquidation

Pain Intensity must not:

- increase contact permission
- override a safety block
- imply Offering probability
- be used to target the most vulnerable person

Its valid uses are:

- state-level classification
- language sensitivity
- identifying recovery transitions
- research into meaning and ritual need

### C. Recovery Orientation — 0 to 100

Measures whether the person is moving from pain toward reflection or rebuilding.

| Dimension | Weight |
|---|---:|
| Reflects on what happened | 25 |
| Recognizes a pattern or judgment error | 20 |
| Attempts to rebuild or begin again | 20 |
| Expresses restraint after loss | 20 |
| Seeks meaning rather than a guaranteed outcome | 15 |

### D. Contact Safety — Gate, not rank

Possible values:

- `safe`
- `human_review`
- `blocked`

Automatic blockers:

- self-harm or suicidal language
- apparent financial desperation or essential-money loss
- minor or uncertain age
- medical, death, war, or acute personal crisis
- explicit request for trading or gambling predictions
- private or access-controlled source
- community rule prohibits outreach
- promotion, bot, news, or joke content
- previous opt-out or negative response

No numerical score may override a blocker.

### E. Continue Intention — 0 to 100

Measures whether the person is still engaged with the road ahead.

| Dimension | Weight |
|---|---:|
| Still waiting for an answer or result | 20 |
| Still considering a next step | 20 |
| Still trying after a setback | 15 |
| Actively practicing restraint | 20 |
| Reflecting on judgment or meaning | 15 |
| Expressing curiosity, hope, or openness | 10 |

Strong signals:

- "I am still trying."
- "I need to slow down before deciding."
- "I am waiting to see what happens."
- "I am entering less often."
- "I am trying not to repeat the same mistake."
- "I do not know what comes next."

Low or blocked signals:

- complete abandonment of agency
- acute desperation
- inability to make a free decision
- severe crisis

Low Continue Intention does not make a person less worthy of care. It
means acquisition contact is less appropriate.

### F. Traveler Readiness — 0 to 100

Measures the probability that a safe candidate may understand and enter the
Shrine. It is not a measure of wealth or vulnerability.

| Dimension | Weight |
|---|---:|
| User actively asks for pause, prayer, calm, or restraint | 25 |
| Current moment is time-bound | 15 |
| Public expression welcomes conversation | 15 |
| Platform culture fits digital ritual | 10 |
| Crypto payment familiarity is directly evidenced by platform context | 15 |
| Expression is reflective rather than acute | 15 |
| Prior positive interaction with Shrine | 5 |

Do not infer payment readiness from position size, wallet balance, losses, or
other financial profiling.

### G. Reply Opportunity — 0 to 100

Measures whether a non-promotional first response can naturally add value.

- Specific state can be witnessed: 30
- A state blessing can be written without advice: 25
- Response will not interrupt a factual debate: 15
- Post remains timely: 15
- Community allows the response: 15

### Candidate Decision

```text
Contact Safety = blocked
    -> discard/minimal compliance record

Contact Safety = human_review
    -> hold for explicit human judgment

Contact Safety = safe
and Reply Opportunity >= 70
and Continue Intention >= 60
and Shrine Fit >= 70
    -> draft queue

Traveler Readiness >= 65
    -> high-priority human review
```

High Pain Intensity must never increase priority by itself.

Golden-zone research priority:

```text
State Level in [3, 4]
+ Recovery Orientation >= 60
+ Continue Intention >= 60
+ Contact Safety = safe
```

### Ranking Order

Candidates are ordered by:

1. Contact Safety
2. Reply Opportunity
3. Recovery Orientation
4. Continue Intention
5. Traveler Readiness
6. Shrine Fit
7. Timeliness

Pain Intensity is retained as an important ritual-need and context signal. It
is not used as a direct proxy for contact priority or Offering probability.

## 3. Reply Corpus

Every first response contains:

```text
Witness
+
State blessing
```

It must not contain:

- a Shrine link
- an Offering mention
- a prediction
- financial or gambling advice
- urgency
- a question designed to force engagement
- claims about the user's identity or psychology

### Reply Families

#### Waiting

- "Waiting can make every check feel urgent. May a little steadiness remain
  with you before the answer arrives."
- "The answer has not arrived yet. May the space around the waiting remain
  yours."

#### Active Restraint

- "The part of you asking not to rush is worth hearing. May patience remain
  beside you while the next step is still unwritten."
- "Fast markets can keep the mind moving long after the candle stops. May the
  space you are creating remain yours."

#### Loss Reflection

- "Knowing the pattern and meeting it in the moment are different burdens. May
  one clear pause stand between the last loss and the next decision."
- "May the loss remain an event, and not become the voice that chooses what
  comes next."

#### Refusing to Force Action

- "Some days grow clearer when they are allowed to remain untraded. May the
  space you stopped forcing stay open."
- "Not every empty moment needs to become an entry. May restraint remain
  visible when the room grows loud."

#### Fear Before an Answer

- "That sounds like a heavy threshold. May your breath remain yours while the
  future stays unwritten."
- "You do not have to become fearless before you can become steady."

### Personalization Rules

The generated response must reuse at most one concrete image from the public
expression, such as waiting, a candle, a chart, or a repeated check.

It must not:

- repeat exact financial amounts
- mention wallet balances or position sizes
- quote humiliating language
- diagnose addiction
- infer personal history
- reproduce profanity unless necessary and clearly welcomed

### Corpus Learning Record

Each sent response stores:

- response family
- template ID
- personalized draft
- final approved text
- reviewer changes
- reply received
- positive, neutral, negative, or no response
- invitation permission
- visit and Offering outcome

This makes the corpus learn from real reception rather than aesthetic
preference.

## 4. Follow-up and Conversion Log

V2 stores events, not only counters.

### Funnel States

```text
discovered
qualified
safe_to_contact
drafted
approved
sent
seen_unknown
replied
conversation
invitation_permitted
invited
visited
offering_started
offering_completed
blessing_received
return_intent
returned
opted_out
rejected
expired
```

### Interaction Event

Each event contains:

- `eventId`
- `candidateId`
- `platform`
- `eventType`
- timestamp
- source URL
- related response/template ID
- actor: system, reviewer, candidate, or Shrine
- factual evidence
- optional reviewer inference, explicitly marked as inference
- consent state
- next permitted action

### Follow-up Rules

- No second message until the person responds.
- No invitation until the person shows curiosity or grants permission.
- No automated cold reply.
- No automated DM.
- One opt-out ends all future contact.
- Deleted source content triggers deletion or minimization according to the
  platform's rules.
- Offering records must not be publicly linked to platform identity.

## 5. Platform Connectors

### Polymarket

Official public endpoints provide comments, comment IDs, timestamps, public
profiles, parent entities, replies, reactions, and optional position context.

V2 uses:

- `GET https://gamma-api.polymarket.com/comments`
- comments by ID
- comments by public user address
- event and market lookup for context

Allowed:

- public comment discovery
- market-context enrichment
- reply-thread monitoring
- source URL construction

Not allowed in V2:

- automatic comment submission
- browser automation
- prioritizing by position size
- financial vulnerability profiling

### X

V2 uses official Recent Search with query families, language filters, retweet
exclusions, pagination, and post lookup before review.

Allowed:

- discovery
- query performance statistics
- post existence checks
- draft generation

Cold keyword-based automated replies are prohibited. X states that AI-powered
automated replies require prior explicit written approval. V2 therefore keeps
all first-contact sending outside the engine.

### Reddit

Reddit requires a registered OAuth client and a descriptive User-Agent.
Unauthenticated traffic may be blocked. Deleted user content must be removed,
and Reddit recommends routine deletion checks within 48 hours.

V2 prerequisites:

- confirm commercial/data-use permission
- OAuth
- descriptive User-Agent
- approved subreddit list
- subreddit-rule snapshots
- deletion reconciliation

Until these conditions are satisfied, Reddit remains research/manual-import
only.

## 6. V2 Components

```text
Platform Connectors
    -> Raw Observation Store
    -> Normalizer
    -> Policy and Safety Gate
    -> State Classifier
    -> Shrine Fit / Readiness / Opportunity Scoring
    -> Candidate Queue
    -> Reply Composer
    -> Human Approval
    -> External Manual Send
    -> Interaction Event Log
    -> Funnel Aggregator
    -> Query and Corpus Learning
    -> Daily Report
```

### Raw Observation Store

Short retention, source-specific deletion rules, and no hidden enrichment.

### Policy and Safety Gate

Runs before scoring. A blocked candidate cannot appear in the reply queue.

### Candidate Queue

Sorted by:

1. safe contact
2. reply opportunity
3. Recovery Orientation
4. Continue Intention
5. Traveler readiness
6. Shrine fit
7. timeliness

Never sorted by pain intensity.

### Daily Report

Reports:

- source and query coverage
- raw observations
- duplicates
- safety blocks
- qualified candidates
- drafts
- approvals
- sent responses
- replies
- invitation permissions
- visits
- Offerings
- negative responses and opt-outs
- top false-positive reasons
- query and corpus promotions/retirements

## 7. Minimal Data Model

### Candidate

```json
{
  "id": "uuid",
  "platform": "polymarket",
  "sourceId": "comment-id",
  "sourceUrl": "https://...",
  "publicHandle": "public-name",
  "content": "public expression",
  "observedAt": "ISO timestamp",
  "queryId": "query-id",
  "stateLevel": 4,
  "stateLabels": ["loss", "reflection", "rebuilding"],
  "painIntensity": 68,
  "recoveryOrientation": 82,
  "shrineFit": 84,
  "continueIntention": 81,
  "travelerReadiness": 72,
  "replyOpportunity": 88,
  "contactSafety": "safe",
  "safetyReasons": [],
  "decision": "drafted",
  "consentState": "none",
  "nextPermittedAction": "human_review"
}
```

### Reply Draft

```json
{
  "id": "uuid",
  "candidateId": "uuid",
  "family": "active_restraint",
  "templateId": "restraint-02",
  "draft": "May...",
  "approvedText": null,
  "status": "pending_review",
  "constitutionalChecks": {
    "predictive": false,
    "instructional": false,
    "outcomeBlessing": false,
    "containsLink": false,
    "containsOffering": false
  }
}
```

### Interaction Event

```json
{
  "id": "uuid",
  "candidateId": "uuid",
  "type": "replied",
  "occurredAt": "ISO timestamp",
  "evidence": "public reply URL",
  "consentState": "invitation_allowed",
  "nextPermittedAction": "human_invitation_review"
}
```

## 8. Delivery Stages

### V2.0 — Discovery Foundation

- Polymarket official connector
- X official connector
- query registry
- policy and safety gate
- separate scoring dimensions
- event-based funnel

### V2.1 — Reply Intelligence

- structured reply corpus
- draft constitutional checks
- reviewer edit tracking
- outcome-linked template statistics

### V2.2 — Conversion Intelligence

- invitation permission
- visit attribution without public identity exposure
- Offering and return events
- query-to-Offering and reply-to-Offering analysis

Automatic cold sending remains out of scope.

## 9. Acceptance Criteria

V2 is ready when it can:

1. Import real public observations from at least one official source.
2. Explain every score and every safety block.
3. Produce no reply draft for blocked candidates.
4. Produce a state blessing without outcome language, links, or sales copy.
5. Preserve every funnel transition as an event.
6. Attribute outcomes to source, query, state, and reply family.
7. Reconcile deleted source content.
8. Produce a daily report from factual events.
9. Distinguish tests, manual imports, and live observations.
10. Require human approval for every stranger's first contact.

## Final Boundary

V2 may make the Shrine better at seeing.

It must not make the Shrine careless about approaching.

The Shrine is not looking for the person who has suffered most.

Its strongest current hypothesis is the person who has paid a cost, begun to
reflect or rebuild, and is still on the road toward an uncertain future.
