import {
  COMMUNITY_ALIASES,
  SIGNALS
} from "./config.mjs";
import { normalizeText } from "./lib.mjs";

const FIRST_PERSON_PATTERN = /\b(i|i'm|im|i am|me|my|we|we're|our)\b/i;

const REPLIES = {
  blessingRequest: [
    "May the flame stay near you tonight, and may your hand remain steady.",
    "May quiet courage walk beside you while the answer is still veiled.",
    "May the night hold you gently, whatever waits beyond this moment."
  ],
  uncertainty: [
    "May patience remain beside you while the answer is still forming.",
    "May the flame keep you steady through the waiting.",
    "May you find one calm breath before the next moment arrives."
  ],
  exposure: [
    "May courage stay clear, and may hunger not speak louder than your judgment.",
    "May your hand remain steady while the candle moves.",
    "May the flame remind you that strength can also mean restraint."
  ],
  loss: [
    "May this moment pass without taking your steadiness with it.",
    "May the loss grow quieter, and may you remain whole beside it.",
    "May the flame hold a little warmth for you after the noise."
  ]
};

function includesAny(text, phrases) {
  const lower = text.toLocaleLowerCase();
  return phrases.filter((phrase) => lower.includes(phrase));
}

function stableIndex(value, length) {
  let hash = 0;
  for (const character of value) {
    hash = ((hash << 5) - hash + character.codePointAt(0)) | 0;
  }
  return Math.abs(hash) % length;
}

export function canonicalGroup(chat) {
  const normalized = normalizeText(chat).toLocaleLowerCase();
  const community = COMMUNITY_ALIASES.find(({ aliases }) =>
    aliases.some((alias) => normalized.includes(alias.toLocaleLowerCase()))
  );
  return community?.group || normalizeText(chat);
}

export function classifySignal(message) {
  const text = normalizeText(message);
  const matched = {
    blessingRequest: includesAny(text, SIGNALS.blessingRequest),
    uncertainty: includesAny(text, SIGNALS.uncertainty),
    exposure: includesAny(text, SIGNALS.exposure),
    outcomeLanguage: includesAny(text, SIGNALS.outcomeLanguage),
    lowSignal: includesAny(text, SIGNALS.lowSignal)
  };
  const firstPerson = FIRST_PERSON_PATTERN.test(text);
  let score = 0.08;

  if (matched.blessingRequest.length) score += 0.48;
  if (matched.uncertainty.length) score += 0.28;
  if (matched.exposure.length) score += 0.16;
  if (matched.outcomeLanguage.length) score += 0.08;
  if (firstPerson) score += 0.12;
  if (
    matched.blessingRequest.length &&
    (matched.uncertainty.length || matched.exposure.length)
  ) score += 0.08;
  if (
    matched.uncertainty.length &&
    matched.exposure.length
  ) score += 0.06;
  if (matched.lowSignal.length) score -= 0.25;

  score = Math.max(0, Math.min(0.98, Number(score.toFixed(2))));

  let state = "uncertainty";
  if (matched.outcomeLanguage.includes("lose") || /liquidat/i.test(text)) {
    state = "loss";
  } else if (matched.blessingRequest.length) {
    state = "blessingRequest";
  } else if (matched.exposure.length) {
    state = "exposure";
  }

  const reasons = [];
  if (matched.blessingRequest.length) reasons.push("request for luck or prayer");
  if (matched.uncertainty.length) reasons.push("waiting or uncertainty");
  if (matched.exposure.length) reasons.push("personal risk exposure");
  if (matched.outcomeLanguage.length) reasons.push("outcome pressure");
  if (firstPerson) reasons.push("first-person personal stakes");
  if (matched.lowSignal.length) reasons.push("announcement penalty");

  return {
    score,
    state,
    reason: reasons.join(" + ") || "low-context keyword match",
    matched,
    firstPerson
  };
}

export function suggestReply(message, state) {
  const choices = REPLIES[state] || REPLIES.uncertainty;
  return choices[stableIndex(normalizeText(message), choices.length)];
}

export function enrichResult(result) {
  const signal = classifySignal(result.text);
  return {
    group: canonicalGroup(result.chat),
    message: normalizeText(result.text),
    score: signal.score,
    reason: signal.reason,
    reply: suggestReply(result.text, signal.state),
    author: normalizeText(result.author),
    timestamp: normalizeText(result.timestamp),
    messageId: normalizeText(result.messageId),
    observedAt: result.observedAt,
    matchedKeywords: [...new Set([
      ...signal.matched.blessingRequest,
      ...signal.matched.uncertainty,
      ...signal.matched.exposure,
      ...signal.matched.outcomeLanguage,
      ...signal.matched.lowSignal
    ])]
  };
}
