# Distribution Engine Beta Verification

Version: Beta 0.1

## Goal

Prove, repeatedly and audibly, which keyword on which platform found how many
real public posts, and how many deserved careful human review.

Beta does not add pages, automatic replies, bulk messaging, or platform
workflows.

## Search Audit

Every keyword is searched independently. Each run records:

- platform
- keyword and exact query
- start and completion time
- requested limit and HTTP status
- raw platform result count
- parsed count
- duplicate count
- created count
- score 70+ count
- pending, approved, and rejected counts
- pagination token
- error

Local audit endpoint:

```text
GET /api/distribution/analytics
```

Search targets carry a `sourceRunId`, allowing approval counts to be derived
from the current target decisions instead of being frozen at search time.

## Current Configuration

Observed on 2026-06-18:

- Local `X_BEARER_TOKEN`: not configured.
- Local Reddit OAuth credentials: not configured.
- Local Reddit public fallback: connection failed.
- Railway public Shrine: online.
- Railway `/api/distribution/status`: returned `404`, so the deployed service
  does not yet expose the Distribution Engine status route from this revision.
- No live platform search has been verified.
- The two existing local targets remain manual test records and are excluded
  from live-search claims.

Required for production:

```text
DISTRIBUTION_ADMIN_TOKEN=<long private value>
DISTRIBUTION_DATA_DIR=/data/distribution
```

Reddit:

```text
REDDIT_CLIENT_ID=<app client id>
REDDIT_CLIENT_SECRET=<app client secret>
REDDIT_USER_AGENT=FortuneShrine-DistributionBeta/0.1 by <reddit username>
```

X:

```text
X_BEARER_TOKEN=<project bearer token>
```

Railway must have a persistent volume mounted at `/data`.

## Minimum Live Verification

For one platform:

1. Configure credentials.
2. Search one keyword with a limit of 25.
3. Confirm HTTP 200 and a non-test public post URL.
4. Open the URL and manually verify that the stored text represents the post.
5. Run the same search again and verify duplicate accounting.
6. Run it a third time later and verify a new auditable run is recorded.
7. Export analytics and reconcile raw, duplicate, created, qualified, pending,
   and approved counts.

No platform is considered verified until these steps succeed against the real
external API.

Unit tests use mocked platform responses. They validate parsing, persistence,
deduplication, qualification counting, and analytics only. Mocked results must
never be reported as real platform discoveries.
