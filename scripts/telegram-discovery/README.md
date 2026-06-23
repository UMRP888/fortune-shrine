# Telegram Discovery Engine V1 Lite

Local, read-only Telegram keyword discovery using standalone Playwright.

The prototype:

- uses a dedicated persistent Chromium profile;
- searches only content visible to the logged-in operator;
- saves matches only from an explicit group allowlist, never private chats;
- searches the V1 keyword set;
- scores emotional signals with deterministic rules;
- generates deterministic Fortune Shrine reply suggestions;
- writes high-value review candidates to JSON;
- can run once or every 10 minutes;
- never replies, posts, reacts, joins groups, or performs AI analysis.

## Install

```bash
npm install
npx playwright install chromium
```

## First login

```bash
npm run telegram:login
```

In the Codex desktop workspace, where `node` may not be on `PATH`, use:

```bash
scripts/telegram-discovery/run.sh --login-only
```

Complete Telegram login manually in the Chromium window. Login state is stored
locally in:

```text
scripts/telegram-discovery/state/browser-profile/
```

The directory is ignored by Git. Do not copy or commit it.

The default group-title allowlist is:

```text
GMX
Gains Network
Bitget English
Bybit English
```

Override or extend it with exact or distinctive group-title fragments:

```bash
export TELEGRAM_DISCOVERY_CHATS='GMX,Gains Network,Bitget English,Bybit English'
```

## Run once

```bash
npm run telegram:discover
```

Codex desktop equivalent:

```bash
scripts/telegram-discovery/run.sh --once
```

## Run every 10 minutes

```bash
npm run telegram:watch
```

Codex desktop equivalent:

```bash
scripts/telegram-discovery/run.sh --watch
```

The watch process runs one cycle immediately, waits 10 minutes after that cycle
finishes, then runs again. Cycles cannot overlap.

After the login profile exists, background operation is available with:

```bash
node scripts/telegram-discovery/run.mjs --watch --headless
```

## Keywords

```text
wish me luck
good luck
pray
pray for me
all in
hope
waiting
fingers crossed
need this
please work
nervous
uncertain
announcement
trade
win
lose
liquidation
long
short
```

## JSON output

```text
scripts/telegram-discovery/output/latest.json
scripts/telegram-discovery/output/results.json
scripts/telegram-discovery/output/run-<timestamp>.json
```

`latest.json` contains the latest cycle. `results.json` is the deduplicated
local archive.

Each review result uses the operator-facing V1 shape:

```json
{
  "group": "GMX",
  "message": "Wish me luck guys",
  "score": 0.92,
  "reason": "request for luck or prayer + first-person personal stakes",
  "reply": "May the flame stay near you tonight, and may your hand remain steady."
}
```

Only results scoring `0.70` or higher enter the review JSON. Reply suggestions
are selected from a curated local corpus. No model or external AI service is
called, and nothing is sent to Telegram.

Telegram Web changes its DOM periodically. If Telegram changes its search UI,
update selector lists in `config.mjs`; the collector intentionally does not use
screenshots, OCR, stealth plugins, or permission bypasses.
