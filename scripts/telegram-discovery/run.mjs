#!/usr/bin/env node
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { DEFAULTS, KEYWORDS } from "./config.mjs";
import {
  collectKeywords,
  collectRecentMessages,
  launchTelegram
} from "./collector.mjs";
import { mergeArchive, readJson, writeJsonAtomic } from "./lib.mjs";
import { generateReplyQueue } from "./reply-queue.mjs";
import { buildReplyQueueV2 } from "./reply-queue-v2.mjs";
import { enrichResult } from "./signal-engine.mjs";
import { formatOperationHud } from "./operation-hud.mjs";
import {
  candidateIdentity,
  partitionQueueEligibility,
  queueDedupKey
} from "./queue-eligibility.mjs";

function parseArguments(argv) {
  const options = {
    mode: "once",
    headless: false,
    intervalMs: DEFAULTS.intervalMs,
    profileDir: DEFAULTS.profileDir,
    outputDir: DEFAULTS.outputDir,
    loginTimeoutMs: DEFAULTS.loginTimeoutMs
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const next = argv[index + 1];
    if (argument === "--once") options.mode = "once";
    else if (argument === "--watch") options.mode = "watch";
    else if (argument === "--login-only") options.mode = "login";
    else if (argument === "--headless") options.headless = true;
    else if (argument === "--interval-minutes") {
      options.intervalMs = Number(next) * 60 * 1000;
      index += 1;
    } else if (argument === "--profile-dir") {
      options.profileDir = path.resolve(next);
      index += 1;
    } else if (argument === "--output-dir") {
      options.outputDir = path.resolve(next);
      index += 1;
    } else if (argument === "--help") options.help = true;
    else throw new Error(`Unknown argument: ${argument}`);
  }

  if (!Number.isFinite(options.intervalMs) || options.intervalMs < 10_000) {
    throw new Error("--interval-minutes must produce an interval of at least 10 seconds.");
  }

  return options;
}

function usage() {
  return `Fortune Shrine Telegram Discovery Engine V1 Lite

Usage:
  npm run telegram:login
  npm run telegram:discover
  npm run telegram:watch

Options:
  --once
  --watch
  --login-only
  --headless
  --interval-minutes 10
  --profile-dir <directory>
  --output-dir <directory>
`;
}

function stamp(isoDate) {
  return isoDate.replaceAll(":", "-").replace(/\.\d{3}Z$/, "Z");
}

async function persistRun(outputDir, run) {
  await mkdir(outputDir, { recursive: true });
  const runPath = path.join(outputDir, `run-${stamp(run.startedAt)}.json`);
  const latestPath = path.join(outputDir, "latest.json");
  const archivePath = path.join(outputDir, "results.json");
  const archive = await readJson(archivePath, {
    version: "1.0-lite",
    updatedAt: null,
    results: []
  });
  const merged = mergeArchive(archive.results, run.results);
  await writeJsonAtomic(runPath, run);
  await writeJsonAtomic(latestPath, run);
  await writeJsonAtomic(archivePath, {
    version: "1.0-lite",
    updatedAt: run.completedAt,
    resultCount: merged.length,
    results: merged
  });

  return {
    runPath,
    latestPath,
    archivePath
  };
}

async function queueEligibility(outputDir, results, settings = {}) {
  const processedPath = path.join(outputDir, "processed_messages.json");
  const processed = await readJson(processedPath, null);
  const processedItems = processed?.items || [];
  const partition = partitionQueueEligibility(results, processedItems, {
    cooldownMs: settings.seenAgainCooldownMs,
    timeZone: settings.watchTimeZone,
    freshnessWindowMs: settings.freshnessWindowMs,
    freshnessFutureToleranceMs: settings.freshnessFutureToleranceMs
  });

  return {
    ...partition,
    processedPath,
    processedItems
  };
}

async function persistProcessedMessages(
  processedPath,
  existingItems,
  queuedItems,
  completedAt
) {
  const merged = new Map();
  for (const item of [...existingItems, ...queuedItems]) {
    const identity = candidateIdentity(item);
    const dedupKey = item.dedupKey || queueDedupKey(item);
    const existing = merged.get(identity);
    merged.set(identity, {
      identity,
      dedupKey,
      peerId: item.peerId || existing?.peerId || "",
      messageId: item.messageId || existing?.messageId || "",
      group: item.group || existing?.group || "",
      original: item.original || item.message || existing?.original || "",
      status: item.status || existing?.status || "processed",
      firstProcessedAt: existing?.firstProcessedAt || completedAt,
      lastProcessedAt: completedAt
    });
  }
  await writeJsonAtomic(processedPath, {
    version: "1.0",
    updatedAt: completedAt,
    itemCount: merged.size,
    items: [...merged.values()]
  });
}

function timeoutAfter(milliseconds, message) {
  return new Promise((_, reject) => setTimeout(
    () => reject(new Error(message)),
    milliseconds
  ));
}

async function closeContextSafely(context, timeoutMs) {
  await Promise.race([
    context.close(),
    timeoutAfter(timeoutMs, `Telegram context close timed out after ${timeoutMs}ms.`)
  ]).catch((error) => {
    process.stderr.write(`${JSON.stringify({
      warningAt: new Date().toISOString(),
      warning: error.message
    })}\n`);
  });
}

async function executeCycle(page, options) {
  const startedAt = new Date().toISOString();
  const settings = { ...DEFAULTS, ...options };
  let searchCollection;
  try {
    searchCollection = await Promise.race([
      collectKeywords(page, KEYWORDS, settings),
      timeoutAfter(
        settings.cycleTimeoutMs,
        `Keyword discovery cycle timed out after ${settings.cycleTimeoutMs}ms before queue writer.`
      )
    ]);
  } catch (error) {
    searchCollection = {
      results: [],
      allowedChats: [],
      keywordRuns: [{
        keyword: "*",
        startedAt,
        completedAt: new Date().toISOString(),
        resultCount: 0,
        status: "skipped",
        error: error.message
      }],
      selfHealing: {
        type: "Discovery Block",
        action: "skip current discovery batch and continue queue writer"
      }
    };
  }
  let recentCollection;
  try {
    recentCollection = await Promise.race([
      collectRecentMessages(page, {
        ...settings,
        allowedChats: searchCollection.allowedChats?.length
          ? searchCollection.allowedChats
          : settings.allowedChats
      }),
      timeoutAfter(
        settings.cycleTimeoutMs,
        `Recent chat discovery cycle timed out after ${settings.cycleTimeoutMs}ms before queue writer.`
      )
    ]);
  } catch (error) {
    recentCollection = {
      results: [],
      allowedChats: searchCollection.allowedChats || [],
      recentRuns: [{
        chat: "*",
        startedAt,
        completedAt: new Date().toISOString(),
        resultCount: 0,
        status: "skipped",
        error: error.message
      }],
      selfHealing: {
        type: "Recent Chat Discovery Block",
        action: "skip current recent batch and continue queue writer"
      }
    };
  }
  const combinedResults = mergeArchive(
    searchCollection.results,
    recentCollection.results
  );
  const selfHealing = [
    searchCollection.selfHealing,
    recentCollection.selfHealing
  ].filter(Boolean);
  const evaluated = combinedResults
    .map(enrichResult)
    .filter((result) => result.score >= DEFAULTS.minimumScore)
    .sort((left, right) => right.score - left.score);
  const run = {
    version: "1.0-lite",
    source: "Telegram Web",
    mode: "keyword-search-plus-recent-chat",
    scope: "configured-group-allowlist",
    startedAt,
    completedAt: new Date().toISOString(),
    keywords: KEYWORDS,
    allowedChats: searchCollection.allowedChats?.length
      ? searchCollection.allowedChats
      : recentCollection.allowedChats,
    autoReply: false,
    aiAnalysis: false,
    autoSend: false,
    minimumScore: DEFAULTS.minimumScore,
    rawMatchCount: combinedResults.length,
    resultCount: evaluated.length,
    keywordRuns: searchCollection.keywordRuns,
    recentRuns: recentCollection.recentRuns,
    selfHealing: selfHealing.length ? selfHealing : null,
    results: evaluated
  };
  const eligibility = await queueEligibility(options.outputDir, run.results, settings);
  const files = await persistRun(options.outputDir, run);
  const queueRun = {
    ...run,
    resultCount: eligibility.queueResults.length,
    results: eligibility.queueResults.map((result) => ({
      ...result,
      dedupKey: queueDedupKey(result)
    }))
  };
  const {
    generatedQueue,
    generatedTopQueue
  } = await Promise.race([
    (async () => {
      const generatedQueue = await generateReplyQueue(
        queueRun,
        options.outputDir,
        files.latestPath,
        { persistQueue: false }
      );
      const generatedTopQueue = await buildReplyQueueV2({
        outputDir: options.outputDir,
        sourcePayload: generatedQueue.payload
      });
      return { generatedQueue, generatedTopQueue };
    })(),
    timeoutAfter(
      settings.writerTimeoutMs,
      `Writer Deadlock: Queue Writer v2 timed out after ${settings.writerTimeoutMs}ms.`
    )
  ]);
  const queue = generatedQueue.payload;
  const topQueue = generatedTopQueue.payload;

  if (
    queue.sourceRun.completedAt !== run.completedAt
    || (
      topQueue.sourceRun.completedAt !== run.completedAt
      && !topQueue.preservedFromPreviousRun
    )
  ) {
    throw new Error("Pipeline Failed: queue data source does not match latest HUD run.");
  }
  const verifiableCandidates = queue.items.filter((item) => item.messageUrl).length;
  const verifiableTopQueue = topQueue.queue.filter((item) => item.originalUrl).length;
  if (topQueue.queue.length > 0 && verifiableTopQueue === 0) {
    throw new Error(
      "Pipeline Failed: Reply Queue Top10 contains no DOM-derived original message URLs."
    );
  }
  process.stdout.write(formatOperationHud({
    run,
    queue,
    topQueue,
    freshCandidateCount: eligibility.freshResults.length,
    seenAgainCount: eligibility.seenAgainResults.length
  }));
}

async function sleep(milliseconds) {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(usage());
    return;
  }

  const session = await launchTelegram(options);
  let stopping = false;
  const stop = () => {
    stopping = true;
  };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);

  try {
    if (options.mode === "login") {
      process.stdout.write("Telegram login profile is ready.\n");
      return;
    }

    do {
      try {
        await executeCycle(session.page, options);
      } catch (error) {
        process.stderr.write(`${JSON.stringify({
          failedAt: new Date().toISOString(),
          error: error.message
        })}\n`);
        if (options.mode !== "watch") throw error;
      }

      if (options.mode !== "watch" || stopping) break;
      await sleep(options.intervalMs);
    } while (!stopping);
  } finally {
    await closeContextSafely(session.context, options.shutdownTimeoutMs || DEFAULTS.shutdownTimeoutMs);
  }
}

main().then(() => {
  if (process.argv.includes("--once")) process.exit(0);
}).catch((error) => {
  console.error(error);
  if (process.argv.includes("--once")) process.exit(1);
  process.exitCode = 1;
});
