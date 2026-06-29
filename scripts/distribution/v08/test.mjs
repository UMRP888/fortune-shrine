import assert from "node:assert/strict";
import { freshnessFor, rankByFreshness } from "./freshness.mjs";
import { filterByMemory, postIdFor } from "./memory.mjs";
import { outputFreshRows, toFreshCsv } from "./output.mjs";
import {
  classifySearchError,
  renderSearchHealthDashboard,
  sourceRunRecord,
  summarizeSearchHealth
} from "./reliability.mjs";

const discoveredAt = "2026-06-20T12:00:00.000Z";
assert.deepEqual(freshnessFor("2026-06-20T11:53:00.000Z", discoveredAt), {
  ageMinutes: 7,
  freshnessScore: "S",
  freshnessRank: 5
});
assert.equal(freshnessFor("2026-06-20T11:40:00.000Z", discoveredAt).freshnessScore, "A");
assert.equal(freshnessFor("2026-06-20T11:15:00.000Z", discoveredAt).freshnessScore, "B");
assert.equal(freshnessFor("2026-06-20T10:00:00.000Z", discoveredAt).freshnessScore, "C");
assert.equal(freshnessFor("2026-06-20T08:00:00.000Z", discoveredAt).freshnessScore, "D");

const candidate = (username, latestAt, text) => ({
  identity: username,
  username,
  platform: "X",
  followers: 100,
  profileUrl: `https://x.com/${username}`,
  latestAt,
  communities: ["Test"],
  engagement: 0,
  posts: [{ at: latestAt, text, url: `https://x.com/${username}/status/1` }]
});

const ranked = rankByFreshness([
  candidate("olderHighScore", "2026-06-20T11:40:00.000Z", "waiting all in risk hope"),
  candidate("newerLowScore", "2026-06-20T11:55:00.000Z", "quiet moment")
], { discoveredAt });

assert.equal(ranked[0].username, "newerLowScore");
assert.equal(ranked[0].freshnessScore, "S");
assert.equal(ranked[1].freshnessScore, "A");

const rows = outputFreshRows(ranked);
const csv = toFreshCsv(rows);
assert.ok(csv.includes("age_minutes,freshness_score,discovered_at,post_created_at"));
assert.equal(rows[0].age_minutes, 5);
assert.equal(rows[0].post_created_at, "2026-06-20T11:55:00.000Z");

const remembered = candidate(
  "remembered",
  "2026-06-20T11:58:00.000Z",
  "waiting for a result"
);
remembered.posts[0].id = "post-remembered";
const recentUser = candidate(
  "recentUser",
  "2026-06-20T11:57:00.000Z",
  "uncertain"
);
recentUser.posts[0].id = "post-new";
const eligible = candidate(
  "eligible",
  "2026-06-20T11:56:00.000Z",
  "hope"
);
eligible.posts[0].id = "post-eligible";
const memoryFiltered = filterByMemory([
  remembered,
  recentUser,
  eligible
], {
  posts: [
    {
      postId: "post-remembered",
      username: "remembered",
      processedAt: "2026-06-19T10:00:00.000Z"
    },
    {
      postId: "older-post",
      username: "recentUser",
      processedAt: "2026-06-20T06:00:00.000Z"
    }
  ]
}, Date.parse(discoveredAt));
assert.deepEqual(memoryFiltered.map((item) => item.username), ["eligible"]);
assert.equal(postIdFor(memoryFiltered[0]), "post-eligible");

assert.deepEqual(classifySearchError({
  message: "curl failed",
  stderr: "curl: (28) Connection timed out after 12000 milliseconds"
}), {
  category: "timeout",
  reason: "The upstream request exceeded its time limit.",
  status: null
});

const successRecord = sourceRunRecord({
  runId: "run-1",
  source: "X",
  startedAt: "2026-06-20T11:00:00.000Z",
  completedAt: "2026-06-20T11:00:02.000Z",
  candidateCount: 4
});
const emptyRecord = sourceRunRecord({
  runId: "run-2",
  source: "Polymarket",
  startedAt: "2026-06-20T11:10:00.000Z",
  completedAt: "2026-06-20T11:10:01.000Z",
  candidateCount: 0
});
const failedRecord = sourceRunRecord({
  runId: "run-3",
  source: "X",
  startedAt: "2026-06-20T11:20:00.000Z",
  completedAt: "2026-06-20T11:20:12.000Z",
  error: { message: "HTTP 429", status: 429 }
});
assert.equal(successRecord.result, "candidates_found");
assert.equal(emptyRecord.result, "no_results");
assert.equal(failedRecord.result, "search_failed");
assert.equal(failedRecord.errorCategory, "rate_limited");

const health = summarizeSearchHealth({
  runs: [successRecord, emptyRecord, failedRecord]
}, {
  now: Date.parse("2026-06-20T12:00:00.000Z")
});
assert.equal(health.totalRuns, 3);
assert.equal(health.successfulRuns, 2);
assert.equal(health.failedRuns, 1);
assert.equal(health.noResultRuns, 1);
assert.equal(health.averageCandidates, 2);
const dashboard = renderSearchHealthDashboard(health);
assert.ok(dashboard.includes("搜索失败"));
assert.ok(dashboard.includes("没有结果"));
assert.ok(dashboard.includes("成功，4 位候选"));

console.log("V0.8 freshness tests passed");
