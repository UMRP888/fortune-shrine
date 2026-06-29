#!/usr/bin/env node
import crypto from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { writeTextAtomic } from "./lib.mjs";

const directory = path.dirname(fileURLToPath(import.meta.url));
const outputDirectory = path.join(directory, "output");
const sourcePath = path.join(outputDirectory, "fortune_shrine_x_all_personal_accounts_final.csv");
const scorePath = path.join(outputDirectory, "fortune_shrine_auditable_scores_all_170.csv");

const fields = [
  "用户名",
  "个人资料网址",
  "关注者",
  "最新帖子",
  "神社评分",
  "不确定性评分",
  "供奉评分（仅用于排序）",
  "类别",
  "原因",
  "证据密度",
  "示例帖子",
  "最终排名原因"
];

function parseCsv(text) {
  text = text.replace(/^\ufeff/, "");
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') quoted = false;
      else field += character;
    } else if (character === '"') quoted = true;
    else if (character === ",") row.push(field), field = "";
    else if (character === "\n") {
      row.push(field);
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = "";
    } else if (character !== "\r") field += character;
  }
  if (field || row.length) row.push(field), rows.push(row);
  const headers = rows.shift() || [];
  return rows.map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] || ""]))
  );
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function toCsv(rows) {
  return "\ufeff" + [
    fields.join(","),
    ...rows.map((row) => fields.map((field) => csvEscape(row[field])).join(","))
  ].join("\n") + "\n";
}

function evidenceDensity(reason) {
  return reason.match(/证据密度\s*(\d+)/)?.[1] || "";
}

function deterministicRandomKey(username) {
  return crypto
    .createHash("sha256")
    .update(`fortune-shrine-v0.6-random50:${username.toLowerCase()}`)
    .digest("hex");
}

const sourceRows = parseCsv(await readFile(sourcePath, "utf8"));
const scoreRows = parseCsv(await readFile(scorePath, "utf8"));
const sourceByUsername = new Map(sourceRows.map((row) => [row["用户名"].toLowerCase(), row]));

const merged = scoreRows.map((score) => {
  const source = sourceByUsername.get(score["用户名"].toLowerCase());
  if (!source) throw new Error(`Missing source row for ${score["用户名"]}`);
  return {
    用户名: score["用户名"],
    个人资料网址: source["个人资料"],
    关注者: source["关注者"],
    最新帖子: source["latest_post"],
    神社评分: score["shrine_分数"],
    不确定性评分: score["不确定性_分数"],
    "供奉评分（仅用于排序）": score["Offering_概率"],
    类别: score["类别"],
    原因: score["原因"],
    证据密度: evidenceDensity(score["原因"]),
    示例帖子: score["示例_帖子"],
    最终排名原因: score["最终排序原因"]
  };
});

const top20 = merged.slice(0, 20);
const top50 = merged.slice(0, 50);
const random50 = merged
  .slice(50)
  .map((row) => ({ row, key: deterministicRandomKey(row["用户名"]) }))
  .sort((a, b) => a.key.localeCompare(b.key))
  .slice(0, 50)
  .map(({ row }) => row);

const outputs = {
  top20: path.join(outputDirectory, "fortune_shrine_v06_validation_top20.csv"),
  top50: path.join(outputDirectory, "fortune_shrine_v06_validation_top50.csv"),
  random50: path.join(outputDirectory, "fortune_shrine_v06_validation_random50.csv")
};

await Promise.all([
  writeTextAtomic(outputs.top20, toCsv(top20)),
  writeTextAtomic(outputs.top50, toCsv(top50)),
  writeTextAtomic(outputs.random50, toCsv(random50))
]);

console.log(JSON.stringify({
  sourceCount: merged.length,
  top20: top20.length,
  top50: top50.length,
  random50: random50.length,
  randomPool: merged.length - 50,
  overlapTop50Random50: random50.filter((row) =>
    new Set(top50.map((item) => item["用户名"].toLowerCase())).has(row["用户名"].toLowerCase())
  ).length,
  outputs
}, null, 2));
