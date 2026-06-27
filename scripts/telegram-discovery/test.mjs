import test from "node:test";
import assert from "node:assert/strict";
import {
  containsKeyword,
  deduplicateResults,
  mergeArchive,
  normalizeText
} from "./lib.mjs";
import { KEYWORDS } from "./config.mjs";
import {
  canonicalGroup,
  classifySignal,
  enrichResult,
  suggestReply
} from "./signal-engine.mjs";
import {
  buildReplyQueuePayload,
  queueCategory,
  queueRisk,
  routeResponseMode,
  selectBlessingDraft
} from "./reply-queue.mjs";
import { formatOperationHud } from "./operation-hud.mjs";
import {
  candidateIdentity,
  partitionQueueEligibility
} from "./queue-eligibility.mjs";

test("normalizes Telegram text without changing words", () => {
  assert.equal(normalizeText("  wish\n me   luck  "), "wish me luck");
});

test("matches keywords case-insensitively", () => {
  assert.equal(containsKeyword("I am ALL IN", "all in"), true);
  assert.equal(containsKeyword("Still waiting here", "waiting"), true);
  assert.equal(containsKeyword("ordinary update", "fortune"), false);
});

test("includes safe trading behavior keywords without deleting uncertainty layer", () => {
  for (const keyword of [
    "wish me luck",
    "pray for me",
    "hope",
    "waiting",
    "nervous",
    "uncertain",
    "leverage",
    "margin call",
    "funding rate",
    "open interest",
    "BTC dump",
    "BTC pump",
    "ETH dump",
    "ETH pump",
    "take profit",
    "stop loss",
    "opened position",
    "closed position",
    "got rekt",
    "wiped out",
    "blew my account",
    "panic sell"
  ]) {
    assert.equal(KEYWORDS.includes(keyword), true, keyword);
  }
  for (const keyword of ["announcement", "trade", "win", "lose", "market crash"]) {
    assert.equal(KEYWORDS.includes(keyword), false, keyword);
  }
});

test("deduplicates the same visible search result", () => {
  const base = {
    platform: "Telegram",
    keyword: "uncertain",
    chat: "Example Group",
    author: "Alice",
    text: "I feel uncertain",
    timestamp: "10:12",
    messageId: "42",
    peerId: "99",
    messageUrl: "https://t.me/example/42",
    observedAt: "2026-06-23T10:00:00.000Z"
  };
  assert.equal(deduplicateResults([base, { ...base }]).length, 1);
});

test("merges archive newest first", () => {
  const older = {
    keyword: "luck",
    chat: "A",
    author: "One",
    text: "luck",
    timestamp: "",
    messageId: "1",
    peerId: "1",
    messageUrl: "https://t.me/a/1",
    observedAt: "2026-06-23T09:00:00.000Z"
  };
  const newer = {
    keyword: "waiting",
    chat: "B",
    author: "Two",
    text: "waiting",
    timestamp: "",
    messageId: "2",
    peerId: "2",
    messageUrl: "https://t.me/b/2",
    observedAt: "2026-06-23T10:00:00.000Z"
  };
  assert.deepEqual(
    mergeArchive([older], [newer]).map((item) => item.messageId),
    ["2", "1"]
  );
});

test("scores a direct luck request as high value", () => {
  const signal = classifySignal("Wish me luck guys, I am all in");
  assert.equal(signal.score >= 0.9, true);
  assert.match(signal.reason, /explicit request for luck or prayer/);
  assert.match(signal.reason, /clear personal risk exposure/);
});

test("keeps soft hope signals in the medium band", () => {
  assert.equal(classifySignal("Hope it works").score, 0.71);
  assert.equal(classifySignal("Fingers crossed").score, 0.71);
  assert.equal(
    classifySignal("Yeah I hope so too Fingers crossed").score,
    0.8
  );
});

test("scores clear personal risk or result waiting as high value", () => {
  assert.equal(classifySignal("I am all in").score >= 0.9, true);
  assert.equal(classifySignal("Waiting for results").score >= 0.9, true);
  assert.equal(classifySignal("I got liquidated").score >= 0.9, true);
  assert.equal(classifySignal("I got rekt on leverage").score >= 0.9, true);
  assert.equal(classifySignal("I blew my account").score >= 0.9, true);
});

test("keeps ordinary market language below 0.50", () => {
  assert.equal(classifySignal("The long trade looks interesting").score < 0.5, true);
  assert.equal(classifySignal("Bitcoin may win this market window").score < 0.5, true);
  assert.equal(classifySignal("Funding rate is elevated").score < 0.5, true);
  assert.equal(
    classifySignal("$550 billion has been wiped out from US stocks").score < 0.5,
    true
  );
});

test("keeps first-person trading risk eligible without blessing the outcome", () => {
  assert.equal(classifySignal("I opened a long with leverage").score >= 0.7, true);
  assert.equal(classifySignal("My short entry is making me nervous").score >= 0.7, true);
  assert.equal(classifySignal("Open interest is elevated").score < 0.5, true);
});

test("scores emotional and trading channels independently before taking max", () => {
  const emotionalOnly = classifySignal("I am nervous and still waiting");
  assert.equal(emotionalOnly.emotionalScore >= 0.7, true);
  assert.equal(emotionalOnly.tradingScore < 0.7, true);
  assert.equal(emotionalOnly.score, Math.max(
    emotionalOnly.emotionalScore,
    emotionalOnly.tradingScore
  ));

  const tradingOnly = classifySignal("I opened a short with leverage");
  assert.equal(tradingOnly.emotionalScore < 0.7, true);
  assert.equal(tradingOnly.tradingScore >= 0.7, true);
  assert.equal(tradingOnly.score, Math.max(
    tradingOnly.emotionalScore,
    tradingOnly.tradingScore
  ));
});

test("recognizes direct anxiety variants without requiring new search keywords", () => {
  assert.equal(classifySignal("I am nervous today").score, 0.86);
  assert.equal(classifySignal("I'm anxious about the result").score, 0.86);
  assert.equal(classifySignal("I am worried this will not work").score, 0.86);
});

test("keeps social hope and coordination waiting below review level", () => {
  assert.equal(classifySignal("Hope you slept well").score < 0.5, true);
  assert.equal(classifySignal("Okay my friend we are waiting for you").score < 0.7, true);
});

test("keeps market narration and educational uncertainty below review level", () => {
  assert.equal(classifySignal("You can tell the market feels nervous").score < 0.5, true);
  assert.equal(
    classifySignal("Risk management is important in uncertain market conditions").score < 0.5,
    true
  );
  assert.equal(
    classifySignal("I completely agree. In uncertain markets, discipline beats emotion").score < 0.5,
    true
  );
  assert.equal(classifySignal("Yeah waiting when pump starting").score < 0.5, true);
});

test("keeps conversational emotion reactions below review level", () => {
  assert.equal(classifySignal("You really make me feel excited and nervous").score < 0.7, true);
  assert.equal(classifySignal("Nervous with what").score < 0.7, true);
});

test("keeps generic announcements below the review threshold", () => {
  const signal = classifySignal("Announcement: new long trade competition");
  assert.equal(signal.score < 0.7, true);
});

test("maps configured Telegram aliases to canonical groups", () => {
  assert.equal(canonicalGroup("GMX Official Community"), "GMX");
  assert.equal(canonicalGroup("gTrade / Gains Network"), "Gains Network");
});

test("reply suggestions bless state without promising an outcome", () => {
  const reply = suggestReply("Please work, I am nervous", "uncertainty");
  assert.doesNotMatch(reply, /\b(win|profit|moon|guarantee|will rise)\b/i);
});

test("produces the required review JSON shape", () => {
  const result = enrichResult({
    chat: "GMX Official",
    author: "Alice",
    text: "Wish me luck guys",
    timestamp: "21:10",
    messageId: "10",
    peerId: "100",
    messageUrl: "https://t.me/gmx/10",
    observedAt: "2026-06-23T13:10:00.000Z"
  });
  assert.deepEqual(
    Object.keys(result).slice(0, 5),
    ["group", "message", "score", "reason", "reply"]
  );
});

test("builds a review queue from the same completed HUD run", () => {
  const run = {
    startedAt: "2026-06-24T13:00:00.000Z",
    completedAt: "2026-06-24T13:01:00.000Z",
    rawMatchCount: 2,
    resultCount: 2,
    minimumScore: 0.7,
    allowedChats: ["GMX"],
    results: [
      {
        group: "GMX",
        message: "Wish me luck",
        score: 0.9,
        reason: "explicit request for luck or prayer + first-person personal stakes",
        author: "Alice",
        timestamp: "21:00",
        messageId: "1",
        peerId: "10",
        messageUrl: "https://t.me/gmx/1",
        matchedKeywords: ["wish me luck"],
        observedAt: "2026-06-24T13:00:30.000Z"
      },
      {
        group: "GMX",
        message: "Waiting for results",
        score: 0.91,
        reason: "waiting for a meaningful result",
        author: "Bob",
        timestamp: "21:01",
        messageId: "2",
        peerId: "10",
        messageUrl: "https://t.me/gmx/2",
        matchedKeywords: ["waiting"],
        observedAt: "2026-06-24T13:00:40.000Z"
      }
    ]
  };
  const queue = buildReplyQueuePayload(run, "/tmp/latest.json");

  assert.equal(queue.itemCount, run.resultCount);
  assert.equal(queue.sourceRun.completedAt, run.completedAt);
  assert.equal(queue.items[0].category, "Prayer");
  assert.equal(queue.items[1].category, "Waiting");
  assert.equal(queue.items[0].messageUrl, "https://t.me/gmx/1");
  assert.deepEqual(queue.items[1].matchedKeywords, ["waiting"]);
  assert.equal(queue.items.every((item) => item.status === "pending_human_review"), true);
});

test("preserves existing queue category and risk mappings", () => {
  assert.equal(queueCategory({
    message: "I am nervous",
    reason: "direct personal anxiety or uncertainty"
  }), "Anxiety");
  assert.equal(queueCategory({
    message: "We can't say what happens",
    reason: "anxiety or uncertainty"
  }), "Uncertainty");
  assert.equal(queueRisk({ reason: "outcome pressure" }), "Medium");
  assert.equal(queueRisk({ reason: "first-person personal stakes" }), "Low");
});

test("routes high-risk contexts through Reality Flow before reply selection", () => {
  const run = {
    startedAt: "2026-06-24T13:00:00.000Z",
    completedAt: "2026-06-24T13:01:00.000Z",
    rawMatchCount: 3,
    resultCount: 3,
    minimumScore: 0.7,
    allowedChats: ["Bitget English"],
    results: [
      {
        group: "Bitget English",
        message: "Pray for me I will win",
        score: 0.9,
        reason: "explicit request for luck or prayer + outcome pressure",
        author: "A",
        timestamp: "21:00",
        messageId: "1",
        peerId: "-100",
        messageUrl: "https://web.telegram.org/k/#-100",
        matchedKeywords: ["pray"],
        observedAt: "2026-06-24T13:00:30.000Z"
      },
      {
        group: "Bitget English",
        message: "Still waiting for this setup",
        score: 0.8,
        reason: "direct personal waiting",
        author: "B",
        timestamp: "21:01",
        messageId: "2",
        peerId: "-100",
        messageUrl: "https://web.telegram.org/k/#-100",
        matchedKeywords: ["waiting"],
        observedAt: "2026-06-24T13:00:31.000Z"
      },
      {
        group: "Bitget English",
        message: "I blew my account twice",
        score: 0.91,
        reason: "clear personal risk exposure + outcome pressure + trading channel",
        author: "C",
        timestamp: "21:02",
        messageId: "3",
        peerId: "-100",
        messageUrl: "https://web.telegram.org/k/#-100",
        matchedKeywords: ["blew my account"],
        observedAt: "2026-06-24T13:00:32.000Z"
      },
      {
        group: "Bitget English",
        message: "I hope your trade comes out with profit Good luck",
        score: 0.8,
        reason: "hope without explicit blessing request",
        author: "D",
        timestamp: "21:03",
        messageId: "4",
        peerId: "-100",
        messageUrl: "https://web.telegram.org/k/#-100",
        matchedKeywords: ["hope", "good luck"],
        observedAt: "2026-06-24T13:00:33.000Z"
      }
    ]
  };
  const queue = buildReplyQueuePayload(run, "/tmp/latest.json", { random: () => 0 });
  const forbidden = /\b(may|hope|wishing|wish you|pray|prayer|blessing|everything will be fine|stay strong|you will be okay)\b/i;

  for (const item of queue.items) {
    assert.equal(routeResponseMode(item, item.category), "REALITY_FLOW");
    assert.doesNotMatch(item.blessingDraft, forbidden);
    assert.doesNotMatch(item.replyDraftA, forbidden);
    assert.doesNotMatch(item.replyDraftB, forbidden);
    assert.doesNotMatch(item.replyDraftC, forbidden);
  }
});

test("selects a blessing outside recent reply history when possible", () => {
  const first = selectBlessingDraft("Waiting", [], () => 0);
  const next = selectBlessingDraft("Waiting", [first], () => 0);

  assert.notEqual(next, first);
});

test("avoids duplicate blessings for non-high-risk blessing mode when category pool allows it", () => {
  const run = {
    startedAt: "2026-06-24T13:00:00.000Z",
    completedAt: "2026-06-24T13:01:00.000Z",
    rawMatchCount: 3,
    resultCount: 3,
    minimumScore: 0.7,
    allowedChats: ["Bitget English"],
    results: Array.from({ length: 3 }, (_, index) => ({
      group: "Bitget English",
      message: `Hope sample ${index}`,
      score: 0.8,
      reason: "hope without explicit blessing request",
      author: `User ${index}`,
      timestamp: "21:00",
      messageId: String(index + 1),
      peerId: "-100",
      messageUrl: "https://web.telegram.org/k/#-100",
      matchedKeywords: ["hope"],
      observedAt: "2026-06-24T13:00:30.000Z"
    }))
  };
  const queue = buildReplyQueuePayload(run, "/tmp/latest.json", { random: () => 0 });
  const blessings = queue.items.map((item) => item.blessingDraft);

  assert.equal(new Set(blessings).size, blessings.length);
});

test("formats Run HUD as an operational queue", () => {
  const output = formatOperationHud({
    run: { completedAt: "2026-06-25T14:31:27.014Z" },
    queue: { itemCount: 12 },
    freshCandidateCount: 4,
    seenAgainCount: 8,
    topQueue: {
      queue: [{
        rank: 1,
        priorityScore: 0.9,
        group: "Bitget English",
        category: "Waiting",
        original: "Still waiting for the result",
        reason: "waiting for a meaningful result",
        originalUrl: "https://web.telegram.org/k/#example",
        blessingDraft: "May patience remain beside you.",
        author: "Tester",
        source: "Telegram",
        replyDraftA: "Reply A text",
        replyDraftB: "Reply B text",
        replyDraftC: "Reply C text",
        dedupKey: "abc123",
        status: "pending_human_review"
      }]
    }
  });

  assert.match(output, /^人工发送队列（完整稳定输出版）/);
  assert.match(output, /安全锁：\n禁止自动发送 \/ 禁止批量打开 \/ 禁止后台操作/);
  assert.match(output, /导入区\n\[载入默认队列\] \[载入 Polymarket 今日队列\]\n1 users · 1 posts ready/);
  assert.match(output, /QUEUE LIST（稳定输出）/);
  assert.match(output, /CARD 1\n@Tester · Bitget English · Waiting\nStill waiting for the result/);
  assert.match(output, /REPLIES:\n\( \) Reply A text\n\( \) Reply B text\n\( \) Reply C text/);
  assert.match(output, /ACTIONS:\n\[复制回复\] \[打开原帖\] \[填入回复\] \[标记已发送\]/);
  assert.match(output, /END OF QUEUE/);
  assert.doesNotMatch(
    output,
    /RUN HUD|TOP10|OPERATOR QUEUE|BLESSING QUEUE|runPath|replyQueueUpdatedAt|verifiableCandidateCount|latest\.json|Completed/
  );
});

test("keeps previously seen Telegram messages queue-eligible with a score penalty", () => {
  const processed = {
    peerId: "-100",
    messageId: "42",
    group: "Bitget English",
    message: "Pray for me",
    score: 0.75,
    reason: "explicit request for luck or prayer"
  };
  const fresh = {
    peerId: "-100",
    messageId: "43",
    group: "Bitget English",
    message: "Still waiting",
    score: 0.8,
    reason: "direct personal waiting"
  };
  const partition = partitionQueueEligibility(
    [{ ...processed }, fresh],
    [processed]
  );

  assert.equal(candidateIdentity(processed), "-100:42");
  assert.deepEqual(
    partition.freshResults.map(candidateIdentity),
    ["-100:43"]
  );
  assert.deepEqual(
    partition.seenAgainResults.map(candidateIdentity),
    ["-100:42"]
  );
  assert.deepEqual(
    partition.queueResults.map(candidateIdentity),
    ["-100:43", "-100:42"]
  );
  assert.equal(partition.queueResults.find((item) =>
    candidateIdentity(item) === "-100:42"
  ).seenAgain, true);
  assert.equal(partition.queueResults.find((item) =>
    candidateIdentity(item) === "-100:42"
  ).score, 0.72);
});

test("matches legacy archive records that lack peerId", () => {
  const current = {
    peerId: "-1872223162",
    messageId: "4304492379",
    group: "Bitget English",
    message: "Pray for me"
  };
  const legacyArchive = {
    peerId: "",
    messageId: "4304492379",
    group: "Bitget English",
    message: "Pray for me"
  };
  const partition = partitionQueueEligibility([current], [legacyArchive]);

  assert.equal(partition.freshResults.length, 0);
  assert.deepEqual(
    partition.seenAgainResults.map(candidateIdentity),
    ["-1872223162:4304492379"]
  );
  assert.deepEqual(
    partition.queueResults.map(candidateIdentity),
    ["-1872223162:4304492379"]
  );
});
