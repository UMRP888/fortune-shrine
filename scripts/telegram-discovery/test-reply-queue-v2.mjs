import test from "node:test";
import assert from "node:assert/strict";
import {
  deduplicate,
  enforceExpressionDiversity,
  expressionIntent,
  resolveOriginalUrl,
  selectBalancedTopQueue
} from "./reply-queue-v2.mjs";

function item(id, category, original, score, extra = {}) {
  return { id, category, original, score, riskLevel: "Low", ...extra };
}

test("collapses common pray-for-me variants into one family", () => {
  const unique = deduplicate([
    item("a", "Prayer", "Pray for me", 0.9),
    item("b", "Prayer", "Pray for me too bro 🙏", 0.9),
    item("c", "Prayer", "Don't forget to pray for me", 0.9)
  ]);

  assert.equal(unique.length, 1);
});

test("preserves the highest scored representative", () => {
  const unique = deduplicate([
    item("a", "Prayer", "Pray for me", 0.9),
    item("b", "Prayer", "Please pray for me", 0.95)
  ]);

  assert.equal(unique[0].id, "b");
});

test("gives each available category a queue opportunity before filling by score", () => {
  const selected = selectBalancedTopQueue([
    item("p1", "Prayer", "Pray for me", 0.99, {
      blessingDraft: "A sincere prayer can stand without claiming the answer."
    }),
    item("p2", "Prayer", "Wish me luck", 0.98, {
      blessingDraft: "May courage walk beside you tonight."
    }),
    item("w1", "Waiting", "Still waiting", 0.8, {
      blessingDraft: "Waiting can be long, and this hour can simply be witnessed."
    }),
    item("h1", "Hope", "Hope it works", 0.78, {
      blessingDraft: "Hope can stay honest without becoming a burden."
    }),
    item("a1", "Anxiety", "I am nervous", 0.75, {
      blessingDraft: "May calm return one breath at a time."
    }),
    item("u1", "Uncertainty", "I do not know", 0.76, {
      blessingDraft: "A quiet harbor is still a place of passage."
    })
  ], 5);

  assert.deepEqual(
    new Set(selected.map((entry) => entry.category)),
    new Set(["Prayer", "Waiting", "Hope", "Anxiety", "Uncertainty"])
  );
  assert.equal(selected[0].category, "Waiting");
  assert.equal(selected.some((entry) => entry.category === "Anxiety"), true);
});

test("prioritizes waiting trading risk and anxiety above other candidates", () => {
  const selected = selectBalancedTopQueue([
    item("hope-high", "Hope", "Hope this is okay", 0.98, {
      reason: "hope without explicit blessing request",
      blessingDraft: "Hope can stay honest without becoming a burden."
    }),
    item("anxiety", "Anxiety", "I am nervous", 0.76, {
      reason: "direct personal anxiety or uncertainty",
      blessingDraft: "May calm return one breath at a time."
    }),
    item("risk", "Hope", "I got rekt yesterday", 0.77, {
      reason: "clear personal risk exposure + outcome pressure + first person personal stakes",
      riskLevel: "Medium",
      blessingDraft: "May steadiness remain with you."
    }),
    item("trading", "Hope", "I opened a long with leverage", 0.78, {
      reason: "clear personal risk exposure + first person personal stakes + trading channel",
      riskLevel: "Medium",
      blessingDraft: "May your hand remain steady."
    }),
    item("waiting", "Waiting", "Still waiting for the result", 0.75, {
      reason: "direct personal waiting",
      blessingDraft: "Waiting can be long, and this hour can simply be witnessed."
    })
  ], 5);

  assert.deepEqual(
    selected.map((entry) => entry.id),
    ["waiting", "trading", "risk", "anxiety", "hope-high"]
  );
});

test("does not force weak market narration into the queue for category balance", () => {
  const selected = selectBalancedTopQueue([
    item("u1", "Uncertainty", "Gold is a store of value during uncertain economic conditions", 0.72, {
      reason: "anxiety or uncertainty + market narration + educational or analytical language",
      blessingDraft: "May you have enough quiet to meet whatever comes next."
    }),
    ...Array.from({ length: 10 }, (_, index) => item(
      `h${index}`,
      "Hope",
      `I got rekt but I am still trying ${index}`,
      0.9 - (index * 0.01),
      {
        reason: "clear personal risk exposure + first person personal stakes",
        blessingDraft: `May steadiness remain with you ${index}.`
      }
    ))
  ], 10);

  assert.equal(selected.length, 10);
  assert.equal(selected.some((entry) => entry.id === "u1"), false);
});

test("clusters expression intent rather than wording", () => {
  assert.equal(expressionIntent(item("a", "Hope", "x", 0.8, {
    blessingDraft: "祈祷你保持平静"
  })), "reassurance");
  assert.equal(expressionIntent(item("b", "Hope", "x", 0.8, {
    blessingDraft: "A quiet harbor is still a place of passage."
  })), "metaphorical support");
});

test("pre-queue diversity rejects semantically equivalent calm replies", () => {
  const selected = enforceExpressionDiversity([
    item("a", "Hope", "one", 0.99, {
      blessingDraft: "祈祷你保持平静"
    }),
    item("b", "Hope", "two", 0.98, {
      blessingDraft: "希望你保持平静"
    }),
    item("c", "Hope", "three", 0.97, {
      blessingDraft: "祝你保持平静"
    }),
    item("d", "Waiting", "four", 0.8, {
      blessingDraft: "A quiet harbor is still a place of passage."
    }),
    item("e", "Prayer", "five", 0.79, {
      blessingDraft: "May courage walk beside you tonight."
    })
  ], 5);

  const calmCount = selected.filter((entry) =>
    /保持平静/.test(entry.blessingDraft)
  ).length;

  assert.equal(calmCount, 1);
  assert.equal(new Set(selected.map(expressionIntent)).size >= 2, true);
});

test("backfills high-quality unique candidates to keep the operator queue at ten", () => {
  const selected = selectBalancedTopQueue(
    Array.from({ length: 12 }, (_, index) => item(
      `h${index}`,
      "Hope",
      `Unique high quality candidate ${index}`,
      0.9 - (index * 0.01),
      {
        blessingDraft: "Hope stays with you, gently and steadily.",
        replyDraftA: "Fingers crossed for a calm heart while you wait.",
        replyDraftB: "Hope stays with you, gently and steadily.",
        replyDraftC: "Wishing you some quiet fortune in this uncertain moment."
      }
    )),
    10
  );

  assert.equal(selected.length, 10);
  assert.deepEqual(
    selected.map((entry) => entry.priorityScore),
    [...selected].map((entry) => entry.priorityScore).sort((a, b) => b - a)
  );
});

test("reuses supported existing original URL fields", () => {
  assert.equal(
    resolveOriginalUrl({
      source: "Telegram",
      message_url: "https://t.me/example/123"
    }),
    "https://t.me/example/123"
  );
  assert.equal(
    resolveOriginalUrl({
      source: "X",
      post_url: "https://x.com/example/status/123"
    }),
    "https://x.com/example/status/123"
  );
  assert.equal(
    resolveOriginalUrl({
      source: "Reddit",
      source_url: "https://www.reddit.com/r/example/comments/123"
    }),
    "https://www.reddit.com/r/example/comments/123"
  );
});

test("rejects missing, malformed, or source-mismatched links", () => {
  assert.equal(resolveOriginalUrl({ source: "Telegram" }), null);
  assert.equal(resolveOriginalUrl({
    source: "Telegram",
    message_link: "javascript:alert(1)"
  }), null);
  assert.equal(resolveOriginalUrl({
    source: "Telegram",
    message_link: "https://example.com/not-telegram"
  }), null);
});
