# Shrine Attribution Layer V1.0 — Architecture Audit

Date: 2026-06-21  
Audit type: design-only, read-only repository review

## Files Reviewed

- `HANDOFF.md`
- `docs/FORTUNE_SHRINE_CANON.md`
- `scripts/distribution/v07/server.mjs`
- `scripts/distribution/v07/public/app.js`
- `scripts/distribution/v08/state/sent-history.json`
- `scripts/distribution/v08/output/latest.json`
- `server.mjs`
- `public/app.js`
- `data/shrine-memory-log.jsonl`

## Current Capability

| Stage | Current evidence | Attribution readiness |
| --- | --- | --- |
| Candidate discovery | Platform, username, post, community, time | Ready |
| Human send history | Post, username, blessing text, send time | Partial |
| Shrine visit | Browser-only analytics event | Not durable |
| Payment | Verified amount, Offering, wallet hash, time | Ready |
| Join across stages | No common attribution ID | Missing |

## Primary Gap

The system records both ends of the funnel but has no durable bridge between them.

```text
sent-history.json            shrine-memory-log.jsonl
post / user / blessing       wallet / amount / Offering
             \               /
              no shared key
```

## Recommended MVP

Introduce:

```text
attribution_id
visitor_id
session_id
send_event_id
blessing_id
```

Persist:

```text
send-events.jsonl
visit-events.jsonl
payment-events.jsonl
attribution-records.jsonl
```

Use deterministic links and first-party storage. Do not use fingerprinting,
probabilistic matching, an external analytics platform, a database cluster, or a
message queue.

## Technical Difficulty

**Medium**

Storage and reporting are low difficulty. Correctly preserving attribution through
link entry, refresh, payment recovery, and verified payment is medium difficulty.

## Estimated Development Time

**3–4 focused engineering days** for the V1 MVP, including tests.

## MVP Minimum Steps

1. Define and validate four schemas.
2. Add append-only event writers.
3. Add attribution and blessing IDs to future confirmed send records.
4. Produce an opaque attributed Shrine URL.
5. Persist visit attribution for 30 days.
6. Propagate it through payment intent and recovery.
7. Append verified payment events.
8. Reconcile and produce a daily report.
9. Test X, Polymarket, Direct, invalid, duplicate, and test-payment paths.

## Risks

### High-impact risks

- Test payments being counted as stranger revenue.
- Human sends not being marked, leaving the source event absent.
- Attribution lost during payment recovery.
- Duplicate blockchain callbacks producing duplicate payment events.

### Privacy risks

- Putting usernames or wallet addresses into links.
- Storing full referrer URLs with sensitive query parameters.
- Introducing browser fingerprinting to fill attribution gaps.

### Analytical risks

- Treating one conversion as proof that a blessing is superior.
- Mixing first-touch and last-touch metrics.
- Guessing attribution for direct visits.
- Comparing platforms without showing send and visit denominators.

## Safeguards

- Production/test environment field on every event.
- Unique payment by verified transaction signature.
- No raw IP collection.
- No personal data in attribution URLs.
- Explicit `unattributed` and `orphaned` states.
- Event logging failure must never interrupt payment or blessing release.
- Reports always display counts beside conversion rates.

## Future Expansion Space

The V1 event contracts support:

- behavior-stage analysis
- returning traveler cohorts
- source and blessing experiments
- time-to-payment analysis
- human-reviewed strategy recommendations
- later migration to a single relational database if file scale requires it

No production code, search logic, sending logic, candidate logic, blessing corpus,
or UI was modified during this design task.
