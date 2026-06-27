import path from "node:path";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { readJson, writeJsonAtomic } from "./lib.mjs";

const directory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(directory, "../..");
const blessingCorpusPath = path.join(projectRoot, "docs", "blessing-corpus-v2.json");
const BLESSING_HISTORY_LIMIT = 50;
const RECENT_BLESSING_BLOCK_LIMIT = 20;
const TOP_K_BLESSING_POOL = 10;

const DRAFTS = {
  Prayer: {
    blessingDraft: "May quiet courage walk beside you while the answer remains unseen.",
    replyDraftA: "Wishing you a steady heart while you wait.",
    replyDraftB: "May the waiting be gentle on you tonight.",
    replyDraftC: "Hope you can hold one calm breath through this moment."
  },
  Waiting: {
    blessingDraft: "May patience remain beside you while the answer is still forming.",
    replyDraftA: "That waiting place is heavy. Hope you stay steady through it.",
    replyDraftB: "May the time pass gently while you wait for the answer.",
    replyDraftC: "Wishing you calm while things are still unresolved."
  },
  Anxiety: {
    blessingDraft: "May the noise grow quieter, and may your hand remain steady.",
    replyDraftA: "That sounds heavy. Wishing you one steady breath at a time.",
    replyDraftB: "May the noise ease enough for you to find a little calm.",
    replyDraftC: "Wishing you steadiness while this feeling passes through."
  },
  Uncertainty: {
    blessingDraft: "May clarity arrive slowly, without forcing your hand.",
    replyDraftA: "Uncertainty is a hard place to stand. Wishing you steadiness there.",
    replyDraftB: "Hope the next step becomes clearer without rushing you.",
    replyDraftC: "May you have enough quiet to meet whatever comes next."
  },
  Hope: {
    blessingDraft: "May hope stay warm without turning into hunger.",
    replyDraftA: "Fingers crossed for a calm heart while you wait.",
    replyDraftB: "Hope stays with you, gently and steadily.",
    replyDraftC: "Wishing you some quiet fortune in this uncertain moment."
  }
};

const CORPUS_CATEGORY_MAP = {
  Prayer: ["风险", "希望"],
  Waiting: ["等待"],
  Anxiety: ["风险"],
  Uncertainty: ["Uncertainty", "决策"],
  Hope: ["希望"]
};

const FALLBACK_BLESSING_ALTERNATES = {
  Prayer: [
    "May steadiness stand beside you while the outcome remains hidden.",
    "May courage stay quiet in your chest while you wait.",
    "May the moment meet you gently, without asking you to know the future.",
    "May your hand remain steady before the answer arrives.",
    "May this uncertainty find you with one calm breath still near."
  ],
  Waiting: [
    "May the waiting leave room for breath.",
    "May patience protect your peace while the answer is still away.",
    "May this unfinished hour be gentle on you.",
    "May calm stay close while time does its part.",
    "May you remain whole inside the pause."
  ],
  Anxiety: [
    "May the noise loosen its hold, one breath at a time.",
    "May your body remember that it is allowed to soften.",
    "May steadiness return before the moment asks more of you.",
    "May fear become a witness rather than a master.",
    "May the room inside you grow quieter."
  ],
  Uncertainty: [
    "May clarity arrive without forcing your hand.",
    "May you stand gently in what cannot yet be known.",
    "May the unknown lose its sharpest edge tonight.",
    "May your judgment remain patient inside the fog.",
    "May enough quiet remain for the next step to appear."
  ],
  Hope: [
    "May hope stay honest without becoming a burden.",
    "May the small light you carry stay warm.",
    "May possibility remain gentle, not demanding.",
    "May hope be shelter rather than pressure.",
    "May your wish remain human without pretending to know tomorrow."
  ]
};

function normalizeBlessing(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function blessingFingerprint(value) {
  return normalizeBlessing(value).toLocaleLowerCase();
}

function blessingLengthBucket(value) {
  const length = normalizeBlessing(value).length;
  if (length < 75) return "short";
  if (length < 135) return "medium";
  return "long";
}

function blessingIntensity(value) {
  const text = blessingFingerprint(value);
  if (/\b(heavy|fear|grief|difficult|pain|loss|whole|endurance|pressure|burden)\b/.test(text)) {
    return "deep";
  }
  if (/\b(light|seed|sky|flame|door|river|harbor|night|breath|quiet)\b/.test(text)) {
    return "metaphor";
  }
  return "plain";
}

function blessingSyntax(value) {
  const text = normalizeBlessing(value);
  if (/^May\b/i.test(text)) return "may";
  if (/^You\b/i.test(text)) return "you";
  if (/^There\b/i.test(text)) return "there";
  if (/^The\b/i.test(text)) return "the";
  if (/^A\b/i.test(text)) return "a";
  return "other";
}

function blessingCreatedAt(value) {
  const key = blessingFingerprint(value);
  const corpusEntry = CORPUS_BLESSINGS.find((entry) =>
    blessingFingerprint(entry.text) === key
  );
  return corpusEntry?.createdAt || null;
}

function freshnessBoost(value, now = Date.now()) {
  const createdAt = blessingCreatedAt(value);
  if (!createdAt) return 0;
  const ageMs = now - Date.parse(createdAt);
  if (!Number.isFinite(ageMs) || ageMs < 0) return 0;
  const ageHours = ageMs / 36e5;
  if (ageHours <= 24) return 3;
  if (ageHours <= 72) return 1;
  return 0;
}

function weightedPick(items, random = Math.random) {
  const total = items.reduce((sum, item) => sum + Math.max(0.1, item.score), 0);
  let threshold = random() * total;
  for (const item of items) {
    threshold -= Math.max(0.1, item.score);
    if (threshold <= 0) return item;
  }
  return items[items.length - 1];
}

function uniqueBlessings(values) {
  const unique = [];
  const seen = new Set();

  for (const value of values) {
    const blessing = normalizeBlessing(value);
    const key = blessing.toLocaleLowerCase();
    if (!blessing || seen.has(key)) continue;
    seen.add(key);
    unique.push(blessing);
  }

  return unique;
}

function loadCorpusBlessings() {
  try {
    const corpus = JSON.parse(readFileSync(blessingCorpusPath, "utf8"));
    return corpus
      .filter((entry) =>
        entry
        && entry["语言"] === "en"
        && typeof entry["文本"] === "string"
        && typeof entry["类别"] === "string"
      )
      .map((entry) => ({
        category: entry["类别"],
        text: entry["文本"],
        createdAt: entry.created_time
          || entry.createdTime
          || entry["created_time"]
          || entry["创建时间"]
          || entry.added_at
          || entry.addedAt
          || null
      }));
  } catch {
    return [];
  }
}

const CORPUS_BLESSINGS = loadCorpusBlessings();
const BLESSING_POOLS = Object.fromEntries(
  Object.entries(DRAFTS).map(([category, drafts]) => {
    const corpusCategories = CORPUS_CATEGORY_MAP[category] || [];
    const corpusBlessings = CORPUS_BLESSINGS
      .filter((entry) => corpusCategories.includes(entry.category))
      .map((entry) => entry.text);

    return [
      category,
      uniqueBlessings([
        drafts.blessingDraft,
        ...(FALLBACK_BLESSING_ALTERNATES[category] || []),
        ...corpusBlessings
      ])
    ];
  })
);

export function selectBlessingDraft(
  category,
  recentBlessings = [],
  random = Math.random,
  {
    usageCounts = new Map(),
    categoryHistory = []
  } = {}
) {
  const pool = BLESSING_POOLS[category] || [DRAFTS.Hope.blessingDraft];
  const recent = new Set(recentBlessings
    .slice(0, RECENT_BLESSING_BLOCK_LIMIT)
    .map(blessingFingerprint));
  const previousSameCategory = categoryHistory
    .filter((item) => item.category === category)
    .slice(0, 2);
  const blockedSyntax = new Set(previousSameCategory.map((item) =>
    blessingSyntax(item.blessingDraft)
  ));
  const blockedLength = new Set(previousSameCategory.map((item) =>
    blessingLengthBucket(item.blessingDraft)
  ));
  const blockedIntensity = new Set(previousSameCategory.map((item) =>
    blessingIntensity(item.blessingDraft)
  ));
  const now = Date.now();
  const valid = uniqueBlessings(pool)
    .filter((blessing) => !recent.has(blessingFingerprint(blessing)));
  const candidatePool = valid.length ? valid : uniqueBlessings(pool);
  const corpusFresh = candidatePool
    .filter((blessing) => freshnessBoost(blessing, now) > 0)
    .slice(0, TOP_K_BLESSING_POOL);
  const topK = uniqueBlessings([
    ...corpusFresh,
    ...candidatePool
  ]).slice(0, TOP_K_BLESSING_POOL);
  const diversified = topK.filter((blessing) => {
    if (previousSameCategory.length < 2) return true;
    return !blockedSyntax.has(blessingSyntax(blessing))
      || !blockedLength.has(blessingLengthBucket(blessing))
      || !blockedIntensity.has(blessingIntensity(blessing));
  });
  const scoringPool = diversified.length ? diversified : topK;
  const scored = scoringPool
    .map((blessing) => {
      const key = blessingFingerprint(blessing);
      const usageCount = usageCounts.get(key) || 0;
      return {
        blessing,
        score: 1 + freshnessBoost(blessing, now) - usageCount * 2
      };
    })
    .sort((left, right) => right.score - left.score);
  const finalists = scored.slice(0, 3);
  return weightedPick(finalists.length ? finalists : scored, random)?.blessing || pool[0];
}

export function queueCategory(result) {
  const reason = String(result.reason || "").toLocaleLowerCase();
  const message = String(result.message || "").toLocaleLowerCase();

  if (reason.includes("explicit request for luck or prayer")) return "Prayer";
  if (
    reason.includes("waiting for a meaningful result")
    || reason.includes("direct personal waiting")
    || /\b(still waiting|wait and see|waiting)\b/.test(message)
  ) return "Waiting";
  if (reason.includes("direct personal anxiety")) return "Anxiety";
  if (
    reason.includes("anxiety or uncertainty")
    && /\b(uncertain|not sure|can't say|cannot say|don't know|do not know)\b/.test(message)
  ) return "Uncertainty";
  return "Hope";
}

export function queueRisk(result) {
  const reason = String(result.reason || "").toLocaleLowerCase();
  return (
    reason.includes("outcome pressure")
    || reason.includes("clear personal risk exposure")
    || reason.includes("general market or trade context")
  ) ? "Medium" : "Low";
}

export function buildReplyQueuePayload(run, latestPath, {
  recentBlessings = [],
  usageCounts = new Map(),
  random = Math.random
} = {}) {
  const rollingRecentBlessings = [...recentBlessings];
  const rollingCategoryHistory = [];
  const items = run.results.map((result, index) => {
    const category = queueCategory(result);
    const blessingDraft = selectBlessingDraft(
      category,
      rollingRecentBlessings,
      random,
      {
        usageCounts,
        categoryHistory: rollingCategoryHistory
      }
    );
    rollingRecentBlessings.unshift(blessingDraft);
    rollingCategoryHistory.unshift({ category, blessingDraft });
    usageCounts.set(
      blessingFingerprint(blessingDraft),
      (usageCounts.get(blessingFingerprint(blessingDraft)) || 0) + 1
    );

    return {
      id: `tg-${String(index + 1).padStart(4, "0")}`,
      source: "Telegram",
      group: result.group,
      original: result.message,
      category,
      score: result.score,
      reason: result.reason,
      ...DRAFTS[category],
      blessingDraft,
      riskLevel: queueRisk(result),
      author: result.author,
      timestamp: result.timestamp,
      messageId: result.messageId,
      peerId: result.peerId,
      messageUrl: result.messageUrl,
      dedupKey: result.dedupKey,
      matchedKeywords: result.matchedKeywords,
      observedAt: result.observedAt,
      status: "pending_human_review"
    };
  });

  return {
    version: "1.0-lite",
    generatedAt: new Date().toISOString(),
    sourceRun: {
      latestPath,
      startedAt: run.startedAt,
      completedAt: run.completedAt,
      rawMatchCount: run.rawMatchCount,
      resultCount: run.resultCount,
      minimumScore: run.minimumScore,
      allowedChats: run.allowedChats
    },
    policy: {
      autoReply: false,
      autoSend: false,
      humanReviewRequired: true,
      note: "Drafts bless the user state, not the outcome."
    },
    itemCount: items.length,
    items
  };
}

function historyEntryFromQueueItem(item, selectedAt = null) {
  return {
    selectedAt: selectedAt || item.reviewedAt || item.observedAt || null,
    sourceRunCompletedAt: null,
    candidateId: item.id,
    category: item.category,
    group: item.group,
    peerId: item.peerId,
    messageId: item.messageId,
    blessingDraft: item.blessingDraft,
    status: item.status || "existing_queue"
  };
}

async function bootstrapBlessingHistory(outputDir) {
  const replyQueueV2 = await readJson(
    path.join(outputDir, "reply_queue_v2.json"),
    null
  );
  const items = [
    ...((replyQueueV2?.queue || []).map((item) =>
      historyEntryFromQueueItem(item, replyQueueV2.generatedAt)
    ))
  ];
  const seenBlessings = new Set();

  return items.filter((item) => {
    const key = normalizeBlessing(item.blessingDraft).toLocaleLowerCase();
    if (!key || seenBlessings.has(key)) return false;
    seenBlessings.add(key);
    return true;
  });
}

export async function generateReplyQueue(run, outputDir, latestPath, {
  persistQueue = true
} = {}) {
  const blessingHistoryPath = path.join(outputDir, "reply_blessing_history.json");
  const existingHistory = await readJson(blessingHistoryPath, null);
  const existingHistoryItems = existingHistory?.items?.length
    ? existingHistory.items
    : await bootstrapBlessingHistory(outputDir);
  const recentBlessings = existingHistoryItems
    .slice(0, BLESSING_HISTORY_LIMIT)
    .map((item) => item.blessingDraft);
  const usageCounts = new Map();
  for (const item of existingHistoryItems) {
    const key = blessingFingerprint(item.blessingDraft);
    if (!key) continue;
    usageCounts.set(key, (usageCounts.get(key) || 0) + 1);
  }
  const payload = buildReplyQueuePayload(run, latestPath, {
    recentBlessings,
    usageCounts
  });
  const replyQueuePath = path.join(outputDir, "reply_queue.json");
  if (persistQueue) await writeJsonAtomic(replyQueuePath, payload);
  const newHistoryItems = payload.items.map((item) => ({
    selectedAt: payload.generatedAt,
    sourceRunCompletedAt: payload.sourceRun.completedAt,
    candidateId: item.id,
    category: item.category,
    group: item.group,
    peerId: item.peerId,
    messageId: item.messageId,
    blessingDraft: item.blessingDraft,
    status: "queued_for_human_review"
  }));
  const history = {
    version: "1.0",
    limit: BLESSING_HISTORY_LIMIT,
    updatedAt: new Date().toISOString(),
    items: [
      ...newHistoryItems,
      ...existingHistoryItems
    ].slice(0, BLESSING_HISTORY_LIMIT)
  };
  await writeJsonAtomic(blessingHistoryPath, history);
  return { payload, replyQueuePath, blessingHistoryPath };
}
