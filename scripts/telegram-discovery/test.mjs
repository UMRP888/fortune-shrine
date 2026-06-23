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
  assert.match(signal.reason, /request for luck or prayer/);
  assert.match(signal.reason, /personal risk exposure/);
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
