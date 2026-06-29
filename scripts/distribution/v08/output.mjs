import { csvEscape, normalizeText } from "../lib.mjs";

export const FIELDS = [
  "用户名",
  "平台",
  "关注者",
  "profile_url",
  "最近的帖子",
  "社区",
  "评分",
  "age_minutes",
  "freshness_score",
  "discovered_at",
  "post_created_at",
  "post_id",
  "post_url"
];

export function outputFreshRows(candidates) {
  return candidates.map((candidate) => ({
    用户名: candidate.username,
    平台: candidate.platform,
    关注者: candidate.followers ?? "",
    profile_url: candidate.profileUrl,
    最近的帖子: candidate.posts
      .slice(0, 3)
      .map((post) => `[${post.at}] ${normalizeText(post.text, 500)}`)
      .join(" || "),
    社区: [...new Set(candidate.communities || [])].join(" | "),
    评分: candidate.score,
    age_minutes: Number.isFinite(candidate.ageMinutes) ? candidate.ageMinutes : "",
    freshness_score: candidate.freshnessScore,
    discovered_at: candidate.discoveredAt,
    post_created_at: candidate.postCreatedAt,
    post_id: candidate.postId,
    post_url: candidate.postUrl
  }));
}

export function toFreshCsv(rows) {
  return [
    FIELDS.join(","),
    ...rows.map((row) => FIELDS.map((field) => csvEscape(row[field])).join(","))
  ].join("\n") + "\n";
}
