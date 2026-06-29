import { chromium } from "playwright";
import {
  allowedChatsFromEnvironment,
  DEFAULTS,
  RECENT_CHAT_SOURCES,
  RESULT_ROW_SELECTORS,
  SEARCH_INPUT_SELECTORS
} from "./config.mjs";
import { containsKeyword, deduplicateResults, normalizeText } from "./lib.mjs";
import { acquireProfileLease } from "./profile-lease.mjs";

function visible(locator) {
  return locator.isVisible().catch(() => false);
}

async function firstVisibleLocator(page, selectors) {
  for (const selector of selectors) {
    const candidates = page.locator(selector);
    const count = await candidates.count();
    for (let index = 0; index < count; index += 1) {
      const candidate = candidates.nth(index);
      if (await visible(candidate)) return candidate;
    }
  }
  return null;
}

async function isLoggedIn(page) {
  const peerTitles = page.locator(".peer-title");
  if (await peerTitles.count()) return true;

  const search = await firstVisibleLocator(page, SEARCH_INPUT_SELECTORS);
  return Boolean(search);
}

async function waitForLogin(page, timeoutMs) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (await isLoggedIn(page)) return;
    await page.waitForTimeout(1_000);
  }

  throw new Error(
    "Telegram login was not detected before the timeout. Run npm run telegram:login and complete login in the opened window."
  );
}

async function clearAndFill(locator, value) {
  await locator.click();
  await locator.fill("");
  await locator.fill(value);
}

async function exposeMessageResults(page) {
  const labels = ["Messages", "Global Search", "Show more"];

  for (const label of labels) {
    const candidate = page.getByText(label, { exact: true });
    if (await candidate.count() === 1 && await visible(candidate)) {
      await candidate.click().catch(() => {});
      return;
    }
  }
}

async function extractVisibleResults(page, keyword, limit) {
  const rows = await page.locator(RESULT_ROW_SELECTORS.join(", ")).evaluateAll(
    (elements, input) => {
      const normalizedKeyword = input.keyword.toLocaleLowerCase();
      const output = [];
      const seen = new Set();

      function textOf(element, selectors) {
        for (const selector of selectors) {
          const match = element.querySelector(selector);
          const text = match?.textContent?.replace(/\s+/g, " ").trim();
          if (text) return text;
        }
        return "";
      }

      function hrefOf(element) {
        const anchors = [
          element.matches("a[href]") ? element : null,
          element.closest("a[href]"),
          element.querySelector("a[href]")
        ].filter(Boolean);

        for (const anchor of anchors) {
          const rawHref = anchor.getAttribute("href")?.trim();
          if (!rawHref) continue;
          try {
            const url = new URL(rawHref, window.location.href);
            if (["http:", "https:"].includes(url.protocol)) return url.href;
          } catch {
            // Ignore malformed DOM href values.
          }
        }
        return "";
      }

      for (const element of elements) {
        if (output.length >= input.limit) break;
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        if (
          style.display === "none" ||
          style.visibility === "hidden" ||
          rect.width === 0 ||
          rect.height === 0
        ) continue;

        const fullText = element.textContent?.replace(/\s+/g, " ").trim() || "";
        if (!fullText.toLocaleLowerCase().includes(normalizedKeyword)) continue;

        const chat = textOf(element, [
          ".row-title .peer-title",
          ".dialog-title .peer-title",
          ".peer-title",
          ".dialog-title",
          ".title",
          '[class*="title"]'
        ]);
        const author = textOf(element, [
          ".dialog-subtitle-span:not(.dialog-subtitle-span-last) .peer-title",
          ".dialog-subtitle-span:not(.dialog-subtitle-span-last)",
          ".sender-title",
          '[class*="sender"]',
          '[class*="author"]'
        ]);
        const message = textOf(element, [
          ".dialog-subtitle-span-last",
          ".message",
          ".subtitle",
          ".row-subtitle",
          '[class*="message"]',
          '[class*="subtitle"]'
        ]) || fullText;
        const timestamp = textOf(element, [
          ".message-time",
          "time",
          ".time",
          '[class*="time"]'
        ]);
        const messageId =
          element.getAttribute("data-mid") ||
          element.getAttribute("data-message-id") ||
          element.querySelector("[data-mid]")?.getAttribute("data-mid") ||
          "";
        const peerId =
          element.getAttribute("data-peer-id") ||
          element.querySelector("[data-peer-id]")?.getAttribute("data-peer-id") ||
          "";
        const messageUrl = hrefOf(element);
        const signature = [
          chat,
          author,
          message,
          timestamp,
          messageId,
          peerId,
          messageUrl
        ].join("\n");
        if (seen.has(signature)) continue;
        seen.add(signature);

        output.push({
          chat,
          author,
          text: message,
          timestamp,
          messageId,
          peerId,
          messageUrl
        });
      }

      return output;
    },
    { keyword, limit }
  );

  return rows
    .filter((row) => containsKeyword(row.text, keyword) || containsKeyword(
      `${row.chat} ${row.author} ${row.text}`,
      keyword
    ))
    .map((row) => ({
      platform: "Telegram",
      keyword,
      chat: normalizeText(row.chat),
      author: normalizeText(row.author),
      text: normalizeText(row.text),
      timestamp: normalizeText(row.timestamp),
      messageId: normalizeText(row.messageId),
      peerId: normalizeText(row.peerId),
      messageUrl: normalizeText(row.messageUrl),
      observedAt: new Date().toISOString()
    }));
}

function chatIsAllowed(chat, allowedChats) {
  const normalized = normalizeText(chat).toLocaleLowerCase();
  return allowedChats.some((allowed) => normalized.includes(
    normalizeText(allowed).toLocaleLowerCase()
  ));
}

function recentSourcesForAllowedChats(allowedChats) {
  return RECENT_CHAT_SOURCES.filter((source) => chatIsAllowed(
    source.chat,
    allowedChats
  ));
}

async function extractVisibleChatMessages(page, source, limit) {
  return page.evaluate(
    ({ source, limit }) => {
      function clean(value) {
        return String(value || "").replace(/\s+/g, " ").trim();
      }

      function textOf(element, selectors) {
        for (const selector of selectors) {
          const match = element.querySelector(selector);
          const text = clean(match?.textContent);
          if (text) return text;
        }
        return "";
      }

      function messageUrlOf(element) {
        const anchor = element.closest("a[href]") || element.querySelector("a[href]");
        const rawHref = anchor?.getAttribute("href")?.trim();
        if (rawHref) {
          try {
            return new URL(rawHref, window.location.href).href;
          } catch {
            // Keep the chat-level URL fallback below.
          }
        }
        return `https://web.telegram.org/k/#${source.peerId}`;
      }

      function visible(element) {
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== "none"
          && style.visibility !== "hidden"
          && rect.width > 0
          && rect.height > 0;
      }

      function messageText(element, timestamp, author) {
        const clone = element.cloneNode(true);
        for (const selector of [
          ".time",
          ".time-inner",
          "time",
          "[class*=time]",
          ".reactions",
          "[class*=reaction]",
          ".bubble-name",
          ".peer-title",
          ".sender-title",
          "[class*=author]"
        ]) {
          for (const match of clone.querySelectorAll(selector)) match.remove();
        }
        let text = clean(clone.innerText || clone.textContent);
        for (const value of [timestamp, author]) {
          if (!value) continue;
          text = clean(text.replace(value, " "));
        }
        return text;
      }

      const elements = [
        ...document.querySelectorAll([
          ".bubbles .bubble",
          ".bubble[data-mid]",
          ".bubble",
          "[data-mid]",
          "[data-message-id]",
          "[class*='bubble']",
          "[class*='message']"
        ].join(", "))
      ];
      const rows = [];
      const seen = new Set();

      for (const element of elements) {
        if (!visible(element)) continue;
        const timestamp = textOf(element, [
          ".time-inner",
          ".message-time",
          ".time",
          "time",
          "[class*=time]"
        ]);
        const author = textOf(element, [
          ".bubble-name",
          ".peer-title",
          ".sender-title",
          "[class*=sender]",
          "[class*=author]"
        ]);
        const text = messageText(element, timestamp, author);
        if (!text || text.length < 3 || text.length > 800) continue;
        if (/^(edited|reply|forwarded|view in channel)$/i.test(text)) continue;
        const messageId =
          element.getAttribute("data-mid")
          || element.getAttribute("data-message-id")
          || element.querySelector("[data-mid]")?.getAttribute("data-mid")
          || "";
        const key = messageId || `${timestamp}\n${author}\n${text.slice(0, 160)}`;
        if (seen.has(key)) continue;
        seen.add(key);
        rows.push({
          platform: "Telegram",
          keyword: "__recent__",
          chat: source.chat,
          author,
          text,
          timestamp,
          messageId,
          peerId: source.peerId,
          messageUrl: messageUrlOf(element),
          observedAt: new Date().toISOString(),
          collectionSource: "recent-chat"
        });
      }

      return rows.slice(-limit);
    },
    { source, limit }
  );
}

async function inspectRecentChatDom(page, source) {
  return page.evaluate((source) => {
    const selectors = [
      ".bubbles .bubble",
      ".bubble",
      "[data-mid]",
      "[data-message-id]",
      "[class*='bubble']",
      "[class*='message']",
      ".chat-input",
      "[contenteditable='true']"
    ];
    const selectorCounts = Object.fromEntries(
      selectors.map((selector) => [selector, document.querySelectorAll(selector).length])
    );
    const bodyText = String(document.body?.innerText || "")
      .replace(/\s+/g, " ")
      .trim();

    return {
      source: source.chat,
      url: window.location.href,
      title: document.title,
      selectorCounts,
      bodyPreview: bodyText.slice(0, 260)
    };
  }, source).catch((error) => ({
    source: source.chat,
    url: page.url(),
    title: "",
    selectorCounts: {},
    bodyPreview: "",
    error: error.message
  }));
}

async function openRecentChatByPeerUrl(page, source, settings) {
  await page.goto(`https://web.telegram.org/k/#${source.peerId}`, {
    waitUntil: "domcontentloaded",
    timeout: 30_000
  });
  await page.waitForTimeout(settings.recentChatSettleMs);
  return {
    finalUrl: page.url(),
    finalTitle: await page.title().catch(() => ""),
    openMethod: "peer-url-fallback"
  };
}

async function openRecentChat(page, source, settings) {
  await page.goto(settings.telegramUrl, {
    waitUntil: "domcontentloaded",
    timeout: 30_000
  }).catch(() => {});
  await page.waitForTimeout(settings.recentChatSettleMs);
  await page.keyboard.press("Escape").catch(() => {});
  const search = await firstVisibleLocator(page, SEARCH_INPUT_SELECTORS);
  if (!search) {
    return openRecentChatByPeerUrl(page, source, settings);
  }
  await clearAndFill(search, source.chat);
  await page.waitForTimeout(settings.searchSettleMs);

  const aliases = [source.chat, ...(source.aliases || [])]
    .map((alias) => normalizeText(alias).toLocaleLowerCase())
    .filter(Boolean);
  const rows = page.locator([
    ".chatlist-chat",
    ".search-super-container .row",
    ".search-results .row",
    ".row",
    "[data-peer-id]"
  ].join(", "));
  const count = await rows.count();
  for (let index = 0; index < count; index += 1) {
    const row = rows.nth(index);
    if (!await visible(row)) continue;
    const text = normalizeText(await row.innerText().catch(() => ""));
    const normalized = text.toLocaleLowerCase();
    if (aliases.some((alias) => normalized.includes(alias))) {
      await row.evaluate((element) => {
        const target = element.closest(
          ".selector-user, .chatlist-chat, .row, a[href], [data-peer-id]"
        ) || element;
        target.click();
      });
      await page.waitForTimeout(settings.recentChatSettleMs);
      return {
        finalUrl: page.url(),
        finalTitle: await page.title().catch(() => ""),
        openMethod: "chat-search"
      };
    }
  }

  throw new Error(`Recent chat source was not found in Telegram search: ${source.chat}`);
}

export async function launchTelegram(options = {}) {
  const settings = { ...DEFAULTS, ...options };
  const lease = await acquireProfileLease(settings.profileDir, {
    owner: "Run HUD",
    timeoutMs: settings.loginTimeoutMs
  });
  let context;
  try {
    context = await chromium.launchPersistentContext(settings.profileDir, {
      headless: settings.headless,
      viewport: { width: 1440, height: 960 },
      locale: "en-US",
      timezoneId: settings.watchTimeZone
    });
    context.once("close", () => {
      lease.release().catch(() => {});
    });
    const pages = context.pages();
    const page = pages[0] || await context.newPage();

    await page.goto(settings.telegramUrl, {
      waitUntil: "domcontentloaded",
      timeout: 45_000
    });
    await waitForLogin(page, settings.loginTimeoutMs);

    return { context, page, settings };
  } catch (error) {
    await context?.close().catch(() => {});
    await lease.release().catch(() => {});
    throw error;
  }
}

export async function collectKeywords(page, keywords, options = {}) {
  const settings = { ...DEFAULTS, ...options };
  const allowedChats = settings.allowedChats || allowedChatsFromEnvironment();
  if (!allowedChats.length) {
    throw new Error("At least one allowed Telegram group must be configured.");
  }
  const search = await firstVisibleLocator(page, SEARCH_INPUT_SELECTORS);
  if (!search) {
    throw new Error("Telegram search input was not found in the logged-in page.");
  }

  const results = [];
  const keywordRuns = [];

  async function collectKeyword(keyword) {
    const startedAt = new Date().toISOString();
    await clearAndFill(search, keyword);
    await page.waitForTimeout(settings.searchSettleMs);
    await exposeMessageResults(page);
    await page.waitForTimeout(400);

    const extracted = await extractVisibleResults(
      page,
      keyword,
      settings.maxResultsPerKeyword
    );
    const matches = extracted.filter((result) => chatIsAllowed(
      result.chat,
      allowedChats
    ));
    return {
      startedAt,
      matches
    };
  }

  for (const keyword of keywords) {
    let startedAt = new Date().toISOString();
    try {
      const collected = await Promise.race([
        collectKeyword(keyword),
        new Promise((_, reject) => setTimeout(
          () => reject(new Error(`Keyword timed out after ${settings.keywordTimeoutMs}ms`)),
          settings.keywordTimeoutMs
        ))
      ]);
      startedAt = collected.startedAt;
      results.push(...collected.matches);
      keywordRuns.push({
        keyword,
        startedAt,
        completedAt: new Date().toISOString(),
        resultCount: collected.matches.length,
        status: "completed"
      });
    } catch (error) {
      keywordRuns.push({
        keyword,
        startedAt,
        completedAt: new Date().toISOString(),
        resultCount: 0,
        status: "skipped",
        error: error.message
      });
      await page.keyboard.press("Escape").catch(() => {});
    }
  }

  await clearAndFill(search, "");

  return {
    results: deduplicateResults(results),
    keywordRuns,
    allowedChats
  };
}

export async function collectRecentMessages(page, options = {}) {
  const settings = { ...DEFAULTS, ...options };
  const allowedChats = settings.allowedChats || allowedChatsFromEnvironment();
  const sources = recentSourcesForAllowedChats(allowedChats);
  const results = [];
  const recentRuns = [];

  for (const source of sources) {
    const startedAt = new Date().toISOString();
    try {
      const opened = await openRecentChat(page, source, settings);
      let matches = await extractVisibleChatMessages(
        page,
        source,
        settings.maxRecentMessagesPerChat
      );
      let finalOpen = opened;
      if (matches.length === 0 && opened.openMethod === "chat-search") {
        finalOpen = await openRecentChatByPeerUrl(page, source, settings);
        matches = await extractVisibleChatMessages(
          page,
          source,
          settings.maxRecentMessagesPerChat
        );
      }
      const proof = await inspectRecentChatDom(page, source);
      results.push(...matches);
      recentRuns.push({
        chat: source.chat,
        peerId: source.peerId,
        startedAt,
        completedAt: new Date().toISOString(),
        resultCount: matches.length,
        status: matches.length > 0 ? "completed" : "collector_failed",
        finalUrl: finalOpen.finalUrl,
        finalTitle: finalOpen.finalTitle,
        openMethod: finalOpen.openMethod,
        proof,
        error: matches.length > 0
          ? undefined
          : "Recent chat opened, but no visible Telegram message DOM was extracted."
      });
    } catch (error) {
      recentRuns.push({
        chat: source.chat,
        peerId: source.peerId,
        startedAt,
        completedAt: new Date().toISOString(),
        resultCount: 0,
        status: "skipped",
        error: error.message
      });
    }
  }

  await page.goto(settings.telegramUrl, {
    waitUntil: "domcontentloaded",
    timeout: 30_000
  }).catch(() => {});

  return {
    results: deduplicateResults(results),
    recentRuns,
    allowedChats
  };
}
