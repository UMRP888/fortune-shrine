import assert from "node:assert/strict";
import { mergeCandidates, outputRows, selectCandidates, toCsv } from "./lib.mjs";
import { discoverPolymarket } from "./sources/polymarket.mjs";
import { discoverX } from "./sources/x.mjs";

const polymarketFixture = {
  events: [{ id: "1", title: "BTC above 100k?", slug: "btc-above-100k", commentCount: 2 }],
  commentsByEvent: {
    1: [
      {
        body: "Waiting for this to resolve. Wish me luck.",
        createdAt: "2026-06-19T10:00:00Z",
        reactionCount: 3,
        userAddress: "0xabc",
        profile: { name: "PatientTrader", proxyWallet: "0xwallet" }
      },
      {
        body: "Still waiting, trying to stay patient.",
        createdAt: "2026-06-19T09:00:00Z",
        reactionCount: 1,
        userAddress: "0xabc",
        profile: { name: "PatientTrader", proxyWallet: "0xwallet" }
      }
    ]
  }
};

const xPayload = {
  meta: { result_count: 1 },
  data: [{
    id: "123",
    author_id: "u1",
    created_at: "2026-06-19T10:30:00Z",
    text: "Watching Polymarket and waiting for resolution.",
    public_metrics: { like_count: 5, reply_count: 2, retweet_count: 1 }
  }],
  includes: {
    users: [{
      id: "u1",
      username: "PredictionWatcher",
      public_metrics: { followers_count: 420 }
    }]
  }
};

const xFixture = Object.fromEntries([
  "Polymarket", "Prediction Markets", "Crypto Trading", "Meme Coin", "Risk / Luck"
].map((community) => [community, [xPayload]]));

const polymarket = await discoverPolymarket({ fixture: polymarketFixture });
const x = await discoverX({ fixture: xFixture });
assert.equal(polymarket.candidates.length, 1);
assert.equal(polymarket.candidates[0].posts.length, 2);
assert.equal(x.candidates.length, 1);
assert.equal(x.candidates[0].followers, 420);

const selected = selectCandidates(
  mergeCandidates([...polymarket.candidates, ...x.candidates]),
  { totalTarget: 2, polymarketTarget: 1, xTarget: 1, seen: new Set() }
);
assert.equal(selected.length, 2);
assert.deepEqual(new Set(selected.map((item) => item.platform)), new Set(["Polymarket", "X"]));
assert.ok(selected[0].score >= selected[1].score);

const rows = outputRows(selected);
const csv = toCsv(rows);
assert.ok(csv.startsWith("用户名,平台,关注者,profile_url,最近的帖子,社区,评分"));
assert.ok(csv.includes("PredictionWatcher"));
assert.ok(csv.includes("PatientTrader"));

console.log("distribution discovery tests passed");
