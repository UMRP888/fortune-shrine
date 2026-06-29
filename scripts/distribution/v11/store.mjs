import crypto from "node:crypto";
import { appendFile, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

export const SEND_STATUSES = new Set([
  "pending",
  "approved",
  "rejected",
  "sent",
  "failed",
  "unconfirmed"
]);

function hash(prefix, value) {
  return `${prefix}_${crypto.createHash("sha256").update(String(value)).digest("hex").slice(0, 20)}`;
}

function clean(value) {
  return String(value || "").trim();
}

function sourceFor(row) {
  const explicit = clean(row.source || row.platform || row["平台"]);
  if (explicit) return explicit;
  if (clean(row.post_url).includes("polymarket.com")) return "Polymarket";
  return "X";
}

export function normalizeQueueRow(row) {
  const username = clean(row.username || row["用户名"]);
  const postId = clean(row.post_id || row.postId || row.id);
  const postUrl = clean(row.post_url || row.postUrl);
  const source = sourceFor(row);
  const identity = `${source}:${postId || postUrl || username}`;
  const candidateId = clean(row.candidate_id) || hash("cand", identity);
  const replies = [
    clean(row.reply_a || row["回复_A"]),
    clean(row.reply_b || row["回复_B"]),
    clean(row.reply_c || row["回复_C"])
  ].filter(Boolean);
  const uniqueReplies = [...new Set(replies)];
  return {
    candidate_id: candidateId,
    attribution_id: clean(row.attribution_id) || hash("atr", identity),
    username,
    platform: source,
    source,
    post_id: postId,
    post_url: postUrl,
    profile_url: clean(row.profile_url || row["个人资料网址"]),
    category: clean(row.category || row["类别"]),
    original_text: clean(row.latest_post || row["最近帖子"] || row["最近的帖子"]),
    blessings: uniqueReplies.map((text) => ({
      blessing_id: hash("bless", text),
      text
    }))
  };
}

export async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return fallback;
    throw error;
  }
}

async function writeJsonAtomic(filePath, payload) {
  await mkdir(path.dirname(filePath), { recursive: true });
  const temporary = `${filePath}.${process.pid}.tmp`;
  await writeFile(temporary, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  await rename(temporary, filePath);
}

export async function appendEvent(eventsPath, event) {
  await mkdir(path.dirname(eventsPath), { recursive: true });
  await appendFile(eventsPath, `${JSON.stringify(event)}\n`, "utf8");
}

export async function loadQueue(queuePath) {
  const payload = await readJson(queuePath, { queue: [] });
  const rows = Array.isArray(payload) ? payload : payload.queue;
  return (Array.isArray(rows) ? rows : [])
    .map(normalizeQueueRow)
    .filter((item) => item.username && item.post_url && item.blessings.length);
}

export async function loadState(statePath) {
  const payload = await readJson(statePath, {
    version: "1.1",
    updated_at: null,
    halted: false,
    halt_reason: null,
    candidates: {}
  });
  return {
    version: "1.1",
    updated_at: payload.updated_at || null,
    halted: Boolean(payload.halted),
    halt_reason: payload.halt_reason || null,
    candidates: payload.candidates && typeof payload.candidates === "object"
      ? payload.candidates
      : {}
  };
}

export async function syncQueue({ queuePath, statePath, now = new Date().toISOString() }) {
  const [queue, state] = await Promise.all([loadQueue(queuePath), loadState(statePath)]);
  for (const candidate of queue) {
    const existing = state.candidates[candidate.candidate_id];
    if (!existing) {
      state.candidates[candidate.candidate_id] = {
        ...candidate,
        status: "pending",
        selected_blessing_id: null,
        approved_text: null,
        approved_at: null,
        approved_by: null,
        rejected_at: null,
        rejected_by: null,
        rejection_reason: null,
        send_time: null,
        message_id: null,
        message_url: null,
        result_at: null,
        result_by: null,
        failure_reason: null,
        created_at: now,
        updated_at: now
      };
      continue;
    }
    existing.username = candidate.username;
    existing.profile_url = candidate.profile_url;
    existing.category = candidate.category;
    existing.original_text = candidate.original_text;
    existing.blessings = candidate.blessings;
    existing.updated_at ||= now;
  }
  state.updated_at = now;
  await writeJsonAtomic(statePath, state);
  return state;
}

export async function saveState(statePath, state, now = new Date().toISOString()) {
  state.updated_at = now;
  await writeJsonAtomic(statePath, state);
}

export function requireCandidate(state, candidateId) {
  const candidate = state.candidates[candidateId];
  if (!candidate) throw Object.assign(new Error("Candidate not found"), { statusCode: 404 });
  return candidate;
}

export function requireStatus(candidate, allowed) {
  if (!allowed.includes(candidate.status)) {
    throw Object.assign(
      new Error(`Invalid transition from ${candidate.status}`),
      { statusCode: 409 }
    );
  }
}

export function eventFor(type, candidate, operator, extra = {}) {
  return {
    event_id: hash("evt", `${type}:${candidate.candidate_id}:${Date.now()}:${Math.random()}`),
    event_type: type,
    timestamp: new Date().toISOString(),
    attribution_id: candidate.attribution_id,
    candidate_id: candidate.candidate_id,
    blessing_id: candidate.selected_blessing_id,
    platform: candidate.platform,
    source: candidate.source,
    username: candidate.username,
    post_id: candidate.post_id,
    operator,
    status: candidate.status,
    ...extra
  };
}

export function calculateStats(state, now = new Date(), timeZone = "America/Los_Angeles") {
  const candidates = Object.values(state.candidates);
  const count = (status) => candidates.filter((item) => item.status === status).length;
  const dateKey = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return null;
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(date);
  };
  const today = dateKey(now);
  const sent = candidates.filter((item) => item.status === "sent");
  const failed = candidates.filter((item) => item.status === "failed");
  const completed = sent.length + failed.length;
  const trend7Days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now.getTime() - (6 - index) * 24 * 60 * 60 * 1_000);
    const key = dateKey(date);
    return {
      date: key,
      sent: sent.filter((item) => dateKey(item.send_time) === key).length
    };
  });
  return {
    pending: count("pending"),
    approved: count("approved"),
    rejected: count("rejected"),
    sent: sent.length,
    failed: failed.length,
    unconfirmed: count("unconfirmed"),
    todaySent: sent.filter((item) => dateKey(item.send_time) === today).length,
    cumulativeSent: sent.length,
    successRate: completed ? Number((sent.length / completed * 100).toFixed(1)) : 0,
    failedCount: failed.length,
    unconfirmedCount: count("unconfirmed"),
    trend7Days
  };
}

export function dailyStartedCount(state, now = new Date(), timeZone = "America/Los_Angeles") {
  const key = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(now);
  return Object.values(state.candidates).filter((item) => {
    if (!item.send_time) return false;
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(new Date(item.send_time)) === key;
  }).length;
}

