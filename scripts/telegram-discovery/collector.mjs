import { chromium } from "playwright";
import {
  allowedChatsFromEnvironment,
  DEFAULTS,
  RESULT_ROW_SELECTORS,
  SEARCH_INPUT_SELECTORS
} from "./config.mjs";
import { containsKeyword, deduplicateResults, normalizeText } from "./lib.mjs";

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
          ".peer-title",
          ".dialog-title",
          ".title",
          '[class*="title"]'
        ]);
        const author = textOf(element, [
          ".sender-title",
          ".peer-title",
          '[class*="sender"]',
          '[class*="author"]'
        ]);
        const message = textOf(element, [
          ".message",
          ".subtitle",
          ".row-subtitle",
          '[class*="message"]',
          '[class*="subtitle"]'
        ]) || fullText;
        const timestamp = textOf(element, [
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
        const signature = [chat, author, message, timestamp, messageId, peerId].join("\n");
        if (seen.has(signature)) continue;
        seen.add(signature);

        output.push({ chat, author, text: message, timestamp, messageId, peerId });
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
      observedAt: new Date().toISOString()
    }));
}

function chatIsAllowed(chat, allowedChats) {
  const normalized = normalizeText(chat).toLocaleLowerCase();
  return allowedChats.some((allowed) => normalized.includes(
    normalizeText(allowed).toLocaleLowerCase()
  ));
}

export async function launchTelegram(options = {}) {
  const settings = { ...DEFAULTS, ...options };
  const context = await chromium.launchPersistentContext(settings.profileDir, {
    headless: settings.headless,
    viewport: { width: 1440, height: 960 },
    locale: "en-US"
  });
  try {
    const pages = context.pages();
    const page = pages[0] || await context.newPage();

    await page.goto(settings.telegramUrl, {
      waitUntil: "domcontentloaded",
      timeout: 45_000
    });
    await waitForLogin(page, settings.loginTimeoutMs);

    return { context, page, settings };
  } catch (error) {
    await context.close().catch(() => {});
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

  for (const keyword of keywords) {
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
    results.push(...matches);
    keywordRuns.push({
      keyword,
      startedAt,
      completedAt: new Date().toISOString(),
      resultCount: matches.length
    });
  }

  await clearAndFill(search, "");

  return {
    results: deduplicateResults(results),
    keywordRuns,
    allowedChats
  };
}
