# Fortune Shrine Distribution Engine V3

Date: 2026-06-18 (America/Los_Angeles)

Scope: strategic reset and evidence audit only. No existing code was changed.

## Executive Conclusion

Current platform priority:

1. **P0: Polymarket**
2. **P0: X / Crypto Twitter**
3. **P0: Telegram**

Frozen, not deleted:

- Hacker News
- Reddit
- Farcaster

No further development or research time should be spent on the frozen
platforms until Polymarket, X, and Telegram have produced real acquisition
data.

## Platform Status

| Platform | Status | Evidence-backed conclusion |
|---|---|---|
| Polymarket | Retained | Working; real markets and comments are retrievable |
| X | Retained, blocked | Current unique root cause: missing API Bearer Token |
| Telegram | Retained, conditional | Sustainable discovery is possible, but credentials are not configured |
| Hacker News | Frozen | Technically working but outside the current core-user thesis |
| Reddit | Frozen | No additional investigation |
| Farcaster | Frozen | No additional investigation |

## X: Why It Does Not Work

### Unique Answer

**A — 缺 API Token。**

This is the only current failure cause supported by evidence.

It is not currently:

- B — proven insufficient permission
- C — proven pricing-tier rejection
- D — a demonstrated code defect
- E — a demonstrated malformed request

Those conditions have not been reached because the engine stops before making
an authenticated request.

### Evidence 1: Runtime Configuration

The current process reports:

```text
X_BEARER_TOKEN=absent
```

The server passes the environment variable directly to the engine:

```text
xBearerToken: process.env.X_BEARER_TOKEN || ""
```

### Evidence 2: Recorded Engine Failure

Saved run:

```text
platform: x
keyword: got liquidated
status: failed
httpStatus: null
rawResultCount: 0
error: X search is not configured. Set X_BEARER_TOKEN in Railway.
```

`httpStatus: null` proves the engine did not reach an authenticated X response.
The failure occurred at the local configuration guard.

Source:

```text
data/distribution/search-runs.json
```

### Evidence 3: Direct Official Endpoint Request

Request:

```text
GET https://api.x.com/2/tweets/search/recent?query=%22got%20liquidated%22%20-is%3Aretweet%20lang%3Aen&max_results=10&tweet.fields=created_at%2Cauthor_id&expansions=author_id&user.fields=username
```

Request authorization:

```text
none
```

Actual response:

```json
{
  "title": "Unauthorized",
  "type": "about:blank",
  "status": 401,
  "detail": "Unauthorized"
}
```

Permanent evidence:

- `audit/x/x_recent_search_unauthorized_headers.txt`
- `audit/x/x_recent_search_unauthorized_body.json`
- response SHA-256:
  `8f20ff0c6196b3d88227a60b7b32325bae08a23c17051edb358c5e321540d76f`

### Is the Existing Request Form Correct?

Yes, at the structural level.

The existing code uses:

```text
GET /2/tweets/search/recent
Authorization: Bearer <token>
query
max_results
tweet.fields
expansions
user.fields
```

This matches the official recent-search endpoint and its documented
app-only Bearer Token authentication pattern.

This does not prove that an unknown future token has sufficient access or
credits. It proves that malformed request construction is not the current
blocker.

### Conditions Required to Restore X Search

1. An X developer account and project/app.
2. A valid project Bearer Token.
3. The project must have access and available credit for recent-search reads.
4. Configure the token as `X_BEARER_TOKEN` in the actual runtime environment.
5. Run one evidence request and retain:
   - request URL
   - HTTP status
   - unmodified response JSON
   - returned post count
   - author, body, timestamp, and post URL

X currently uses pay-per-usage pricing. Having a token alone does not guarantee
that the account has usable credit, but the missing token is the present
failure—not pricing.

Official references:

- https://docs.x.com/x-api/posts/recent-search
- https://docs.x.com/x-api/getting-started/pricing

## Telegram Feasibility

### Conclusion

**可行，但当前未打通。**

A stable, auditable public-discovery path exists. It requires either a
user-authorized Telegram API session or a third-party TGStat API token.

### Option 1: TGStat Post Search — Recommended Minimum Proof

Endpoint:

```text
GET https://api.tgstat.ru/posts/search
```

Documented capabilities include:

- full-text query
- start and end date
- public channel, public chat, or all peer types
- country and language filters
- post text
- publication date
- post link
- channel information
- pagination, up to 50 records per request and 1,000 records of depth

This satisfies the evidence requirements better than public HTML pages.

Actual unauthenticated probe:

```text
GET https://api.tgstat.ru/posts/search?q=hope&limit=5&peerType=all
```

Actual response:

```json
{
  "status": "error",
  "error": "empty_token"
}
```

Permanent evidence:

- `audit/telegram/tgstat_search_no_token_headers.txt`
- `audit/telegram/tgstat_search_no_token_body.json`
- response SHA-256:
  `290a29beadb21cd3733a3499573d7d6e23b852f4b7c9754f14bb94935d0a5f36`

Therefore TGStat search is not currently operational. The proven blocker is a
missing TGStat API token.

Reference:

- https://api.tgstat.ru/docs/ru/posts/search.html

### Option 2: Official Telegram Client API

Telegram's official `messages.searchGlobal` method supports global full-text
message search and can restrict results to public groups. It returns messages
and peer information suitable for saving body, date, message ID, and source.

Important boundary:

- only user-authorized clients can call this method
- a Bot API token is not enough
- it requires Telegram API credentials and a real Telegram user session
- Telegram flood-wait and account-safety limits must be respected

Reference:

- https://core.telegram.org/method/messages.searchGlobal

### Option 3: Public `t.me` Pages

The following public pages returned HTTP 200 during this investigation:

```text
https://t.me/Polymarket
https://t.me/polymarketgroup
https://t.me/degencalls
https://t.me/cryptocurrency
```

Public pages are suitable for validating known communities. They are not a
stable global keyword-search system and should not be counted as a discovery
engine.

### Telegram Decision

Telegram has a viable sustainable route:

1. TGStat API for the fastest auditable proof, or
2. official user-authorized Telegram API for direct platform access.

Neither route is currently proven to return Fortune Shrine candidates in this
workspace. The next valid proof must retain raw JSON and exact message links.

## Polymarket Current Discovery Capacity

### Proven Technical Capacity

The current audit proves:

- 10 active markets returned
- 158 comments returned from one selected market
- 99 unique public usernames or wallet labels in that response
- comment body, public identity, timestamp, comment ID, and market URL are
  available

Evidence:

- `audit/polymarket/markets_response_full.json`
- `audit/polymarket/comments_response_full.json`
- `audit/polymarket/POLYMARKET_AUDIT_REPORT.md`

### Measured 24-Hour Discovery Capacity

Measured window:

```text
2026-06-18T04:41:54Z
to
2026-06-19T04:41:54Z
```

Within the single audited `World Cup Winner` market:

| Metric | Count |
|---|---:|
| Public comments | 18 |
| Unique public accounts | 16 |
| Keyword-matched expressions | 1 |
| Potential target accounts | 1 |
| Human-qualified travelers | 0 confirmed |

The one potential expression was:

```text
User: Thyser
Time: 2026-06-18T21:32:07.844718Z
Text: Please 🙏
URL: https://polymarket.com/event/world-cup-winner
```

It is a discovery lead, not a confirmed traveler, because the expression lacks
enough personal context.

### Answer: How Many Per Day?

The only defensible current answer is:

> The audited method discovered **1 potential account in 24 hours from one
> high-volume market**, and **0 confirmed qualified travelers**.

A platform-wide daily number has not been measured. Claiming a larger number
would require extrapolation and is prohibited by the evidence standard.

Polymarket is operational, but stable target discovery requires selecting
markets where comments naturally contain waiting, resolution stress, loss,
restraint, or reflection. General high-volume markets contain substantial
banter, promotion, and outcome advocacy.

## Minimum Next Action

No platform expansion and no architecture work.

### 1. Polymarket

Use the already working evidence path on target-relevant markets. Measure one
complete day and retain every potential candidate with:

- username
- exact comment text
- timestamp
- comment ID
- market URL
- raw response file

The goal is a measured platform-wide daily candidate count, not another
connectivity test.

### 2. X

Obtain and configure one valid X project Bearer Token with usable credit.
Then run exactly one recent-search proof request and save the raw response.

Do not change search code before that proof. The current blocker is
configuration.

### 3. Telegram

Choose one access path before development:

- TGStat API token for the minimum auditable proof, or
- Telegram user API credentials and an authorized user session.

Run one keyword proof against:

```text
hope
luck
pray
please
wish
all in
nervous
afraid
```

No Telegram implementation should begin until one path returns raw, traceable
messages with source links.

## Final Decision

Polymarket remains active and usable.

X is blocked by one proven condition: **missing Bearer Token**.

Telegram is strategically viable but currently unconfigured.

HN, Reddit, and Farcaster are frozen. Their existing code and audit evidence
remain intact.
