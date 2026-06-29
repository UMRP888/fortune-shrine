import crypto from "node:crypto";
import { readFile } from "node:fs/promises";
import { writeJsonAtomic } from "../lib.mjs";

const USER_COOLDOWN_MS = 24 * 60 * 60 * 1_000;

export function postIdFor(candidate, post = candidate?.posts?.[0]) {
  if (post?.id) return String(post.id);
  const url = String(post?.url || "");
  const xId = url.match(/\/status\/(\d+)/)?.[1];
  if (xId) return xId;
  const polymarketId = url.match(/[?&]comment=(\d+)/)?.[1];
  if (polymarketId) return `polymarket:${polymarketId}`;
  return `sha256:${crypto.createHash("sha256")
    .update([
      candidate?.platform || "",
      url,
      post?.at || "",
      post?.text || ""
    ].join("\n"))
    .digest("hex")}`;
}

export async function readSaw(filePath) {
  try {
    const payload = JSON.parse(await readFile(filePath, "utf8"));
    return {
      version: payload.version || "0.8",
      posts: Array.isArray(payload.posts) ? payload.posts : []
    };
  } catch (error) {
    if (error.code === "ENOENT") return { version: "0.8", posts: [] };
    throw error;
  }
}

export function filterByMemory(candidates, saw, now = Date.now()) {
  const seenPostIds = new Set(saw.posts.map((entry) => String(entry.postId)));
  const latestUserSeen = new Map();
  for (const entry of saw.posts) {
    const key = String(entry.username || "").toLowerCase();
    const seenAt = Date.parse(entry.processedAt);
    if (!key || !Number.isFinite(seenAt)) continue;
    latestUserSeen.set(key, Math.max(latestUserSeen.get(key) || 0, seenAt));
  }

  return candidates.flatMap((candidate) => {
    const usernameKey = String(candidate.username || "").toLowerCase();
    const lastSeenAt = latestUserSeen.get(usernameKey) || 0;
    if (lastSeenAt && now - lastSeenAt < USER_COOLDOWN_MS) return [];

    const posts = (candidate.posts || [])
      .filter((post) => !seenPostIds.has(postIdFor(candidate, post)))
      .sort((a, b) => String(b.at).localeCompare(String(a.at)));
    if (!posts.length) return [];

    const targetPost = posts[0];
    return [{
      ...candidate,
      posts,
      latestAt: targetPost.at,
      targetPost,
      postId: postIdFor(candidate, targetPost),
      postUrl: targetPost.url || ""
    }];
  });
}

export async function rememberProcessed(filePath, candidates, processedAt = new Date().toISOString()) {
  const saw = await readSaw(filePath);
  const existing = new Set(saw.posts.map((entry) => String(entry.postId)));
  for (const candidate of candidates) {
    const post = candidate.targetPost || candidate.posts?.[0];
    const postId = candidate.postId || postIdFor(candidate, post);
    if (existing.has(postId)) continue;
    saw.posts.push({
      postId,
      username: candidate.username,
      platform: candidate.platform,
      postUrl: candidate.postUrl || post?.url || "",
      processedAt
    });
    existing.add(postId);
  }
  saw.updatedAt = processedAt;
  await writeJsonAtomic(filePath, saw);
  return saw;
}
