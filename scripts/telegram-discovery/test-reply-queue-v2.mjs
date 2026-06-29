import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  buildReplyQueueV2,
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
    ["waiting", "trading", "risk", "anxiety"]
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
      `I am still trying after getting rekt ${index}`,
      0.9 - (index * 0.01),
      {
        reason: "clear personal risk exposure + first person personal stakes",
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

test("rejects generic social hope from the operator queue", () => {
  const selected = selectBalancedTopQueue([
    item("social-1", "Hope", "Hope we are all good", 0.9, {
      reason: "hope without explicit blessing request + first-person personal stakes + emotional channel",
      blessingDraft: "Hope stays with you, gently and steadily."
    }),
    item("social-2", "Hope", "I hope you are active dear", 0.9, {
      reason: "hope without explicit blessing request + first-person personal stakes + emotional channel",
      blessingDraft: "Hope stays with you, gently and steadily."
    }),
    item("valid", "Waiting", "Still waiting for the result", 0.8, {
      reason: "direct personal waiting",
      blessingDraft: "Waiting can be long, and this hour can simply be witnessed."
    })
  ], 10);

  assert.deepEqual(selected.map((entry) => entry.id), ["valid"]);
});

test("rejects negated anxiety from the operator queue", () => {
  const selected = selectBalancedTopQueue([
    item("negated", "Anxiety", "I am patient am not worried", 0.86, {
      reason: "direct personal anxiety or uncertainty",
      blessingDraft: "May calm return one breath at a time."
    }),
    item("valid", "Anxiety", "I'm getting a bit anxious, to be honest", 0.86, {
      reason: "direct personal anxiety or uncertainty",
      blessingDraft: "May calm return one breath at a time."
    })
  ], 10);

  assert.deepEqual(selected.map((entry) => entry.id), ["valid"]);
});

test("rejects self-authored queue items", () => {
  const selected = selectBalancedTopQueue([
    item("self", "Waiting", "Still waiting", 0.9, {
      author: "You:",
      reason: "direct personal waiting",
      blessingDraft: "Waiting can be long, and this hour can simply be witnessed."
    }),
    item("valid", "Waiting", "Still waiting for the result", 0.8, {
      author: "Someone",
      reason: "direct personal waiting",
      blessingDraft: "Waiting can be long, and this hour can simply be witnessed."
    })
  ], 10);

  assert.deepEqual(selected.map((entry) => entry.id), ["valid"]);
});

test("writes an empty v2 queue when current run has no eligible items", async () => {
  const outputDir = await mkdtemp(path.join(os.tmpdir(), "reply-queue-v2-"));
  try {
    const existing = {
      version: "2.1",
      generatedAt: "2026-06-28T00:00:00.000Z",
      sourceRun: { completedAt: "2026-06-28T00:00:00.000Z" },
      queue: [item("old", "Waiting", "Still waiting", 0.8)]
    };
    await writeFile(
      path.join(outputDir, "reply_queue_v2.json"),
      `${JSON.stringify(existing, null, 2)}\n`,
      "utf8"
    );
    const { payload } = await buildReplyQueueV2({
      outputDir,
      sourcePayload: {
        sourceRun: { completedAt: "2026-06-28T01:00:00.000Z" },
        items: []
      }
    });

    const written = JSON.parse(await readFile(
      path.join(outputDir, "reply_queue_v2.json"),
      "utf8"
    ));

    assert.equal(payload.preservedFromPreviousRun, undefined);
    assert.equal(payload.emptyRun, undefined);
    assert.equal(payload.queue.length, 0);
    assert.equal(written.queue.length, 0);
    assert.equal(written.sourceRun.completedAt, "2026-06-28T01:00:00.000Z");
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});

test("v2 writer fills missing reply drafts before rendering", async () => {
  const outputDir = await mkdtemp(path.join(os.tmpdir(), "reply-queue-v2-"));
  try {
    const { payload } = await buildReplyQueueV2({
      outputDir,
      sourcePayload: {
        sourceRun: { completedAt: "2026-06-28T01:00:00.000Z" },
        items: [item("one", "Waiting", "Still waiting for the result", 0.9, {
          reason: "direct personal waiting",
          replyDraftA: "Only one draft"
        })]
      }
    });
    const [entry] = payload.queue;
    assert.equal(new Set([
      entry.replyDraftA,
      entry.replyDraftB,
      entry.replyDraftC
    ]).size, 3);
    assert.equal(Boolean(entry.replyDraftB), true);
    assert.equal(Boolean(entry.replyDraftC), true);
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});

test("v2 writer replaces old Reality Flow fallback drafts", async () => {
  const outputDir = await mkdtemp(path.join(os.tmpdir(), "reply-queue-v2-"));
  try {
    const { payload } = await buildReplyQueueV2({
      outputDir,
      sourcePayload: {
        sourceRun: { completedAt: "2026-06-28T01:00:00.000Z" },
        items: [item("old-flow", "Waiting", "Still waiting for the result", 0.9, {
          reason: "direct personal waiting",
          replyDraftA: "Waiting is not neutral here; the delay keeps exposure open while the answer is still forming.",
          replyDraftB: "Information arrives late in moments like this; timing can change the shape before certainty appears.",
          replyDraftC: "The moment is still unresolved, and delay can carry its own cost before anything becomes final."
        })]
      }
    });
    const [entry] = payload.queue;
    assert.doesNotMatch(entry.replyDraftA, /Waiting is not neutral here/);
    assert.doesNotMatch(entry.replyDraftB, /Information arrives late/);
    assert.doesNotMatch(entry.replyDraftC, /moment is still unresolved/);
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
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
