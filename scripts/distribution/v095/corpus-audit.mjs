import { readFile } from "node:fs/promises";

function words(text) {
  return String(text || "").toLowerCase().match(/[a-z']+/g) || [];
}

function normalized(text) {
  return words(text).join(" ");
}

function characterTrigrams(text) {
  const clean = normalized(text);
  const grams = new Set();
  for (let index = 0; index <= clean.length - 3; index += 1) {
    grams.add(clean.slice(index, index + 3));
  }
  return grams;
}

function diceSimilarity(left, right) {
  const a = characterTrigrams(left);
  const b = characterTrigrams(right);
  if (!a.size && !b.size) return 1;
  let overlap = 0;
  for (const token of a) if (b.has(token)) overlap += 1;
  return (2 * overlap) / (a.size + b.size);
}

function grammarFlags(entry) {
  const text = String(entry["文本"] || "");
  const flags = [];
  if (text && !/^[A-Z“]/.test(text)) flags.push("sentence_does_not_start_with_capital");
  if (text && !/[.!?]$/.test(text)) flags.push("missing_terminal_punctuation");
  if (/\s{2,}/.test(text)) flags.push("repeated_whitespace");
  if (/\b([a-z]+)\s+\1\b/i.test(text)) flags.push("repeated_adjacent_word");
  if ((text.match(/"/g) || []).length % 2 !== 0) flags.push("unbalanced_quotes");
  if ((text.match(/\(/g) || []).length !== (text.match(/\)/g) || []).length) {
    flags.push("unbalanced_parentheses");
  }
  return flags;
}

function styleFlags(entry) {
  const text = String(entry["文本"] || "");
  const flags = [];
  const forbidden = [
    [/\byou will (win|succeed|profit|be rich)\b/i, "outcome_promise"],
    [/\bguarantee(?:d|s)?\b/i, "guarantee_language"],
    [/(?:^|[.!?]\s+)(?:buy|sell|invest|enter the trade|exit the trade|act now)\b/i, "instructional_language"],
    [/\b(profit|wealth|riches|financial returns|market returns|jackpot)\b/i, "wealth_language"],
    [/\b(prediction|prophecy|oracle says)\b/i, "prediction_language"],
    [/\bnever give up\b/i, "motivational_slogan"],
    [/\beverything will be okay\b/i, "certainty_slogan"]
  ];
  for (const [pattern, label] of forbidden) if (pattern.test(text)) flags.push(label);
  if (!/\bmay\b/i.test(text)) flags.push("no_explicit_blessing_clause");
  if (/\bI (see|know|understand)\b/i.test(text)) flags.push("narrator_presence");
  return flags;
}

export async function auditBlessingCorpus(filePath, {
  similarityThreshold = 0.5,
  minimumWords = 8,
  maximumWords = 45
} = {}) {
  const entries = JSON.parse(await readFile(filePath, "utf8"));
  const exactGroups = new Map();
  for (const entry of entries) {
    const key = normalized(entry["文本"]);
    const group = exactGroups.get(key) || [];
    group.push(entry.id);
    exactGroups.set(key, group);
  }
  const exactDuplicates = [...exactGroups.values()]
    .filter((ids) => ids.length > 1)
    .map((ids) => ({ ids }));
  const similarPairs = [];
  for (let left = 0; left < entries.length; left += 1) {
    for (let right = left + 1; right < entries.length; right += 1) {
      const score = diceSimilarity(entries[left]["文本"], entries[right]["文本"]);
      if (score < similarityThreshold || score === 1) continue;
      similarPairs.push({
        leftId: entries[left].id,
        rightId: entries[right].id,
        similarity: Number(score.toFixed(3)),
        leftText: entries[left]["文本"],
        rightText: entries[right]["文本"]
      });
    }
  }
  similarPairs.sort((a, b) => b.similarity - a.similarity);
  const grammarIssues = [];
  const lengthIssues = [];
  const styleIssues = [];
  for (const entry of entries) {
    const grammar = grammarFlags(entry);
    if (grammar.length) grammarIssues.push({ id: entry.id, flags: grammar, text: entry["文本"] });
    const wordCount = words(entry["文本"]).length;
    if (wordCount < minimumWords || wordCount > maximumWords) {
      lengthIssues.push({ id: entry.id, wordCount, text: entry["文本"] });
    }
    const style = styleFlags(entry);
    if (style.length) styleIssues.push({ id: entry.id, flags: style, text: entry["文本"] });
  }

  return {
    version: "0.95",
    auditedAt: new Date().toISOString(),
    corpusPath: filePath,
    entryCount: entries.length,
    categoryCounts: entries.reduce((counts, entry) => {
      counts[entry["类别"]] = (counts[entry["类别"]] || 0) + 1;
      return counts;
    }, {}),
    thresholds: { similarityThreshold, minimumWords, maximumWords },
    exactDuplicates,
    highSimilarityPairs: similarPairs,
    grammarIssues,
    lengthIssues,
    styleIssues,
    summary: {
      exactDuplicateGroups: exactDuplicates.length,
      highSimilarityPairs: similarPairs.length,
      grammarIssues: grammarIssues.length,
      lengthIssues: lengthIssues.length,
      styleIssues: styleIssues.length
    },
    note: "Grammar and style findings are heuristic flags for human review, not automatic corrections."
  };
}

function issueTable(headers, rows, emptyText) {
  if (!rows.length) return emptyText;
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map((value) =>
      String(value).replaceAll("|", "\\|").replaceAll("\n", " ")
    ).join(" | ")} |`)
  ].join("\n");
}

export function renderCorpusAudit(audit) {
  return `# Fortune Shrine V0.9 祝福语料库审计

审计时间：${audit.auditedAt}

语料数量：${audit.entryCount}

> 本报告只列出问题与启发式风险，不修改语料库。

## 摘要

| 项目 | 数量 |
| --- | ---: |
| 完全重复组 | ${audit.summary.exactDuplicateGroups} |
| 高相似度文本对 | ${audit.summary.highSimilarityPairs} |
| 语法启发式问题 | ${audit.summary.grammarIssues} |
| 长度异常 | ${audit.summary.lengthIssues} |
| 风格异常 | ${audit.summary.styleIssues} |

## 完全重复文本

${issueTable(
  ["ID"],
  audit.exactDuplicates.map((item) => [item.ids.join(", ")]),
  "未发现完全重复文本。"
)}

## 高相似度文本

阈值：字符三元组 Dice similarity ≥ ${audit.thresholds.similarityThreshold}

${issueTable(
  ["相似度", "左侧 ID", "右侧 ID", "左侧文本", "右侧文本"],
  audit.highSimilarityPairs.slice(0, 100).map((item) => [
    item.similarity,
    item.leftId,
    item.rightId,
    item.leftText,
    item.rightText
  ]),
  "未发现达到阈值的高相似度文本。"
)}

## 语法问题

${issueTable(
  ["ID", "标记", "文本"],
  audit.grammarIssues.map((item) => [item.id, item.flags.join(", "), item.text]),
  "未发现语法启发式问题。"
)}

## 长度异常

正常范围：${audit.thresholds.minimumWords}–${audit.thresholds.maximumWords} 个英文单词。

${issueTable(
  ["ID", "词数", "文本"],
  audit.lengthIssues.map((item) => [item.id, item.wordCount, item.text]),
  "未发现长度异常。"
)}

## 风格异常

${issueTable(
  ["ID", "标记", "文本"],
  audit.styleIssues.map((item) => [item.id, item.flags.join(", "), item.text]),
  "未发现协议级风格异常。"
)}
`;
}
