#!/usr/bin/env node
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { normalizeText, writeTextAtomic } from "./lib.mjs";

const execute = promisify(execFile);
const directory = path.dirname(fileURLToPath(import.meta.url));
const inputPath = process.argv[2] || path.join(directory, "output", "fortune_shrine_x_all_personal_accounts_final.csv");
const outputPath = process.argv[3] || path.join(directory, "output", "fortune_shrine_top20_buyers.csv");
const proxy = process.env.PUBLIC_X_PROXY || process.env.HTTPS_PROXY || "";

const POSITIVE = {
  "活跃交易者": ["trade", "trading", "trader", "position", "long", "short", "leverage", "liquidat", "portfolio", "chart"],
  "Polymarket用户": ["polymarket"],
  "预测市场用户": ["prediction market", "kalshi", "manifold", "metaculus", "forecast", "probability", "odds"],
  "加密用户": ["crypto", "bitcoin", "btc", "ethereum", "eth", "solana", "defi", "nft", "web3", "token", "coin"],
  "运气表达": ["luck", "lucky", "blessed", "pray", "prayer", "wish"],
  "输赢表达": ["win", "winning", "won", "lose", "losing", "lost", "loss", "profit", "pnl"],
  "风险表达": ["risk", "risky", "gamble", "bet", "wager", "all in", "stake"],
  "希望表达": ["hope", "hoping", "faith", "believe"],
  "等待结果": ["wait", "waiting", "result", "resolve", "resolution", "pending", "outcome"]
};

const DIRECT_PERSONAL = [" i ", " i'm ", " my ", " me ", "i’ve", "i'm", "i am", "my ", "wish me", "hope i"];

function parseCsv(text) {
  text = text.replace(/^\ufeff/, "");
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') field += '"', i += 1;
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") row.push(field), field = "";
    else if (c === "\n") {
      row.push(field);
      if (row.some(Boolean)) rows.push(row);
      row = []; field = "";
    } else if (c !== "\r") field += c;
  }
  if (field || row.length) row.push(field), rows.push(row);
  const headers = rows.shift() || [];
  return rows.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] || ""])));
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function decodeHtml(value) {
  return String(value || "")
    .replaceAll("&amp;", "&").replaceAll("&quot;", '"').replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<").replaceAll("&gt;", ">");
}

async function fetchProfile(handle) {
  const args = [];
  if (proxy) args.push("--proxy", proxy);
  args.push(
    "-L", "--max-time", "12", "--retry", "1", "--retry-all-errors",
    "-A", "Mozilla/5.0", "-sS", `https://x.com/${handle}`
  );
  const { stdout } = await execute("curl", args, { maxBuffer: 20 * 1024 * 1024, encoding: "utf8" });
  return stdout.replaceAll("\0", "");
}

function profileMetadata(html, expectedHandle) {
  const title = decodeHtml(html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i)?.[1] || "");
  const match = title.match(/^(.*?) \(@([A-Za-z0-9_]+)\) on X/i);
  if (!match || match[2].toLowerCase() !== expectedHandle.toLowerCase()) return null;
  const description = decodeHtml(html.match(/<meta[^>]+property="og:description"[^>]+content="([^"]*)"/i)?.[1] || "");
  const posts = [...html.matchAll(/full_text:"((?:\\.|[^"\\])*)"[\s\S]{0,1000}?created_at_ms:(\d+)/g)]
    .slice(0, 5)
    .map((item) => {
      let text = item[1];
      try { text = JSON.parse(`"${text}"`); } catch {}
      return normalizeText(decodeHtml(text), 1_500);
    });
  return { name: match[1], description: normalizeText(description, 500), posts };
}

async function mapConcurrent(items, concurrency, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  async function run() {
    while (cursor < items.length) {
      const index = cursor++;
      try { results[index] = await worker(items[index]); }
      catch { results[index] = null; }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, run));
  return results;
}

function occurrences(text, signals) {
  return signals.reduce((total, signal) => {
    let cursor = 0, count = 0;
    while ((cursor = text.indexOf(signal, cursor)) !== -1) count += 1, cursor += signal.length;
    return total + count;
  }, 0);
}

function classifyAndScore(row, meta) {
  const corpus = `${meta?.name || ""} ${meta?.description || ""} ${meta?.posts?.join(" ") || ""} ${row.latest_post || ""}`.toLowerCase();
  const positives = [];
  for (const [label, signals] of Object.entries(POSITIVE)) {
    const count = occurrences(corpus, signals);
    if (!count) continue;
    positives.push({ label, count });
  }

  const followers = Number(row["关注者"] || 0);
  const strongest = positives.sort((a, b) => b.count - a.count);
  const category = strongest.slice(0, 2).map((item) => item.label).join(" + ") || "一般个人账号";
  const uncertaintyLabels = new Set(["运气表达", "输赢表达", "风险表达", "希望表达", "等待结果"]);
  const uncertaintyRaw = positives
    .filter((item) => uncertaintyLabels.has(item.label))
    .reduce((sum, item) => sum + Math.min(4, item.count), 0);
  const uncertaintyScore = Math.min(100, uncertaintyRaw * 8);
  const marketFit = Math.min(100,
    (positives.some((item) => item.label === "Polymarket用户") ? 30 : 0)
    + (positives.some((item) => item.label === "预测市场用户") ? 25 : 0)
    + (positives.some((item) => item.label === "活跃交易者") ? 20 : 0)
    + (positives.some((item) => item.label === "加密用户") ? 15 : 0)
    + (positives.some((item) => item.label === "风险表达") ? 10 : 0)
  );
  const ritualFit = Math.min(100,
    (positives.some((item) => item.label === "运气表达") ? 30 : 0)
    + (positives.some((item) => item.label === "希望表达") ? 25 : 0)
    + (positives.some((item) => item.label === "等待结果") ? 25 : 0)
    + (positives.some((item) => item.label === "输赢表达") ? 10 : 0)
    + (DIRECT_PERSONAL.some((signal) => ` ${corpus} `.includes(signal)) ? 10 : 0)
  );
  const contentEvidence = Math.min(100, positives.reduce((sum, item) => sum + Math.min(5, item.count), 0) * 5);
  const shrineScore = Math.round(
    uncertaintyScore * 0.38
    + marketFit * 0.32
    + ritualFit * 0.22
    + contentEvidence * 0.08
  );
  const offeringProbability = Math.max(1, Math.min(35, Math.round(
    1 + shrineScore * 0.23 + ritualFit * 0.07 + marketFit * 0.03
  )));
  const examplePost = normalizeText(
    meta?.posts?.[0] || String(row.latest_post || "").replace(/^\[[^\]]+\]\s*/, ""),
    700
  );
  const reason = [
    strongest.length ? `正向信号：${strongest.slice(0, 4).map((item) => `${item.label}×${item.count}`).join("、")}` : "正向信号较少",
    `市场契合 ${marketFit}`,
    `仪式契合 ${ritualFit}`,
    `证据密度 ${contentEvidence}`
  ].join("；");
  return {
    用户名: row["用户名"],
    shrine_分数: shrineScore,
    不确定性_分数: uncertaintyScore,
    Offering_概率: `${offeringProbability}%`,
    类别: category,
    原因: reason,
    示例_帖子: examplePost,
    最终排序原因: `按 shrine_分数 ${shrineScore} 降序；同分时依次比较不确定性 ${uncertaintyScore}、Offering估计 ${offeringProbability}%、当前公开粉丝 ${followers.toLocaleString("en-US")}`
  };
}

const rows = parseCsv(await readFile(inputPath, "utf8"));
const metas = await mapConcurrent(rows, 6, async (row) =>
  profileMetadata(await fetchProfile(row["用户名"]), row["用户名"])
);
const scored = rows.map((row, index) => classifyAndScore(row, metas[index]))
  .sort((a, b) =>
    b.shrine_分数 - a.shrine_分数
    || b.不确定性_分数 - a.不确定性_分数
    || Number.parseInt(b.Offering_概率) - Number.parseInt(a.Offering_概率)
    || a.用户名.localeCompare(b.用户名)
  );

const fields = ["用户名", "shrine_分数", "不确定性_分数", "Offering_概率", "类别", "原因", "示例_帖子", "最终排序原因"];
function toCsv(items) {
  return "\ufeff" + [
    fields.join(","),
    ...items.map((row) => fields.map((field) => csvEscape(row[field])).join(","))
  ].join("\n") + "\n";
}

await writeTextAtomic(outputPath, toCsv(scored));
const extension = path.extname(outputPath);
const base = outputPath.slice(0, -extension.length);
const subsetPaths = {};
for (const limit of [20, 50, 100]) {
  const subsetPath = `${base}_top_${limit}${extension}`;
  await writeTextAtomic(subsetPath, toCsv(scored.slice(0, limit)));
  subsetPaths[`top${limit}`] = subsetPath;
}
console.log(JSON.stringify({
  input: rows.length,
  scored: scored.length,
  outputPath,
  ...subsetPaths
}, null, 2));
