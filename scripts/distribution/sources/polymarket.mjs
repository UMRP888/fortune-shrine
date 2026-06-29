import { DEFAULTS } from "../config.mjs";
import {
  fetchJson,
  mergeCandidates,
  normalizeText,
  resolveSearchProxy
} from "../lib.mjs";

const EVENTS_ENDPOINT = "https://gamma-api.polymarket.com/events";
const COMMENTS_ENDPOINT = "https://gamma-api.polymarket.com/comments";

export async function discoverPolymarket({
  eventLimit = DEFAULTS.polymarketEventLimit,
  commentsPerEvent = DEFAULTS.polymarketCommentsPerEvent,
  timeoutMs = DEFAULTS.requestTimeoutMs,
  maxRetries = DEFAULTS.maxRetries,
  fetchImpl = fetch,
  proxy,
  fixture
} = {}) {
  const activeProxy = fixture ? "" : (proxy ?? await resolveSearchProxy());
  const eventsUrl = new URL(EVENTS_ENDPOINT);
  eventsUrl.search = new URLSearchParams({
    active: "true",
    closed: "false",
    limit: String(eventLimit),
    order: "volume24hr",
    ascending: "false"
  });

  const eventsResponse = fixture?.events
    ? { data: fixture.events, url: "fixture://polymarket/events", status: 200 }
    : await fetchJson(eventsUrl, {
      timeoutMs,
      maxRetries,
      fetchImpl,
      proxy: activeProxy
    });
  const evidence = [{ platform: "Polymarket", url: eventsResponse.url, resultCount: eventsResponse.data.length }];
  const candidates = [];

  for (const event of eventsResponse.data) {
    if (!event?.id || Number(event.commentCount || 0) <= 0) continue;
    const commentsUrl = new URL(COMMENTS_ENDPOINT);
    commentsUrl.search = new URLSearchParams({
      parent_entity_id: String(event.id),
      parent_entity_type: "Event",
      limit: String(commentsPerEvent),
      offset: "0",
      order: "createdAt",
      ascending: "false"
    });
    const response = fixture?.commentsByEvent?.[event.id]
      ? { data: fixture.commentsByEvent[event.id], url: `fixture://polymarket/comments/${event.id}`, status: 200 }
      : await fetchJson(commentsUrl, {
        timeoutMs,
        maxRetries,
        fetchImpl,
        proxy: activeProxy
      });
    evidence.push({ platform: "Polymarket", url: response.url, resultCount: response.data.length });

    for (const comment of response.data) {
      const profile = comment.profile || {};
      const username = normalizeText(profile.name || profile.pseudonym || comment.userAddress, 100);
      const wallet = normalizeText(profile.proxyWallet || profile.baseAddress || comment.userAddress, 100);
      const text = normalizeText(comment.body, 1_500);
      if (!username || !wallet || !text || !comment.createdAt) continue;
      const profileUrl = `https://polymarket.com/profile/${wallet}`;
      candidates.push({
        identity: wallet,
        username,
        platform: "Polymarket",
        followers: "",
        profileUrl,
        latestAt: comment.createdAt,
        communities: [normalizeText(event.title || event.slug || "Polymarket", 150)],
        engagement: Number(comment.reactionCount || 0),
        posts: [{
          id: comment.id ? `polymarket:${comment.id}` : null,
          at: comment.createdAt,
          text,
          url: event.slug
            ? `https://polymarket.com/event/${event.slug}${comment.id ? `?comment=${comment.id}` : ""}`
            : profileUrl
        }]
      });
    }
  }
  return { candidates: mergeCandidates(candidates), evidence };
}
