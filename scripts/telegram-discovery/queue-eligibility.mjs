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

export function partitionQueueEligibility(results, processedResults) {
  const previouslySeen = new Set(
    processedResults
      .filter((result) => result.status !== "ignored")
      .flatMap((result) => [...candidateIdentityKeys(result)])
  );
  const wasSeen = (result) =>
    [...candidateIdentityKeys(result)].some((key) => previouslySeen.has(key));
  const freshResults = results.filter((result) => !wasSeen(result));
  const seenAgainResults = results.filter((result) => wasSeen(result));
  const queueResults = [
    ...freshResults,
    ...seenAgainResults.map((result) => ({
      ...result,
      score: Math.max(0.7, Number((Number(result.score || 0) - 0.03).toFixed(2))),
      seenAgain: true,
      reason: [result.reason, "seen again score penalty"].filter(Boolean).join(" + ")
    }))
  ].sort((left, right) => right.score - left.score);

  return {
    freshResults,
    seenAgainResults,
    queueResults
  };
}
