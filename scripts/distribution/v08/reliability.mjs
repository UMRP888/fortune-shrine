import { readFile } from "node:fs/promises";
import { writeJsonAtomic, writeTextAtomic } from "../lib.mjs";

const HISTORY_VERSION = "0.9";
const MAX_HISTORY_RECORDS = 5_000;

function errorChain(error) {
  const values = [];
  let current = error;
  while (current && !values.includes(current)) {
    values.push(current);
    current = current.cause;
  }
  return values;
}

export function classifySearchError(error) {
  const chain = errorChain(error);
  const text = chain
    .flatMap((item) => [item?.message, item?.stderr, item?.code])
    .filter(Boolean)
    .join("\n");
  const status = chain.find((item) => Number(item?.status))?.status || null;

  if (/Failed to connect to 127\.0\.0\.1|ECONNREFUSED/i.test(text)) {
    return { category: "proxy_unavailable", reason: "Configured local proxy was unavailable.", status };
  }
  if (/timed out|timeout|AbortError|ABORT_ERR|curl: \(28\)/i.test(text)) {
    return { category: "timeout", reason: "The upstream request exceeded its time limit.", status };
  }
  if (/Could not resolve host|ENOTFOUND|EAI_AGAIN|getaddrinfo/i.test(text)) {
    return { category: "dns", reason: "The upstream hostname could not be resolved.", status };
  }
  if (status === 401) return { category: "unauthorized", reason: "The upstream rejected authentication.", status };
  if (status === 403) return { category: "forbidden", reason: "The upstream denied this request.", status };
  if (status === 429) return { category: "rate_limited", reason: "The upstream rate limit was reached.", status };
  if (status >= 500) return { category: "upstream_error", reason: `The upstream returned HTTP ${status}.`, status };
  if (/INVALID_JSON|Invalid JSON|Unexpected token/i.test(text)) {
    return { category: "invalid_response", reason: "The upstream response was not valid JSON.", status };
  }
  if (/selector|contenteditable|DOM|Playwright|browser/i.test(text)) {
    return { category: "page_extraction", reason: "The public page could not be extracted.", status };
  }
  if (/fetch failed|ECONNRESET|socket|network/i.test(text)) {
    return { category: "network", reason: "The network request failed before a valid response arrived.", status };
  }
  return { category: "unknown", reason: error?.message || "Unknown search failure.", status };
}

export function sourceRunRecord({
  runId,
  source,
  searchMethod = null,
  startedAt,
  completedAt = new Date().toISOString(),
  candidateCount = 0,
  evidenceCount = 0,
  error = null
}) {
  const durationMs = Math.max(0, Date.parse(completedAt) - Date.parse(startedAt));
  if (error) {
    const classified = classifySearchError(error);
    return {
      runId,
      timestamp: startedAt,
      completedAt,
      source,
      searchMethod,
      status: "failed",
      result: "search_failed",
      errorCategory: classified.category,
      errorReason: classified.reason,
      httpStatus: classified.status,
      candidateCount: 0,
      evidenceCount,
      durationMs
    };
  }
  return {
    runId,
    timestamp: startedAt,
    completedAt,
    source,
    searchMethod,
    status: "success",
    result: candidateCount > 0 ? "candidates_found" : "no_results",
    errorCategory: null,
    errorReason: null,
    httpStatus: null,
    candidateCount,
    evidenceCount,
    durationMs
  };
}

export async function readSearchHistory(filePath) {
  try {
    const payload = JSON.parse(await readFile(filePath, "utf8"));
    return {
      version: payload.version || HISTORY_VERSION,
      updatedAt: payload.updatedAt || null,
      runs: Array.isArray(payload.runs) ? payload.runs : []
    };
  } catch (error) {
    if (error.code === "ENOENT") {
      return { version: HISTORY_VERSION, updatedAt: null, runs: [] };
    }
    throw error;
  }
}

export async function appendSearchHistory(filePath, records) {
  const history = await readSearchHistory(filePath);
  history.version = HISTORY_VERSION;
  history.updatedAt = new Date().toISOString();
  history.runs.push(...records);
  if (history.runs.length > MAX_HISTORY_RECORDS) {
    history.runs = history.runs.slice(-MAX_HISTORY_RECORDS);
  }
  await writeJsonAtomic(filePath, history);
  return history;
}

export function summarizeSearchHealth(history, {
  now = Date.now(),
  windowHours = 24
} = {}) {
  const cutoff = now - windowHours * 60 * 60 * 1_000;
  const sourceRuns = history.runs
    .filter((run) => Date.parse(run.timestamp) >= cutoff)
    .sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));
  const grouped = new Map();
  for (const sourceRun of sourceRuns) {
    const group = grouped.get(sourceRun.runId) || [];
    group.push(sourceRun);
    grouped.set(sourceRun.runId, group);
  }
  const runs = [...grouped.entries()].map(([runId, sources]) => {
    const failedSources = sources.filter((run) => run.status === "failed");
    const candidateCount = sources.reduce(
      (sum, run) => sum + Number(run.candidateCount || 0),
      0
    );
    return {
      runId,
      timestamp: sources.map((run) => run.timestamp).sort()[0],
      completedAt: sources.map((run) => run.completedAt).sort().at(-1),
      status: failedSources.length ? "failed" : "success",
      result: failedSources.length
        ? "search_failed"
        : candidateCount > 0 ? "candidates_found" : "no_results",
      candidateCount,
      sourceCount: sources.length,
      failedSourceCount: failedSources.length
    };
  });
  const successful = runs.filter((run) => run.status === "success");
  const failed = runs.filter((run) => run.status === "failed");
  const noResults = successful.filter((run) => run.result === "no_results");
  const candidateTotal = successful.reduce((sum, run) => sum + run.candidateCount, 0);
  const bySource = {};

  for (const source of [...new Set(sourceRuns.map((run) => run.source))]) {
    const matchingRuns = sourceRuns.filter((run) => run.source === source);
    const sourceSuccessful = matchingRuns.filter((run) => run.status === "success");
    const sourceCandidates = sourceSuccessful.reduce(
      (sum, run) => sum + Number(run.candidateCount || 0),
      0
    );
    bySource[source] = {
      totalRuns: matchingRuns.length,
      successfulRuns: sourceSuccessful.length,
      failedRuns: matchingRuns.length - sourceSuccessful.length,
      noResultRuns: sourceSuccessful.filter((run) => run.result === "no_results").length,
      successRate: matchingRuns.length
        ? Number((sourceSuccessful.length / matchingRuns.length * 100).toFixed(1))
        : 0,
      averageCandidates: sourceSuccessful.length
        ? Number((sourceCandidates / sourceSuccessful.length).toFixed(2))
        : 0
    };
  }

  return {
    generatedAt: new Date(now).toISOString(),
    windowHours,
    totalRuns: runs.length,
    successfulRuns: successful.length,
    failedRuns: failed.length,
    noResultRuns: noResults.length,
    successRate: runs.length
      ? Number((successful.length / runs.length * 100).toFixed(1))
      : 0,
    averageCandidates: successful.length
      ? Number((candidateTotal / successful.length).toFixed(2))
      : 0,
    bySource,
    runs: sourceRuns
  };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function statusLabel(run) {
  if (run.status === "failed") return "搜索失败";
  if (run.result === "no_results") return "没有结果";
  return `成功，${run.candidateCount} 位候选`;
}

export function renderSearchHealthDashboard(summary) {
  const sourceCards = Object.entries(summary.bySource).map(([source, item]) => `
    <section class="card">
      <h2>${escapeHtml(source)}</h2>
      <p><strong>${item.successRate}%</strong> 成功率</p>
      <small>${item.successfulRuns} 成功 · ${item.failedRuns} 失败 · ${item.noResultRuns} 次没有结果</small>
    </section>
  `).join("");
  const rows = summary.runs.map((run) => `
    <tr class="${run.status === "failed" ? "failed" : run.result === "no_results" ? "empty" : "success"}">
      <td>${escapeHtml(new Date(run.timestamp).toLocaleString("zh-CN", { hour12: false }))}</td>
      <td>${escapeHtml(run.source)}</td>
      <td>${escapeHtml(statusLabel(run))}</td>
      <td>${escapeHtml(run.errorCategory || "—")}</td>
      <td>${escapeHtml(run.errorReason || "—")}</td>
      <td>${escapeHtml(run.durationMs)} ms</td>
    </tr>
  `).join("");

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Fortune Shrine Search Health</title>
  <style>
    :root { color-scheme: dark; font-family: ui-sans-serif, system-ui, sans-serif; }
    body { margin: 0; padding: 32px; background: #100d09; color: #eee4d2; }
    header, main { max-width: 1120px; margin: auto; }
    h1 { font-weight: 500; letter-spacing: .04em; }
    .summary, .sources { display: grid; grid-template-columns: repeat(auto-fit,minmax(170px,1fr)); gap: 12px; }
    .metric, .card { padding: 16px; border: 1px solid #4c3d29; background: #19140e; border-radius: 8px; }
    .metric strong, .card strong { display: block; font-size: 28px; color: #efc87f; }
    .sources { margin: 18px 0 28px; }
    table { width: 100%; border-collapse: collapse; background: #15110c; }
    th, td { padding: 10px; border-bottom: 1px solid #30271c; text-align: left; vertical-align: top; }
    th { color: #b9a98e; font-weight: 500; }
    .success td:nth-child(3) { color: #8fd5a6; }
    .empty td:nth-child(3) { color: #e3c276; }
    .failed td:nth-child(3), .failed td:nth-child(4) { color: #ef8f85; }
    small { color: #a99d8b; }
  </style>
</head>
<body>
  <header>
    <h1>Fortune Shrine · 搜索健康</h1>
    <p>最近 ${summary.windowHours} 小时 · 更新于 ${escapeHtml(summary.generatedAt)}</p>
    <div class="summary">
      <div class="metric"><strong>${summary.totalRuns}</strong><span>总运行次数</span></div>
      <div class="metric"><strong>${summary.successfulRuns}</strong><span>成功次数</span></div>
      <div class="metric"><strong>${summary.failedRuns}</strong><span>失败次数</span></div>
      <div class="metric"><strong>${summary.successRate}%</strong><span>成功率</span></div>
      <div class="metric"><strong>${summary.averageCandidates}</strong><span>平均候选数</span></div>
    </div>
  </header>
  <main>
    <div class="sources">${sourceCards}</div>
    <table>
      <thead><tr><th>时间</th><th>来源</th><th>结果</th><th>错误分类</th><th>原因</th><th>耗时</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="6">最近24小时暂无运行记录。</td></tr>'}</tbody>
    </table>
  </main>
</body>
</html>`;
}

export async function writeSearchHealth({
  history,
  summaryPath,
  dashboardPath,
  now = Date.now()
}) {
  const summary = summarizeSearchHealth(history, { now });
  await writeJsonAtomic(summaryPath, summary);
  await writeTextAtomic(dashboardPath, renderSearchHealthDashboard(summary));
  return summary;
}
