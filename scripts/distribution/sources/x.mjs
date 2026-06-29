import { DEFAULTS, X_QUERIES } from "../config.mjs";
import {
  fetchJson,
  mergeCandidates,
  normalizeText,
  resolveSearchProxy
} from "../lib.mjs";

const X_RECENT_SEARCH = "https://api.x.com/2/tweets/search/recent";

export async function discoverX({
  bearerToken = process.env.X_BEARER_TOKEN || "",
  resultsPerQuery = DEFAULTS.xResultsPerQuery,
  maxPagesPerQuery = DEFAULTS.maxXPagesPerQuery,
  timeoutMs = DEFAULTS.requestTimeoutMs,
  maxRetries = DEFAULTS.maxRetries,
  fetchImpl = fetch,
  proxy,
  fixture
} = {}) {
  if (!bearerToken && !fixture) {
    const error = new Error("X_BEARER_TOKEN is required for Crypto Twitter discovery.");
    error.code = "X_NOT_CONFIGURED";
    throw error;
  }

  const candidates = [];
  const evidence = [];
  const activeProxy = fixture ? "" : (proxy ?? await resolveSearchProxy());
  for (const queryConfig of X_QUERIES) {
    let nextToken = null;
    for (let page = 0; page < maxPagesPerQuery; page += 1) {
      const params = new URLSearchParams({
        query: queryConfig.query,
        max_results: String(Math.min(100, Math.max(10, resultsPerQuery))),
        "tweet.fields": "created_at,author_id,public_metrics",
        expansions: "author_id",
        "user.fields": "username,name,description,public_metrics"
      });
      if (nextToken) params.set("next_token", nextToken);
      const url = `${X_RECENT_SEARCH}?${params}`;
      const fixturePage = fixture?.[queryConfig.community]?.[page];
      const response = fixturePage
        ? { data: fixturePage, url: `fixture://x/${encodeURIComponent(queryConfig.community)}/${page}`, status: 200 }
        : await fetchJson(url, {
          headers: { Authorization: `Bearer ${bearerToken}` },
          timeoutMs,
          maxRetries,
          fetchImpl,
          proxy: activeProxy
        });
      evidence.push({
        platform: "X",
        community: queryConfig.community,
        url: response.url,
        resultCount: Number(response.data.meta?.result_count || response.data.data?.length || 0)
      });

      const users = new Map((response.data.includes?.users || []).map((user) => [user.id, user]));
      for (const tweet of response.data.data || []) {
        const user = users.get(tweet.author_id);
        if (!user?.username || !tweet.created_at || !tweet.text) continue;
        candidates.push({
          identity: user.id,
          username: user.username,
          platform: "X",
          followers: Number(user.public_metrics?.followers_count || 0),
          profileUrl: `https://x.com/${user.username}`,
          latestAt: tweet.created_at,
          communities: [queryConfig.community],
          engagement: Object.values(tweet.public_metrics || {}).reduce((sum, value) => sum + Number(value || 0), 0),
          posts: [{
            id: tweet.id,
            at: tweet.created_at,
            text: normalizeText(tweet.text, 1_500),
            url: `https://x.com/${user.username}/status/${tweet.id}`
          }]
        });
      }
      nextToken = response.data.meta?.next_token || null;
      if (!nextToken) break;
    }
  }
  return { candidates: mergeCandidates(candidates), evidence };
}
