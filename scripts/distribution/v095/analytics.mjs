import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const DAY_MS = 24 * 60 * 60 * 1_000;
const STOP_WORDS = new Set([
  "a", "about", "after", "again", "against", "all", "also", "am", "an", "and",
  "any", "are", "as", "at", "be", "because", "been", "before", "being", "both",
  "but", "by", "can", "could", "did", "do", "does", "doing", "don", "down",
  "during", "each", "few", "for", "from", "further", "get", "got", "had", "has",
  "have", "having", "he", "her", "here", "hers", "herself", "him", "himself",
  "his", "how", "i", "if", "in", "into", "is", "it", "its", "itself", "just",
  "me", "more", "most", "my", "myself", "no", "nor", "not", "now", "of", "off",
  "on", "once", "only", "or", "other", "our", "ours", "ourselves", "out", "over",
  "own", "same", "she", "should", "so", "some", "such", "than", "that", "the",
  "their", "theirs", "them", "themselves", "then", "there", "these", "they",
  "this", "those", "through", "to", "too", "under", "until", "up", "very", "was",
  "we", "were", "what", "when", "where", "which", "while", "who", "whom", "why",
  "will", "with", "would", "you", "your", "yours", "yourself", "yourselves",
  "https", "http", "co", "t", "com", "rt", "th", "amp", "vs", "de"
]);

export const HIGH_VALUE_TERMS = [
  "lost",
  "loss",
  "all in",
  "waiting",
  "wait",
  "hope",
  "prediction",
  "risk",
  "regret",
  "liquidated",
  "liquidation",
  "nervous",
  "afraid",
  "uncertain",
  "uncertainty",
  "wish",
  "luck",
  "pray",
  "bet",
  "trade",
  "leverage",
  "result",
  "resolution"
];

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return fallback;
    throw error;
  }
}

function dateKey(value, timeZone = "America/Los_Angeles") {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function recentDateKeys(days, now, timeZone) {
  return Array.from({ length: days }, (_, index) =>
    dateKey(now - (days - 1 - index) * DAY_MS, timeZone)
  );
}

function countBy(items, getKey) {
  const counts = {};
  for (const item of items) {
    const key = getKey(item);
    if (!key) continue;
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

function percentage(part, total) {
  return total ? Number((part / total * 100).toFixed(1)) : 0;
}

function tokensFor(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .match(/[a-z][a-z'-]{1,30}/g) || [];
}

function sourceText(row) {
  return String(row["最近的帖子"] || row.latest_post || row.text || "")
    .replace(/\[\d{4}-\d{2}-\d{2}T[^\]]+\]\s*/g, " ")
    .replace(/\s*\|\|\s*/g, " ")
    .trim();
}

function rankCounts(map, limit) {
  return [...map.entries()]
    .map(([term, count]) => ({ term, count }))
    .sort((a, b) => b.count - a.count || a.term.localeCompare(b.term))
    .slice(0, limit);
}

export async function loadQueueRuns(outputDirectory) {
  let names = [];
  try {
    names = await readdir(outputDirectory);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  const files = names
    .filter((name) => /^fresh-targets-.*\.json$/.test(name))
    .sort();
  const runs = [];
  for (const name of files) {
    const filePath = path.join(outputDirectory, name);
    const rows = await readJson(filePath, []);
    if (!Array.isArray(rows)) continue;
    const discoveredAt = rows[0]?.discovered_at
      || name.match(/^fresh-targets-(.+)\.json$/)?.[1]?.replace(
        /^(\d{4}-\d{2}-\d{2}T\d{2})-(\d{2})-(\d{2})Z$/,
        "$1:$2:$3Z"
      )
      || null;
    runs.push({ name, filePath, discoveredAt, rows });
  }
  return runs;
}

export async function loadSearchManifests(outputDirectory) {
  let names = [];
  try {
    names = await readdir(outputDirectory);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  const manifests = [];
  for (const name of names.filter((item) => /^run-.*\.json$/.test(item)).sort()) {
    const payload = await readJson(path.join(outputDirectory, name), null);
    if (!payload?.discoveredAt) continue;
    manifests.push({
      name,
      runId: payload.sourceRuns?.[0]?.runId || `legacy:${payload.discoveredAt}`,
      discoveredAt: payload.discoveredAt,
      completedAt: payload.completedAt || null,
      resultCount: Number(payload.resultCount || 0),
      failed: Array.isArray(payload.failures) && payload.failures.length > 0,
      sourceRuns: Array.isArray(payload.sourceRuns) ? payload.sourceRuns : []
    });
  }
  return manifests;
}

export function analyzeKeywords(rows, { keywordLimit = 30, phraseLimit = 30 } = {}) {
  const uniqueByPost = new Map();
  rows.forEach((row, index) => {
    const key = row.post_id || row.post_url || `${row["平台"]}:${row["用户名"]}:${index}`;
    if (!uniqueByPost.has(key)) uniqueByPost.set(key, row);
  });
  const uniqueRows = [...uniqueByPost.values()];
  const keywordCounts = new Map();
  const phraseCounts = new Map();
  const highValueCounts = new Map(HIGH_VALUE_TERMS.map((term) => [term, 0]));

  for (const row of uniqueRows) {
    const text = sourceText(row);
    const lower = text.toLowerCase();
    const tokens = tokensFor(text);
    const meaningful = tokens.filter((token) => !STOP_WORDS.has(token));
    for (const token of meaningful) {
      keywordCounts.set(token, (keywordCounts.get(token) || 0) + 1);
    }
    for (const length of [2, 3]) {
      for (let index = 0; index <= meaningful.length - length; index += 1) {
        const phrase = meaningful.slice(index, index + length).join(" ");
        if (phrase.split(" ").some((token) => token.length < 3)) continue;
        phraseCounts.set(phrase, (phraseCounts.get(phrase) || 0) + 1);
      }
    }
    for (const term of HIGH_VALUE_TERMS) {
      const pattern = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g");
      const matches = lower.match(pattern);
      if (matches) highValueCounts.set(term, highValueCounts.get(term) + matches.length);
    }
  }

  return {
    analyzedCandidatePosts: uniqueRows.length,
    topKeywords: rankCounts(keywordCounts, keywordLimit),
    topPhrases: rankCounts(
      new Map([...phraseCounts].filter(([, count]) => count >= 2)),
      phraseLimit
    ),
    highValueKeywords: rankCounts(highValueCounts, HIGH_VALUE_TERMS.length)
  };
}

export async function buildOperationalAnalytics({
  searchHistoryPath,
  sentHistoryPath,
  sawPath,
  outputDirectory,
  now = Date.now(),
  timeZone = "America/Los_Angeles"
}) {
  const [searchHistory, sentHistory, saw, queueRuns, manifests] = await Promise.all([
    readJson(searchHistoryPath, { runs: [] }),
    readJson(sentHistoryPath, { records: [] }),
    readJson(sawPath, { posts: [] }),
    loadQueueRuns(outputDirectory),
    loadSearchManifests(outputDirectory)
  ]);
  const today = dateKey(now, timeZone);
  const sourceRuns = Array.isArray(searchHistory.runs) ? searchHistory.runs : [];
  const uniqueSearchRuns = new Map();
  for (const run of sourceRuns) {
    const entry = uniqueSearchRuns.get(run.runId) || {
      runId: run.runId,
      timestamp: run.timestamp,
      candidateCount: 0,
      failed: false
    };
    entry.candidateCount += Number(run.candidateCount || 0);
    entry.failed ||= run.status === "failed";
    uniqueSearchRuns.set(run.runId, entry);
  }
  for (const manifest of manifests) {
    if (uniqueSearchRuns.has(manifest.runId)) continue;
    uniqueSearchRuns.set(manifest.runId, {
      runId: manifest.runId,
      timestamp: manifest.discoveredAt,
      candidateCount: manifest.sourceRuns.reduce(
        (sum, run) => sum + Number(run.candidateCount || 0),
        0
      ),
      failed: manifest.failed,
      candidateCountKnown: manifest.sourceRuns.length > 0
    });
  }
  const searchRuns = [...uniqueSearchRuns.values()];
  const todaySearchRuns = searchRuns.filter((run) => dateKey(run.timestamp, timeZone) === today);
  const todaySourceRuns = sourceRuns.filter((run) => dateKey(run.timestamp, timeZone) === today);
  const sentRecords = (Array.isArray(sentHistory.records) ? sentHistory.records : [])
    .filter((record) => record.status === "sent" && record.sentAt);
  const todaySent = sentRecords.filter((record) => dateKey(record.sentAt, timeZone) === today);
  const todayQueueRuns = queueRuns.filter((run) => dateKey(run.discoveredAt, timeZone) === today);
  const todayQueueRows = todayQueueRuns.flatMap((run) => run.rows);
  const queueRows = queueRuns.flatMap((run) => run.rows);
  const todaySaw = (Array.isArray(saw.posts) ? saw.posts : [])
    .filter((post) => dateKey(post.processedAt, timeZone) === today);
  const sevenDays = recentDateKeys(7, now, timeZone);
  const thirtyDays = recentDateKeys(30, now, timeZone);
  const sentCountsByDay = countBy(sentRecords, (record) => dateKey(record.sentAt, timeZone));
  const sourceCounts = countBy(queueRows, (row) => row["平台"]);
  const sourceTotal = Object.values(sourceCounts).reduce((sum, count) => sum + count, 0);
  const sevenDayRows = queueRows.filter((row) =>
    sevenDays.includes(dateKey(row.discovered_at, timeZone))
  );
  const dailySourceTrend = sevenDays.map((date) => {
    const rows = sevenDayRows.filter((row) => dateKey(row.discovered_at, timeZone) === date);
    const counts = countBy(rows, (row) => row["平台"]);
    return {
      date,
      totalCandidates: rows.length,
      Polymarket: counts.Polymarket || 0,
      X: counts.X || 0
    };
  });

  return {
    version: "0.95",
    generatedAt: new Date(now).toISOString(),
    timeZone,
    dataFreshness: {
      searchHistoryUpdatedAt: searchHistory.updatedAt || null,
      sentHistoryUpdatedAt: sentHistory.updatedAt || null,
      sawUpdatedAt: saw.updatedAt || null,
      latestQueueRunAt: queueRuns.at(-1)?.discoveredAt || null
    },
    operations: {
      todaySearchRuns: todaySearchRuns.length,
      todayCandidatesDiscovered: todaySourceRuns.reduce(
        (sum, run) => sum + Number(run.candidateCount || 0),
        0
      ),
      todayQueueEntries: todayQueueRows.length || todaySaw.length,
      todaySent: todaySent.length,
      cumulativeSent: sentRecords.length,
      cumulativeUniqueUsers: new Set(
        sentRecords.map((record) => String(record.username || "").toLowerCase()).filter(Boolean)
      ).size,
      candidateCountCoverage: {
        coveredRuns: todaySearchRuns.filter((run) => run.candidateCountKnown !== false).length,
        totalRuns: todaySearchRuns.length
      },
      sentTrend7Days: sevenDays.map((date) => ({ date, sent: sentCountsByDay[date] || 0 })),
      sentTrend30Days: thirtyDays.map((date) => ({ date, sent: sentCountsByDay[date] || 0 }))
    },
    sources: {
      totalQueueEntries: sourceTotal,
      counts: {
        Polymarket: sourceCounts.Polymarket || 0,
        X: sourceCounts.X || 0
      },
      shares: {
        Polymarket: percentage(sourceCounts.Polymarket || 0, sourceTotal),
        X: percentage(sourceCounts.X || 0, sourceTotal)
      },
      trend7Days: dailySourceTrend
    },
    keywords: analyzeKeywords(queueRows),
    definitions: {
      searchRun: "Unique runId in 搜索历史.json.",
      candidateDiscovered: "Sum of source-level candidateCount returned before final queue selection.",
      queueEntry: "A row written to a fresh-targets run output.",
      sent: "A sent-history record with status=sent and a sentAt timestamp.",
      uniqueUser: "Case-insensitive unique username among sent records."
    }
  };
}

function markdownTable(headers, rows) {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.join(" | ")} |`)
  ].join("\n");
}

export function renderOperationsReport(analytics) {
  const operations = analytics.operations;
  const sources = analytics.sources;
  const keywords = analytics.keywords;
  return `# Fortune Shrine V0.95 运营分析

生成时间：${analytics.generatedAt}

时区：${analytics.timeZone}

## 今日运营仪表盘

${markdownTable(
  ["指标", "数值"],
  [
    ["今日搜索次数", operations.todaySearchRuns],
    ["今日候选人数", operations.todayCandidatesDiscovered],
    ["今日进入队列人数", operations.todayQueueEntries],
    ["今日发送人数", operations.todaySent],
    ["累计发送人数", operations.cumulativeSent],
    ["累计唯一用户数", operations.cumulativeUniqueUsers]
  ]
)}

候选人数覆盖：${operations.candidateCountCoverage.coveredRuns}/${operations.candidateCountCoverage.totalRuns} 次搜索具有来源级候选计数。旧运行若没有该字段，不进行估算。

## 最近 7 天发送趋势

${markdownTable(
  ["日期", "发送数"],
  operations.sentTrend7Days.map((item) => [item.date, item.sent])
)}

## 最近 30 天发送趋势

${markdownTable(
  ["日期", "发送数"],
  operations.sentTrend30Days.map((item) => [item.date, item.sent])
)}

## 候选来源

${markdownTable(
  ["来源", "队列条目", "占比"],
  [
    ["Polymarket", sources.counts.Polymarket, `${sources.shares.Polymarket}%`],
    ["X", sources.counts.X, `${sources.shares.X}%`]
  ]
)}

## 最近 7 天来源趋势

${markdownTable(
  ["日期", "总候选", "Polymarket", "X"],
  sources.trend7Days.map((item) => [
    item.date,
    item.totalCandidates,
    item.Polymarket,
    item.X
  ])
)}

## 高频关键词

${markdownTable(
  ["排名", "关键词", "出现次数"],
  keywords.topKeywords.slice(0, 20).map((item, index) => [index + 1, item.term, item.count])
)}

## 高频短语

${markdownTable(
  ["排名", "短语", "出现次数"],
  keywords.topPhrases.slice(0, 20).map((item, index) => [index + 1, item.term, item.count])
)}

## 高价值关键词

${markdownTable(
  ["关键词", "出现次数"],
  keywords.highValueKeywords.map((item) => [item.term, item.count])
)}

## 统计口径

- 搜索次数：按 \`搜索历史.json\` 中唯一 \`runId\` 计算。
- 候选人数：来源在最终排队前返回的候选身份数之和。
- 进入队列人数：实际写入每次 \`fresh-targets-*.json\` 的行数。
- 发送人数：\`sent-history.json\` 中 \`status=sent\` 且存在 \`sentAt\` 的记录。
- 唯一用户：已发送记录中按用户名忽略大小写去重。
`;
}
