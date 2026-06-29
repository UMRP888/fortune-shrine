import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

export function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

export function containsKeyword(text, keyword) {
  return normalizeText(text).toLocaleLowerCase().includes(
    normalizeText(keyword).toLocaleLowerCase()
  );
}

export function resultId(result) {
  const identity = result.peerId && result.messageId
    ? ["telegram-message", result.peerId, result.messageId]
    : [
      "telegram-visible-text",
      result.chat,
      result.author,
      result.messageId,
      result.text
    ];

  return createHash("sha256")
    .update(identity.map(normalizeText).join("\n"))
    .digest("hex")
    .slice(0, 24);
}

export function deduplicateResults(results) {
  const unique = new Map();

  for (const result of results) {
    const normalized = {
      ...result,
      chat: normalizeText(result.chat),
      author: normalizeText(result.author),
      text: normalizeText(result.text),
      timestamp: normalizeText(result.timestamp),
      messageId: normalizeText(result.messageId),
      peerId: normalizeText(result.peerId),
      messageUrl: normalizeText(result.messageUrl),
      collectionSource: normalizeText(result.collectionSource)
    };
    const id = resultId(normalized);
    if (!unique.has(id)) unique.set(id, { id, ...normalized });
  }

  return [...unique.values()];
}

export async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return fallback;
    throw error;
  }
}

export async function writeJsonAtomic(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${process.pid}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(temporaryPath, filePath);
}

export function mergeArchive(existing, incoming) {
  return deduplicateResults([...(existing || []), ...(incoming || [])])
    .sort((left, right) => right.observedAt.localeCompare(left.observedAt));
}
