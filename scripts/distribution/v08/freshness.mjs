import { canonicalIdentity, scoreCandidate } from "../lib.mjs";

export function freshnessFor(postCreatedAt, discoveredAt = new Date().toISOString()) {
  const createdMs = Date.parse(postCreatedAt);
  const discoveredMs = Date.parse(discoveredAt);
  const valid = Number.isFinite(createdMs) && Number.isFinite(discoveredMs);
  const ageMinutes = valid
    ? Math.max(0, Math.floor((discoveredMs - createdMs) / 60_000))
    : Number.POSITIVE_INFINITY;

  if (ageMinutes <= 15) return { ageMinutes, freshnessScore: "S", freshnessRank: 5 };
  if (ageMinutes <= 30) return { ageMinutes, freshnessScore: "A", freshnessRank: 4 };
  if (ageMinutes <= 60) return { ageMinutes, freshnessScore: "B", freshnessRank: 3 };
  if (ageMinutes <= 180) return { ageMinutes, freshnessScore: "C", freshnessRank: 2 };
  return { ageMinutes, freshnessScore: "D", freshnessRank: 1 };
}

export function rankByFreshness(candidates, {
  discoveredAt = new Date().toISOString(),
  seen = new Set()
} = {}) {
  return candidates
    .filter((candidate) => !seen.has(canonicalIdentity(candidate)))
    .map((candidate) => {
      const postCreatedAt = candidate.latestAt || candidate.posts?.[0]?.at || "";
      const freshness = freshnessFor(postCreatedAt, discoveredAt);
      return {
        ...candidate,
        score: scoreCandidate(candidate, Date.parse(discoveredAt)),
        discoveredAt,
        postCreatedAt,
        ...freshness
      };
    })
    .sort((a, b) =>
      b.freshnessRank - a.freshnessRank
      || a.ageMinutes - b.ageMinutes
      || b.score - a.score
      || b.postCreatedAt.localeCompare(a.postCreatedAt)
    );
}

export function selectFreshCandidates(candidates, {
  totalTarget,
  polymarketTarget,
  xTarget,
  discoveredAt = new Date().toISOString(),
  seen = new Set()
}) {
  const available = rankByFreshness(candidates, { discoveredAt, seen });
  const selected = [];

  const take = (platform, limit) => {
    for (const candidate of available) {
      if (
        selected.length >= totalTarget
        || selected.filter((item) => item.platform === platform).length >= limit
      ) break;
      if (candidate.platform !== platform || selected.includes(candidate)) continue;
      selected.push(candidate);
    }
  };

  take("Polymarket", polymarketTarget);
  take("X", xTarget);
  for (const candidate of available) {
    if (selected.length >= totalTarget) break;
    if (!selected.includes(candidate)) selected.push(candidate);
  }

  return selected.sort((a, b) =>
    b.freshnessRank - a.freshnessRank
    || a.ageMinutes - b.ageMinutes
    || b.score - a.score
    || b.postCreatedAt.localeCompare(a.postCreatedAt)
  );
}
