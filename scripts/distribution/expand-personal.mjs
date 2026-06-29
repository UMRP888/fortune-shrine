#!/usr/bin/env node
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { normalizeText, writeTextAtomic } from "./lib.mjs";

const execute = promisify(execFile);
const directory = path.dirname(fileURLToPath(import.meta.url));
const inputPath = process.argv[2] || path.join(directory, "output", "fortune_shrine_x_targets_verified_85.csv");
const outputPath = process.argv[3] || path.join(directory, "output", "fortune_shrine_x_personal_expansion.csv");
const allPersonalMode = process.argv.includes("--all-personal");
const proxy = process.env.PUBLIC_X_PROXY || process.env.HTTPS_PROXY || "";
const now = Date.now();
const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

const CONTENT_SIGNALS = [
  "predict", "prediction", "polymarket", "kalshi", "bet", "betting", "wager",
  "trade", "trading", "trader", "position", "market", "luck", "lucky", "hope",
  "risk", "uncertain", "uncertainty", "wait", "waiting", "loss", "lost",
  "liquidated", "odds"
];

const ORGANIZATION_SIGNALS = [
  "official", "company", "platform", "protocol", "network",
  "foundation", "exchange", "marketplace", "sportsbook", "casino", "betting tips",
  "best bets", "odds comparison", "news", "media", "magazine", "newspaper",
  "newsletter", "podcast", "community", "customer support", "support account",
  "agency", "studio", "labs", "capital", "ventures", "research firm", "analytics",
  "data provider", "nonprofit organization", "association", "team account",
  "home of", "the home of", "bringing you", "follow us", "our app", "our users",
  "download the app", "leading provider", "global leader", "sports betting",
  "daily picks", "free picks", "bet builder", "market data", "breaking news",
  "latest news", "coverage of", "fan account", "supporting the", "squad"
];

const BOT_SIGNALS = [
  "bot", "automated", "auto-post", "alerts only", "price alerts", "whale alert",
  "signals", "calls", "24/7"
];

const INTERACTION_SEARCHES = [
  { handle: "Polymarket", community: "Polymarket" },
  { handle: "Kalshi", community: "Prediction Markets" },
  { handle: "manifoldmarkets", community: "Prediction Markets" },
  { handle: "Metaculus", community: "Prediction Markets" },
  { handle: "CryptoCred", community: "Crypto Traders" },
  { handle: "cobie", community: "Crypto Traders" },
  { handle: "HsakaTrades", community: "Crypto Traders" },
  { handle: "DegenSpartan", community: "Crypto Traders" },
  { handle: "oddschecker", community: "Betting" },
  { handle: "Covers", community: "Betting" },
  { handle: "ActionNetworkHQ", community: "Betting" },
  { handle: "PollTracker2024", community: "Election Markets" }
];

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
  return rows.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] || ""])));
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function extractMentions(text) {
  return [...new Set([...String(text).matchAll(/@([A-Za-z0-9_]{1,15})/g)].map((match) => match[1]))];
}

function decodeHtml(value) {
  return String(value || "")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function decodeJsString(value) {
  try {
    return JSON.parse(`"${value}"`);
  } catch {
    return value.replaceAll("\\n", "\n").replaceAll('\\"', '"');
  }
}

function parseCompactNumber(value) {
  const match = String(value || "").replaceAll(",", "").trim().match(/^([\d.]+)([KMB])?$/i);
  if (!match) return 0;
  const multiplier = { K: 1_000, M: 1_000_000, B: 1_000_000_000 }[match[2]?.toUpperCase()] || 1;
  return Math.round(Number(match[1]) * multiplier);
}

async function fetchProfile(handle) {
  const args = [];
  if (proxy) args.push("--proxy", proxy);
  args.push(
    "-L", "--max-time", "15", "--retry", "1", "--retry-all-errors",
    "-A", "Mozilla/5.0", "-sS", `https://x.com/${handle}`
  );
  const { stdout } = await execute("curl", args, {
    maxBuffer: 20 * 1024 * 1024,
    encoding: "utf8"
  });
  return stdout.replaceAll("\0", "");
}

async function searchInteractions(handle) {
  const query = `site:x.com "@${handle}"`;
  const args = [];
  if (proxy) args.push("--proxy", proxy);
  const url = `https://search.brave.com/search?q=${encodeURIComponent(query)}&source=web`;
  args.push(
    "-L", "--max-time", "20", "--retry", "1", "--retry-all-errors",
    "-A", "Mozilla/5.0", "-sS", url
  );
  const { stdout } = await execute("curl", args, {
    maxBuffer: 10 * 1024 * 1024,
    encoding: "utf8"
  });
  return [...new Set(
    [...stdout.matchAll(/https:\/\/x\.com\/([A-Za-z0-9_]{1,15})(?:\/status\/\d+)?/g)]
      .map((match) => match[1])
      .filter((candidate) => candidate.toLowerCase() !== handle.toLowerCase())
  )];
}

function parseProfile(html, expectedHandle) {
  const title = decodeHtml(html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i)?.[1] || "");
  const titleMatch = title.match(/^(.*?) \(@([A-Za-z0-9_]+)\) on X/i);
  if (!titleMatch || titleMatch[2].toLowerCase() !== expectedHandle.toLowerCase()) return null;
  const name = normalizeText(titleMatch[1], 100);
  const handle = titleMatch[2];
  const description = decodeHtml(html.match(/<meta[^>]+property="og:description"[^>]+content="([^"]*)"/i)?.[1] || "");
  const escapedHandle = handle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const followerText = html.match(new RegExp(
    `href="/${escapedHandle}/verified_followers"[\\s\\S]{0,500}?font-bold">([^<]+)<`,
    "i"
  ))?.[1];
  const followers = parseCompactNumber(followerText);
  const posts = [...html.matchAll(
    /full_text:"((?:\\.|[^"\\])*)"[\s\S]{0,1000}?created_at_ms:(\d+)/g
  )].slice(0, 5).map((match) => {
    const preceding = html.slice(Math.max(0, match.index - 3_000), match.index);
    const tweetIds = [...preceding.matchAll(/client:([A-Za-z0-9+/=]+)/g)]
      .map((item) => {
        try {
          return Buffer.from(item[1], "base64").toString("utf8").match(/^Tweet:(\d+)$/)?.[1];
        } catch {
          return null;
        }
      }).filter(Boolean);
    const engagement = ["favorite_count", "reply_count", "retweet_count", "quote_count"]
      .reduce((sum, key) => sum + Number(preceding.match(new RegExp(`${key}:(\\d+)`))?.[1] || 0), 0);
    return {
      at: new Date(Number(match[2])).toISOString(),
      text: normalizeText(decodeHtml(decodeJsString(match[1])), 1_500),
      engagement,
      url: tweetIds.length ? `https://x.com/${handle}/status/${tweetIds.at(-1)}` : `https://x.com/${handle}`
    };
  });
  const relatedHandles = [...new Set(
    [...html.matchAll(/screen_name:"([A-Za-z0-9_]{1,15})"/g)]
      .map((match) => match[1])
      .filter((candidate) => candidate.toLowerCase() !== handle.toLowerCase())
  )];
  return { name, handle, description: normalizeText(description, 500), followers, posts, relatedHandles };
}

function isPersonal(profile) {
  const identity = `${profile.name} ${profile.handle} ${profile.description}`.toLowerCase();
  if (ORGANIZATION_SIGNALS.some((signal) => identity.includes(signal))) return false;
  if (BOT_SIGNALS.some((signal) => identity.includes(signal))) return false;
  if (/(official|news|media|sportsbook|casino|exchange|protocol|network|foundation|labs|markets?|sports|football|baseball|basketball|golf|tour|fc|united|nation|hq)$/i.test(profile.name)) return false;
  if (/(official|news|media|sportsbook|casino|exchange|protocol|network|foundation|labs|markets?|sports|football|baseball|basketball|golf|tour|fc|hq|alerts?|picks?|odds)$/i.test(profile.handle)) return false;
  if (/^(the |we |our )/i.test(profile.description)) return false;
  if (/\b(inc|llc|ltd|corp|corporation|organization|organisation)\b/i.test(identity)) return false;
  if (/\b(mlb|nfl|nba|nhl|pga|ncaa|premier league|world cup)\b/i.test(identity)
    && !/\b(i|i'm|my|me|bettor|trader|gambler|analyst|founder)\b/i.test(identity)) return false;
  return true;
}

function matchSignals(posts) {
  const lower = posts.map((post) => post.text).join(" ").toLowerCase();
  return [...new Set(CONTENT_SIGNALS.filter((signal) => lower.includes(signal)))];
}

function score(profile, signals) {
  const latest = profile.posts[0] ? Date.parse(profile.posts[0].at) : 0;
  const recency = latest >= now - 24 * 60 * 60 * 1000 ? 30 : latest ? 22 : 0;
  const signalScore = Math.min(35, signals.length * 6);
  const personalScore = /\b(i|i'm|my|me)\b/i.test(`${profile.description} ${profile.posts.map((post) => post.text).join(" ")}`) ? 15 : 8;
  const followerScore = profile.followers <= 1_000 ? 15 : profile.followers <= 3_000 ? 12 : 9;
  const engagementScore = profile.posts.some((post) => post.engagement > 0) ? 5 : 0;
  return Math.min(100, recency + signalScore + personalScore + followerScore + engagementScore);
}

async function mapConcurrent(items, concurrency, worker) {
  const results = [];
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
  return results.filter(Boolean);
}

const seeds = parseCsv(await readFile(inputPath, "utf8"));
const seedHandles = new Set(seeds.map((row) => row["用户名"].toLowerCase()));
const communitiesByHandle = new Map();
const queue = [];

for (const search of INTERACTION_SEARCHES) {
  try {
    for (const handle of await searchInteractions(search.handle)) {
      const key = handle.toLowerCase();
      if (seedHandles.has(key)) continue;
      if (!communitiesByHandle.has(key)) queue.push(handle);
      const communities = communitiesByHandle.get(key) || new Set();
      communities.add(search.community);
      communitiesByHandle.set(key, communities);
    }
  } catch {
    // A blocked public index must not stop profile-based expansion.
  }
  await new Promise((resolve) => setTimeout(resolve, 1_500));
}

for (const seed of seeds) {
  for (const handle of extractMentions(seed["近期帖子"])) {
    const key = handle.toLowerCase();
    if (seedHandles.has(key)) continue;
    if (!communitiesByHandle.has(key)) queue.push(handle);
    const communities = communitiesByHandle.get(key) || new Set();
    communities.add(seed["社区"] || "X Interaction");
    communitiesByHandle.set(key, communities);
  }
}

const inspected = new Set();
const profiles = [];
for (let depth = 0; depth < 3 && queue.length; depth += 1) {
  const batch = queue.splice(0, 180).filter((handle) => {
    const key = handle.toLowerCase();
    if (inspected.has(key) || seedHandles.has(key)) return false;
    inspected.add(key);
    return true;
  });
  const fetched = await mapConcurrent(batch, 5, async (handle) => {
    const profile = parseProfile(await fetchProfile(handle), handle);
    return profile;
  });
  for (const profile of fetched) {
    profiles.push(profile);
    const related = [
      ...extractMentions(profile.posts.map((post) => post.text).join(" ")),
      ...(profile.relatedHandles || [])
    ];
    for (const mention of related) {
      const key = mention.toLowerCase();
      if (inspected.has(key) || seedHandles.has(key) || communitiesByHandle.has(key)) continue;
      communitiesByHandle.set(key, new Set(communitiesByHandle.get(profile.handle.toLowerCase()) || ["X Interaction"]));
      queue.push(mention);
    }
  }
}

const selected = profiles.map((profile) => {
  const signals = matchSignals(profile.posts);
  const latest = profile.posts[0] ? Date.parse(profile.posts[0].at) : 0;
  const hasRecentPost = profile.posts.some((post) => Date.parse(post.at) >= thirtyDaysAgo);
  const hasRecentActivity = latest >= sevenDaysAgo;
  return {
    ...profile,
    signals,
    hasRecentPost,
    hasRecentActivity,
    personal: isPersonal(profile)
  };
}).filter((profile) => allPersonalMode
  ? profile.personal
  : profile.personal
    && profile.followers >= 50
    && profile.followers <= 5_000
    && profile.hasRecentPost
    && profile.hasRecentActivity
    && profile.signals.length
).map((profile) => ({
  ...profile,
  matchScore: score(profile, profile.signals)
})).sort((a, b) =>
  b.matchScore - a.matchScore
  || Date.parse(b.posts[0]?.at || 0) - Date.parse(a.posts[0]?.at || 0)
);

const diagnostics = {
  followerRange: profiles.filter((profile) => profile.followers >= 50 && profile.followers <= 5_000).length,
  recentSevenDays: profiles.filter((profile) => profile.posts[0] && Date.parse(profile.posts[0].at) >= sevenDaysAgo).length,
  recentThirtyDays: profiles.filter((profile) => profile.posts.some((post) => Date.parse(post.at) >= thirtyDaysAgo)).length,
  personal: profiles.filter(isPersonal).length,
  signalMatch: profiles.filter((profile) => matchSignals(profile.posts).length).length,
  followerAndRecent: profiles.filter((profile) =>
    profile.followers >= 50 && profile.followers <= 5_000
    && profile.posts[0] && Date.parse(profile.posts[0].at) >= sevenDaysAgo
  ).length,
  followerRecentPersonal: profiles.filter((profile) =>
    profile.followers >= 50 && profile.followers <= 5_000
    && profile.posts[0] && Date.parse(profile.posts[0].at) >= sevenDaysAgo
    && isPersonal(profile)
  ).length,
  followerRecentSignal: profiles.filter((profile) =>
    profile.followers >= 50 && profile.followers <= 5_000
    && profile.posts[0] && Date.parse(profile.posts[0].at) >= sevenDaysAgo
    && matchSignals(profile.posts).length
  ).length
};

const fields = ["用户名", "个人资料", "关注者", "latest_post", "match_score"];
const csv = [
  fields.join(","),
  ...selected.map((profile) => [
    profile.handle,
    `https://x.com/${profile.handle}`,
    profile.followers,
    profile.posts[0] ? `[${profile.posts[0].at}] ${profile.posts[0].text}` : "",
    profile.matchScore
  ].map(csvEscape).join(","))
].join("\n") + "\n";

await writeTextAtomic(outputPath, "\ufeff" + csv);
console.log(JSON.stringify({
  inputSeeds: seeds.length,
  interactionHandles: inspected.size,
  verifiedProfiles: profiles.length,
  diagnostics,
  selected: selected.length,
  output: outputPath
}, null, 2));
