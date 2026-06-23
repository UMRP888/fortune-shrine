#!/usr/bin/env node
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { DEFAULTS, KEYWORDS } from "./config.mjs";
import { collectKeywords, launchTelegram } from "./collector.mjs";
import { mergeArchive, readJson, writeJsonAtomic } from "./lib.mjs";
import { enrichResult } from "./signal-engine.mjs";

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

  return { runPath, latestPath, archivePath };
}

async function executeCycle(page, options) {
  const startedAt = new Date().toISOString();
  const collection = await collectKeywords(page, KEYWORDS);
  const evaluated = collection.results
    .map(enrichResult)
    .filter((result) => result.score >= DEFAULTS.minimumScore)
    .sort((left, right) => right.score - left.score);
  const run = {
    version: "1.0-lite",
    source: "Telegram Web",
    mode: "keyword-search",
    scope: "configured-group-allowlist",
    startedAt,
    completedAt: new Date().toISOString(),
    keywords: KEYWORDS,
    allowedChats: collection.allowedChats,
    autoReply: false,
    aiAnalysis: false,
    autoSend: false,
    minimumScore: DEFAULTS.minimumScore,
    rawMatchCount: collection.results.length,
    resultCount: evaluated.length,
    keywordRuns: collection.keywordRuns,
    results: evaluated
  };
  const files = await persistRun(options.outputDir, run);

  process.stdout.write(`${JSON.stringify({
    completedAt: run.completedAt,
    resultCount: run.resultCount,
    nextRunInMinutes: options.mode === "watch"
      ? options.intervalMs / 60_000
      : null,
    files
  }, null, 2)}\n`);
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
    await session.context.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
