#!/usr/bin/env node
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DEFAULTS } from "../config.mjs";
import {
  canonicalIdentity,
  mergeCandidates,
  readSeen,
  writeJsonAtomic,
  writeTextAtomic
} from "../lib.mjs";
import { discoverPolymarket } from "../sources/polymarket.mjs";
import { discoverX } from "../sources/x.mjs";
import { discoverXPublic } from "../sources/x-public.mjs";
import { selectFreshCandidates } from "./freshness.mjs";
import { filterByMemory, readSaw, rememberProcessed } from "./memory.mjs";
import { outputFreshRows, toFreshCsv } from "./output.mjs";
import {
  appendSearchHistory,
  sourceRunRecord,
  writeSearchHealth
} from "./reliability.mjs";

const directory = path.dirname(fileURLToPath(import.meta.url));

function parseArguments(argv) {
  const values = {
    totalTarget: DEFAULTS.totalTarget,
    polymarketTarget: DEFAULTS.polymarketTarget,
    xTarget: DEFAULTS.xTarget,
    outputDir: path.join(directory, "output"),
    stateFile: path.join(directory, "state", "seen.json"),
    sawFile: path.join(directory, "state", "saw.json"),
    historyFile: path.join(directory, "state", "搜索历史.json"),
    platforms: ["polymarket", "x"],
    dryRun: false
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const next = argv[index + 1];
    if (argument === "--target") values.totalTarget = Number(next), index += 1;
    else if (argument === "--polymarket-target") values.polymarketTarget = Number(next), index += 1;
    else if (argument === "--x-target") values.xTarget = Number(next), index += 1;
    else if (argument === "--output-dir") values.outputDir = path.resolve(next), index += 1;
    else if (argument === "--state-file") values.stateFile = path.resolve(next), index += 1;
    else if (argument === "--saw-file") values.sawFile = path.resolve(next), index += 1;
    else if (argument === "--history-file") values.historyFile = path.resolve(next), index += 1;
    else if (argument === "--platforms") {
      values.platforms = next.split(",").map((item) => item.trim().toLowerCase());
      index += 1;
    } else if (argument === "--dry-run") values.dryRun = true;
    else throw new Error(`Unknown argument: ${argument}`);
  }
  return values;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const discoveredAt = new Date().toISOString();
  const discovered = [];
  const evidence = [];
  const failures = [];
  const sourceRecords = [];
  const runId = `shrine-search-${discoveredAt}`;

  if (options.platforms.includes("polymarket")) {
    const startedAt = new Date().toISOString();
    try {
      const result = await discoverPolymarket();
      discovered.push(...result.candidates);
      evidence.push(...result.evidence);
      sourceRecords.push(sourceRunRecord({
        runId,
        source: "Polymarket",
        searchMethod: "Gamma API",
        startedAt,
        candidateCount: result.candidates.length,
        evidenceCount: result.evidence.length
      }));
    } catch (error) {
      failures.push({ platform: "Polymarket", error: error.message, status: error.status || null });
      sourceRecords.push(sourceRunRecord({
        runId,
        source: "Polymarket",
        searchMethod: "Gamma API",
        startedAt,
        error
      }));
    }
  }

  if (options.platforms.includes("x")) {
    const startedAt = new Date().toISOString();
    const officialApi = Boolean(process.env.X_BEARER_TOKEN);
    try {
      const result = officialApi
        ? await discoverX()
        : await discoverXPublic();
      discovered.push(...result.candidates);
      evidence.push(...result.evidence);
      sourceRecords.push(sourceRunRecord({
        runId,
        source: "X",
        searchMethod: officialApi ? "X Recent Search API" : "Public index + public profiles",
        startedAt,
        candidateCount: result.candidates.length,
        evidenceCount: result.evidence.length
      }));
    } catch (error) {
      failures.push({ platform: "X", error: error.message, status: error.status || null });
      sourceRecords.push(sourceRunRecord({
        runId,
        source: "X",
        searchMethod: officialApi ? "X Recent Search API" : "Public index + public profiles",
        startedAt,
        error
      }));
    }
  }

  const seen = await readSeen(options.stateFile);
  const saw = await readSaw(options.sawFile);
  const memoryFiltered = filterByMemory(
    mergeCandidates(discovered),
    saw,
    Date.parse(discoveredAt)
  );
  const candidates = selectFreshCandidates(memoryFiltered, {
    ...options,
    discoveredAt,
    seen
  });
  const rows = outputFreshRows(candidates);
  const stamp = discoveredAt.replaceAll(":", "-").replace(/\.\d{3}Z$/, "Z");
  const csvPath = path.join(options.outputDir, `fresh-targets-${stamp}.csv`);
  const jsonPath = path.join(options.outputDir, `fresh-targets-${stamp}.json`);
  const latestCsvPath = path.join(options.outputDir, "latest.csv");
  const latestJsonPath = path.join(options.outputDir, "latest.json");
  const manifestPath = path.join(options.outputDir, `run-${stamp}.json`);
  const healthSummaryPath = path.join(options.outputDir, "search-health.json");
  const healthDashboardPath = path.join(options.outputDir, "search-health.html");

  await mkdir(options.outputDir, { recursive: true });
  await writeTextAtomic(csvPath, toFreshCsv(rows));
  await writeTextAtomic(latestCsvPath, toFreshCsv(rows));
  await writeJsonAtomic(jsonPath, rows);
  await writeJsonAtomic(latestJsonPath, rows);
  await writeJsonAtomic(manifestPath, {
    version: "0.8",
    ranking: "freshness_score desc, age_minutes asc, score desc",
    discoveredAt,
    completedAt: new Date().toISOString(),
    resultCount: rows.length,
    memoryFilteredCount: discovered.length - memoryFiltered.length,
    freshnessBreakdown: Object.fromEntries(
      ["S", "A", "B", "C", "D"].map((grade) => [
        grade,
        rows.filter((row) => row.freshness_score === grade).length
      ])
    ),
    failures,
    evidence,
    sourceRuns: sourceRecords,
    csvPath,
    jsonPath
  });
  const history = await appendSearchHistory(options.historyFile, sourceRecords);
  const health = await writeSearchHealth({
    history,
    summaryPath: healthSummaryPath,
    dashboardPath: healthDashboardPath
  });
  await rememberProcessed(options.sawFile, candidates, discoveredAt);

  if (!options.dryRun) {
    for (const candidate of candidates) seen.add(canonicalIdentity(candidate));
    await writeJsonAtomic(options.stateFile, {
      updatedAt: new Date().toISOString(),
      seen: [...seen].sort()
    });
  }

  process.stdout.write(JSON.stringify({
    csv: csvPath,
    json: jsonPath,
    latestCsv: latestCsvPath,
    latestJson: latestJsonPath,
    searchHistory: options.historyFile,
    healthSummary: healthSummaryPath,
    healthDashboard: healthDashboardPath,
    health: {
      totalRuns: health.totalRuns,
      successfulRuns: health.successfulRuns,
      failedRuns: health.failedRuns,
      successRate: health.successRate,
      averageCandidates: health.averageCandidates
    },
    resultCount: rows.length,
    failures
  }, null, 2) + "\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
