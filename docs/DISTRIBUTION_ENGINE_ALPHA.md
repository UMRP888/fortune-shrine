# Fortune Shrine Distribution Engine

Version Alpha 0.2

## Boundary

The engine discovers public posts, scores relevance, drafts a blessing, and waits for human approval.

It does not:

- auto-post
- bulk-message users
- attach Shrine links to replies
- predict outcomes
- promise success
- bypass platform access controls

Every suggested reply must follow:

```text
Bless the state.
Never bless the outcome.
```

## Local Access

Run the Shrine:

```bash
node server.mjs
```

Open:

```text
http://127.0.0.1:4188/distribution
```

Local access works without an admin token when `DISTRIBUTION_ADMIN_TOKEN` is not configured.

## Railway Environment

Required:

```text
DISTRIBUTION_ADMIN_TOKEN=<a long random private value>
DISTRIBUTION_DATA_DIR=/data/distribution
```

Recommended Reddit OAuth:

```text
REDDIT_CLIENT_ID=<reddit app client id>
REDDIT_CLIENT_SECRET=<reddit app client secret>
REDDIT_USER_AGENT=FortuneShrine-DistributionAlpha/0.2 by UMRP888
```

Optional X recent search:

```text
X_BEARER_TOKEN=<X API bearer token>
```

The X connector uses the official X recent-search endpoint. It remains disabled until the bearer token exists.

The Reddit connector prefers OAuth. Without OAuth it attempts Reddit's public search endpoint, which may be blocked or rate limited.

## Railway Volume

Attach a Railway Volume and mount it at:

```text
/data
```

Without a persistent volume, Railway redeploys or restarts can erase the target database.

The public Shrine payment flow does not depend on this volume. It is only for Distribution Engine records.

## Scoring

The initial score is transparent and deterministic:

```text
uncertainty
+ emotional intensity
+ directness
+ personal stakes
```

Generic greetings, promotions, giveaways, and non-personal posts are penalized.

Only targets with a score of `70` or higher appear in the default approval queue.

## Human Approval

The dashboard supports:

- approve
- reject
- edit suggested blessing
- copy suggested blessing
- open the original post
- mark a reply as sent
- JSON export

There is deliberately no automatic send endpoint.

## Data

Stored fields include:

- platform
- username
- profile URL
- post URL
- public post content
- timestamp
- source keyword
- relevance score and dimensions
- suggested reply
- approval decision
- sent status
- interaction counters

Do not add private messages, email addresses, real names, or private profile data.
