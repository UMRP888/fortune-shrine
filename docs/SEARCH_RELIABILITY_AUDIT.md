# Fortune Shrine Search Reliability Audit

Date: 2026-06-21

Scope:

- Polymarket discovery
- X discovery
- Search run history
- 24-hour search health reporting

Excluded:

- blessing corpus
- sender workflow
- automatic sending
- candidate scoring and ranking

## Final Result

The latest verified run completed successfully:

```text
Shrine Search runs: 1
Successful runs: 1
Failed runs: 0
Success rate: 100%
Final queue: 20 candidates
Polymarket selected: 10
X selected: 10
```

The source-level discovery result was:

```text
Polymarket: success, 827 discovered identities, 16.756 seconds
X: success, 85 discovered profiles, 108.948 seconds
```

The larger source counts are pre-ranking discovery counts. The final queue remains
limited to 20.

## Root Cause

### Polymarket

The Polymarket API had not failed.

Verified:

- Gamma events endpoint returned HTTP 200.
- Gamma comments endpoint returned HTTP 200 and current public comments.
- No authentication or logged-in session was required.
- No browser selector or page extraction was involved.
- The configured 25-second request timeout was not the original cause.

The failure occurred in the network layer:

```text
discoverPolymarket
→ Node native fetch
→ direct DNS/network route
→ fetch failed
```

X public discovery already supported an explicit proxy. Polymarket used Node native
`fetch`, which did not inherit the local proxy. This made the two sources behave
differently during the same Shrine Search run.

After routing Polymarket through the available search proxy, the same API returned
real events and comments.

### X

The observed timeout was not caused by:

- X login state
- an X rate limit
- an HTTP 401, 403, or 429 response
- Playwright
- an editor or DOM selector

The current fallback search does not use Playwright or a logged-in browser. It uses:

```text
Brave public index
→ public X profile pages
→ Twitter syndication fallback
```

The failed runs had two network conditions:

1. `127.0.0.1:7897` was unavailable, producing `curl (7)`.
2. A later direct request had no working route and reached the 12-second timeout,
   producing `curl (28)`.

After the local proxy became available, the Brave endpoint returned HTTP 200 in
approximately 1.46 seconds. The complete X source scan then returned 85 public
profiles.

The Brave result pages produced zero newly parsed handles in the verification run,
but the configured public profile seed path succeeded. This is recorded as an X
source success, not as proof that Brave query extraction produced candidates.

## Reliability Changes

Search behavior and candidate ranking were not changed.

The reliability layer now:

1. Uses explicit proxy environment variables when present.
2. Otherwise probes `127.0.0.1:7897`.
3. Applies the same available proxy to Polymarket and X requests.
4. Falls back to direct networking when no proxy is available.
5. Records each source attempt independently.
6. Separates successful zero-result searches from failed searches.
7. Classifies proxy, timeout, DNS, authentication, rate-limit, upstream, parsing,
   extraction, and generic network errors.

## Permanent Evidence

Search history:

```text
scripts/distribution/v08/state/搜索历史.json
```

Each source record contains:

```text
runId
timestamp
completedAt
source
searchMethod
status
result
errorCategory
errorReason
httpStatus
candidateCount
evidenceCount
durationMs
```

Health summary:

```text
scripts/distribution/v08/output/search-health.json
```

Health dashboard:

```text
scripts/distribution/v08/output/search-health.html
```

Latest successful run evidence:

```text
scripts/distribution/v08/output/run-2026-06-21T03-21-29Z.json
scripts/distribution/v08/output/fresh-targets-2026-06-21T03-21-29Z.json
scripts/distribution/v08/output/fresh-targets-2026-06-21T03-21-29Z.csv
```

## Status Semantics

```text
status=success, result=candidates_found
Search completed and found candidates.

status=success, result=no_results
Search completed correctly but found no candidates.

status=failed, result=search_failed
The source could not be searched. A zero candidate count is not treated as a real
zero-result search.
```

## Remaining Reliability Risk

X public discovery still depends on public HTML and syndication endpoints. It is
slower and less stable than the official X Recent Search API. The verified run took
about 109 seconds for X.

When `X_BEARER_TOKEN` is available to the running process, the engine automatically
uses the official X Recent Search API instead of the public fallback.
