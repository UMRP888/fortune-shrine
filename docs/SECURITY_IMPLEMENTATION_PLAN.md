# Security Implementation Plan

Version 1.0

## Purpose

This document turns the first security model into an implementation plan.

Goal:

Make Fortune Shrine safe enough to accept small-scale real users and real USDC payments without violating the canon.

## The Three Required Layers

Fortune Shrine needs three layers before real launch:

1. Payment Verification Layer
2. Content Safety Layer
3. Basic Protection Layer

These should be built before public paid traffic.

## Layer 1: Payment Verification

### Goal

The frontend must never decide whether payment is real.

The backend must verify:

- offering id
- amount
- token
- chain
- recipient address
- transaction hash
- confirmation status
- whether the transaction was already used

### Required Backend Objects

#### Offering

Canonical server-side price map:

```ts
const OFFERINGS = {
  traveler: { name: "Traveler's Offering", amount: "5", token: "USDC" },
  keeper: { name: "Keeper's Offering", amount: "15", token: "USDC" },
  sacred: { name: "Sacred Offering", amount: "35", token: "USDC" },
  eternal: { name: "Eternal Offering", amount: "88", token: "USDC" }
};
```

The frontend may display this data.

Only the backend may enforce it.

#### Payment Intent

Minimum fields:

```text
id
offering_id
expected_amount
expected_token
expected_chain
recipient_address
status
created_at
expires_at
verified_tx_hash
verified_at
```

Allowed statuses:

```text
created
pending
verified
expired
failed
```

### Required API Endpoints

#### POST /api/payment-intents

Input:

```json
{
  "offeringId": "sacred"
}
```

Backend:

- validates offering id
- creates payment intent
- returns payment instructions

Output:

```json
{
  "paymentIntentId": "pi_...",
  "offeringName": "Sacred Offering",
  "amount": "35",
  "token": "USDC",
  "chain": "base",
  "recipientAddress": "0x..."
}
```

#### POST /api/payment-intents/:id/verify

Input:

```json
{
  "txHash": "0x..."
}
```

Backend verifies:

- transaction exists
- chain is correct
- token contract is correct
- recipient is correct
- amount matches expected amount
- transaction hash has not been used
- payment intent is not expired
- transaction has required confirmations

Output:

```json
{
  "status": "verified"
}
```

### Frontend Flow

```text
User chooses offering
Frontend calls POST /api/payment-intents
Payment modal displays backend-provided amount and recipient
User pays
Frontend submits tx hash for verification
Backend verifies payment
Only then ritual begins
```

### Do Not Do

- do not trust frontend amount
- do not trust frontend payment status
- do not unlock ritual from wallet callback alone
- do not accept arbitrary token transfers
- do not request unlimited token approval
- do not store private keys in the app

### MVP Payment Recommendation

Start with one chain and one token.

Recommended MVP pattern:

```text
Base USDC transfer to fixed recipient
```

Keep it simple until real usage proves the ritual.

## Layer 2: Content Safety

### Goal

The Shrine must never output prediction, instruction, trading advice, financial promise, or manipulative language.

### Current Safe Choice

Use curated blessing library first.

Do not use fully dynamic AI blessings until the filter system exists.

### Blessing Quality Gate

Every blessing must pass:

- Recognition
- Blessing
- Mystery
- Universal meaning
- Sacred tone
- Emotional truth
- No prediction
- No instruction
- No guarantee
- No judgment
- No financial promise

### Forbidden Phrase Filter

Reject outputs containing direct action language:

```text
buy
sell
enter
exit
invest
wait
act now
open position
close position
long
short
leverage
guaranteed
profit
returns
win
wealth will come
you will succeed
```

### AI Blessing Pipeline

Only if AI is introduced:

```text
User context
Sanitize input
Generate candidate blessing
Run forbidden phrase filter
Run structure check
Run tone check
Fallback to curated blessing if unsafe
Return safe blessing
Log rejection reason
```

### Required Content Endpoints

#### POST /api/blessings/generate

Input:

```json
{
  "paymentIntentId": "pi_..."
}
```

Backend:

- confirms payment intent is verified
- selects curated blessing or generates safe blessing
- returns one blessing

Output:

```json
{
  "witness": "I see the light you carry.",
  "blessing": "May it remain warm through the longest night.",
  "echo": "The stars follow paths unseen."
}
```

### Do Not Do

- do not expose the full blessing library through a public API
- do not let user input directly control blessing output
- do not generate financial advice
- do not generate personalized trading hints
- do not imply bigger offering gives better blessing

## Layer 3: Basic Protection

### Goal

Protect the shrine from ordinary production attacks and operational failure.

### Required Protections

#### Rate Limiting

Apply to:

- payment intent creation
- payment verification
- blessing generation
- any future user input endpoint

Basic limits:

```text
IP-based limit
wallet-based limit if wallet exists
payment-intent-based limit
```

#### Security Headers

Use:

```text
Content-Security-Policy
X-Frame-Options or frame-ancestors
X-Content-Type-Options
Referrer-Policy
Permissions-Policy
Strict-Transport-Security in production
```

#### Logging

Log:

- payment intent created
- payment verification failed
- payment verified
- reused tx hash attempt
- wrong token
- wrong chain
- wrong amount
- rate limit hit
- blessing rejected by safety filter

Do not log:

- sensitive private user context
- wallet signatures beyond what is necessary
- secrets

#### Error Handling

Failure states must be calm.

Examples:

```text
The payment is still being verified.
The Shrine has not received the flame yet.
Please check the network and try again.
```

Avoid:

```text
Failed!
Error!
Payment rejected!
```

#### Official Domain And Anti-Phishing

Before public payment:

- choose official domain
- display official domain in wallet/payment instructions
- do not request broad approvals
- avoid wallet signatures unless necessary
- publish official links from controlled accounts only

## Suggested Implementation Order

### Step 1: Backend Skeleton

Create:

```text
/api/payment-intents
/api/payment-intents/:id/verify
/api/blessings/generate
```

Add:

- environment variables
- canonical offering map
- payment intent storage
- structured error responses

### Step 2: Payment Intent Storage

Use simple storage first:

- SQLite
- Postgres
- or hosted database

Required tables:

```text
payment_intents
used_transactions
blessing_events
```

### Step 3: Chain Verification

Integrate one chain RPC provider.

Verify:

- tx hash
- transfer event
- token contract
- recipient
- amount
- confirmations

### Step 4: Frontend Payment Modal

Replace simulated payment with:

```text
Create payment intent
Show payment instructions
Wait for wallet transfer or tx hash
Verify payment
Begin ritual
```

### Step 5: Blessing Gate

Move blessing generation behind backend verification.

Frontend should request blessing only after verified payment.

### Step 6: Rate Limits And Logs

Add rate limits before public testing.

Add basic logs before real money.

### Step 7: Security Headers

Add production headers and CSP.

### Step 8: Small Paid Test

Limit launch to small traffic.

Observe:

- payment completion rate
- verification failures
- support issues
- bot attempts
- user emotional response

## Minimum Launch Checklist

Do not accept real USDC until all are true:

- backend creates payment intents
- backend owns offering prices
- backend verifies tx hash
- backend rejects wrong token
- backend rejects wrong chain
- backend rejects wrong recipient
- backend rejects wrong amount
- backend rejects reused tx hash
- payment intent expires
- blessing is gated behind verified payment
- rate limiting is active
- logs are active
- no frontend secrets
- no broad wallet approval
- no prediction or trading language
- official domain is clear

## Engineering Rule

If a shortcut can lose user funds, do not take it.

If a shortcut can make the Shrine look like financial advice, do not take it.

If a shortcut can make the ritual feel like a cheap transaction, do not take it.
