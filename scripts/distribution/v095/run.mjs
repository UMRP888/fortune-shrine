#!/usr/bin/env node
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { writeJsonAtomic, writeTextAtomic } from "../lib.mjs";
import {
  buildOperationalAnalytics,
  renderOperationsReport
} from "./analytics.mjs";
import {
  auditBlessingCorpus,
  renderCorpusAudit
} from "./corpus-audit.mjs";

const directory = path.dirname(fileURLToPath(import.meta.url));
const distributionDirectory = path.resolve(directory, "..");
const projectDirectory = path.resolve(distributionDirectory, "..", "..");
const outputDirectory = path.join(directory, "output");

async function main() {
  await mkdir(outputDirectory, { recursive: true });
  const analytics = await buildOperationalAnalytics({
    searchHistoryPath: path.join(distributionDirectory, "v08", "state", "搜索历史.json"),
    sentHistoryPath: path.join(distributionDirectory, "v08", "state", "sent-history.json"),
    sawPath: path.join(distributionDirectory, "v08", "state", "saw.json"),
    outputDirectory: path.join(distributionDirectory, "v08", "output")
  });
  const corpusAudit = await auditBlessingCorpus(
    path.join(projectDirectory, "docs", "blessing-corpus-v2.json")
  );

  const files = {
    analyticsJson: path.join(outputDirectory, "operations-analytics.json"),
    operationsReport: path.join(outputDirectory, "OPERATIONS_DASHBOARD.md"),
    corpusAuditJson: path.join(outputDirectory, "blessing-corpus-audit.json"),
    corpusAuditReport: path.join(outputDirectory, "BLESSING_CORPUS_AUDIT.md")
  };
  await Promise.all([
    writeJsonAtomic(files.analyticsJson, analytics),
    writeTextAtomic(files.operationsReport, renderOperationsReport(analytics)),
    writeJsonAtomic(files.corpusAuditJson, corpusAudit),
    writeTextAtomic(files.corpusAuditReport, renderCorpusAudit(corpusAudit))
  ]);
  process.stdout.write(`${JSON.stringify({
    version: "0.95",
    generatedAt: analytics.generatedAt,
    files,
    operations: analytics.operations,
    sourceCounts: analytics.sources.counts,
    corpusAudit: corpusAudit.summary
  }, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
