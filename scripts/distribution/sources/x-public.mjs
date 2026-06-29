import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { PUBLIC_X_QUERIES, PUBLIC_X_SEEDS } from "../config.mjs";
import {
  mergeCandidates,
  normalizeText,
  resolveSearchProxy
} from "../lib.mjs";

const execute = promisify(execFile);
const SEARCH_ENDPOINT = "https://search.brave.com/search";
const TIMELINE_ENDPOINT = "https://syndication.twitter.com/srv/timeline-profile/screen-name";

function decodeHtml(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

async function curlText(url, {
  proxy = process.env.PUBLIC_X_PROXY || process.env.HTTPS_PROXY || "",
  timeoutSeconds = 12,
  retries = 1
} = {}) {
  const args = [];
  if (proxy) args.push("--proxy", proxy);
  args.push(
    "-L",
    "--max-time", String(timeoutSeconds),
    "--retry", String(retries),
    "--retry-delay", "1",
    "--retry-all-errors",
    "-A", "Mozilla/5.0",
    "-sS",
    url
  );
  const { stdout } = await execute("curl", args, {
    maxBuffer: 20 * 1024 * 1024,
    encoding: "utf8"
  });
  return stdout;
}

function discoveredHandles(html) {
  const urls = html.match(/https:\/\/x\.com\/[A-Za-z0-9_]+(?:\/status\/[0-9]+)?/g) || [];
  const reserved = new Set([
    "about", "compose", "en", "explore", "hashtag", "home", "i", "intent",
    "login", "messages", "notifications", "search", "settings", "share", "signup"
  ]);
  return [...new Set(urls.map(decodeHtml).map((url) =>
    url.match(/^https:\/\/x\.com\/([A-Za-z0-9_]+)/)?.[1]
  ).filter((handle) => handle && !reserved.has(handle.toLowerCase())))];
}

function parseTimeline(html, expectedHandle) {
  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (!match) return null;
  const payload = JSON.parse(match[1]);
  const page = payload?.props?.pageProps;
  if (!page?.contextProvider?.hasResults) return null;
  const entries = page?.timeline?.entries || [];
  const tweets = entries
    .filter((entry) => entry.type === "tweet" && entry.content?.tweet)
    .map((entry) => entry.content.tweet)
    .filter((tweet) => tweet.user?.screen_name?.toLowerCase() === expectedHandle.toLowerCase());
  if (!tweets.length) return null;
  const user = tweets[0].user;
  return {
    username: user.screen_name,
    followers: Number(user.normal_followers_count ?? user.followers_count ?? 0),
    posts: tweets.slice(0, 3).map((tweet) => ({
      id: String(tweet.id_str || tweet.id || tweet.rest_id || tweet.permalink?.match(/\/status\/(\d+)/)?.[1] || ""),
      at: new Date(tweet.created_at).toISOString(),
      text: normalizeText(tweet.full_text || tweet.text, 1_500),
      url: `https://x.com${tweet.permalink}`
    })),
    engagement: tweets.slice(0, 3).reduce((sum, tweet) =>
      sum + Number(tweet.favorite_count || 0)
      + Number(tweet.reply_count || 0)
      + Number(tweet.retweet_count || 0)
      + Number(tweet.quote_count || 0), 0),
    relatedHandles: [...new Set(tweets.flatMap((tweet) => [
      ...(tweet.entities?.user_mentions || []).map((mention) => mention.screen_name),
      tweet.quoted_tweet?.user?.screen_name,
      tweet.retweeted_status?.user?.screen_name
    ]).filter(Boolean))]
  };
}

function parseCompactNumber(value) {
  const match = String(value || "").replaceAll(",", "").trim().match(/^([\d.]+)([KMB])?$/i);
  if (!match) return 0;
  const multiplier = { K: 1_000, M: 1_000_000, B: 1_000_000_000 }[match[2]?.toUpperCase()] || 1;
  return Math.round(Number(match[1]) * multiplier);
}

function decodeJsString(value) {
  try {
    return JSON.parse(`"${value}"`);
  } catch {
    return value.replaceAll("\\n", "\n").replaceAll('\\"', '"');
  }
}

function parseDirectProfile(html, expectedHandle) {
  const clean = html.replaceAll("\0", "");
  const title = clean.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i)?.[1] || "";
  const handle = title.match(/\(@([A-Za-z0-9_]+)\) on X/i)?.[1];
  if (!handle || handle.toLowerCase() !== expectedHandle.toLowerCase()) return null;
  const escapedHandle = handle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const followerText = clean.match(new RegExp(
    `href="/${escapedHandle}/verified_followers"[\\s\\S]{0,500}?font-bold">([^<]+)<`,
    "i"
  ))?.[1];
  const posts = [...clean.matchAll(
    /full_text:"((?:\\.|[^"\\])*)"[\s\S]{0,1000}?created_at_ms:(\d+)/g
  )].slice(0, 3).map((match) => {
    const preceding = clean.slice(Math.max(0, match.index - 4_000), match.index);
    const ids = [...preceding.matchAll(/client:([A-Za-z0-9+/=]+)/g)]
      .map((item) => {
        try {
          return Buffer.from(item[1], "base64").toString("utf8").match(/^Tweet:(\d+)$/)?.[1];
        } catch {
          return null;
        }
      })
      .filter(Boolean);
    const id = ids.at(-1) || "";
    return {
      id,
      at: new Date(Number(match[2])).toISOString(),
      text: normalizeText(decodeHtml(decodeJsString(match[1])), 1_500),
      url: id ? `https://x.com/${handle}/status/${id}` : `https://x.com/${handle}`
    };
  });
  if (!posts.length) return null;
  return {
    username: handle,
    followers: parseCompactNumber(followerText),
    posts,
    engagement: 0,
    relatedHandles: []
  };
}

async function mapConcurrent(items, concurrency, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  async function run() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      try {
        results[index] = await worker(items[index], index);
      } catch (error) {
        results[index] = { error };
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, run));
  return results;
}

export async function discoverXPublic({
  pagesPerQuery = 2,
  maxProfiles = 140,
  concurrency = 6,
  proxy,
  searchDelayMs = 900,
  skipSearch = process.env.PUBLIC_X_SKIP_SEARCH === "1"
} = {}) {
  const activeProxy = proxy ?? await resolveSearchProxy();
  const handleCommunities = new Map();
  const evidence = [];

  for (const seedGroup of PUBLIC_X_SEEDS) {
    for (const handle of seedGroup.handles) {
      const key = handle.toLowerCase();
      const entry = handleCommunities.get(key) || { handle, communities: new Set() };
      entry.communities.add(seedGroup.community);
      handleCommunities.set(key, entry);
    }
  }

  for (const item of skipSearch ? [] : PUBLIC_X_QUERIES) {
    for (let page = 0; page < pagesPerQuery; page += 1) {
      const url = new URL(SEARCH_ENDPOINT);
      url.search = new URLSearchParams({
        q: item.query,
        source: "web",
        offset: String(page)
      });
      const html = await curlText(url, { proxy: activeProxy });
      const handles = discoveredHandles(html);
      evidence.push({
        platform: "X Public Index",
        community: item.community,
        url: String(url),
        resultCount: handles.length
      });
      for (const handle of handles) {
        const key = handle.toLowerCase();
        const entry = handleCommunities.get(key) || { handle, communities: new Set() };
        entry.communities.add(item.community);
        handleCommunities.set(key, entry);
      }
      await new Promise((resolve) => setTimeout(resolve, searchDelayMs));
    }
  }

  async function fetchProfiles(profiles) {
    return mapConcurrent(profiles, concurrency, async (profile) => {
    const directUrl = `https://x.com/${encodeURIComponent(profile.handle)}`;
    const directHtml = await curlText(directUrl, { proxy: activeProxy });
    let timeline = parseDirectProfile(directHtml, profile.handle);
    let url = directUrl;
    if (!timeline || !timeline.followers) {
      url = `${TIMELINE_ENDPOINT}/${encodeURIComponent(profile.handle)}`;
      const html = await curlText(url, { proxy: activeProxy });
      timeline = parseTimeline(html, profile.handle) || timeline;
    }
    evidence.push({
      platform: "X Syndication",
      community: [...profile.communities].join(" | "),
      url,
      resultCount: timeline?.posts.length || 0
    });
    if (!timeline?.posts.length) return null;
      return {
      identity: timeline.username,
      username: timeline.username,
      platform: "X",
      followers: timeline.followers,
      profileUrl: `https://x.com/${timeline.username}`,
      latestAt: timeline.posts[0].at,
      communities: [...profile.communities],
      engagement: timeline.engagement,
        posts: timeline.posts,
        relatedHandles: timeline.relatedHandles
      };
    });
  }

  const primaryProfiles = [...handleCommunities.values()].slice(0, maxProfiles);
  const primary = await fetchProfiles(primaryProfiles);
  const primaryCandidates = primary.filter((item) => item && !item.error);

  for (const candidate of primaryCandidates) {
    for (const relatedHandle of candidate.relatedHandles || []) {
      const key = relatedHandle.toLowerCase();
      if (handleCommunities.has(key)) continue;
      handleCommunities.set(key, {
        handle: relatedHandle,
        communities: new Set(candidate.communities)
      });
    }
  }

  const expandedProfiles = [...handleCommunities.values()]
    .filter((profile) => !primaryProfiles.some((primaryProfile) =>
      primaryProfile.handle.toLowerCase() === profile.handle.toLowerCase()
    ))
    .slice(0, Math.max(0, maxProfiles - primaryProfiles.length));
  const expanded = await fetchProfiles(expandedProfiles);
  const fetched = [...primaryCandidates, ...expanded.filter((item) => item && !item.error)];

  return {
    candidates: mergeCandidates(fetched).map(({ relatedHandles, ...candidate }) => candidate),
    evidence
  };
}
