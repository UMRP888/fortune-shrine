import crypto from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_KEYWORDS = [
  "wish me luck",
  "pray for me",
  "all in",
  "need luck",
  "hope this works",
  "tomorrow is a big day",
  "interview tomorrow",
  "final exam tomorrow",
  "please pray"
];

const SIGNALS = {
  uncertainty: [
    "tomorrow", "waiting", "wait", "result", "results", "unknown", "uncertain",
    "hear back", "find out", "decision", "interview", "exam", "test", "application",
    "pending", "outcome", "announcement", "decide everything"
  ],
  emotion: [
    "afraid", "scared", "nervous", "anxious", "worried", "terrified", "stress",
    "stressed", "can't sleep", "cannot sleep", "panic", "hope", "prayer", "pray",
    "luck"
  ],
  directness: [
    "i ", "i'm", "i am", "my ", "me ", "wish me", "pray for me", "need luck",
    "hope this", "tomorrow i", "i have"
  ],
  stakes: [
    "all in", "everything", "life savings", "big decision", "make or break",
    "decide everything", "on the line", "career", "job", "interview", "exam",
    "driving test", "license", "licence", "surgery", "court", "hearing", "visa",
    "application", "proposal", "launch"
  ]
};

const GENERIC_PATTERNS = [
  "good luck everyone",
  "good luck all",
  "wish you all luck",
  "daily quote",
  "giveaway",
  "promotion",
  "discount",
  "dm me",
  "subscribe"
];

const REPLY_LIBRARY = {
  waiting: [
    "The answer has not arrived yet. May steadiness remain beside you while you wait.",
    "Waiting can make the mind very loud. May a little quiet reach you before the result does."
  ],
  fear: [
    "That sounds like a heavy threshold. May your breath remain yours while the future stays unwritten.",
    "Fear often arrives before important moments. May calm stand beside you without asking you to be fearless."
  ],
  risk: [
    "You have placed something real at stake. May courage remain gentle, and may the result not define your worth.",
    "Uncertainty asks a great deal of those who enter it. May you keep your name larger than the outcome."
  ],
  hope: [
    "Hope can feel fragile before an answer arrives. May you carry it without letting it carry all of you.",
    "The future has not spoken yet. May warmth remain with you while the page is still turning."
  ],
  general: [
    "The future remains unwritten. May you meet this moment with a steady heart.",
    "Some moments ask more of us than others. May you feel seen before the answer arrives."
  ]
};

function countMatches(text, terms) {
  return terms.reduce((count, term) => count + (text.includes(term) ? 1 : 0), 0);
}

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function normalizeText(value, limit = 5000) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, limit);
}

function normalizeUrl(value) {
  const url = normalizeText(value, 2000);
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function detectTheme(text) {
  if (countMatches(text, SIGNALS.stakes) >= 2 || text.includes("all in")) return "risk";
  if (countMatches(text, SIGNALS.emotion) >= 2) return "fear";
  if (countMatches(text, SIGNALS.uncertainty) >= 2) return "waiting";
  if (text.includes("hope") || text.includes("luck") || text.includes("pray")) return "hope";
  return "general";
}

function stableChoice(items, seed) {
  const digest = crypto.createHash("sha256").update(seed).digest();
  return items[digest[0] % items.length];
}

export function scorePost(content) {
  const text = normalizeText(content).toLowerCase();
  const uncertaintyMatches = countMatches(text, SIGNALS.uncertainty);
  const emotionMatches = countMatches(text, SIGNALS.emotion);
  const directnessMatches = countMatches(` ${text} `, SIGNALS.directness);
  const stakesMatches = countMatches(text, SIGNALS.stakes);
  const genericMatches = countMatches(text, GENERIC_PATTERNS);

  const dimensions = {
    uncertainty: clamp(
      uncertaintyMatches * 12
        + (text.includes("tomorrow") ? 6 : 0)
        + (text.includes("all in") ? 12 : 0),
      0,
      30
    ),
    emotionIntensity: clamp(
      emotionMatches * 10
        + (text.includes("!") ? 3 : 0)
        + (/(very |really |so )?(afraid|terrified|scared)/.test(text) ? 8 : 0),
      0,
      25
    ),
    directness: clamp(
      (directnessMatches ? 12 : 0)
        + Math.min(8, directnessMatches * 4)
        + (/(wish me luck|pray for me|need luck|please pray)/.test(text) ? 8 : 0),
      0,
      20
    ),
    personalStakes: clamp(stakesMatches * 12 + (text.includes("all in") ? 10 : 0), 0, 25)
  };

  let score = Object.values(dimensions).reduce((sum, value) => sum + value, 0);
  if (Object.values(dimensions).filter((value) => value > 0).length >= 3) score += 8;
  if (text.length < 18) score -= 12;
  if (genericMatches) score -= 30;
  if (!directnessMatches) score -= 8;

  return {
    score: clamp(Math.round(score)),
    dimensions,
    theme: detectTheme(text),
    matchedSignals: {
      uncertainty: uncertaintyMatches,
      emotion: emotionMatches,
      directness: directnessMatches,
      stakes: stakesMatches
    }
  };
}

export function generateSuggestedReply(content, postId = "") {
  const text = normalizeText(content).toLowerCase();
  const theme = detectTheme(text);
  return stableChoice(REPLY_LIBRARY[theme], `${postId}:${text}`);
}

function targetFingerprint(post) {
  return crypto.createHash("sha256")
    .update(`${post.platform}|${post.postUrl || ""}|${post.username || ""}|${post.content}`)
    .digest("hex");
}

function cleanPost(post) {
  const platform = normalizeText(post.platform, 40).toLowerCase();
  const content = normalizeText(post.content);
  if (!["x", "reddit"].includes(platform)) throw new Error("Platform must be x or reddit.");
  if (!content) throw new Error("Post content is required.");

  return {
    platform,
    username: normalizeText(post.username, 160) || "unknown",
    profileUrl: normalizeUrl(post.profileUrl),
    postUrl: normalizeUrl(post.postUrl),
    content,
    timestamp: post.timestamp ? new Date(post.timestamp).toISOString() : new Date().toISOString(),
    keyword: normalizeText(post.keyword, 160) || null
  };
}

async function readJsonFile(filePath, fallback) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return fallback;
    throw error;
  }
}

async function writeJsonFile(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.${crypto.randomUUID()}.tmp`;
  await writeFile(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(tempPath, filePath);
}

export class DistributionEngine {
  constructor({
    dataDir,
    xBearerToken = "",
    redditClientId = "",
    redditClientSecret = "",
    redditUserAgent = ""
  }) {
    this.dataPath = path.join(dataDir, "targets.json");
    this.xBearerToken = xBearerToken;
    this.redditClientId = redditClientId;
    this.redditClientSecret = redditClientSecret;
    this.redditUserAgent = redditUserAgent || "FortuneShrine-DistributionAlpha/0.2";
    this.redditAccessToken = null;
    this.redditAccessTokenExpiresAt = 0;
    this.queue = Promise.resolve();
  }

  async load() {
    return readJsonFile(this.dataPath, { version: "0.2", targets: [] });
  }

  async mutate(mutator) {
    this.queue = this.queue.then(async () => {
      const database = await this.load();
      const result = await mutator(database);
      await writeJsonFile(this.dataPath, database);
      return result;
    });
    return this.queue;
  }

  async list({ minScore = 0, decision = "all", platform = "all" } = {}) {
    const database = await this.load();
    return database.targets
      .filter((target) => target.score >= minScore)
      .filter((target) => decision === "all" || target.decision === decision)
      .filter((target) => platform === "all" || target.platform === platform)
      .sort((a, b) => b.score - a.score || b.createdAt.localeCompare(a.createdAt));
  }

  async importPosts(posts, source = "manual") {
    if (!Array.isArray(posts) || !posts.length) throw new Error("Posts must be a non-empty array.");

    return this.mutate((database) => {
      const fingerprints = new Set(database.targets.map((target) => target.fingerprint));
      const created = [];

      for (const rawPost of posts.slice(0, 250)) {
        const post = cleanPost(rawPost);
        const fingerprint = targetFingerprint(post);
        if (fingerprints.has(fingerprint)) continue;

        const scored = scorePost(post.content);
        const id = crypto.randomUUID();
        const target = {
          id,
          ...post,
          fingerprint,
          source,
          score: scored.score,
          scoreDimensions: scored.dimensions,
          matchedSignals: scored.matchedSignals,
          theme: scored.theme,
          suggestedReply: generateSuggestedReply(post.content, id),
          decision: "pending",
          sent: false,
          sentAt: null,
          interaction: {
            likes: 0,
            replies: 0,
            reposts: 0,
            profileVisits: 0,
            linkClicks: 0
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        database.targets.push(target);
        fingerprints.add(fingerprint);
        created.push(target);
      }

      return created;
    });
  }

  async decide(ids, decision) {
    if (!["approved", "rejected", "pending"].includes(decision)) {
      throw new Error("Invalid decision.");
    }

    const wanted = new Set(ids);
    return this.mutate((database) => {
      const updated = [];
      for (const target of database.targets) {
        if (!wanted.has(target.id)) continue;
        target.decision = decision;
        target.updatedAt = new Date().toISOString();
        updated.push(target);
      }
      return updated;
    });
  }

  async updateTarget(id, patch) {
    return this.mutate((database) => {
      const target = database.targets.find((item) => item.id === id);
      if (!target) return null;

      if (typeof patch.suggestedReply === "string") {
        target.suggestedReply = normalizeText(patch.suggestedReply, 1000);
      }
      if (typeof patch.sent === "boolean") {
        target.sent = patch.sent;
        target.sentAt = patch.sent ? new Date().toISOString() : null;
      }
      if (patch.interaction && typeof patch.interaction === "object") {
        for (const field of Object.keys(target.interaction)) {
          if (Number.isFinite(Number(patch.interaction[field]))) {
            target.interaction[field] = Math.max(0, Math.round(Number(patch.interaction[field])));
          }
        }
      }
      target.updatedAt = new Date().toISOString();
      return target;
    });
  }

  async search({ platform, keywords = DEFAULT_KEYWORDS, limit = 25 }) {
    const cleanKeywords = (Array.isArray(keywords) ? keywords : [keywords])
      .map((keyword) => normalizeText(keyword, 120))
      .filter(Boolean)
      .slice(0, 12);
    if (!cleanKeywords.length) throw new Error("At least one keyword is required.");

    let posts;
    if (platform === "x") posts = await this.searchX(cleanKeywords, limit);
    else if (platform === "reddit") posts = await this.searchReddit(cleanKeywords, limit);
    else throw new Error("Platform must be x or reddit.");

    return this.importPosts(posts, `${platform}-search`);
  }

  async searchX(keywords, limit) {
    if (!this.xBearerToken) {
      const error = new Error("X search is not configured. Set X_BEARER_TOKEN in Railway.");
      error.code = "NOT_CONFIGURED";
      throw error;
    }

    const query = `(${keywords.map((keyword) => `"${keyword.replaceAll('"', "")}"`).join(" OR ")}) -is:retweet lang:en`;
    const params = new URLSearchParams({
      query,
      max_results: String(Math.min(100, Math.max(10, Number(limit) || 25))),
      "tweet.fields": "created_at,author_id",
      expansions: "author_id",
      "user.fields": "username"
    });
    let response;
    try {
      response = await fetch(`https://api.x.com/2/tweets/search/recent?${params}`, {
        headers: { Authorization: `Bearer ${this.xBearerToken}` }
      });
    } catch {
      throw new Error("X search could not reach the X API.");
    }
    if (!response.ok) throw new Error(`X search failed with ${response.status}.`);

    const payload = await response.json();
    const users = new Map((payload.includes?.users || []).map((user) => [user.id, user]));
    return (payload.data || []).map((post) => {
      const user = users.get(post.author_id);
      return {
        platform: "x",
        username: user?.username || post.author_id,
        profileUrl: user?.username ? `https://x.com/${user.username}` : null,
        postUrl: user?.username ? `https://x.com/${user.username}/status/${post.id}` : null,
        content: post.text,
        timestamp: post.created_at,
        keyword: keywords.find((keyword) => post.text.toLowerCase().includes(keyword.toLowerCase())) || null
      };
    });
  }

  async getRedditAccessToken() {
    if (!this.redditClientId || !this.redditClientSecret) return null;
    if (this.redditAccessToken && Date.now() < this.redditAccessTokenExpiresAt) {
      return this.redditAccessToken;
    }

    let response;
    try {
      response = await fetch("https://www.reddit.com/api/v1/access_token", {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${this.redditClientId}:${this.redditClientSecret}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": this.redditUserAgent
        },
        body: "grant_type=client_credentials"
      });
    } catch {
      throw new Error("Reddit OAuth could not reach Reddit.");
    }
    if (!response.ok) throw new Error(`Reddit OAuth failed with ${response.status}.`);

    const payload = await response.json();
    this.redditAccessToken = payload.access_token;
    this.redditAccessTokenExpiresAt = Date.now() + Math.max(60, Number(payload.expires_in || 3600) - 60) * 1000;
    return this.redditAccessToken;
  }

  async searchReddit(keywords, limit) {
    const query = keywords.map((keyword) => `"${keyword.replaceAll('"', "")}"`).join(" OR ");
    const params = new URLSearchParams({
      q: query,
      sort: "new",
      type: "link",
      limit: String(Math.min(100, Math.max(1, Number(limit) || 25))),
      raw_json: "1"
    });
    const accessToken = await this.getRedditAccessToken();
    const endpoint = accessToken
      ? `https://oauth.reddit.com/search?${params}`
      : `https://www.reddit.com/search.json?${params}`;

    let response;
    try {
      response = await fetch(endpoint, {
        headers: {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          "User-Agent": this.redditUserAgent
        }
      });
    } catch {
      throw new Error("Reddit search could not reach Reddit. Configure Reddit OAuth or try again later.");
    }
    if (!response.ok) {
      const error = new Error(`Reddit search failed with ${response.status}. Reddit OAuth may be required.`);
      error.code = "PLATFORM_BLOCKED";
      throw error;
    }

    const payload = await response.json();
    return (payload.data?.children || []).map(({ data }) => ({
      platform: "reddit",
      username: data.author,
      profileUrl: data.author ? `https://www.reddit.com/user/${data.author}/` : null,
      postUrl: data.permalink ? `https://www.reddit.com${data.permalink}` : null,
      content: [data.title, data.selftext].filter(Boolean).join("\n"),
      timestamp: new Date(Number(data.created_utc) * 1000).toISOString(),
      keyword: keywords.find((keyword) => `${data.title} ${data.selftext}`.toLowerCase().includes(keyword.toLowerCase())) || null
    }));
  }
}

export { DEFAULT_KEYWORDS };
