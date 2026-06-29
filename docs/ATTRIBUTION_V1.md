# Fortune Shrine Attribution Layer V1.0

Status: architecture design only  
Date: 2026-06-21

## 1. Objective

Shrine Attribution Layer V1 connects four facts that currently exist separately:

```text
Candidate
→ Sent blessing
→ Shrine visit
→ Verified Offering
```

It must answer:

- Where did a paying traveler first come from?
- Which sent blessing preceded a visit or Offering?
- Which platform produces the highest verified conversion rate?
- Which candidate segment most often reaches the Shrine?
- Did the first stranger payment come from X, Polymarket, Direct, or Other?

It must not:

- automate sending
- change candidate discovery or scoring
- change blessing generation
- identify anonymous visitors through fingerprinting
- infer attribution when no evidence exists
- treat test payments as stranger payments

## 2. Current-State Audit

### Already available

Search and candidate records already contain:

- platform
- username
- profile URL
- post ID and post URL
- discovered time
- source community
- candidate score and freshness

The send history already supports:

- `postId`
- `username`
- sent blessing text
- `sentAt`
- `status`

The payment and Shrine memory flow already supports:

- payment intent ID
- hashed payer wallet
- amount and token
- Offering type
- verification time and method
- verified transaction signature
- the blessing revealed after payment

### Missing

There is no stable identifier joining:

```text
sent-history
→ landing visit
→ payment intent
→ verified payment
```

There is also no durable visit-event log. Current browser analytics events are
placed in `dataLayer`, emitted as browser events, and printed to the console, but
they are not a permanent attribution record.

Therefore current payment records cannot establish which external blessing,
candidate, or source caused the visit.

## 3. MVP Principle

Use deterministic, evidence-based attribution only.

The MVP introduces one opaque identifier:

```text
attribution_id
```

Example:

```text
atr_7YpN4fZ2uX8qR6sL9cKm3A
```

Properties:

- generated from at least 128 random bits
- URL-safe
- contains no username, wallet, platform, or post ID
- created before or when a blessing is marked sent
- carried in a Shrine link as `?a=<attribution_id>`
- stored in the visitor's first-party browser storage
- copied into visit, payment, and attribution records

The link may only be shared when the human operator decides that a link is
appropriate. Attribution does not change the existing no-spam or human-review
policy.

## 4. Source Taxonomy

Canonical `source` values:

| Source | Meaning |
| --- | --- |
| `x_reply` | A unique Shrine link shared in or after an X reply |
| `x_profile` | Visit from a Shrine link placed on an X profile |
| `polymarket` | Visit from a Polymarket comment, profile, or conversation |
| `direct` | No usable referrer and no valid attribution ID |
| `other` | Known source outside the supported taxonomy |

Additional fields preserve detail:

```json
{
  "source": "x_reply",
  "source_platform": "X",
  "source_surface": "reply",
  "source_post_id": "2068534613102759995",
  "source_post_url": "https://x.com/example/status/2068534613102759995"
}
```

`direct` must remain a valid result. The system must not force a guessed source.

## 5. Identity and Privacy Model

### Operational identity

The send event may contain the public username and public platform user ID because
the operator already needs them to conduct and audit a public interaction.

### Visitor identity

The Shrine creates a random first-party `visitor_id`. It is not derived from:

- IP address
- browser fingerprint
- wallet
- X account
- Polymarket wallet

### Payment identity

Only a one-way `wallet_hash` is stored in attribution logs. The raw wallet may
remain available in the verified blockchain transaction, but it should not be
duplicated into analytics files.

### Separation

Visit and payment logs use `attribution_id`; they do not need the public username.
The username is recovered only when an authorized report joins back to the
send event.

Never place a username, wallet, post text, or blessing text in the attribution URL.

## 6. Blessing Identity

The outbound blessing must receive a stable `blessing_id`.

V1 supports both curated and generated replies:

```text
Curated asset:
blessing_id = corpus entry ID

Generated or edited reply:
blessing_id = "b_" + first 20 chars of SHA-256(normalized exact sent text)
```

The send event stores:

- `blessing_id`
- exact sent-text snapshot
- optional component IDs
- generator version

This allows attribution even when a human edits the draft before sending.

The blessing revealed after payment is a different object:

```text
outbound_blessing_id
shrine_blessing_id
```

They must never be conflated.

## 7. Event Files

Recommended directory:

```text
/data/attribution/
```

Files:

```text
send-events.jsonl
visit-events.jsonl
payment-events.jsonl
attribution-records.jsonl
dead-letter-events.jsonl
daily-attribution-report.json
```

Use append-only JSONL for source events.

Use atomic replacement for derived JSON reports:

```text
write temporary file
→ fsync when practical
→ rename
```

No database cluster, message queue, or external analytics service is required.

## 8. Event Lifecycle

### Send

When a human marks a blessing as sent:

1. Generate or reuse `send_event_id`.
2. Generate `attribution_id`.
3. Resolve `blessing_id` from the exact sent text.
4. Append one send event.
5. Produce a copyable attributed Shrine URL.

Marking a record `unmarked` does not delete history. Append a corrective event or
set `status=voided` in a later materialized record.

### Visit

When the Shrine loads:

1. Read `a` from the URL.
2. Validate its format.
3. Resolve source from the send event if the ID exists.
4. Generate or load random `visitor_id`.
5. Generate a new `session_id`.
6. Append a visit event.
7. Store the accepted `attribution_id` first-party for 30 days.
8. Remove the attribution query from the visible URL with `history.replaceState`
   when implementation begins.

If there is no valid ID:

- classify from safe referrer origin when possible
- otherwise use `direct`

### Payment

When a payment intent is created:

1. Copy active `attribution_id`, `visitor_id`, and `session_id` into the intent.
2. Preserve those identifiers during recovery.
3. On verified USDC transfer, append a payment event.
4. Mark test/admin/recovery payments explicitly.

Only `payment_status=verified` and `environment=production` count as revenue.

### Attribution record

A small reconciliation job joins:

```text
send_event.attribution_id
visit_event.attribution_id
payment_event.attribution_id
```

It writes a derived attribution record. Source events remain immutable.

## 9. Attribution Rules

V1 uses two deterministic views:

### First touch

The earliest valid external attribution attached to the visitor within 30 days.

Use for:

- where new travelers originate
- first stranger payment source
- platform acquisition comparisons

### Last touch

The most recent valid external attribution before payment within 7 days.

Use for:

- which recent blessing or conversation preceded payment
- operational follow-up analysis

### Direct visits

Direct must not overwrite a known external first touch during its 30-day window.

### Conflicts

Priority is based on evidence, not platform preference:

1. valid `attribution_id`
2. known campaign parameter generated by Fortune Shrine
3. safe referrer origin
4. `direct`

No fingerprint-based or time-proximity guessing is allowed.

## 10. Core Metrics

### Platform

```text
visits_by_source
verified_payments_by_source
unique_payers_by_source
offering_amount_by_source
visit_to_payment_rate
send_to_visit_rate
send_to_payment_rate
```

### Blessing

```text
sends_by_blessing_id
visits_by_blessing_id
payments_by_blessing_id
unique_payers_by_blessing_id
verified_amount_by_blessing_id
```

Display the underlying counts beside every rate. A blessing with one send and one
payment must not be presented as conclusively superior.

### Candidate segment

Snapshot at send time:

```text
candidate_category
state_tags
community
source_platform
freshness_score
```

This enables comparisons such as:

- waiting vs loss vs risk
- Polymarket user vs crypto trader
- fresh post vs older post

## 11. MVP Reports

V1 should generate:

```text
attribution-summary.json
ATTRIBUTION_DAILY.md
```

Required report sections:

- first-touch visits and payments by source
- last-touch visits and payments by source
- top outbound blessings by sends, visits, and payments
- candidate segments by sends, visits, and payments
- unattributed/direct share
- test-payment count excluded from revenue
- first verified stranger payment, if one exists

## 12. Failure Handling

- Invalid attribution IDs are logged as rejected without crashing the Shrine.
- Event writes must never block payment verification or blessing release.
- Failed appends go to a bounded dead-letter log.
- Duplicate events are ignored by `event_id`.
- A payment event is unique by verified transaction signature.
- Missing send events produce `attribution_status=orphaned`, not guessed identity.
- Missing attribution produces `attribution_status=unattributed`.

## 13. Security and Retention

- Do not store raw IP addresses.
- Do not implement browser fingerprinting.
- Store referrer origin and path only; strip query parameters and fragments.
- Redact known secret parameters before logging landing URLs.
- Hash wallet addresses with a server-side pepper if cross-session wallet
  comparison is required.
- Restrict attribution files to operator access.
- Rotate JSONL files monthly or at a practical size threshold.
- Suggested raw-event retention: 180 days.
- Suggested username and source-post snapshot retention: 90 days, then retain
  aggregate statistics or hashed public user ID.
- Keep verified payment accounting records according to financial requirements,
  separate from behavioral analytics retention.

## 14. Technical Difficulty

**Medium**

The storage mechanism is simple. The main difficulty is preserving one attribution
identifier across:

- a human sending workflow
- an external link
- browser refresh and return
- payment intent creation and recovery
- verified on-chain payment

The design deliberately avoids complex infrastructure.

## 15. Estimated Development Time

MVP engineering estimate:

```text
Event schemas and append-only writer       0.5 day
Send-event integration and link creation   0.5 day
Visit capture and first-party persistence  0.5 day
Payment-intent propagation                 0.5 day
Reconciliation and reports                 0.5–1 day
Tests and failure validation               0.5 day
```

Total:

```text
3–4 focused engineering days
```

This estimate excludes production deployment waiting time and real conversion-data
collection.

## 16. MVP Minimum Implementation Steps

1. Create `/data/attribution/` and append-only writers.
2. Add schema validation for four V1 record types.
3. Add `attribution_id`, platform, candidate snapshot, and `blessing_id` to new
   send records.
4. Generate a copyable attributed Shrine URL after human approval.
5. Capture a landing visit and preserve attribution for 30 days.
6. Copy attribution identifiers into payment intent and payment recovery state.
7. Append a payment event only after existing verification succeeds.
8. Reconcile events into `attribution-records.jsonl`.
9. Generate a daily factual report.
10. Validate with test traffic before counting any stranger conversion.

## 17. Future Expansion

The event model can later support:

- repeat-visit and time-to-payment analysis
- blessing family experiments
- candidate-state cohorts
- first-touch and multi-touch comparisons
- returning traveler analysis
- privacy-safe aggregate dashboards
- strategy recommendations requiring human approval

It does not require changing the V1 JSONL event contracts.
