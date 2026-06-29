import assert from "node:assert/strict";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  analyzeKeywords,
  buildOperationalAnalytics
} from "./analytics.mjs";
import {
  auditBlessingCorpus,
  renderCorpusAudit
} from "./corpus-audit.mjs";

const rows = [
  {
    平台: "X",
    用户名: "one",
    post_id: "1",
    最近的帖子: "[2026-06-21T00:00:00Z] I lost everything waiting for results. All in felt risky."
  },
  {
    平台: "Polymarket",
    用户名: "two",
    post_id: "2",
    最近的帖子: "[2026-06-21T00:01:00Z] Waiting for results with hope and regret."
  },
  {
    平台: "X",
    用户名: "duplicate",
    post_id: "1",
    最近的帖子: "This duplicate must not be analyzed."
  }
];
const keywords = analyzeKeywords(rows);
assert.equal(keywords.analyzedCandidatePosts, 2);
assert.ok(keywords.highValueKeywords.find((item) => item.term === "waiting").count >= 2);
assert.ok(keywords.topKeywords.some((item) => item.term === "waiting"));

const audit = await auditBlessingCorpus(
  new URL("../../../docs/blessing-corpus-v2.json", import.meta.url)
);
assert.equal(audit.entryCount, 308);
assert.equal(audit.summary.exactDuplicateGroups, 0);
assert.ok(renderCorpusAudit(audit).includes("完全重复文本"));

const temporary = await mkdtemp(path.join(os.tmpdir(), "fortune-shrine-v095-"));
const outputDirectory = path.join(temporary, "output");
await mkdir(outputDirectory, { recursive: true });
await Promise.all([
  writeFile(path.join(temporary, "search.json"), JSON.stringify({
    runs: [{
      runId: "search-1",
      timestamp: "2026-06-20T18:00:00.000Z",
      status: "success",
      candidateCount: 12
    }]
  })),
  writeFile(path.join(temporary, "sent.json"), JSON.stringify({
    records: [{
      postId: "1",
      username: "Traveler",
      blessing: "May steadiness remain.",
      sentAt: "2026-06-20T18:30:00.000Z",
      status: "sent"
    }]
  })),
  writeFile(path.join(temporary, "saw.json"), JSON.stringify({ posts: [] })),
  writeFile(
    path.join(outputDirectory, "fresh-targets-2026-06-20T18-00-00Z.json"),
    JSON.stringify([{
      用户名: "Traveler",
      平台: "X",
      最近的帖子: "Waiting for results",
      discovered_at: "2026-06-20T18:00:00.000Z",
      post_id: "1"
    }])
  ),
  writeFile(
    path.join(outputDirectory, "run-2026-06-20T18-00-00Z.json"),
    JSON.stringify({
      discoveredAt: "2026-06-20T18:00:00.000Z",
      resultCount: 1,
      failures: [],
      sourceRuns: [{ runId: "search-1" }]
    })
  )
]);
const operational = await buildOperationalAnalytics({
  searchHistoryPath: path.join(temporary, "search.json"),
  sentHistoryPath: path.join(temporary, "sent.json"),
  sawPath: path.join(temporary, "saw.json"),
  outputDirectory,
  now: Date.parse("2026-06-20T20:00:00.000Z"),
  timeZone: "UTC"
});
assert.equal(operational.operations.todaySearchRuns, 1);
assert.equal(operational.operations.todayCandidatesDiscovered, 12);
assert.equal(operational.operations.todayQueueEntries, 1);
assert.equal(operational.operations.todaySent, 1);
assert.equal(operational.operations.cumulativeUniqueUsers, 1);
assert.equal(operational.sources.counts.X, 1);

console.log("V0.95 analytics tests passed");
