#!/usr/bin/env node
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const directory = path.dirname(fileURLToPath(import.meta.url));
const outputDirectory = path.join(directory, "output");
const DEFAULT_LIMIT = 10;
const CATEGORY_BALANCE_MIN_SCORE = 0.75;
const CATEGORY_ORDER = ["Prayer", "Waiting", "Hope", "Anxiety", "Uncertainty"];
const SOURCE_URL_FIELDS = [
  "post_url",
  "postUrl",
  "message_url",
  "messageUrl",
  "source_url",
  "sourceUrl",
  "telegram_link",
  "telegramLink",
  "message_link",
  "messageLink"
];
const TRUSTED_SOURCE_HOSTS = {
  Telegram: ["t.me", "telegram.me", "web.telegram.org"],
  X: ["x.com", "twitter.com"],
  Reddit: ["reddit.com", "www.reddit.com", "old.reddit.com"]
};
const EXPRESSION_CLUSTER_ORDER = [
  "reassurance",
  "companionship",
  "blessing",
  "hope",
  "neutral presence",
  "metaphorical support"
];

function normalizeText(value) {
  return String(value || "")
    .normalize("NFKD")
    .toLocaleLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function dedupeKey(item) {
  const text = normalizeText(item.original);

  if (item.category === "Prayer") {
    if (/\bpray(?:ing)?\b.*\bfor me\b/.test(text)) return "prayer:pray-for-me";
    if (/\bwish me luck\b/.test(text)) return "prayer:wish-me-luck";
    if (/\bfingers crossed\b/.test(text)) return "prayer:fingers-crossed";
    if (/\bgood luck\b/.test(text)) return "prayer:good-luck";
  }

  const withoutFillers = text
    .replace(/\b(?:please|pls|plz|bro|bruh|guys|guy|man|mate|too|also|really|just)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return `${item.category}:${withoutFillers}`;
}

function operationalPriority(item) {
  const category = String(item.category || "");
  const reason = normalizeText(item.reason);
  if (
    category === "Waiting"
    || reason.includes("waiting for a meaningful result")
    || reason.includes("direct personal waiting")
  ) return 0;
  if (reason.includes("trading channel")) return 1;
  if (
    reason.includes("clear personal risk exposure")
    || reason.includes("outcome pressure")
    || item.riskLevel === "Medium"
    || item.riskLevel === "High"
  ) return 2;
  if (
    category === "Anxiety"
    || reason.includes("direct personal anxiety")
  ) return 3;
  return 4;
}

function compareQuality(left, right) {
  return operationalPriority(left) - operationalPriority(right)
    || right.score - left.score
    || riskRank(left.riskLevel) - riskRank(right.riskLevel)
    || String(right.original).length - String(left.original).length
    || String(left.id).localeCompare(String(right.id));
}

function riskRank(riskLevel) {
  return { Low: 0, Medium: 1, High: 2 }[riskLevel] ?? 3;
}

function operationallyStrong(item) {
  const score = Number(item.score || 0);
  const reason = normalizeText(item.reason);
  if (score < CATEGORY_BALANCE_MIN_SCORE) return false;
  if (
    reason.includes("educational or analytical language")
    && !reason.includes("first person personal stakes")
    && !reason.includes("clear personal risk exposure")
    && !reason.includes("explicit request for luck or prayer")
  ) return false;
  if (
    reason.includes("market narration")
    && !reason.includes("first person personal stakes")
    && !reason.includes("clear personal risk exposure")
    && !reason.includes("direct personal")
  ) return false;
  return true;
}

function expressionText(item) {
  const replyText = [
    item.blessingDraft,
    item.replyDraftA,
    item.replyDraftB,
    item.replyDraftC
  ].filter(Boolean).join(" ");
  if (replyText.trim()) return replyText;

  return [
    item.original,
    item.category,
    item.reason
  ].filter(Boolean).join(" ");
}

export function expressionIntent(item) {
  const text = normalizeText(expressionText(item));

  if (
    /\b(flame|light|ember|road|river|seed|door|threshold|harbor|lantern|sky|darkness|night|page|vessel|storm|spring)\b/.test(text)
    || /(火|光|灯|门|路|河|种子|花|黎明|黑夜|风|海|入口|故事|页|船|港)/.test(text)
  ) return "metaphorical support";

  if (
    /\b(beside|with you|near you|walk beside|accompany|held|hold you|not alone|companionship|welcome|seen|honored)\b/.test(text)
    || /(陪|身边|看见|接住|抱|拥抱|同行|不孤单|珍惜|欢迎)/.test(text)
  ) return "companionship";

  if (
    /\b(calm|peace|steady|steadiness|gentle|gently|safe|enough|allowed|soften|no shame|patience|rest)\b/.test(text)
    || /(平静|冷静|安稳|稳定|温柔|足够|不用|不必|允许|耐心|休息|放下|接纳|不责怪|已经很好)/.test(text)
  ) return "reassurance";

  if (
    /\b(bless|blessing|pray|prayer|wish|wishing)\b/.test(text)
    || /(祝福|祈祷|祝愿)/.test(text)
  ) return "blessing";

  if (
    /\b(hope|possibility|future|tomorrow|beginning|continue|renewal|return)\b/.test(text)
    || /(希望|未来|机会|相信|继续|开始|重新|新)/.test(text)
  ) return "hope";

  return "neutral presence";
}

function expressionSignature(item) {
  return normalizeText(expressionText(item))
    .replace(/\b(may|wish|wishing|hope|pray|prayer|bless|blessing)\b/g, " ")
    .replace(/(愿你|祝你|希望你|祈祷你|祈祷|祝愿你|祝愿|神殿愿你知道|神殿知道|请不要|请允许自己)/g, " ")
    .replace(/\b(calm|peace|steady|steadiness|stillness|quiet)\b/g, " calm ")
    .replace(/(平静|冷静|安稳|稳定|安定|从容)/g, " calm ")
    .replace(/\b(gentle|gently|soft|softly|kind|warm|warmth)\b/g, " gentle ")
    .replace(/(温柔|轻轻|柔和|暖|暖意)/g, " gentle ")
    .replace(/\b(beside|near|with|accompany|companionship|walk)\b/g, " beside ")
    .replace(/(陪伴|陪|身边|同行)/g, " beside ")
    .replace(/\b(future|tomorrow|possibility|opportunity)\b/g, " future ")
    .replace(/(未来|明天|机会|可能)/g, " future ")
    .replace(/\b(start|begin|beginning|return|renewal|continue)\b/g, " begin ")
    .replace(/(开始|重新|继续|回来|再次|重来)/g, " begin ")
    .replace(/\s+/g, " ")
    .trim();
}

function expressionTokens(item) {
  return new Set(expressionSignature(item)
    .split(" ")
    .filter((token) => token.length > 2));
}

function jaccard(left, right) {
  if (!left.size || !right.size) return 0;
  let intersection = 0;
  for (const token of left) {
    if (right.has(token)) intersection += 1;
  }
  return intersection / (left.size + right.size - intersection);
}

function semanticallyEquivalent(left, right) {
  const leftSignature = expressionSignature(left);
  const rightSignature = expressionSignature(right);
  if (!leftSignature || !rightSignature) return false;
  if (leftSignature === rightSignature) return true;
  return jaccard(expressionTokens(left), expressionTokens(right)) >= 0.72;
}

export function resolveOriginalUrl(item) {
  const candidate = SOURCE_URL_FIELDS
    .map((field) => item[field])
    .find((value) => typeof value === "string" && value.trim());
  if (!candidate) return null;

  try {
    const url = new URL(candidate.trim());
    if (!["http:", "https:"].includes(url.protocol)) return null;
    const source = String(item.source || item.platform || "").trim();
    const allowedHosts = TRUSTED_SOURCE_HOSTS[source];
    if (!allowedHosts) return url.href;
    const host = url.hostname.toLocaleLowerCase();
    return allowedHosts.some((allowed) =>
      host === allowed || host.endsWith(`.${allowed}`)
    ) ? url.href : null;
  } catch {
    return null;
  }
}

export function deduplicate(items) {
  const families = new Map();

  for (const item of items) {
    const key = dedupeKey(item);
    const existing = families.get(key);
    if (!existing || compareQuality(item, existing) < 0) {
      families.set(key, item);
    }
  }

  return [...families.values()].sort(compareQuality);
}

export function enforceExpressionDiversity(items, limit = DEFAULT_LIMIT) {
  const selected = [];
  const selectedIds = new Set();
  const clusterCounts = new Map();

  function canAdd(item, clusterCap) {
    if (selectedIds.has(item.id)) return false;
    const cluster = expressionIntent(item);
    if ((clusterCounts.get(cluster) || 0) >= clusterCap) return false;
    return !selected.some((selectedItem) =>
      expressionIntent(selectedItem) === cluster
      && semanticallyEquivalent(selectedItem, item)
    );
  }

  function add(item) {
    selected.push(item);
    selectedIds.add(item.id);
    const cluster = expressionIntent(item);
    clusterCounts.set(cluster, (clusterCounts.get(cluster) || 0) + 1);
  }

  function fillByCategory(clusterCap) {
    for (const category of CATEGORY_ORDER) {
      if (selected.length >= limit) break;
      const candidate = items.find((item) =>
        item.category === category && canAdd(item, clusterCap)
      );
      if (candidate) add(candidate);
    }
  }

  function fillByScore(clusterCap) {
    for (const item of items) {
      if (selected.length >= limit) break;
      if (canAdd(item, clusterCap)) add(item);
    }
  }

  fillByCategory(1);
  fillByScore(1);
  fillByCategory(2);
  fillByScore(2);
  fillByCategory(limit);
  fillByScore(limit);

  return selected;
}

export function selectBalancedTopQueue(items, limit = DEFAULT_LIMIT) {
  const diverseItems = enforceExpressionDiversity(items, limit);
  const selected = [];
  const selectedIds = new Set();

  for (const category of CATEGORY_ORDER) {
    const candidate = items.find((item) =>
      diverseItems.includes(item)
      && item.category === category
      && operationallyStrong(item)
      && !selectedIds.has(item.id)
    );
    if (!candidate) continue;
    selected.push(candidate);
    selectedIds.add(candidate.id);
  }

  for (const item of items) {
    if (selected.length >= limit) break;
    if (selectedIds.has(item.id) || !operationallyStrong(item)) continue;
    selected.push(item);
    selectedIds.add(item.id);
  }

  for (const item of items) {
    if (selected.length >= limit) break;
    if (selectedIds.has(item.id)) continue;
    selected.push(item);
    selectedIds.add(item.id);
  }

  return selected
    .sort(compareQuality)
    .slice(0, limit)
    .map((item, index) => ({
      ...item,
      rank: index + 1,
      priorityScore: item.score,
      originalUrl: resolveOriginalUrl(item)
    }));
}

function summarize(items) {
  const categories = Object.fromEntries(CATEGORY_ORDER.map((category) => [
    category,
    items.filter((item) => item.category === category).length
  ]));
  const communityCounts = {
    Bitget: 0,
    Bybit: 0,
    Binance: 0,
    "Prediction Market": 0,
    "Sports Betting": 0,
    Other: 0
  };

  for (const item of items) {
    const group = normalizeText(item.group);
    if (group.includes("bitget")) communityCounts.Bitget += 1;
    else if (group.includes("bybit")) communityCounts.Bybit += 1;
    else if (group.includes("binance")) communityCounts.Binance += 1;
    else if (/prediction|polymarket|kalshi/.test(group)) communityCounts["Prediction Market"] += 1;
    else if (/sport|betting|bet\b/.test(group)) communityCounts["Sports Betting"] += 1;
    else communityCounts.Other += 1;
  }

  const total = items.length;
  const communities = Object.fromEntries(
    Object.entries(communityCounts).map(([name, count]) => [
      name,
      {
        count,
        percentage: total ? Number(((count / total) * 100).toFixed(1)) : 0
      }
    ])
  );

  return {
    totalResults: total,
    categories,
    communities
  };
}

function markdownFor(payload) {
  const categoryLines = CATEGORY_ORDER
    .map((category) => `- ${category}: ${payload.summary.categories[category]}`)
    .join("\n");
  const communityLines = Object.entries(payload.summary.communities)
    .map(([name, value]) => `- ${name}: ${value.count} (${value.percentage}%)`)
    .join("\n");
  const cards = payload.queue.map((item) => `## #${item.rank}

Priority Score: ${item.priorityScore.toFixed(2)}
Category: ${item.category}
Group: ${item.group}
Risk: ${item.riskLevel}

Original Message:

> ${String(item.original).replace(/\n/g, "\n> ")}

Reason: ${item.reason}

Blessing Draft: ${item.blessingDraft}

Reply A: ${item.replyDraftA}

Reply B: ${item.replyDraftB}

Reply C: ${item.replyDraftC}

Original Post: ${item.originalUrl || "Unavailable in source data"}
`).join("\n");

  return `# Telegram Discovery Reply Queue V2.1

Generated: ${payload.generatedAt}
Source run completed: ${payload.sourceRun.completedAt}

Human Review Required · No Auto Send · No DM · No Group Join · No Auto Reply

## HUD Summary

- Total Results: ${payload.summary.totalResults}
${categoryLines}

## Community Distribution

${communityLines}

## Top Queue

${cards}`;
}

export async function buildReplyQueueV2({
  limit = DEFAULT_LIMIT,
  outputDir = outputDirectory,
  sourcePayload = null
} = {}) {
  const jsonPath = path.join(outputDir, "reply_queue_v2.json");
  const markdownPath = path.join(outputDir, "reply_queue_v2.md");
  if (!sourcePayload) {
    throw new Error("Queue Freeze: buildReplyQueueV2 requires the in-memory v2 source payload.");
  }
  const source = sourcePayload;
  const eligible = source.items
    .filter((item) =>
      Number(item.score) >= 0.7 && CATEGORY_ORDER.includes(item.category)
    )
    .map((item) => ({ ...item, score: Number(item.score) }));
  const clusteredItems = eligible.sort(compareQuality);
  const uniqueItems = deduplicate(clusteredItems);
  const diverseItems = enforceExpressionDiversity(uniqueItems, limit);
  const queue = selectBalancedTopQueue(uniqueItems, limit);
  const payload = {
    version: "2.1",
    generatedAt: new Date().toISOString(),
    sourceRun: source.sourceRun,
    policy: {
      humanReviewRequired: true,
      autoSend: false,
      autoReply: false,
      directMessage: false,
      groupJoin: false,
      note: "Bless the state. Never bless the outcome."
    },
    summary: summarize(eligible),
    deduplication: {
      inputCount: eligible.length,
      uniqueCount: uniqueItems.length,
      removedCount: eligible.length - uniqueItems.length
    },
    diversity: {
      clusters: Object.fromEntries(EXPRESSION_CLUSTER_ORDER.map((cluster) => [
        cluster,
        queue.filter((item) => expressionIntent(item) === cluster).length
      ])),
      preQueueCount: diverseItems.length,
      maxPerCluster: 2,
      appliedBeforeFinalQueue: true
    },
    queueLimit: limit,
    queue
  };

  await writeFile(jsonPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  await writeFile(markdownPath, markdownFor(payload), "utf8");
  return { payload, jsonPath, markdownPath };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  throw new Error("Queue Freeze: reply_queue_v2.json is written only by Run HUD.");
}
