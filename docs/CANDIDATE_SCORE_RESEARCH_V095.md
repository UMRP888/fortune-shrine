# Fortune Shrine V0.95 Candidate Score Research

Status: research only

This score is not connected to production search, ranking, queueing, blessing
generation, or sending.

## Purpose

Candidate Score estimates whether a public post represents a safe, timely, and
relevant opportunity for a human-reviewed Fortune Shrine response.

It does not estimate a person's worth, vulnerability, or guaranteed payment
probability.

## Proposed Score: 0–100

| Dimension | Points | Question |
| --- | ---: | --- |
| Personal uncertainty | 0–20 | Is the author personally facing an unresolved outcome? |
| Concrete stakes | 0–20 | Is there a real cost, amount, deadline, launch, bet, or decision? |
| Emotional explicitness | 0–15 | Does the author state fear, hope, regret, waiting, or nervousness? |
| Ritual readiness | 0–15 | Is the author asking for luck, prayer, calm, restraint, or meaning? |
| Immediacy | 0–15 | Is the moment happening now or very soon? |
| Continue intention | 0–10 | Is the person still acting, rebuilding, waiting, or reflecting? |
| Contact safety | −30–5 | Is a respectful public response appropriate and safe? |

Maximum before penalties: 100.

## Safety Penalties

| Signal | Adjustment |
| --- | ---: |
| Severe crisis or self-harm language | −100 and do not contact |
| Explicit request not to be contacted | −100 |
| Minor or protected private context | −100 |
| Advertising, bot, media headline, or corporate promotion | −35 |
| Pure market analysis without personal state | −25 |
| Joke, meme, or engagement bait | −20 |
| Requests for predictions or financial advice | −15 |
| Post older than 24 hours | −10 |

## Interpretation

| Score | Meaning |
| --- | --- |
| 90–100 | Strong human-review candidate |
| 75–89 | Relevant candidate; review context carefully |
| 55–74 | Possible fit but weak intent or timing |
| 25–54 | Low-priority observation |
| 0–24 | Do not queue |

No score authorizes automatic contact.

## Example Scoring

### “I lost $5,000 and I can’t stop thinking about entering again.”

```text
Personal uncertainty       18
Concrete stakes            20
Emotional explicitness     14
Ritual readiness           10
Immediacy                  14
Continue intention          8
Contact safety              5
Total                      89
```

Suggested interpretation: strong but sensitive candidate. A response should bless
restraint and steadiness, never recovery of the loss.

### “I’m all in. Wish me luck.”

```text
Personal uncertainty       18
Concrete stakes            15
Emotional explicitness     11
Ritual readiness           15
Immediacy                  15
Continue intention         10
Contact safety              5
Total                      89
```

Suggested interpretation: immediate ritual readiness. Do not bless the wager or its
outcome.

### “Waiting for the results tomorrow. Nervous but hopeful.”

```text
Personal uncertainty       20
Concrete stakes            12
Emotional explicitness     15
Ritual readiness           11
Immediacy                  14
Continue intention          8
Contact safety              5
Total                      85
```

Suggested interpretation: high fit for a waiting-state blessing.

### “Prediction markets are useful forecasting tools.”

```text
Personal uncertainty        2
Concrete stakes             0
Emotional explicitness      0
Ritual readiness            0
Immediacy                   2
Continue intention          2
Contact safety              5
Total                      11
```

Suggested interpretation: topical relevance without traveler state.

### “gm”

```text
Personal uncertainty        0
Concrete stakes             0
Emotional explicitness      0
Ritual readiness            0
Immediacy                   1
Continue intention          0
Contact safety              4
Total                       5
```

## Validation Requirement

Before production use, score at least 100 manually reviewed posts and compare:

- reviewer agreement
- reply appropriateness
- real responses
- profile visits
- shrine visits
- Offering events

The score should only be revised from observed behavior. It must not be treated as
a conversion probability.
