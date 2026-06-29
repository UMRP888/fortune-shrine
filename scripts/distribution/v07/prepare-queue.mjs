#!/usr/bin/env node
import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execute = promisify(execFile);
const directory = path.dirname(fileURLToPath(import.meta.url));
const distributionDirectory = path.resolve(directory, "..");
const inputPath = process.argv[2]
  || path.join(distributionDirectory, "output", "v06_validation_top20_pool30.csv");
const profilePath = process.argv[3]
  || path.join(distributionDirectory, "output", "fortune_shrine_v06_validation_top50.csv");
const outputDirectory = path.join(directory, "data");
const proxy = process.env.PUBLIC_X_PROXY || process.env.HTTPS_PROXY || "";

function parseCsv(text) {
  text = text.replace(/^\ufeff/, "");
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') quoted = false;
      else field += character;
    } else if (character === '"') quoted = true;
    else if (character === ",") row.push(field), field = "";
    else if (character === "\n") {
      row.push(field);
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = "";
    } else if (character !== "\r") field += character;
  }
  if (field || row.length) row.push(field), rows.push(row);
  const headers = rows.shift() || [];
  return rows.map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] || ""]))
  );
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function normalize(value) {
  return String(value || "")
    .replace(/https:\/\/t\.co\/\S+/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function decodeHtml(value) {
  return String(value || "")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function decodeText(value) {
  try {
    return JSON.parse(`"${value}"`);
  } catch {
    return value.replaceAll("\\n", "\n").replaceAll('\\"', '"');
  }
}

async function fetchProfile(handle) {
  const args = [];
  if (proxy) args.push("--proxy", proxy);
  args.push(
    "-L",
    "--max-time", "15",
    "--retry", "1",
    "--retry-all-errors",
    "-A", "Mozilla/5.0",
    "-sS",
    `https://x.com/${encodeURIComponent(handle)}`
  );
  const { stdout } = await execute("curl", args, {
    maxBuffer: 20 * 1024 * 1024,
    encoding: "utf8"
  });
  return stdout.replaceAll("\0", "");
}

function parsePosts(html, handle) {
  return [...html.matchAll(
    /full_text:"((?:\\.|[^"\\])*)"[\s\S]{0,1000}?created_at_ms:(\d+)/g
  )].map((match) => {
    const preceding = html.slice(Math.max(0, match.index - 4_000), match.index);
    const tweetIds = [...preceding.matchAll(/client:([A-Za-z0-9+/=]+)/g)]
      .map((item) => {
        try {
          return Buffer.from(item[1], "base64").toString("utf8").match(/^Tweet:(\d+)$/)?.[1];
        } catch {
          return null;
        }
      })
      .filter(Boolean);
    const id = tweetIds.at(-1) || null;
    const text = decodeHtml(decodeText(match[1]));
    return {
      id,
      text,
      normalized: normalize(text),
      url: id ? `https://x.com/${handle}/status/${id}` : null
    };
  });
}

function findPostUrl(posts, latestPost) {
  const target = normalize(latestPost.replace(/^\[[^\]]+\]\s*/, ""));
  if (!target) return null;
  const exact = posts.find((post) => post.normalized === target);
  if (exact?.url) return exact.url;
  const prefix = target.slice(0, 90);
  const partial = posts.find((post) =>
    prefix.length >= 30
    && (post.normalized.startsWith(prefix) || target.startsWith(post.normalized.slice(0, 90)))
  );
  return partial?.url || null;
}

function postIdFromUrl(url) {
  return String(url || "").match(/\/status\/(\d+)/)?.[1]
    || String(url || "").match(/[?&]comment=(\d+)/)?.[1]
    || "";
}

async function mapConcurrent(items, concurrency, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  async function run() {
    while (cursor < items.length) {
      const index = cursor++;
      try {
        results[index] = await worker(items[index]);
      } catch {
        results[index] = null;
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, run));
  return results;
}

const replyRows = parseCsv(await readFile(inputPath, "utf8"));
const profileRows = parseCsv(await readFile(profilePath, "utf8"));
const profiles = new Map(profileRows.map((row) => [row["用户名"].toLowerCase(), row]));
const resolved = await mapConcurrent(replyRows, 4, async (row) => {
  const profile = profiles.get(row["用户名"].toLowerCase());
  const profileUrl = profile?.["个人资料网址"]
    || profile?.profile_url
    || `https://x.com/${row["用户名"]}`;
  const knownPostUrl = profile?.post_url || profile?.["post_url"] || "";
  const html = knownPostUrl ? "" : await fetchProfile(row["用户名"]);
  const postUrl = knownPostUrl
    || findPostUrl(parsePosts(html, row["用户名"]), row["最新帖子"]);
  const postId = profile?.post_id
    || profile?.["post_id"]
    || postIdFromUrl(postUrl);
  return {
    id: postId || row["用户名"].toLowerCase(),
    post_id: postId,
    username: row["用户名"],
    profile_url: profileUrl,
    post_url: postUrl || "",
    post_url_status: postUrl ? "verified" : "missing",
    category: row["类别"],
    latest_post: row["最新帖子"],
    example_post: row["示例帖子"],
    reply_a: row["回复_A"],
    reply_b: row["回复_B"],
    reply_c: row["回复_C"]
  };
});

const queue = resolved.filter(Boolean);
await mkdir(outputDirectory, { recursive: true });
await writeFile(
  path.join(outputDirectory, "queue.json"),
  JSON.stringify({ version: "0.7", generatedAt: new Date().toISOString(), queue }, null, 2) + "\n",
  "utf8"
);

const fields = [
  "post_id", "username", "profile_url", "post_url", "post_url_status", "category",
  "latest_post", "example_post", "reply_a", "reply_b", "reply_c"
];
const csv = [
  fields.join(","),
  ...queue.map((row) => fields.map((field) => csvEscape(row[field])).join(","))
].join("\n") + "\n";
await writeFile(path.join(outputDirectory, "queue.csv"), "\ufeff" + csv, "utf8");

console.log(JSON.stringify({
  users: queue.length,
  verifiedPostUrls: queue.filter((item) => item.post_url).length,
  missingPostUrls: queue.filter((item) => !item.post_url).length,
  outputDirectory
}, null, 2));
