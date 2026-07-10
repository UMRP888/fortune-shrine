# Fortune Shrine Trust + Payment + Output Canon V2

Date: 2026-07-03

This canon records the final direction for the official website trust layer, payment wording, and post-offering output layer.

It is a product canon, not an instruction to implement immediately.

No code should be changed from this document unless the user explicitly asks to execute it.

## Core Goal

This structure exists to solve three things:

- reduce the first Web3 reaction of “phishing / scam / malicious approval”
- preserve the black-gold minimal Shrine atmosphere
- make the payment path clear, calm, and impossible to misunderstand

## Offering Structure

The official offering structure is four levels:

```text
Traveler’s Offering — 5 USDC
Wanderer’s Offering — 10 USDC
Keeper’s Offering — 35 USDC
Sanctum Offering — 88 USDC
```

Rules:

- do not add hidden tiers
- do not change the order
- do not add complex financial explanations
- express only increasing ritual weight / ritual intensity

## Page System

The payment page has three layers.

### Layer 1 — Offering Emotional Layer

Purpose:

```text
Create the ritual entrance.
```

Requirements:

- keep black-gold visual style
- show four Offering levels
- each Offering has one short poetic/minimal line
- no security explanations here
- no technical terms here

### Layer 2 — Trust Layer

Placement:

```text
Above the QR Code / Wallet Button.
Visible by default.
Not collapsed.
```

Required copy:

```text
ALL OFFERINGS ARE STANDARD USDC TRANSFERS ON SOLANA.

No staking.
No token approvals.
No smart contract permissions.
No hidden access to your wallet.

Your wallet always remains fully in your control.

Payments are irreversible once sent on-chain.
```

Strongly recommended small text:

```text
We never request unlimited approvals or asset permissions.
```

### Layer 3 — Payment Execution Layer

QR mode:

```text
Scan Official Shrine Wallet
Solana / USDC only
```

Wallet mode:

```text
CONNECT WALLET & SEND
```

Button helper text:

```text
Standard transfer only — no approvals required
```

## Required Terminology

Use these terms consistently:

```text
Recipient -> Official Shrine Wallet
Verification Details -> Payment Notes
Pay With Wallet -> Connect Wallet & Send
```

## User Psychology Path

Correct path:

```text
Offering
↓
Trust Layer
↓
Payment
```

Avoid this path:

```text
Wallet Connect
↓
Risk association
↓
Exit
```

## Non-Removable Security Semantics

The payment page must clearly communicate all four:

- No token approvals
- No smart contract permissions
- Wallet never accessed
- Standard transfer only

If any one is missing, trust is weakened.

## UI Tone Constraints

Allowed:

- black-gold / dark minimal style
- ritual language
- very short lines
- silence and spacing

Forbidden:

- red warning blocks
- long legal text
- heavy technical explanation
- pop-up security warnings
- audit-dashboard feeling

## Payment Definition

Fortune Shrine is not a crypto tool.

It is a ritual interface for standard on-chain USDC offerings.

## Output Layer Definition

An Offering must not end at payment.

After a completed Offering, the system should generate a shareable:

```text
Blessing Artifact
```

This artifact is not an investment asset and not an NFT collection narrative.

It is:

- emotional proof
- ritual record
- shareable content unit

## Output Type

Core output:

```text
Blessing Card
```

Possible forms:

- Digital Blessing Card
- Share Image Card
- Ritual Receipt
- Optional future NFT / SBT ritual record

## Blessing Card Structure

Each Blessing Card should contain:

### 1. Emotional Statement

Examples:

```text
A calm light during market turbulence.
A quiet blessing before risk.
Something was released into the market silence.
```

### 2. Time Binding

Include:

- date
- optional market state

Examples:

```text
During volatile market conditions
2026.07.02
```

### 3. Weak Identity / Wallet Marker

Optional:

- partially hidden wallet hash
- anonymous ritual id

The goal is to create event presence, not identity exposure.

### 4. Shrine Signature

Fixed ending:

```text
Fortune Shrine · Blessing Recorded
```

## Distribution Purpose

The Blessing Card exists to be:

```text
screenshotted / forwarded / quoted
```

Growth loop:

```text
User completes Offering
↓
System generates Blessing Card
↓
User shares on X / Telegram
↓
Others see emotional artifact
↓
New users enter site
↓
Loop repeats
```

## Product Boundaries

Do not turn the Output Layer into:

- financial product
- NFT speculation
- trading result badge
- profit proof
- prediction artifact

Only build:

```text
emotion + ritual + shareable result
```

## Relationship Between Payment and Output

```text
Payment = door
Output = growth engine
```

Payment handles the USDC transfer.

Output creates the shareable artifact.

## First Flame Invitation

Long-term early-user operating mode:

```text
First Flame Invitation
```

This is a manual invitation path for early users, community replies, DMs,
testers, and real feedback collection.

It is not a public free trial.
It is not a discount mechanic.
It is not a fifth Offering tier.
It must not alter the official four Offering structure.

Recommended manual flow:

```text
User replies / comments / DMs
-> Founder sends one invitation code or invitation link
-> Invitee enters the Shrine
-> Invitee receives one free Blessing Card experience
-> Founder records the invitation manually at first
```

Recommended founder record format:

```text
FLAME-001 -> @username -> sent
FLAME-002 -> @username -> sent
FLAME-003 -> @username -> sent
```

Required tone:

- use `First Flame Invitation`
- optionally use `Guest Blessing`
- do not use `free trial`
- do not make the public site feel like a coupon or discount page
- do not create loud free language on the homepage

Constraints:

- each invitation should be one-use or tightly limited
- invitation unlocks one Blessing Card experience
- no hidden paid tiers
- no prediction, signal, advice, or financial promise
- no change to payment logic unless explicitly requested

Current implementation note:

- `server.mjs` accepts `POST /api/invitations/claim`
- default accepted codes are `FLAME-001` through `FLAME-200`
- production can override the accepted set with `FIRST_FLAME_INVITATION_CODES`
- each code is one-use per running server process
- the browser also remembers used invitation codes locally
- invitation events are marked as `INVITATION`, not USDC payment
- the public page accepts either manual code entry or `?invite=FLAME-001`

Positioning:

```text
Paid Offering = formal ritual
Invitation = invited first flame
```

Purpose:

The invitation path lowers the first-use barrier while protecting the ritual
atmosphere. It should create real feedback and shareable Blessing Cards without
making Fortune Shrine feel like software, coupons, or growth-hack mechanics.

## NFT / On-Chain Extension

Future optional expansion may include:

- Blessing NFT
- Ritual Proof
- SBT / Soulbound Token

But only as ritual records.

Forbidden:

- financial asset framing
- speculation framing
- collectible floor-price framing
- implication of market value

## Implementation Priority

Recommended sequence:

1. Trust + Payment wording layer
   - low complexity
   - low stability risk
   - mostly frontend copy / terminology
   - do not change payment logic

2. Minimal Blessing Card
   - static shareable card after completed Offering
   - no NFT
   - no complex chain verification
   - no architecture expansion unless necessary

3. NFT / SBT ritual record
   - future only
   - not V1

## Final Principle

Fortune Shrine does not sell rituals.

It generates shareable emotional artifacts from completed rituals.
