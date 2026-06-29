#!/usr/bin/env node
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DEFAULTS } from "./config.mjs";
import {
  canonicalIdentity,
  mergeCandidates,
  outputRows,
  readSeen,
  selectCandidates,
  toCsv,
  writeJsonAtomic,
  writeTextAtomic
} from "./lib.mjs";
import { discoverPolymarket } from "./sources/polymarket.mjs";
import { discoverX } from "./sources/x.mjs";
import { discoverXPublic } from "./sources/x-public.mjs";

const directory = path.dirname(fileURLToPath(import.meta.url));

function parseArguments(argv) {
  const values = {
    totalTarget: DEFAULTS.totalTarget,
    polymarketTarget: DEFAULTS.polymarketTarget,
    xTarget: DEFAULTS.xTarget,
    outputDir: path.join(directory, "output"),
    stateFile: path.join(directory, "state", "seen.json"),
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
    else if (argument === "--platforms") values.platforms = next.split(",").map((item) => item.trim().toLowerCase()), index += 1;
    else if (argument === "--dry-run") values.dryRun = true;
    else if (argument === "--help") values.help = true;
    else throw new Error(`Unknown argument: ${argument}`);
  }
  return values;
}

function usage() {
  return `Fortune Shrine Target Discovery Engine v1

Usage:
  node scripts/distribution/discover.mjs [options]

Options:
  --target 100
  --polymarket-target 50
  --x-target 50
  --platforms polymarket,x
  --output-dir <directory>
  --state-file <file>
  --dry-run
`;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(usage());
    return;
  }
  const startedAt = new Date().toISOString();
  const discovered = [];
  const evidence = [];
  const failures = [];

  if (options.platforms.includes("polymarket")) {
    try {
      const result = await discoverPolymarket();
      discovered.push(...result.candidates);
      evidence.push(...result.evidence);
    } catch (error) {
      failures.push({ platform: "Polymarket", error: error.message, status: error.status || null });
    }
  }
  if (options.platforms.includes("x")) {
    try {
      const result = process.env.X_BEARER_TOKEN
        ? await discoverX()
        : await discoverXPublic();
      discovered.push(...result.candidates);
      evidence.push(...result.evidence);
    } catch (error) {
      failures.push({ platform: "X", error: error.message, status: error.status || null });
    }
  }

  const seen = await readSeen(options.stateFile);
  const candidates = selectCandidates(mergeCandidates(discovered), { ...options, seen });
  const rows = outputRows(candidates);
  const stamp = startedAt.replaceAll(":", "-").replace(/\.\d{3}Z$/, "Z");
  const csvPath = path.join(options.outputDir, `fortune-shrine-targets-${stamp}.csv`);
  const latestPath = path.join(options.outputDir, "latest.csv");
  const manifestPath = path.join(options.outputDir, `run-${stamp}.json`);

  await mkdir(options.outputDir, { recursive: true });
  await writeTextAtomic(csvPath, toCsv(rows));
  await writeTextAtomic(latestPath, toCsv(rows));
  await writeJsonAtomic(manifestPath, {
    version: "1.0",
    startedAt,
    completedAt: new Date().toISOString(),
    requested: {
      total: options.totalTarget,
      polymarket: options.polymarketTarget,
      x: options.xTarget
    },
    resultCount: rows.length,
    platformBreakdown: {
      Polymarket: rows.filter((row) => row.平台 === "Polymarket").length,
      X: rows.filter((row) => row.平台 === "X").length
    },
    failures,
    evidence,
    csvPath
  });

  if (!options.dryRun) {
    for (const candidate of candidates) seen.add(canonicalIdentity(candidate));
    await writeJsonAtomic(options.stateFile, {
      updatedAt: new Date().toISOString(),
      seen: [...seen].sort()
    });
  }

  process.stdout.write(JSON.stringify({
    csv: csvPath,
    latest: latestPath,
    resultCount: rows.length,
    failures
  }, null, 2) + "\n");

  if (!rows.length && failures.length) process.exitCode = 2;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
