# Security Model

Version 1.0

## Purpose

This document lists the attacks Fortune Shrine can currently imagine and the defenses the product should build before real money, wallets, accounts, or saved history are introduced.

This is not legal advice.

This is not a full audit.

It is the first threat model for the first shrine.

## Security Principle

Fortune Shrine must protect:

- the user's funds
- the user's trust
- the user's emotional state
- the canon
- the payment flow
- the blessing boundary
- the brand from being reframed as prediction, gambling, or financial advice

## Current MVP Status

Current working preview:

- static local prototype
- simulated payment
- no real wallet
- no backend
- no database
- no user accounts
- no saved personal data

Current risk is low because no real funds or personal data are handled.

Risk rises sharply when real USDC payment, wallet connection, saved history, or AI-generated blessings are added.

## Threat 1: Fake Payment Completion

Attack:

A user or bot modifies frontend state to show the ritual as paid.

Current impact:

Low in simulation.

Real payment impact:

High.

Defense before real payment:

- never trust frontend payment state
- verify payment server-side or against chain data
- bind payment to amount, token, chain, recipient, timestamp, and nonce
- store payment intent status
- make payment completion idempotent

Rule:

The frontend may display ritual state.

The backend must decide payment truth.

## Threat 2: Amount Tampering

Attack:

The user changes the selected amount in the browser before payment confirmation.

Defense:

- backend creates payment intent with canonical offering id
- backend maps offering id to price
- frontend never decides final price
- reject mismatched amount
- reject unknown offering id

Canonical offerings:

- Traveler's Offering: 5 USDC
- Keeper's Offering: 15 USDC
- Sacred Offering: 35 USDC
- Eternal Offering: 88 USDC

## Threat 3: Wrong Token Or Wrong Chain

Attack:

User sends the wrong token, wrong chain, wrong recipient, or fake token.

Defense:

- define accepted chain clearly
- define accepted USDC contract address clearly
- verify token contract address
- verify recipient address
- verify exact or minimum expected amount
- display network clearly before payment
- do not accept arbitrary tokens in MVP

## Threat 4: Replay Attack

Attack:

An old transaction hash is reused to claim a new ritual.

Defense:

- store used transaction hashes
- bind transaction to a payment intent
- reject already-used hashes
- expire unpaid payment intents
- require confirmation block threshold if using chain data

## Threat 5: Fake Wallet Callback

Attack:

Frontend receives a fake wallet success response or a malicious script simulates success.

Defense:

- wallet callback is not final proof
- verify on backend
- only unlock ritual after backend verified status
- show pending state until verification completes

## Threat 6: Bot Abuse

Attack:

Bots repeatedly generate blessings, overload APIs, scrape blessing output, or test payment flows.

Defense:

- rate limit by IP, wallet, session, and payment intent
- add bot friction only where needed
- cache static assets
- avoid expensive generation for unpaid sessions
- log abnormal request patterns

Do not add aggressive friction to the sacred ritual unless abuse requires it.

## Threat 7: Blessing Library Scraping

Attack:

Competitors scrape the blessing library and reuse lines.

Defense:

- accept that some surface text can be copied
- keep improving reviewed blessing quality
- avoid exposing full library through public API
- return one blessing per completed ritual
- consider server-side blessing selection after real payment
- maintain internal blessing quality notes outside the client bundle

Long-term moat:

The library, timing, trust, and atmosphere together are harder to copy than text alone.

## Threat 8: Prompt Injection

Applies if AI-generated blessings are introduced.

Attack:

User input tries to force the model to output trading advice, predictions, harmful content, or system prompts.

Defense:

- do not send raw user intent directly into the final blessing prompt without constraints
- keep strict system rules
- run output through a forbidden phrase filter
- reject prediction, instruction, guarantee, judgment, and financial language
- prefer curated blessing library for MVP

Forbidden output:

- buy
- sell
- enter
- exit
- invest
- wait
- act now
- guaranteed
- profit
- return
- win
- wealth will come

## Threat 9: XSS Through User Input

Attack:

User enters HTML or script in an intention field or profile field.

Current status:

The current first shrine does not need user input.

Future defense:

- avoid rendering raw HTML
- escape all user content
- validate input length
- store plain text only
- use Content Security Policy
- sanitize any share card generation pipeline

## Threat 10: API Key Exposure

Attack:

Secrets are shipped to the frontend or committed to the repo.

Defense:

- no private keys in frontend code
- no API secrets in client bundle
- use server-only environment variables
- keep wallet private keys out of the app
- use provider keys with minimal permissions
- rotate keys after exposure

## Threat 11: Wallet Drainer Imitation

Attack:

A fake Fortune Shrine site asks users to approve malicious token allowances or sign dangerous messages.

Defense:

- official domain clarity
- never request unlimited token approval
- prefer exact payment transfer over approval flow
- explain what the wallet action does in simple language
- keep contract interactions minimal
- publish official links only from controlled channels

Brand rule:

Fortune Shrine should never ask for broad wallet permissions.

## Threat 12: Phishing Clone

Attack:

Competitors or attackers clone the shrine and redirect payment to another wallet.

Defense:

- official domain
- verified social links
- clear recipient verification
- signed release announcements
- monitor lookalike domains
- avoid encouraging users to trust random links

## Threat 13: Brand Reframing Attack

Attack:

People accuse the product of being gambling, financial advice, paid prediction, or manipulation.

Defense:

- keep public copy canon-compliant
- never promise outcomes
- never use trading instructions
- never use fear or greed copy
- keep disclaimers plain and visible where needed
- preserve the language of ritual, blessing, and uncertainty

Important:

Do not respond by becoming defensive or louder.

Respond by making the boundary clearer.

## Threat 14: Psychological Manipulation Risk

Attack or product failure:

The product pushes vulnerable users toward risky action, dependency, or repeated payment.

Defense:

- no streaks
- no urgency
- no punishment for leaving
- no "your luck is fading" messages
- no "one more blessing" loops
- no bigger payment means better outcome
- no outcome prediction

Core line:

```text
The Shrine blesses. The user decides.
```

## Threat 15: Content Drift

Attack or internal failure:

The product slowly drifts into self-help, trading hints, wealth promises, or fortune-telling because those convert better.

Defense:

- maintain canon review
- use forbidden language checks
- review new blessing lines before release
- reject high-converting copy if it weakens sacred trust
- keep `Blessing Is The Product` as the highest rule

## Threat 16: Dependency Loop

Attack or internal failure:

The product encourages users to return compulsively before every action.

Defense:

- no streak mechanics
- no daily pressure
- no countdowns
- no fear notifications
- no loss aversion mechanics
- no ranking by offering amount

Allowed:

- the user may return freely
- the Shrine may remember blessings if the user chooses
- memory should be calm, not addictive

## Threat 17: Denial Of Service

Attack:

Traffic spikes or bots overload the app.

Defense:

- static-first frontend
- CDN caching
- rate limit dynamic endpoints
- queue payment verification
- protect blessing generation endpoints
- isolate payment verification from visual rendering

## Threat 18: Payment Provider Or Chain Outage

Attack or failure:

Payments cannot be verified or chain RPC fails.

Defense:

- show a calm pending state
- never say paid until verified
- retry verification server-side
- allow support lookup by payment intent
- avoid charging twice

Tone:

Even failure states should feel calm and clear.

## Threat 19: Data Privacy

Future risk:

If blessing history or wallet addresses are stored, user privacy becomes important.

Defense:

- store minimal data
- avoid linking wallet to sensitive intent text
- avoid public profiles by default
- allow deletion
- avoid selling or sharing user data
- separate analytics from identity where possible

## Threat 20: Analytics Corrupting The Product

Risk:

Optimizing only conversion may push the Shrine into manipulative design.

Defense:

Track:

- payment completion
- ritual completion
- blessing share/save interest
- return rate

Do not optimize toward:

- anxiety
- repeated payment pressure
- higher payment through guilt
- fear-based conversion

## Minimum Security Before Real USDC

Before accepting real USDC, Fortune Shrine needs:

- backend payment intent creation
- canonical offering price map on backend
- chain and token allowlist
- recipient address verification
- transaction hash uniqueness
- server-side payment verification
- idempotent payment completion
- rate limiting
- basic logs
- clear official domain
- no broad wallet approvals
- no frontend-only payment success

## Minimum Content Safety Before AI Blessings

Before dynamic AI blessings, Fortune Shrine needs:

- strict system prompt
- canon checklist
- forbidden phrase filter
- output classifier or rule check
- fallback curated blessing
- logs for rejected outputs
- no raw trading advice
- no prediction
- no instruction

## Security Review Checklist

Before each release, ask:

1. Can a user fake payment completion?
2. Can a user change the amount?
3. Can an old transaction be reused?
4. Can a fake token or wrong chain pass?
5. Does the frontend expose secrets?
6. Can user input become executable HTML?
7. Does any copy imply prediction or advice?
8. Does any feature pressure repeated payment?
9. Does any wallet action request more permission than needed?
10. Does the product still feel like a ritual rather than a transaction?

## Canonical Security Statement

Fortune Shrine must be safe enough for trust and restrained enough for sacredness.

If a security shortcut weakens trust, it weakens the Shrine.
