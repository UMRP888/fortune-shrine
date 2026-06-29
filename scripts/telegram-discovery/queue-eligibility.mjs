import { createHash } from "node:crypto";

function normalizeForDedup(value) {
  return String(value || "").replace(/\s+/g, " ").trim().toLocaleLowerCase();
}

function timestampBucket(result) {
  const source = result.observedAt || result.timestamp || result.date || "";
  const parsed = Date.parse(source);
  if (Number.isFinite(parsed)) return Math.floor(parsed / 1000 / 300);

  const timeMatch = String(source).match(/\b(\d{1,2}):(\d{2})\b/);
  if (timeMatch) {
    const hours = Number(timeMatch[1]);
    const minutes = Number(timeMatch[2]);
    return Math.floor(((hours * 60) + minutes) / 5);
  }

  return 0;
}

export function queueDedupKey(result) {
  const identity = [
    normalizeForDedup(result.original || result.message || result.text),
    normalizeForDedup(result.group || result.chat || result.channel),
    timestampBucket(result)
  ].join("\n");

  return createHash("sha256").update(identity).digest("hex").slice(0, 24);
}

export function candidateIdentity(result) {
  if (result.peerId && result.messageId) {
    return `${result.peerId}:${result.messageId}`;
  }
  if (result.messageId) {
    return `${result.group || result.chat || ""}:${result.messageId}`;
  }
  return `${result.group || result.chat || ""}:${result.message || result.text || ""}`;
}

function candidateIdentityKeys(result) {
  const keys = new Set([candidateIdentity(result)]);
  if (result.messageId && (result.group || result.chat)) {
    keys.add(`${result.group || result.chat}:${result.messageId}`);
  }
  return keys;
}

function humanProcessed(result) {
  return ["sent", "reviewed", "ignored"].includes(String(result.status || "").toLocaleLowerCase());
}

function timePartsInZone(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit"
  }).formatToParts(date);
  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

export function hasFreshTelegramTimestamp(result, {
  now = Date.now(),
  timeZone = "Asia/Shanghai",
  maxAgeMs = 4 * 60 * 60 * 1000,
  futureToleranceMs = 5 * 60 * 1000
} = {}) {
  const timestamp = normalizeForDedup(result.timestamp);
  if (!timestamp) return false;
  if (/^today\b/.test(timestamp)) return true;
  const timeMatch = timestamp.match(/^(\d{1,2}):(\d{2})(?:\s?([ap]m))?$/);
  if (timeMatch) {
    let hours = Number(timeMatch[1]);
    const minutes = Number(timeMatch[2]);
    const suffix = timeMatch[3];
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return false;
    if (suffix === "pm" && hours < 12) hours += 12;
    if (suffix === "am" && hours === 12) hours = 0;
    if (hours > 23 || minutes > 59) return false;

    const parts = timePartsInZone(new Date(now), timeZone);
    const currentMinutes = Number(parts.hour) * 60 + Number(parts.minute);
    const labelMinutes = hours * 60 + minutes;
    const ageMs = (currentMinutes - labelMinutes) * 60 * 1000;
    return ageMs >= -futureToleranceMs && ageMs <= maxAgeMs;
  }

  return false;
}

export function partitionQueueEligibility(results, processedResults, options = {}) {
  const manuallyProcessed = new Set(
    processedResults
      .filter(humanProcessed)
      .flatMap((result) => [...candidateIdentityKeys(result)])
  );
  const wasSeen = (result) =>
    [...candidateIdentityKeys(result)].some((key) => manuallyProcessed.has(key));
  const freshResults = results.filter((result) =>
    !wasSeen(result) && hasFreshTelegramTimestamp(result, {
      now: options.now,
      timeZone: options.timeZone,
      maxAgeMs: options.freshnessWindowMs,
      futureToleranceMs: options.freshnessFutureToleranceMs
    })
  );
  const seenAgainResults = results.filter((result) => wasSeen(result));
  const queueResults = freshResults
    .map((result) => ({ ...result, seenAgain: false }))
    .sort((left, right) => right.score - left.score);

  return {
    freshResults,
    seenAgainResults,
    queueResults
  };
}
