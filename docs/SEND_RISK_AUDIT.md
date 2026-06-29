# Fortune Shrine Auto Send MVP — Risk Audit

Status: architecture design only  
Date: 2026-06-21

## Audit Conclusion

The current V0.7 sender is not an automatic sender.

It is a draft-opening and draft-filling tool with a manual final send and a manual
sent marker.

The safest MVP is:

```text
Human Approve
→ separate human Send action
→ one mechanical platform send
→ provider receipt
→ append-only send event
```

Anything that sends immediately after discovery, draft generation, or approval is
outside the approved MVP.

## Current Module Risk Findings

### 1. No explicit approval state

Severity: High

A selected radio button is temporary browser state. It is not durable consent to
send.

Required control:

- explicit Approve
- explicit Reject
- immutable approval snapshot

### 2. “Mark sent” is not send proof

Severity: High

The current operator can mark a record sent even if:

- X failed
- the reply was never submitted
- the reply was hidden
- the wrong account sent it
- the wrong post was open

Required control:

- provider message ID or public reply URL
- otherwise `unconfirmed`, not `sent`

### 3. Duplicate-send risk

Severity: High

Multiple clicks, retries, reopened tabs, or stale local state could produce a
second reply.

Required control:

- `candidate_id`
- `send_request_id`
- one sent reply per source post
- provider receipt deduplication

### 4. Account authorization risk

Severity: High

Mechanical sending requires the correct Fortune Shrine account and current
platform write permission.

Required control:

- verify account identity before each send session
- verify current write authorization before implementation
- stop on 401, 403, 429, checkpoint, warning, or forced login

### 5. Platform-policy risk

Severity: High

Repeated automated replies may be classified as spam or platform manipulation even
when the text is benign.

Required control:

- human approval for every item
- no batch action
- no continuous sending
- no automatic retry
- conservative daily caps during validation
- no repeated identical blessing
- public-context relevance

### 6. Approval/text mismatch

Severity: High

If text remains editable after approval, the executor may send something the human
did not approve.

Required control:

- exact text hash
- blessing ID
- reject send if text hash changes

### 7. Wrong destination

Severity: High

A stale tab or DOM reference can target the wrong post.

Required control:

- destination post ID is part of approval
- adapter verifies destination before send
- no cached editor or tab reference as authority

### 8. Browser automation instability

Severity: Medium–High

The current X composer integration has historically required DOM and editor
diagnostics. Draft insertion success does not prove send reliability.

Required control:

- prefer a documented official write API when available
- if browser-assisted, verify the created reply URL
- classify missing receipt as `unconfirmed`

### 9. Rate-limit and account-health risk

Severity: High

Fast consecutive sends may create:

- rate limits
- challenges
- login resets
- reduced reply visibility
- account restrictions

Required circuit breakers:

```text
401 / 403 / 429
captcha or checkpoint
forced login
account warning
reply visibility failure
two consecutive unknown send failures
```

Any trigger disables the executor until human review.

### 10. Content safety risk

Severity: High

A grammatically valid blessing can still be inappropriate for:

- severe crisis
- self-harm language
- a minor
- harassment
- a request for financial prediction
- a clearly private or sensitive situation

Required control:

- contact-safety check before Approve
- Constitution check on exact final text
- Reject remains available
- no send to blocked candidates

### 11. Attribution integrity risk

Severity: Medium

If attribution IDs are generated after send or copied incorrectly, conversion
records cannot be trusted.

Required control:

- create attribution ID before execution
- store it in the approved job
- append it to the send event atomically with the receipt

### 12. Logging sensitive data

Severity: Medium

Logs can accidentally capture:

- browser cookies
- access tokens
- full debug payloads
- private account metadata

Required control:

- never log auth headers or cookies
- do not store browser profiles
- store only public destination and normalized provider result
- redact provider error bodies

### 13. Local file concurrency

Severity: Medium

Multiple local processes could corrupt JSON state.

Required control:

- one writer process
- append-only JSONL events
- atomic replacement of derived state
- startup integrity scan

### 14. False scale confidence

Severity: Medium

Five successful sends do not prove that 100 daily sends are safe.

Required validation:

```text
5 test-account sends
→ 20 human-approved production sends
→ review account health and visibility
→ decide whether to continue
```

No automatic increase.

## Required Safety Invariants

The implementation must always satisfy:

```text
No approval → no send
Rejected → no send
Changed text → new approval
Changed destination → new approval
One click → at most one send
No provider receipt → not confirmed sent
Failure → no automatic retry
Account warning → stop
One source post → at most one Shrine reply
```

## Recommended Initial Limits

These are validation limits, not growth targets:

```text
one item per Send action
minimum 15 seconds between completed attempts
maximum 5 test-account sends in first validation
maximum 20 production sends before formal review
```

The executor should not contain a timer that automatically sends when the delay
expires. The delay only blocks another human-triggered attempt.

## Unsupported Actions

The MVP must not support:

- auto approve
- send all approved
- send next automatically
- scheduled sends
- automatic retry
- direct messages
- likes
- follows
- reposts
- deleting or editing platform posts
- account switching

## Risk by Implementation Option

| Option | Reliability | Account safety | Evidence quality | Recommendation |
| --- | --- | --- | --- | --- |
| Official X write API | High if authorized | Best controllability | Provider message ID | Preferred |
| Existing browser extension clicks Reply | Medium/low | Higher UI and account risk | Must recover reply URL | Fallback only |
| Generic browser automation | Low | High risk | Weak without receipt | Do not use |
| Polymarket DOM automation | Unknown | Unknown | Weak | Do not implement in MVP |

## Go / No-Go Conditions

### Go

- confirmed Fortune Shrine account
- verified platform write permission
- one-item executor
- Approve and Reject implemented
- immutable exact-text approval
- idempotency test passes
- provider receipt captured
- stop conditions tested

### No-Go

- no provider write authorization
- only DOM click automation available without receipt
- account checkpoint or warning
- inability to distinguish sent from unconfirmed
- inability to prevent duplicate reply
- inability to freeze approved text

## Technical Difficulty

**Medium–High**

## Estimated Development Time

**4–5 focused engineering days**, assuming verified X write authorization.

## Recommended Implementation Order

1. Approval and rejection state model.
2. Candidate, blessing, attribution, and send-request IDs.
3. Append-only approval and send logs.
4. Idempotency and immutable text checks.
5. One X send adapter with provider receipt.
6. Circuit breakers.
7. Test-account validation.
8. Twenty-item human-approved production validation.

Do not implement auto approval or additional platforms during this MVP.
