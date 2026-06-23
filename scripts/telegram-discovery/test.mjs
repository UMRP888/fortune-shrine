import test from "node:test";
import assert from "node:assert/strict";
import {
  containsKeyword,
  deduplicateResults,
  mergeArchive,
  normalizeText
} from "./lib.mjs";
import {
  canonicalGroup,
  classifySignal,
  enrichResult,
  suggestReply
} from "./signal-engine.mjs";

test("normalizes Telegram text without changing words", () => {
  assert.equal(normalizeText("  wish\n me   luck  "), "wish me luck");
});

test("matches keywords case-insensitively", () => {
  assert.equal(containsKeyword("I am ALL IN", "all in"), true);
  assert.equal(containsKeyword("Still waiting here", "waiting"), true);
  assert.equal(containsKeyword("ordinary update", "fortune"), false);
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
    observedAt: "2026-06-23T09:00:00.000Z"
  };
  const newer = {
    keyword: "waiting",
    chat: "B",
    author: "Two",
    text: "waiting",
    timestamp: "",
    messageId: "2",
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
});

test("keeps ordinary market language below 0.50", () => {
  assert.equal(classifySignal("The long trade looks interesting").score < 0.5, true);
  assert.equal(classifySignal("Bitcoin may win this market window").score < 0.5, true);
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
    observedAt: "2026-06-23T13:10:00.000Z"
  });
  assert.deepEqual(
    Object.keys(result).slice(0, 5),
    ["group", "message", "score", "reason", "reply"]
  );
});
