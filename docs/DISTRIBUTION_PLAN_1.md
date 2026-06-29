# Fortune Shrine Distribution Plan 1

Date: 2026-06-29

Status: Planned. Do not execute before the current Telegram Discovery engine passes the evening stability test and is frozen.

## Purpose

Distribution Plan 1 is the first lightweight growth plan after Telegram Discovery stabilizes.

It does not change the Discovery Engine.

It does not change Detector, Ranking, Freshness, Queue, UI, API, or Reply Engine.

It is an independent manual outreach layer.

## Core Insight

Fortune Shrine should not only look for individual users.

It should also look for distribution nodes.

The goal is not:

```text
Find 10,000 scattered users.
```

The goal is:

```text
Find 100 people who can influence 10,000 users.
```

## Distribution Nodes

Potential node types:

- Telegram group owners/admins
- Discord server admins/moderators
- small X KOLs
- TradingView authors
- newsletter writers
- YouTube or Spaces hosts

The first version should start very small.

Do not build bots, APIs, widgets, or automation yet.

## First Operating Mode

Safe sequence:

```text
Identify node
↓
Record in tracker
↓
Generate outreach draft
↓
Human reviews
↓
Human manually sends
↓
Record response
```

Forbidden by default:

- auto-DM
- bulk outreach
- joining groups automatically
- scraping private data
- sending links as first contact
- promotional spam

## Initial Offer

Fortune Shrine should approach nodes as a community-content service, not as an ad.

Possible offer:

```text
Free daily blessing card for trader communities.
No signals.
No trading advice.
No paid promotion required.
No outcome promises.
```

## Example Outreach Tone

```text
Hey, I’m building a small ritual-style project for traders called Fortune Shrine.
It doesn’t give signals or trading advice.
I make short daily “blessing cards” for people before risk, waiting, or after losses.
If you ever want one free daily card for your community, I can send a sample.
No promo required.
```

Short version:

```text
Hey, I make short “daily blessing” cards for trader communities — no signals, no ads, just a calm line before risk.
Would you be open to seeing one sample?
```

## Tracker

When activated, start with a simple CSV or Markdown tracker.

Fields:

- name
- platform
- source group
- role
- why relevant
- contact status
- last contacted at
- suggested message
- response
- next action
- notes

## Activation Condition

Do not start Distribution Plan 1 until:

1. Telegram Discovery runs three successful evening HUD tests.
2. The current engine version is frozen.
3. The user explicitly asks to begin Distribution Plan 1.

## Relationship to Engineering Charter

This plan follows:

```text
Engine freezes.
Library grows.
Detector selects.
Operator decides.
Human sends.
```

Distribution Plan 1 is an operations layer, not an engine change.
