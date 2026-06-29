import { execFile } from "node:child_process";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import { promisify } from "node:util";
import { EXCLUSION_SIGNALS, SIGNALS } from "./config.mjs";

const execute = promisify(execFile);
const DEFAULT_LOCAL_PROXY = "http://127.0.0.1:7897";

export function normalizeText(value, maxLength = 2_000) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function toCsv(rows) {
  const fields = ["用户名", "平台", "关注者", "profile_url", "最近的帖子", "社区", "评分"];
  return [
    fields.join(","),
    ...rows.map((row) => fields.map((field) => csvEscape(row[field])).join(","))
  ].join("\n") + "\n";
}

export function canonicalIdentity(candidate) {
  if (candidate.platform === "X") return `x:${candidate.username.toLowerCase()}`;
  return `polymarket:${String(candidate.identity || candidate.username).toLowerCase()}`;
}

export function countSignals(text, signals) {
  const lower = text.toLowerCase();
  return signals.reduce((count, signal) => count + (lower.includes(signal) ? 1 : 0), 0);
}

export function scoreCandidate(candidate, now = Date.now()) {
  const combined = candidate.posts.map((post) => post.text).join(" ");
  const ageHours = Math.max(0, (now - Date.parse(candidate.latestAt)) / 3_600_000);
  const recency = ageHours <= 6 ? 30 : ageHours <= 24 ? 25 : ageHours <= 72 ? 18 : ageHours <= 168 ? 10 : 3;
  const activity = Math.min(20, candidate.posts.length * 5);
  const uncertainty = Math.min(18, countSignals(combined, SIGNALS.uncertainty) * 4);
  const risk = Math.min(15, countSignals(combined, SIGNALS.risk) * 3);
  const restraint = Math.min(10, countSignals(combined, SIGNALS.restraint) * 5);
  const engagement = Math.min(7, Math.round(Math.log10(1 + Number(candidate.engagement || 0)) * 3));
  const penalty = countSignals(combined, EXCLUSION_SIGNALS) * 12;
  return Math.max(1, Math.min(100, recency + activity + uncertainty + risk + restraint + engagement - penalty));
}

export function mergeCandidates(candidates) {
  const merged = new Map();
  for (const candidate of candidates) {
    const key = canonicalIdentity(candidate);
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, { ...candidate, posts: [...candidate.posts] });
      continue;
    }
    existing.followers = Math.max(Number(existing.followers || 0), Number(candidate.followers || 0)) || "";
    existing.engagement = Number(existing.engagement || 0) + Number(candidate.engagement || 0);
    existing.communities = [...new Set([...(existing.communities || []), ...(candidate.communities || [])])];
    existing.posts.push(...candidate.posts);
    existing.posts = [...new Map(existing.posts.map((post) => [
      `${post.url || ""}:${post.at}:${post.text}`,
      post
    ])).values()]
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, 3);
    existing.latestAt = existing.posts[0]?.at || existing.latestAt;
  }
  return [...merged.values()];
}

export function selectCandidates(candidates, {
  totalTarget,
  polymarketTarget,
  xTarget,
  seen = new Set()
}) {
  const available = candidates
    .filter((candidate) => !seen.has(canonicalIdentity(candidate)))
    .map((candidate) => ({ ...candidate, score: scoreCandidate(candidate) }))
    .sort((a, b) => b.score - a.score || b.latestAt.localeCompare(a.latestAt));

  const selected = [];
  const take = (platform, limit) => {
    for (const candidate of available) {
      if (selected.length >= totalTarget || selected.filter((item) => item.platform === platform).length >= limit) break;
      if (candidate.platform !== platform || selected.includes(candidate)) continue;
      selected.push(candidate);
    }
  };
  take("Polymarket", polymarketTarget);
  take("X", xTarget);
  for (const candidate of available) {
    if (selected.length >= totalTarget) break;
    if (!selected.includes(candidate)) selected.push(candidate);
  }
  return selected.sort((a, b) => b.score - a.score || b.latestAt.localeCompare(a.latestAt));
}

export function outputRows(candidates) {
  return candidates.map((candidate) => ({
    用户名: candidate.username,
    平台: candidate.platform,
    关注者: candidate.followers ?? "",
    profile_url: candidate.profileUrl,
    最近的帖子: candidate.posts
      .slice(0, 3)
      .map((post) => `[${post.at}] ${normalizeText(post.text, 500)}`)
      .join(" || "),
    社区: [...new Set(candidate.communities || [])].join(" | "),
    评分: candidate.score
  }));
}

export async function fetchJson(url, {
  headers = {},
  timeoutMs = 25_000,
  maxRetries = 2,
  fetchImpl = fetch,
  proxy = ""
} = {}) {
  if (proxy) {
    return fetchJsonWithCurl(url, {
      headers,
      timeoutMs,
      maxRetries,
      proxy
    });
  }

  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(url, { headers, signal: controller.signal });
      const body = await response.text();
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status} for ${url}`);
        error.status = response.status;
        error.body = body.slice(0, 1_000);
        if (response.status < 500 && response.status !== 429) throw error;
        lastError = error;
      } else {
        return { data: JSON.parse(body), status: response.status, url };
      }
    } catch (error) {
      error.requestUrl ||= String(url);
      lastError = error;
      if (error.status && error.status < 500 && error.status !== 429) throw error;
    } finally {
      clearTimeout(timer);
    }
    if (attempt < maxRetries) await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
  }
  throw lastError;
}

async function fetchJsonWithCurl(url, {
  headers = {},
  timeoutMs = 25_000,
  maxRetries = 2,
  proxy
} = {}) {
  const headerArgs = Object.entries(headers).flatMap(([name, value]) => [
    "-H",
    `${name}: ${value}`
  ]);
  const args = [
    "--proxy", proxy,
    "-L",
    "--max-time", String(Math.max(1, Math.ceil(timeoutMs / 1_000))),
    "--retry", String(maxRetries),
    "--retry-delay", "1",
    "--retry-all-errors",
    "-A", "Fortune Shrine Discovery Engine/0.8",
    "-sS",
    "-w", "\n%{http_code}",
    ...headerArgs,
    String(url)
  ];

  try {
    const { stdout } = await execute("curl", args, {
      maxBuffer: 50 * 1024 * 1024,
      encoding: "utf8"
    });
    const splitAt = stdout.lastIndexOf("\n");
    const body = splitAt >= 0 ? stdout.slice(0, splitAt) : "";
    const status = Number(splitAt >= 0 ? stdout.slice(splitAt + 1).trim() : 0);
    if (status < 200 || status >= 300) {
      const error = new Error(`HTTP ${status} for ${url}`);
      error.status = status;
      error.body = body.slice(0, 1_000);
      error.requestUrl = String(url);
      throw error;
    }
    try {
      return { data: JSON.parse(body), status, url: String(url) };
    } catch (cause) {
      const error = new Error(`Invalid JSON from ${url}`);
      error.code = "INVALID_JSON";
      error.cause = cause;
      error.body = body.slice(0, 1_000);
      error.requestUrl = String(url);
      throw error;
    }
  } catch (error) {
    error.requestUrl ||= String(url);
    throw error;
  }
}

function canConnect(host, port, timeoutMs = 300) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    const finish = (available) => {
      socket.destroy();
      resolve(available);
    };
    socket.setTimeout(timeoutMs);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
  });
}

export async function resolveSearchProxy() {
  const configured = String(
    process.env.PUBLIC_X_PROXY
    || process.env.HTTPS_PROXY
    || process.env.HTTP_PROXY
    || process.env.ALL_PROXY
    || ""
  ).trim();
  if (configured) return configured;
  return await canConnect("127.0.0.1", 7897) ? DEFAULT_LOCAL_PROXY : "";
}

export async function readSeen(filePath) {
  try {
    const payload = JSON.parse(await readFile(filePath, "utf8"));
    return new Set(Array.isArray(payload.seen) ? payload.seen : []);
  } catch (error) {
    if (error.code === "ENOENT") return new Set();
    throw error;
  }
}

export async function writeJsonAtomic(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  const temporary = `${filePath}.tmp`;
  await writeFile(temporary, JSON.stringify(value, null, 2) + "\n", "utf8");
  await rename(temporary, filePath);
}

export async function writeTextAtomic(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  const temporary = `${filePath}.tmp`;
  await writeFile(temporary, value, "utf8");
  await rename(temporary, filePath);
}
