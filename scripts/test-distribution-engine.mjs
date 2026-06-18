import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { DistributionEngine, generateSuggestedReply, scorePost } from "../distribution-engine.mjs";

const strong = scorePost("I have a job interview tomorrow and I am terrified. Please wish me luck.");
assert.ok(strong.score >= 70, `Expected strong target, received ${strong.score}`);

const generic = scorePost("Good luck everyone!");
assert.ok(generic.score < 70, `Expected generic post below threshold, received ${generic.score}`);

const drivingTest = scorePost("Wish me luck for my driving test tomorrow.");
assert.ok(drivingTest.score >= 70, `Expected driving-test target, received ${drivingTest.score}`);

const decisive = scorePost("Tomorrow will decide everything. I am very afraid.");
assert.ok(decisive.score >= 90, `Expected high-stakes target, received ${decisive.score}`);

const reply = generateSuggestedReply("I have an interview tomorrow. I am nervous.", "example");
assert.ok(reply.length > 20);
assert.doesNotMatch(reply.toLowerCase(), /\b(win|profit|guarantee|success is certain)\b/);
assert.doesNotMatch(reply, /https?:\/\//);

const tempDir = await mkdtemp(path.join(os.tmpdir(), "fortune-shrine-distribution-"));
const engine = new DistributionEngine({ dataDir: tempDir });
const created = await engine.importPosts([
  {
    platform: "x",
    username: "traveler",
    postUrl: "https://x.com/traveler/status/1",
    content: "Tomorrow will decide everything. I am scared and cannot sleep. Please pray for me.",
    timestamp: "2026-06-17T12:00:00.000Z",
    keyword: "pray for me"
  }
]);
assert.equal(created.length, 1);
assert.ok(created[0].score >= 70);

const duplicate = await engine.importPosts([
  {
    platform: "x",
    username: "traveler",
    postUrl: "https://x.com/traveler/status/1",
    content: "Tomorrow will decide everything. I am scared and cannot sleep. Please pray for me.",
    timestamp: "2026-06-17T12:00:00.000Z",
    keyword: "pray for me"
  }
]);
assert.equal(duplicate.length, 0);

await engine.decide([created[0].id], "approved");
const approved = await engine.list({ decision: "approved", minScore: 70 });
assert.equal(approved.length, 1);

const originalFetch = globalThis.fetch;
globalThis.fetch = async (url) => {
  const parsed = new URL(url);
  const keyword = parsed.searchParams.get("q");
  assert.equal(keyword, "\"got liquidated\"");
  return new Response(JSON.stringify({
    data: {
      after: "next-page",
      children: [
        {
          data: {
            author: "mock_public_user",
            permalink: "/r/CryptoCurrency/comments/example/liquidated/",
            title: "I just got liquidated",
            selftext: "Tomorrow will decide everything. I am terrified, cannot sleep, and need to slow down. Please pray for me.",
            created_utc: 1781712000
          }
        }
      ]
    }
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
};

const searchResult = await engine.search({
  platform: "reddit",
  keywords: ["got liquidated"],
  limit: 25
});
assert.equal(searchResult.runs.length, 1);
assert.equal(searchResult.runs[0].rawResultCount, 1);
assert.equal(searchResult.runs[0].duplicateCount, 0);
assert.equal(searchResult.runs[0].createdCount, 1);
assert.equal(searchResult.runs[0].qualifiedCount, 1);
assert.equal(searchResult.created[0].source, "reddit-search");
assert.ok(searchResult.created[0].postUrl.includes("reddit.com"));

const repeatedSearch = await engine.search({
  platform: "reddit",
  keywords: ["got liquidated"],
  limit: 25
});
assert.equal(repeatedSearch.runs[0].rawResultCount, 1);
assert.equal(repeatedSearch.runs[0].duplicateCount, 1);
assert.equal(repeatedSearch.runs[0].createdCount, 0);

const analytics = await engine.searchAnalytics();
assert.equal(analytics.aggregate.length, 1);
assert.equal(analytics.aggregate[0].platform, "reddit");
assert.equal(analytics.aggregate[0].keyword, "got liquidated");
assert.equal(analytics.aggregate[0].rawResultCount, 2);
assert.equal(analytics.aggregate[0].duplicateCount, 1);
assert.equal(analytics.aggregate[0].createdCount, 1);
assert.equal(analytics.aggregate[0].pendingCount, 1);

globalThis.fetch = originalFetch;

console.log("Distribution engine tests passed.");
