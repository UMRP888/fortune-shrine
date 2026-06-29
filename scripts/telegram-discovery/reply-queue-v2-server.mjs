#!/usr/bin/env node
import http from "node:http";
import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import { chromium } from "playwright";
import {
  DEFAULTS,
  SEARCH_INPUT_SELECTORS
} from "./config.mjs";
import { acquireProfileLease } from "./profile-lease.mjs";
import { expressionIntent } from "./reply-queue-v2.mjs";
import { candidateIdentity, queueDedupKey } from "./queue-eligibility.mjs";

const directory = path.dirname(fileURLToPath(import.meta.url));
const publicDirectory = path.join(directory, "reply-queue-v2", "public");
const queuePath = path.join(directory, "output", "reply_queue_v2.json");
const processedPath = path.join(directory, "output", "processed_messages.json");
const navigationLogPath = path.join(directory, "output", "open-post-navigation.jsonl");
const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 4196);
const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};
const CHAT_COMPOSER_SELECTORS = [
  ".input-message-input[contenteditable=\"true\"]",
  ".chat-input [contenteditable=\"true\"]",
  ".input-message-container [contenteditable=\"true\"]",
  ".chat-input .input-field-input[contenteditable=\"true\"]"
];
let telegramContext = null;
let telegramProfileLease = null;
let telegramContextIdleTimer = null;
const telegramContextIdleMs = Number(
  process.env.TELEGRAM_REVIEW_CONTEXT_IDLE_MS || 2 * 60 * 1_000
);

async function readRequestJson(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function readJsonIfExists(filePath) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

function summarizeBoundQueue(items) {
  const categoryNames = ["Prayer", "Waiting", "Hope", "Anxiety", "Uncertainty"];
  const categories = Object.fromEntries(categoryNames.map((category) => [
    category,
    items.filter((item) => item.sourceCategory === category || item.category === category).length
  ]));
  const communities = {
    Bitget: { count: 0, percentage: 0 },
    Bybit: { count: 0, percentage: 0 },
    Binance: { count: 0, percentage: 0 },
    "Prediction Market": { count: 0, percentage: 0 },
    "Sports Betting": { count: 0, percentage: 0 },
    Other: { count: 0, percentage: 0 }
  };

  for (const item of items) {
    const group = String(item.group || "").toLocaleLowerCase();
    if (group.includes("bitget")) communities.Bitget.count += 1;
    else if (group.includes("bybit")) communities.Bybit.count += 1;
    else if (group.includes("binance")) communities.Binance.count += 1;
    else if (/prediction|polymarket|kalshi/.test(group)) communities["Prediction Market"].count += 1;
    else if (/sport|betting|bet\b/.test(group)) communities["Sports Betting"].count += 1;
    else communities.Other.count += 1;
  }

  const total = items.length;
  for (const value of Object.values(communities)) {
    value.percentage = total ? Number(((value.count / total) * 100).toFixed(1)) : 0;
  }

  return { totalResults: total, categories, communities };
}

function fallbackReplyDraft(item) {
  if (item.replyDraftA) return item.replyDraftA;
  if (item.blessingDraft) return item.blessingDraft;
  return "May you stay steady while this moment remains unresolved.";
}

function normalizeQueueItem(item, index) {
  const id = String(item.id || (item.messageId ? `tg-${item.peerId || "peer"}-${item.messageId}` : `queue-${index + 1}`));
  const original = item.original || item.message || item.text || "";
  const sourceCategory = item.category || item.emotion || "";
  const boundItem = {
    ...item,
    id,
    source: item.source || "Telegram",
    group: item.group || item.chat || item.community || "Unknown",
    original,
    sourceCategory,
    category: sourceCategory || expressionIntent({
      original,
      reason: item.reason,
      blessingDraft: item.blessingDraft,
      replyDraftA: item.replyDraftA,
      replyDraftB: item.replyDraftB,
      replyDraftC: item.replyDraftC
    }),
    expressionCategory: expressionIntent({
      original,
      reason: item.reason,
      blessingDraft: item.blessingDraft,
      replyDraftA: item.replyDraftA,
      replyDraftB: item.replyDraftB,
      replyDraftC: item.replyDraftC
    }),
    score: Number(item.score || item.priorityScore || 0),
    priorityScore: Number(item.priorityScore || item.score || 0),
    rank: Number(item.rank || index + 1),
    reason: item.reason || "Selected by Telegram Discovery HUD.",
    blessingDraft: item.blessingDraft || fallbackReplyDraft(item),
    replyDraftA: item.replyDraftA || fallbackReplyDraft(item),
    replyDraftB: item.replyDraftB || item.replyDraftA || fallbackReplyDraft(item),
    replyDraftC: item.replyDraftC || item.replyDraftA || fallbackReplyDraft(item),
    riskLevel: item.riskLevel || "Low",
    originalUrl: item.originalUrl || item.messageUrl || item.message_url || item.sourceUrl || item.source_url || null,
    messageUrl: item.messageUrl || item.message_url || item.originalUrl || null,
    status: item.status || "pending"
  };

  return boundItem;
}

function normalizeQueuePayload(payload, sourcePath) {
  const rawQueue = Array.isArray(payload.queue)
    ? payload.queue
    : Array.isArray(payload.items)
      ? payload.items
    : [];
  const queue = rawQueue
    .map((item, index) => normalizeQueueItem(item, index))
    .sort((left, right) =>
      Number(left.rank) - Number(right.rank)
      || Number(right.priorityScore) - Number(left.priorityScore)
    );

  return {
    ...payload,
    version: payload.version || "operation-queue-binding-v1",
    generatedAt: payload.generatedAt || payload.completedAt || new Date().toISOString(),
    boundSource: sourcePath,
    policy: {
      humanReviewRequired: true,
      autoSend: false,
      autoReply: false,
      directMessage: false,
      groupJoin: false,
      note: "Bless the state. Never bless the outcome.",
      ...(payload.policy || {})
    },
    summary: payload.summary || summarizeBoundQueue(queue),
    queue
  };
}

function humanProcessedStatus(status) {
  return ["sent", "reviewed", "ignored"].includes(String(status || "").toLocaleLowerCase());
}

async function loadOperationQueuePayload() {
  const payload = await readJsonIfExists(queuePath);
  if (!payload) {
    throw Object.assign(new Error("Operation Queue v2 source not found"), { code: "ENOENT" });
  }
  const normalized = normalizeQueuePayload(payload, queuePath);
  const processed = await readJsonIfExists(processedPath);
  const humanProcessed = new Set(
    (processed?.items || [])
      .filter((item) => humanProcessedStatus(item.status))
      .map((item) => item.identity || candidateIdentity(item))
  );
  const queue = normalized.queue.filter((item) => !humanProcessed.has(candidateIdentity(item)));
  return {
    path: queuePath,
    payload: {
      ...normalized,
      queue,
      summary: summarizeBoundQueue(queue)
    }
  };
}

async function navigationLog(requestId, step, details = {}) {
  await mkdir(path.dirname(navigationLogPath), { recursive: true });
  await appendFile(navigationLogPath, `${JSON.stringify({
    timestamp: new Date().toISOString(),
    requestId,
    step,
    ...details
  })}\n`, "utf8");
}

async function updateReviewStatus(id, status) {
  const { payload } = await loadOperationQueuePayload();
  const item = payload.queue.find((candidate) => candidate.id === id);
  if (!item) return null;
  const allowedStatus = ["sent", "reviewed", "ignored"].includes(status) ? status : "sent";
  const existing = await readJsonIfExists(processedPath);
  const items = existing?.items || [];
  const merged = new Map(items.map((entry) => [entry.identity || candidateIdentity(entry), entry]));
  const identity = candidateIdentity(item);
  const previous = merged.get(identity);
  const now = new Date().toISOString();
  merged.set(identity, {
    identity,
    dedupKey: item.dedupKey || queueDedupKey(item),
    peerId: item.peerId || previous?.peerId || "",
    messageId: item.messageId || previous?.messageId || "",
    group: item.group || previous?.group || "",
    original: item.original || previous?.original || "",
    status: allowedStatus,
    firstProcessedAt: previous?.firstProcessedAt || now,
    lastProcessedAt: now
  });
  await writeFile(processedPath, `${JSON.stringify({
    version: "1.0",
    updatedAt: now,
    itemCount: merged.size,
    items: [...merged.values()]
  }, null, 2)}\n`, "utf8");

  return {
    id: item.id,
    status: allowedStatus,
    reviewedAt: now
  };
}

async function firstVisibleLocator(page, selectors) {
  for (const selector of selectors) {
    const candidates = page.locator(selector);
    const count = await candidates.count();
    for (let index = 0; index < count; index += 1) {
      const candidate = candidates.nth(index);
      if (await candidate.isVisible().catch(() => false)) return candidate;
    }
  }
  return null;
}

async function exposeMessageResults(page) {
  for (const label of ["Messages", "Global Search", "Show more"]) {
    const candidate = page.getByText(label, { exact: true });
    if (
      await candidate.count() === 1
      && await candidate.isVisible().catch(() => false)
    ) {
      await candidate.click().catch(() => {});
      return;
    }
  }
}

async function telegramReviewContext() {
  if (telegramContext) {
    if (telegramContextIdleTimer) clearTimeout(telegramContextIdleTimer);
    telegramContextIdleTimer = null;
    return telegramContext;
  }
  telegramProfileLease = await acquireProfileLease(DEFAULTS.profileDir, {
    owner: "Reply Queue Open Post",
    timeoutMs: DEFAULTS.loginTimeoutMs
  });
  try {
    telegramContext = await chromium.launchPersistentContext(DEFAULTS.profileDir, {
      headless: false,
      viewport: { width: 1440, height: 960 },
      locale: "en-US"
    });
  } catch (error) {
    await telegramProfileLease.release();
    telegramProfileLease = null;
    throw error;
  }
  telegramContext.once("close", () => {
    telegramContext = null;
    if (telegramContextIdleTimer) clearTimeout(telegramContextIdleTimer);
    telegramContextIdleTimer = null;
    telegramProfileLease?.release().catch(() => {});
    telegramProfileLease = null;
  });
  return telegramContext;
}

function scheduleTelegramContextRelease() {
  if (!telegramContext) return;
  if (telegramContextIdleTimer) clearTimeout(telegramContextIdleTimer);
  telegramContextIdleTimer = setTimeout(async () => {
    const context = telegramContext;
    telegramContextIdleTimer = null;
    await context?.close().catch(() => {});
  }, telegramContextIdleMs);
  telegramContextIdleTimer.unref();
}

async function openOriginalMessage(item) {
  const requestId = crypto.randomUUID();
  const url = new URL(item.originalUrl || item.messageUrl || "");
  const evidence = {
    candidateId: item.id,
    targetMessageId: item.messageId,
    targetPeerId: item.peerId,
    sourceUrl: url.href
  };
  await navigationLog(requestId, "start", evidence);
  if (url.hostname !== "web.telegram.org") {
    throw new Error("Candidate lacks a trusted Telegram DOM source URL.");
  }
  if (!item.messageId || !item.original) {
    throw new Error("Candidate lacks message evidence.");
  }

  const context = await telegramReviewContext();
  await navigationLog(requestId, "context_ready", evidence);

  try {
    const page = context.pages()[0] || await context.newPage();
    await page.bringToFront();
    await navigationLog(requestId, "tab_focused", {
      ...evidence,
      currentUrl: page.url()
    });

    const staleSearch = await firstVisibleLocator(page, SEARCH_INPUT_SELECTORS);
    if (staleSearch) {
      await staleSearch.fill("", { force: true });
      await page.keyboard.press("Escape");
      await page.keyboard.press("Escape");
    }
    await navigationLog(requestId, "search_state_cleared_before_navigation", {
      ...evidence,
      searchFound: Boolean(staleSearch),
      currentUrl: page.url()
    });

    await navigationLog(requestId, "channel_navigation_started", evidence);
    await page.goto(url.href, {
      waitUntil: "domcontentloaded",
      timeout: 45_000
    });
    await page.waitForTimeout(750);
    await navigationLog(requestId, "channel_navigation_completed", {
      ...evidence,
      currentUrl: page.url()
    });

    let search = null;
    for (let attempt = 0; attempt < 20 && !search; attempt += 1) {
      search = await firstVisibleLocator(page, SEARCH_INPUT_SELECTORS);
      if (!search) await page.waitForTimeout(500);
    }
    if (!search) throw new Error("Telegram search is unavailable.");
    await search.fill("", { force: true });
    await navigationLog(requestId, "search_ready_and_empty", {
      ...evidence,
      currentUrl: page.url(),
      searchValue: await search.inputValue()
    });

    const searchTerms = [
      ...(item.matchedKeywords || []),
      item.original
    ].filter((term, index, terms) =>
      term && terms.indexOf(term) === index
    );
    let result = null;
    let matchedSearchTerm = null;

    for (const term of searchTerms) {
      for (let attempt = 0; attempt < 2; attempt += 1) {
        await search.fill("", { force: true });
        await search.fill(term, { force: true });
        await navigationLog(requestId, "message_search_started", {
          ...evidence,
          term,
          attempt: attempt + 1,
          currentUrl: page.url()
        });
        await page.waitForTimeout(DEFAULTS.searchSettleMs);
        await exposeMessageResults(page);
        await page.waitForTimeout(500);

        const candidate = page.locator(`a[data-mid="${item.messageId}"]`);
        const candidateCount = await candidate.count();
        await navigationLog(requestId, "message_search_result_checked", {
          ...evidence,
          term,
          attempt: attempt + 1,
          candidateCount
        });
        if (candidateCount === 1) {
          result = candidate;
          matchedSearchTerm = term;
          break;
        }
      }
      if (result) break;
    }

    if (!result) {
      throw new Error("Original message search result was not found.");
    }
    await result.click();
    await navigationLog(requestId, "message_result_clicked", {
      ...evidence,
      matchedSearchTerm,
      currentUrl: page.url()
    });

    const bubble = page.locator(`.bubble[data-mid="${item.messageId}"]`);
    await bubble.waitFor({ state: "visible", timeout: 10_000 });
    const foundMessageId = await bubble.getAttribute("data-mid");
    await navigationLog(requestId, "target_message_visible", {
      ...evidence,
      foundMessageId,
      matched: foundMessageId === item.messageId,
      currentUrl: page.url()
    });
    const normalizedActual = (await bubble.innerText()).replace(/\s+/g, " ").trim();
    const normalizedExpected = String(item.original).replace(/\s+/g, " ").trim();
    const expectedEvidence = normalizedExpected
      .replace(/\s*(?:\.\.\.|…)\s*$/, "")
      .trim();
    if (!expectedEvidence || !normalizedActual.includes(expectedEvidence)) {
      throw new Error("Opened message does not match the candidate text.");
    }
    await navigationLog(requestId, "message_body_verified", {
      ...evidence,
      foundMessageId,
      matched: true
    });

    await search.fill("", { force: true });
    await page.keyboard.press("Escape");
    await page.waitForTimeout(250);
    const activeSearch = await firstVisibleLocator(page, SEARCH_INPUT_SELECTORS);
    if (activeSearch) {
      await activeSearch.fill("", { force: true });
      await page.keyboard.press("Escape");
    }

    let composer = null;
    for (let attempt = 0; attempt < 20 && !composer; attempt += 1) {
      composer = await firstVisibleLocator(page, CHAT_COMPOSER_SELECTORS);
      if (!composer) await page.waitForTimeout(250);
    }
    if (!composer) {
      throw new Error("Telegram reply composer did not become available.");
    }
    await navigationLog(requestId, "reply_composer_ready", {
      ...evidence,
      foundMessageId,
      currentUrl: page.url()
    });

    await page.bringToFront();
    await navigationLog(requestId, "completed", {
      ...evidence,
      foundMessageId,
      openedUrl: page.url()
    });
    return {
      verified: true,
      requestId,
      messageId: item.messageId,
      matchedSearchTerm,
      composerReady: true,
      sourceUrl: url.href,
      openedUrl: page.url()
    };
  } catch (error) {
    await navigationLog(requestId, "failed", {
      ...evidence,
      error: error.message
    });
    throw error;
  } finally {
    scheduleTelegramContextRelease();
  }
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);
    if (url.pathname === "/api/reply-queue") {
      const { payload } = await loadOperationQueuePayload();
      response.writeHead(200, {
        "Content-Type": contentTypes[".json"],
        "Cache-Control": "no-store"
      });
      response.end(JSON.stringify(payload, null, 2));
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/review-status") {
      const body = await readRequestJson(request);
      const updated = await updateReviewStatus(String(body.id || ""), String(body.status || "sent"));
      response.writeHead(updated ? 200 : 404, {
        "Content-Type": contentTypes[".json"],
        "Cache-Control": "no-store"
      });
      response.end(JSON.stringify(updated || { error: "Queue item not found." }));
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/open-original") {
      response.writeHead(405, {
        "Content-Type": contentTypes[".json"],
        "Cache-Control": "no-store"
      });
      response.end(JSON.stringify({
        error: "Queue Freeze: browser verification workers are disabled."
      }));
      return;
    }

    const requestedPath = url.pathname === "/" ? "/index.html" : url.pathname;
    const filePath = path.join(publicDirectory, requestedPath);
    if (!filePath.startsWith(publicDirectory)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }
    const file = await readFile(filePath);
    response.writeHead(200, {
      "Content-Type": contentTypes[path.extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    response.end(file);
  } catch (error) {
    response.writeHead(error.code === "ENOENT" ? 404 : 500, {
      "Content-Type": "text/plain; charset=utf-8"
    });
    response.end(error.code === "ENOENT" ? "Not found" : "Reply Queue unavailable");
  }
});

server.listen(port, host, () => {
  process.stdout.write(`Reply Queue V2: http://${host}:${port}\n`);
});
