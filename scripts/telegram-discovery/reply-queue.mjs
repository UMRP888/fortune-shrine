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
const SHRINE_REPLY_PREFIX = "The Shrine says:";

function shrinePrefixedReply(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (/^the shrine says:/i.test(text)) return text;
  if (/[\u3400-\u9fff]/u.test(text)) return text;
  return `${SHRINE_REPLY_PREFIX} ${text}`;
}

const SRE_LIBRARY = {
  WAITING: [
    "The situation has not resolved, and no clear signal has arrived yet. You are still inside the waiting, where outcomes are not formed. May clarity reach you without forcing you to rush.",
    "Nothing has changed in a visible way, even if time has moved. You remain inside an unfinished process. May this uncertainty stay gentle rather than heavy.",
    "What you are waiting for is still in motion, just not revealed. You are not outside the process, only inside its early phase. May you stay steady until it becomes clearer.",
    "Silence here does not mean absence, only unfinished movement. You are still part of what is forming. May what arrives not shake your center.",
    "This moment is still open, not concluded. You are inside the interval where outcomes are forming. May you move through it without losing direction.",
    "Nothing has closed yet, even if nothing is changing. You are still inside the process. May time carry you gently forward.",
    "What you are waiting for is still moving through time. You are not outside its path. May it arrive in its right form.",
    "The outcome is not yet decided. You are still inside its formation space. May you remain calm until it settles.",
    "Things are still forming beneath what you can see. You are still inside the unfolding. May clarity come without force.",
    "Nothing here is final yet. You remain within the living process of time. May you be held steady through it."
  ],
  TRADING_LOSS: [
    "A loss has already happened, and it cannot be undone. You are still here, and this moment is not the end of your path. May you regain steadiness before your next step.",
    "What has passed is already part of the system’s outcome. You are still inside its aftermath. May this weight become lighter over time.",
    "The impact is real, and it has already occurred. You remain inside its echo, not its conclusion. May you recover without rushing.",
    "This moment has already been shaped by timing and exposure. You are still within its continuation. May you not lose your direction.",
    "Loss belongs to movement in uncertain systems. You are still on the same path. May balance return to you.",
    "What happened is now part of the structure you came through. You are still inside its unfolding effect. May you move forward with clarity.",
    "The system has already moved on from this point. You are still adjusting inside its result. May your next step be steadier.",
    "This is not the end, but a shift in condition. You are still within the same path. May you find ground again.",
    "What is felt now is the echo, not the full story. You are still inside its field. May calm return before your next move.",
    "The outcome has already been set in motion. You are still inside its consequences. May you recover your center."
  ],
  RISK: [
    "Every decision already carries exposure. You are not in neutrality, but in motion. May your choice come with clarity rather than pressure.",
    "Waiting does not remove risk, only reshapes it. You are already inside the system. May timing align with your action.",
    "There is no fully safe position in a moving environment. You are already part of the structure. May your decision stay clear.",
    "You are already inside consequence space. Nothing here is outside effect. May you move without pressure.",
    "The system is already active before action. You are within it now. May awareness stay steady.",
    "Uncertainty is already part of the structure you stand in. You are not outside outcome formation. May clarity come before pressure builds.",
    "The moment does not wait for certainty. You are inside ongoing motion. May your decision feel grounded.",
    "Even hesitation is part of participation. You are already in the system. May your choice remain steady.",
    "You are already in contact with consequence through timing. Nothing here is fully detached. May your step be calm and deliberate.",
    "The structure is already in motion before action. You are inside its field. May you move without distortion."
  ],
  ANXIETY: [
    "What feels heavy is already passing through you, not defining you. You are still here inside this moment. May your breath settle again.",
    "This state is temporary, even if it feels close. You are still in motion. May calm return naturally.",
    "Pressure is part of the moment, not the whole system. You are not trapped inside it. May space open again for you.",
    "You are still inside a passing condition. Nothing here is final. May steadiness return gradually.",
    "What you feel is a wave, not a structure. You are still grounded in reality. May it soften in time.",
    "The system is moving faster than your sense of control. You are still inside it. May your mind slow down.",
    "This will not remain in this form. You are still present here. May relief arrive soon.",
    "Nothing here is permanent or fixed. You are still in transition. May balance return.",
    "You are inside a temporary intensity. You are not lost in it. May calm re-enter you.",
    "This moment will pass without becoming permanent. You are still here. May you stay steady until it does."
  ],
  HOPE: [
    "What you are waiting for is still forming in time. You are still inside its field. May it arrive in a stable form.",
    "The outcome is not decided yet. You are still within possibility space. May things align in your favor.",
    "Nothing here has closed. You are still inside unfolding conditions. May clarity arrive gently.",
    "The result is still in formation. You are still connected to it. May it complete in a balanced way.",
    "This is still an open situation. You are still inside its movement. May it resolve without disruption.",
    "What you want has not disappeared. You are still in its path. May it take shape correctly.",
    "The process is still ongoing. You are still within possibility. May outcome meet expectation.",
    "Nothing has finalized yet. You are still inside time. May what arrives feel right.",
    "The situation remains open. You are still part of it. May it stabilize in your direction.",
    "What is coming has not formed yet. You are still inside its unfolding. May it reach you clearly."
  ]
};

function sreIntent(result, category) {
  const reason = String(result.reason || "").toLocaleLowerCase();
  const message = String(result.message || result.original || "").toLocaleLowerCase();
  const keywords = (result.matchedKeywords || []).join(" ").toLocaleLowerCase();
  const text = [reason, message, keywords, category].join(" ");

  if (/\b(liquidat(?:ed|ion)|got rekt|rekt|wiped out|blew my account|blown account|loss|lost|lose)\b/.test(text)) {
    return "TRADING_LOSS";
  }
  if (/\b(nervous|anxious|worried|afraid|scared|stressed|panic|panicking|control)\b/.test(text)) {
    return "ANXIETY";
  }
  if (
    reason.includes("clear personal risk exposure")
    || reason.includes("outcome pressure")
    || reason.includes("trading channel")
    || /\b(trade|trading|leverage|margin call|funding rate|open interest|long|short|entry|exit|tp|sl|take profit|stop loss|position|fomo|decision|enter|entered|early)\b/.test(text)
  ) {
    return "RISK";
  }
  if (category === "Waiting" || /\b(waiting|still waiting|wait|delay|hours)\b/.test(text)) {
    return "WAITING";
  }
  if (category === "Hope" || /\b(hope|hoping|hopefully|fingers crossed|wish)\b/.test(text)) {
    return "HOPE";
  }
  return category === "Uncertainty" ? "RISK" : "HOPE";
}

export function shrineReplyEngine(
  result,
  category = queueCategory(result),
  random = Math.random,
  recentReplies = []
) {
  const intent = sreIntent(result, category);
  const library = SRE_LIBRARY[intent];
  if (!library?.length) return null;
  const recent = new Set(recentReplies.map(blessingFingerprint));
  const available = library.filter((reply) => !recent.has(blessingFingerprint(reply)));
  const pool = available.length ? available : library;
  const index = Math.floor(random() * pool.length);
  return pool[Math.max(0, Math.min(pool.length - 1, index))];
}

function shrineReplyDrafts(result, category, random = Math.random, recentReplies = []) {
  const intent = sreIntent(result, category);
  const library = SRE_LIBRARY[intent];
  if (!library?.length) return null;

  const recent = new Set(recentReplies.map(blessingFingerprint));
  const selected = [];
  const selectedKeys = new Set();
  let pool = library.filter((reply) => !recent.has(blessingFingerprint(reply)));
  if (pool.length < 3) pool = library;

  while (selected.length < 3 && pool.length) {
    const index = Math.floor(random() * pool.length);
    const [reply] = pool.splice(Math.max(0, Math.min(pool.length - 1, index)), 1);
    const key = blessingFingerprint(reply);
    if (selectedKeys.has(key)) continue;
    selectedKeys.add(key);
    selected.push(reply);
  }

  while (selected.length < 3 && library.length) {
    selected.push(library[selected.length % library.length]);
  }

  return {
    blessingDraft: selected[0],
    replyDraftA: selected[0],
    replyDraftB: selected[1],
    replyDraftC: selected[2]
  };
}

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

const REALITY_FLOW_DRAFTS = {
  Waiting: {
    blessingDraft: "Waiting is still part of the position; time keeps moving before the answer arrives.",
    replyDraftA: "Waiting is not neutral here; the delay keeps exposure open while the answer is still forming.",
    replyDraftB: "Information arrives late in moments like this; timing can change the shape before certainty appears.",
    replyDraftC: "The moment is still unresolved, and delay can carry its own cost before anything becomes final."
  },
  Anxiety: {
    blessingDraft: "Anxiety is information about exposure; it is not the same thing as a signal.",
    replyDraftA: "Anxiety can show where exposure is already active, even before the outcome becomes clear.",
    replyDraftB: "Pressure changes the next decision by adding noise before the situation has fully settled.",
    replyDraftC: "The feeling is part of the structure now; it can distort timing before facts arrive."
  },
  Risk: {
    blessingDraft: "Exposure begins before certainty appears; the system does not wait for intent to become clear.",
    replyDraftA: "A position creates exposure immediately; the outcome remains nonlinear while information is still delayed.",
    replyDraftB: "Once exposure exists, timing matters more than the original intention behind the move.",
    replyDraftC: "Risk is already active when the position exists; certainty usually arrives after the structure changes."
  },
  Loss: {
    blessingDraft: "Loss changes the next decision by adding pressure before the moment has fully closed.",
    replyDraftA: "A loss is not only an event; it changes the weight of whatever decision comes next.",
    replyDraftB: "After impact, pressure can become part of the position before any new choice is made.",
    replyDraftC: "The account event is already final in one place, but its pressure can still move forward."
  },
  Uncertainty: {
    blessingDraft: "Uncertainty is the baseline condition; information is still delayed while the path remains open.",
    replyDraftA: "The path is still incomplete; information may arrive after the structure has already shifted.",
    replyDraftB: "Not knowing is not an empty state; it keeps multiple costs active until the moment resolves.",
    replyDraftC: "The signal is still late, and the decision space remains open without becoming neutral."
  }
};

const CORPUS_CATEGORY_MAP = {
  Prayer: ["风险", "希望"],
  Waiting: ["等待"],
  Anxiety: ["风险"],
  Uncertainty: ["Uncertainty", "决策"],
  Hope: ["希望"]
};

function realityFlowKey(result, category) {
  const reason = String(result.reason || "").toLocaleLowerCase();
  const message = String(result.message || result.original || "").toLocaleLowerCase();
  const keywords = (result.matchedKeywords || []).join(" ").toLocaleLowerCase();
  const highRiskText = [reason, message, keywords].join(" ");

  if (
    /\b(liquidat(?:ed|ion)|got rekt|rekt|wiped out|blew my account|blown account|loss|lost|lose)\b/.test(highRiskText)
  ) return "Loss";
  if (
    reason.includes("clear personal risk exposure")
    || reason.includes("outcome pressure")
    || reason.includes("trading channel")
    || /\b(trade|trading|profit|loss|leverage|margin call|funding rate|open interest|long|short|entry|exit|tp|sl|take profit|stop loss|position|fomo|panic sell)\b/.test(highRiskText)
  ) return "Risk";
  if (
    category === "Waiting"
    || reason.includes("waiting")
    || /\b(waiting|still waiting|wait)\b/.test(highRiskText)
  ) return "Waiting";
  if (
    category === "Anxiety"
    || reason.includes("direct personal anxiety")
    || /\b(nervous|anxious|worried|afraid|scared|stressed|uneasy)\b/.test(highRiskText)
  ) return "Anxiety";
  if (
    category === "Uncertainty"
    || reason.includes("uncertainty")
    || /\b(uncertain|not sure|cannot say|can't say|do not know|don't know)\b/.test(highRiskText)
  ) return "Uncertainty";
  return null;
}

export function routeResponseMode(result, category = queueCategory(result)) {
  return realityFlowKey(result, category) ? "REALITY_FLOW" : "SHORT_BLESSING";
}

function replyDraftsForResult(result, category) {
  const realityKey = realityFlowKey(result, category);
  if (realityKey) return REALITY_FLOW_DRAFTS[realityKey];
  return DRAFTS[category];
}

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
    reason.includes("outcome pressure")
    && /\b(liquidat(?:ed|ion)|got rekt|rekt|wiped out|blew my account|loss|lost|lose)\b/.test(message)
  ) return "Loss";
  if (
    reason.includes("clear personal risk exposure")
    || reason.includes("trading channel")
  ) return "Risk";
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
    const sreDrafts = shrineReplyDrafts(result, category, random, rollingRecentBlessings);
    const routedDrafts = sreDrafts || replyDraftsForResult(result, category);
    const realityFlowActive = routeResponseMode(result, category) === "REALITY_FLOW";
    const blessingDraft = sreDrafts
      ? sreDrafts.blessingDraft
      : realityFlowActive
      ? routedDrafts.blessingDraft
      : selectBlessingDraft(
        category,
        rollingRecentBlessings,
        random,
        {
          usageCounts,
          categoryHistory: rollingCategoryHistory
        }
      );
    if (sreDrafts) {
      for (const reply of [
        sreDrafts.replyDraftA,
        sreDrafts.replyDraftB,
        sreDrafts.replyDraftC
      ]) {
        rollingRecentBlessings.unshift(reply);
        usageCounts.set(
          blessingFingerprint(reply),
          (usageCounts.get(blessingFingerprint(reply)) || 0) + 1
        );
      }
      rollingCategoryHistory.unshift({ category, blessingDraft });
      usageCounts.set(
        blessingFingerprint(blessingDraft),
        (usageCounts.get(blessingFingerprint(blessingDraft)) || 0)
      );
    } else if (!realityFlowActive) {
      rollingRecentBlessings.unshift(blessingDraft);
      rollingCategoryHistory.unshift({ category, blessingDraft });
      usageCounts.set(
        blessingFingerprint(blessingDraft),
        (usageCounts.get(blessingFingerprint(blessingDraft)) || 0) + 1
      );
    }

    return {
      id: `tg-${String(index + 1).padStart(4, "0")}`,
      source: "Telegram",
      group: result.group,
      original: result.message,
      category,
      score: result.score,
      reason: result.reason,
      ...routedDrafts,
      blessingDraft: shrinePrefixedReply(blessingDraft),
      replyDraftA: shrinePrefixedReply(routedDrafts.replyDraftA),
      replyDraftB: shrinePrefixedReply(routedDrafts.replyDraftB),
      replyDraftC: shrinePrefixedReply(routedDrafts.replyDraftC),
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
