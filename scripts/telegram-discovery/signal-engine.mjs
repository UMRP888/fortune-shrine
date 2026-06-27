import {
  COMMUNITY_ALIASES,
  SIGNALS
} from "./config.mjs";
import { normalizeText } from "./lib.mjs";

const FIRST_PERSON_PATTERN = /\b(i|i'm|im|i am|me|my|we|we're|our)\b/i;
const EXPLICIT_BLESSING_REQUESTS = ["wish me luck", "pray for me"];
const SOFT_HOPE_SIGNALS = ["good luck", "pray", "fingers crossed", "hope"];
const STRONG_RISK_SIGNALS = [
  "all in",
  "liquidation",
  "margin call",
  "rekt",
  "got rekt",
  "wiped out",
  "blew my account",
  "panic sell"
];
const RESULT_WAITING_PATTERN = /\b(waiting|wait)\b.{0,32}\b(result|results|outcome|decision|approval|reward|rewards)\b/i;
const PERSONAL_LIQUIDATION_PATTERN = /\b(i|i'm|im|i am|me|my|we|our)\b.{0,40}\b(liquidat(?:ed|ion)|margin call|got rekt|wiped out|blew my account)\b|\b(liquidat(?:ed|ion)|margin call|got rekt|wiped out|blew my account)\b.{0,40}\b(i|me|my|we|our)\b/i;
const PERSONAL_TRADING_EXPOSURE_PATTERN = /\b(i|i'm|im|i am|i just|i got|i have|i've|i opened|i closed|me|my|we|we're|we are|we got|we have|our)\b.{0,48}\b(leverage|funding rate|open interest|btc dump|btc pump|eth dump|eth pump|market crash|reversal|breakout|bounce|long|short|entry|exit|take profit|stop loss|tp|sl|opened position|closed position|fomo|panic sell)\b|\b(leverage|funding rate|open interest|btc dump|btc pump|eth dump|eth pump|market crash|reversal|breakout|bounce|long|short|entry|exit|take profit|stop loss|tp|sl|opened position|closed position|fomo|panic sell)\b.{0,48}\b(me|my|mine|us|our|position|positions|account)\b/i;
const PERSONAL_EMOTION_PATTERN = /\b(i'm|i am|i feel|i get|i got|i've been|we're|we are|we feel)\b.{0,28}\b(nervous|anxious|worried|uncertain|afraid|scared|stressed|uneasy)\b|\b(make|makes|made|has|got)\s+me\b.{0,20}\b(nervous|anxious|worried|uncertain|afraid|scared|stressed|uneasy)\b|\bmy\b.{0,20}\b(anxiety|worry|fear|nerves)\b/i;
const EMOTION_VARIANT_PATTERN = /\b(nervous|anxious|worried|uncertain|afraid|scared|stressed|uneasy|fingers crossed)\b/i;
const PERSONAL_WAITING_PATTERN = /\b(i(?:'m| am|'ll| will)?|we(?:'re| are|'ll| will)?|my|our)\b.{0,40}\b(still\s+waiting|waiting|wait)\b|\b(still\s+waiting|waiting|wait)\b.{0,40}\b(my|our)\b/i;
const SOCIAL_WAITING_PATTERN = /\b(waiting|wait)\s+(for\s+)?(you|your answer|your reply|him|her|them)\b/i;
const SOCIAL_HOPE_PATTERN = /\bhope\b.{0,28}\b(you(?:'re| are)? fine|you slept well|you are well|you'?re doing well|weather|visit|not married)\b/i;
const MARKET_NARRATION_PATTERN = /\b(market|markets|investors|traders|retail|portfolio|liquidity|policy|bitcoin|btc|ethereum|eth|price|pump|dump|bullish|bearish|inflation|crisis|funding|open interest|leverage)\b.{0,80}\b(nervous|uncertain|waiting|hope|fingers crossed)\b|\b(nervous|uncertain|waiting|hope|fingers crossed)\b.{0,80}\b(market|markets|investors|traders|retail|portfolio|liquidity|policy|bitcoin|btc|ethereum|eth|price|pump|dump|bullish|bearish|inflation|crisis|funding|open interest|leverage)\b/i;
const EDUCATIONAL_PATTERN = /\b(risk management|diversification|discipline|research|strategy|analysis|conditions|environment|cycles|regimes|nervous system|market participants|investors get nervous|uncertain markets?|uncertain periods?)\b/i;
const SOCIAL_EMOTION_PATTERN = /\byou\b.{0,20}\b(make|made)\s+me\b.{0,20}\b(excited|nervous|anxious|worried)\b/i;
const SHORT_REACTION_PATTERN = /^(nervous|anxious|worried|uncertain)\s+(with|about)\s+what\??$/i;
const MACRO_MARKET_LOSS_PATTERN = /\b(stocks?|market|markets|equities|portfolio|portfolios|bitcoin|btc|ethereum|eth|altcoins?|crypto)\b.{0,80}\b(wiped out|rekt|liquidat(?:ed|ion)|blew)\b|\b(wiped out|rekt|liquidat(?:ed|ion)|blew)\b.{0,80}\b(stocks?|market|markets|equities|portfolio|portfolios|bitcoin|btc|ethereum|eth|altcoins?|crypto)\b|\b\d+(?:\.\d+)?\s*(?:billion|trillion|m|bn|tn)\b.{0,80}\b(wiped out|lost|liquidat(?:ed|ion))\b/i;

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

function phrasePattern(phrase) {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`, "i");
}

function includesAny(text, phrases) {
  return phrases.filter((phrase) => phrasePattern(phrase).test(text));
}

function stableIndex(value, length) {
  let hash = 0;
  for (const character of value) {
    hash = ((hash << 5) - hash + character.codePointAt(0)) | 0;
  }
  return Math.abs(hash) % length;
}

function clampScore(value) {
  return Math.max(0, Math.min(0.98, Number(value.toFixed(2))));
}

function emotionalFilter({
  explicitBlessingRequest,
  strongRisk,
  waitingForResult,
  emotionalUncertainty,
  softHope,
  firstPerson,
  personalEmotion,
  personalWaiting,
  emotionVariant,
  socialHope,
  socialWaiting,
  socialEmotion,
  shortReaction,
  marketNarration,
  educational
}) {
  let score = 0.18;

  if (explicitBlessingRequest.length) {
    score = 0.9;
    if (waitingForResult || emotionalUncertainty.length || personalEmotion) {
      score += 0.05;
    }
  } else if (waitingForResult) {
    score = 0.91;
    if (emotionalUncertainty.length || softHope.length) score += 0.03;
  } else if (personalEmotion) {
    score = 0.86;
    if (personalWaiting || strongRisk.length || softHope.length) score += 0.04;
  } else if (personalWaiting) {
    score = 0.8;
    if (softHope.length || emotionVariant) score += 0.04;
  } else if (emotionalUncertainty.length) {
    score = firstPerson ? 0.78 : 0.72;
    if (softHope.length) score += 0.04;
  } else if (softHope.length) {
    score = firstPerson ? 0.76 : 0.71;
    if (softHope.length > 1) score += 0.04;
  }

  if (socialHope) score = Math.min(score, 0.48);
  if (socialWaiting) score = Math.min(score, 0.54);
  if (socialEmotion || shortReaction) score = Math.min(score, 0.54);
  if (marketNarration && !personalEmotion && !explicitBlessingRequest.length) {
    score = Math.min(score, 0.46);
  }
  if (educational && !explicitBlessingRequest.length) {
    score = Math.min(score, 0.42);
  }

  return clampScore(score);
}

function tradingFilter({
  matched,
  firstPerson,
  strongRisk,
  personalLiquidation,
  personalTradingExposure,
  educational,
  macroMarketLoss
}) {
  const tradingSignals = [
    ...matched.exposure,
    ...matched.outcomeLanguage
  ];
  const severeLoss = matched.outcomeLanguage.some((phrase) =>
    ["rekt", "got rekt", "wiped out", "blew my account"].includes(phrase)
  );
  let score = 0.18;

  if (macroMarketLoss && !firstPerson && !personalLiquidation && !personalTradingExposure) {
    score = 0.44;
  } else if (personalLiquidation || (severeLoss && firstPerson) || (strongRisk.includes("all in") && firstPerson)) {
    score = 0.91;
  } else if (severeLoss) {
    score = 0.72;
  } else if (personalTradingExposure || (firstPerson && strongRisk.length)) {
    score = 0.74;
  } else if (firstPerson && tradingSignals.length) {
    score = 0.7;
  } else if (tradingSignals.length) {
    score = 0.44;
  }

  if (educational && !personalLiquidation && !personalTradingExposure && !severeLoss) {
    score = Math.min(score, 0.42);
  }

  return clampScore(score);
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
  const explicitBlessingRequest = includesAny(text, EXPLICIT_BLESSING_REQUESTS);
  const softHope = includesAny(text, SOFT_HOPE_SIGNALS)
    .filter((phrase) => !explicitBlessingRequest.includes(phrase));
  const strongRisk = includesAny(text, STRONG_RISK_SIGNALS);
  const waitingForResult = RESULT_WAITING_PATTERN.test(text);
  const personalLiquidation = PERSONAL_LIQUIDATION_PATTERN.test(text);
  const personalTradingExposure = PERSONAL_TRADING_EXPOSURE_PATTERN.test(text);
  const personalEmotion = PERSONAL_EMOTION_PATTERN.test(text);
  const emotionVariant = EMOTION_VARIANT_PATTERN.test(text);
  const personalWaiting = PERSONAL_WAITING_PATTERN.test(text);
  const socialWaiting = SOCIAL_WAITING_PATTERN.test(text);
  const socialHope = SOCIAL_HOPE_PATTERN.test(text);
  const marketNarration = MARKET_NARRATION_PATTERN.test(text);
  const educational = EDUCATIONAL_PATTERN.test(text);
  const socialEmotion = SOCIAL_EMOTION_PATTERN.test(text);
  const shortReaction = SHORT_REACTION_PATTERN.test(text);
  const macroMarketLoss = MACRO_MARKET_LOSS_PATTERN.test(text);
  const emotionalUncertainty = matched.uncertainty.filter(
    (phrase) => phrase !== "hope"
  );
  const genericMarketExposure = matched.exposure.filter(
    (phrase) => !strongRisk.includes(phrase)
  );
  const emotionalScore = emotionalFilter({
    explicitBlessingRequest,
    strongRisk,
    waitingForResult,
    emotionalUncertainty,
    softHope,
    firstPerson,
    personalEmotion,
    personalWaiting,
    emotionVariant,
    socialHope,
    socialWaiting,
    socialEmotion,
    shortReaction,
    marketNarration,
    educational
  });
  const tradingScore = tradingFilter({
    matched,
    firstPerson,
    strongRisk,
    personalLiquidation,
    personalTradingExposure,
    educational,
    macroMarketLoss
  });
  const score = Math.max(emotionalScore, tradingScore);

  let state = "uncertainty";
  if (
    matched.outcomeLanguage.includes("lose")
    || /liquidat|got rekt|wiped out|blew my account|margin call/i.test(text)
  ) {
    state = "loss";
  } else if (matched.blessingRequest.length) {
    state = "blessingRequest";
  } else if (matched.exposure.length) {
    state = "exposure";
  }

  const reasons = [];
  if (explicitBlessingRequest.length) reasons.push("explicit request for luck or prayer");
  else if (softHope.length) reasons.push("hope without explicit blessing request");
  if (waitingForResult) reasons.push("waiting for a meaningful result");
  else if (personalEmotion) reasons.push("direct personal anxiety or uncertainty");
  else if (personalWaiting) reasons.push("direct personal waiting");
  else if (emotionalUncertainty.length || emotionVariant) reasons.push("anxiety or uncertainty");
  if (strongRisk.length || personalLiquidation || personalTradingExposure) reasons.push("clear personal risk exposure");
  else if (genericMarketExposure.length) reasons.push("general market or trade context");
  if (matched.outcomeLanguage.length) reasons.push("outcome pressure");
  if (firstPerson) reasons.push("first-person personal stakes");
  if (socialHope || socialWaiting || socialEmotion || shortReaction) {
    reasons.push("ordinary social context");
  }
  if (marketNarration) reasons.push("market narration");
  if (macroMarketLoss) reasons.push("macro market loss narration");
  if (educational) reasons.push("educational or analytical language");
  if (matched.lowSignal.length) reasons.push("announcement penalty");
  if (emotionalScore >= tradingScore) reasons.push("emotional channel");
  else reasons.push("trading channel");

  return {
    score,
    state,
    reason: reasons.join(" + ") || "low-context keyword match",
    matched,
    firstPerson,
    explicitBlessingRequest,
    softHope,
    strongRisk,
    waitingForResult,
    personalTradingExposure,
    personalEmotion,
    personalWaiting,
    socialHope,
    socialWaiting,
    marketNarration,
    educational,
    socialEmotion,
    shortReaction,
    macroMarketLoss,
    emotionalScore,
    tradingScore
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
    peerId: normalizeText(result.peerId),
    messageUrl: normalizeText(result.messageUrl),
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
