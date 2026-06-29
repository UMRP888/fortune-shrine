# Fortune Shrine Attribution Roadmap

Status: architecture design only  
Scope: attribution and conversion observation

## Guiding Rule

The roadmap improves the Shrine's ability to learn from factual behavior.

It does not authorize:

- automatic replies
- automatic direct messages
- automatic follows or likes
- outcome-based blessing language
- opaque user profiling
- probabilistic identity matching

## V1 — Basic Attribution

Goal:

```text
Know which source and outbound blessing preceded a visit and verified Offering.
```

### Deliverables

- append-only send, visit, and payment JSONL files
- opaque `attribution_id`
- stable outbound `blessing_id`
- random first-party `visitor_id` and per-visit `session_id`
- attributed Shrine links
- first-touch and last-touch rules
- payment-intent attribution context
- derived attribution records
- factual daily report
- explicit test/production separation

### Questions answered

- Did this sent blessing produce a visit?
- Did this visit produce a verified Offering?
- Was the source X, Polymarket, Direct, or Other?
- Which outbound blessing IDs have produced payments?
- Where did the first verified stranger payment come from?

### Storage

```text
JSONL + atomic JSON reports
```

### Acceptance criteria

1. A test X send can be traced to a test visit and test payment.
2. A test Polymarket send can be traced through the same chain.
3. Direct visits remain direct.
4. Invalid IDs never receive guessed attribution.
5. Duplicate verified signatures never create duplicate revenue.
6. Existing payment and blessing flows still complete if attribution logging fails.
7. Production reports exclude test and development events.

### Estimated implementation

```text
3–4 focused engineering days
```

## V2 — User Behavior Analysis

Goal:

```text
Understand how travelers move through the Shrine after arrival.
```

V2 begins only after V1 has collected enough real events.

### Possible additions

- return visits
- time from send to visit
- time from visit to Offering
- Offering selection by source
- abandonment stage
- first-time vs returning traveler
- blessing family and candidate-state cohorts
- source and segment retention
- privacy-safe weekly cohort reports

### New event types

Potential events:

```text
ritual_started
offering_viewed
offering_selected
payment_intent_created
payment_verified
blessing_revealed
return_visit
```

These are observational events. They must not turn the Shrine into a visible SaaS
funnel or change the ritual UI.

### Questions answered

- Where do visitors leave?
- Which Offering is selected by each source?
- How long does conversion take?
- Do paid travelers return?
- Which states lead to deeper ritual participation?

### Technical direction

Continue using JSONL while volume remains modest. Add:

- monthly partitions
- deterministic compaction
- schema versioning
- aggregate cohort files

No database cluster is required at this stage.

### Estimated implementation

```text
4–6 engineering days after V1 data exists
```

## V3 — Strategy Optimization

Goal:

```text
Use observed conversion evidence to recommend better human-reviewed outreach.
```

V3 must not automatically send.

### Possible capabilities

- rank blessing families using minimum sample thresholds
- compare X and Polymarket by verified conversions
- identify candidate-state cohorts with stronger observed response
- recommend platform and time allocation
- suggest which approved blessing family fits a candidate state
- detect declining source quality
- generate experiment proposals

### Required safeguards

- human approval remains mandatory
- no optimization toward gambling losses or vulnerable people
- no recommendation based on protected traits
- no claim of causal certainty from small samples
- display denominators and confidence intervals
- minimum sample threshold before declaring a winner
- holdout or alternating experiments where practical
- preserve the Constitution: bless the state, never the outcome

### Questions answered

- Where should the operator spend the next hour?
- Which blessing family deserves another controlled test?
- Which source has enough evidence to justify more attention?
- Which apparent success is only a small-sample artifact?

### Future infrastructure threshold

Remain on JSONL until at least one of these occurs:

- event files are too large for reliable daily scans
- concurrent writers cannot be serialized safely
- reporting regularly exceeds acceptable execution time
- multiple production instances need shared writes

Only then consider a single managed relational database. A message queue or data
warehouse remains unnecessary until substantially larger verified traffic exists.

### Estimated implementation

```text
1–2 weeks after sufficient V1/V2 real-world data
```

## Recommended Sequence

```text
V1: prove deterministic attribution
↓
collect real sends, visits, and verified payments
↓
V2: describe actual traveler behavior
↓
collect sufficient cohort samples
↓
V3: recommend, never autonomously act
```

The next engineering decision should be based on observed V1 data, not on the
desire for a more elaborate architecture.
