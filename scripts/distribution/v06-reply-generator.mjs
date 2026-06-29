#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeText, writeJsonAtomic, writeTextAtomic } from "./lib.mjs";

const directory = path.dirname(fileURLToPath(import.meta.url));
const inputPath = process.argv[2]
  || path.join(directory, "output", "fortune_shrine_v06_validation_top20.csv");
const outputPath = process.argv[3]
  || path.join(directory, "output", "fortune_shrine_v06_reply_candidates_top20.csv");
const poolStatePath = process.env.V06_POOL_STATE_FILE || "";

const REPLIES = {
  grief: [
    "Some dates carry more weight than others. May the memory remain gentle beside you.",
    "Six months can feel both long and impossibly near. May love keep its place even where absence remains.",
    "There are losses time does not ask us to forget. May you carry this one with tenderness."
  ],
  birth: [
    "A new life changes the meaning of every future result. May wonder and steadiness walk beside your family.",
    "That is a beautiful new beginning. May the road ahead hold warmth for all of you.",
    "Some arrivals make the whole world feel newly uncertain and newly sacred. May your family meet it with love."
  ],
  farewell: [
    "Ending one chapter while beginning another carries its own uncertainty. May the next road honor what came before.",
    "There is courage in knowing when a chapter has reached its final page. May the new beginning arrive with clarity.",
    "A farewell can hold gratitude and uncertainty at once. May what follows be worthy of what you built."
  ],
  hopeFarewell: [
    "Hope and goodbye can live in the same moment. May the years behind you be held with gratitude, whatever comes next.",
    "That is a great deal of history and hope in one message. May the next chapter meet you kindly.",
    "Some thresholds ask us to celebrate and let go at once. May you cross this one with a steady heart."
  ],
  blessingWin: [
    "A moment like that can feel touched by fortune. May gratitude stay longer than the rush.",
    "The result arrived loudly. May you keep the wonder without letting the outcome carry all the meaning.",
    "Fortune sometimes enters without warning. May your joy remain grounded when the room grows bright."
  ],
  riskChallenge: [
    "A public challenge makes every choice feel louder. May discipline remain beside you when momentum starts to speak.",
    "Risk becomes heavier when the numbers begin to move. May your judgment stay larger than the excitement.",
    "The challenge is visible, but the inner pressure is not. May clarity remain with you between one decision and the next."
  ],
  riskPhilosophy: [
    "Taking risk seriously means respecting what certainty cannot provide. May judgment remain steady when conviction grows loud.",
    "The best preparation still leaves the future unwritten. May humility stay beside every strong belief.",
    "Risk rewards careful thought, but never removes uncertainty. May patience remain part of the method."
  ],
  liquidation: [
    "Transparency can reveal the mechanics, but it does not remove the weight of liquidation. May clarity remain when the numbers turn severe.",
    "Onchain evidence makes the event visible; the human cost can still be quiet. May restraint stand beside certainty.",
    "A system can be verifiable and still carry real consequence. May precision never lose sight of the people inside the numbers."
  ],
  chance: [
    "Chance has a way of making every outcome feel personal. May generosity remain larger than the draw.",
    "Randomness gives no one a promise. May the moment be held lightly and fairly.",
    "Many will hope when chance enters the room. May expectation remain gentle."
  ],
  lawsuit: [
    "When money and judgment are still unresolved, certainty can arrive too early. May patience remain until the facts have spoken.",
    "A future result can feel settled long before it is. May clarity stand between expectation and outcome.",
    "Legal uncertainty carries its own kind of waiting. May steadiness remain while the answer is still unwritten."
  ],
  regret: [
    "That sounds like the kind of result people replay afterward. May hindsight bring clarity without becoming a burden.",
    "Some outcomes leave a sharper echo than expected. May the lesson remain without taking the whole day.",
    "Regret can make the past feel louder than it was. May perspective return when the noise settles."
  ],
  milestone: [
    "Some public days carry decades of waiting behind them. May the people inside the moment feel its full weight.",
    "History often arrives after a long silence. May this day be met with gratitude and humility.",
    "A milestone can hold memory, hope, and unfinished work at once. May those who enter it do so with care."
  ],
  odds: [
    "Odds can describe the crowd without deciding the future. May perspective remain larger than the number.",
    "A number on a board can become a story very quickly. May uncertainty keep its rightful place.",
    "Markets speak in probabilities, never promises. May everyone watching remember the distance between the two."
  ],
  sloganRisk: [
    "Risk may open a road, but it also asks for respect. May courage never have to become recklessness.",
    "The reward is visible; the cost often stays quiet. May discernment remain beside the appetite for risk.",
    "Boldness has its place. May restraint keep a place beside it."
  ],
  electionResult: [
    "A result can carry years of expectation into a single moment. May responsibility remain after celebration fades.",
    "Victory closes one uncertainty and opens another. May those entrusted with the next step meet it with humility.",
    "The result has arrived, but the road beyond it is still unwritten. May steadiness guide what follows."
  ],
  newsletter: [
    "Every new dispatch enters a world already full of noise. May the words that matter find the people who need them.",
    "Sharing what you see is its own small act of faith. May clarity remain at the center of the work.",
    "Another page goes out into an uncertain day. May it carry more signal than noise."
  ],
  performance: [
    "Some performances look quiet until the full measure appears. May the work be seen beyond the noise around it.",
    "Numbers can reveal what attention overlooks. May recognition arrive without changing the discipline beneath it.",
    "The result speaks loudly after the effort stayed quiet. May the unseen work keep its dignity."
  ],
  variance: [
    "When the chances created and the goals scored drift this far apart, patience is tested. May analysis stay clear without becoming certainty.",
    "The numbers describe a cruel distance between process and result. May perspective survive the variance.",
    "Sometimes the work and the outcome refuse to match. May discipline remain when probability feels personal."
  ],
  quietMoment: [
    "Quiet exchanges can carry more weight than public declarations. May care remain present in what is left unsaid.",
    "Some moments ask only to be witnessed. May dignity stay with everyone inside this one.",
    "The smallest exchange can hold the greatest uncertainty. May understanding arrive before judgment."
  ],
  startupRisk: [
    "Building that much with so few people carries an unusual concentration of risk. May discipline remain larger than momentum.",
    "Extraordinary efficiency can make the future look inevitable. May humility remain where uncertainty still lives.",
    "A story of scale is also a story of decisions made before the future was known. May clarity stay close as the stakes grow."
  ],
  general: [
    "There is more uncertainty inside this moment than the surface shows. May clarity remain beside you.",
    "The result is visible; the road behind it is not. May the next step be met with steadiness.",
    "Some moments deserve recognition before interpretation. May perspective remain when the noise settles."
  ]
};

const REPLY_ECHOES = [
  "The road remains unwritten.",
  "Let the flame stay quiet beside the unknown.",
  "The answer can arrive in its own time.",
  "Not every uncertainty needs to be conquered today.",
  "The next page has not been written yet.",
  "Let the moment keep its dignity.",
  "The future may remain veiled for a little longer.",
  "A steady heart is enough for this moment.",
  "What comes next does not erase what is true now.",
  "The silence before an answer still belongs to the journey."
];

for (const [state, seeds] of Object.entries(REPLIES)) {
  const expanded = [...seeds];
  for (const seed of seeds) {
    for (const echo of REPLY_ECHOES) expanded.push(`${seed} ${echo}`);
  }
  REPLIES[state] = [...new Set(expanded)];
}

function splitSentences(text) {
  return String(text || "").match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((sentence) => sentence.trim()) || [];
}

function buildSelectionPool(replies) {
  const core = replies.slice(0, 3).map(splitSentences);
  const witnesses = [...new Set(core.map((sentences) => sentences[0]).filter(Boolean))];
  const blessings = [...new Set(core.map((sentences) => sentences[1]).filter(Boolean))];
  const variants = [...replies];
  for (const witness of witnesses) {
    for (const blessing of blessings) {
      variants.push(`${witness} ${blessing}`);
      for (const echo of REPLY_ECHOES) {
        variants.push(`${witness} ${blessing} ${echo}`);
      }
    }
  }
  return [...new Set(variants)];
}

const SELECTION_POOLS = Object.fromEntries(
  Object.entries(REPLIES).map(([state, replies]) => [state, buildSelectionPool(replies)])
);

async function readPoolState() {
  if (!poolStatePath) return {};
  try {
    const payload = JSON.parse(await readFile(poolStatePath, "utf8"));
    return payload && typeof payload === "object" ? payload : {};
  } catch (error) {
    if (error.code === "ENOENT") return {};
    throw error;
  }
}

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

function detectState(row) {
  const category = String(row["类别"] || "").toLowerCase();
  const post = `${row["最新帖子"] || ""} ${row["示例帖子"] || ""}`.toLowerCase();
  const text = `${category} ${post}`;
  if (/(miss you|day you wish never happened|already been .*months)/.test(text)) return "grief";
  if (/(my son|born friday|is here)/.test(text)) return "birth";
  if (/(goodbye|say goodbye)/.test(text) && /(hoping|celebrat)/.test(text)) return "hopeFarewell";
  if (/(final .*podcast|chapter ends|new .*begins)/.test(text)) return "farewell";
  if (/(blessed me|huge win|pulled from)/.test(text)) return "blessingWin";
  if (/(well wishes|prayers|pray for|severity of the crash|love and support|thank each)/.test(post)) return "quietMoment";
  if (/(launching|we're launching|we’re launching|new product|announcements|is live|going live|built for the community|joining the .*desk)/.test(post)) return "startupRisk";
  if (/(running for congress|time to vote|go vote|election victory|by-election|exit poll|voting candidates|vote won.t change|results speak)/.test(post)) return "electionResult";
  if (/(bets? for|betting|survivor contest|today's pick|today’s pick|sweeping bags|bullish|challenge)/.test(post)) return "riskChallenge";
  if (/(recommended reads|thinking, fast|fortune's formula|superforecasting)/.test(text)) return "riskPhilosophy";
  if (/(liquidation|liquidations|onchain)/.test(text)) return "liquidation";
  if (/(random winners|giving away|receive \\$)/.test(text)) return "chance";
  if (/(lawsuit|worth every penny)/.test(text)) return "lawsuit";
  if (/(wished they hadn|regret)/.test(text)) return "regret";
  if (/(important day|opening on|first time in .*years|months to go|opening match|tentative agreement|baseball is back|schedule thoughts|days of rest)/.test(post)) return "milestone";
  if (/(odds|probability|chance they|poll|forecast|prediction|data by how much attention|net rest)/.test(post)) return "odds";
  if (/(no risk no reward)/.test(text)) return "sloganRisk";
  if (/(newsletter)/.test(text)) return "newsletter";
  if (/(winners win|they losing|performance|catches|touchdown|td |for the win|world cup goals|championship|parade|athletes)/.test(post)) return "performance";
  if (/(#?xg\b|\bxp\b|\bxgf\b|quality of chances)/.test(text)) return "variance";
  if (/(quiet exchange|reached a tentative agreement|helping .* afford|trade for a trade)/.test(post)) return "quietMoment";
  if (/(startup|profit per employee|venture capital)/.test(text)) return "startupRisk";
  if (category.includes("预测市场")) return "odds";
  if (category.includes("等待结果")) return "milestone";
  if (category.includes("风险表达")) return "sloganRisk";
  if (category.includes("运气表达") || category.includes("希望表达")) return "quietMoment";
  if (category.includes("输赢表达")) return "performance";
  if (category.includes("活跃交易者") || category.includes("加密用户")) return "riskPhilosophy";
  return "general";
}

const inputRows = parseCsv(await readFile(inputPath, "utf8")).slice(0, 20);
const persistedState = await readPoolState();
const stateUsage = new Map(
  Object.entries(persistedState).map(([state, cursor]) => [state, Number(cursor) || 0])
);
const outputRows = inputRows.map((row) => {
  const state = detectState(row);
  const replies = SELECTION_POOLS[state] || SELECTION_POOLS.general;
  const usage = stateUsage.get(state) || 0;
  const offset = usage % replies.length;
  stateUsage.set(state, usage + 3);
  return {
    用户名: row["用户名"],
    类别: row["类别"],
    最新帖子: row["最新帖子"],
    示例帖子: row["示例帖子"],
    回复_A: replies[offset],
    回复_B: replies[(offset + 1) % replies.length],
    回复_C: replies[(offset + 2) % replies.length]
  };
});

const fields = ["用户名", "类别", "最新帖子", "示例帖子", "回复_A", "回复_B", "回复_C"];
const csv = "\ufeff" + [
  fields.join(","),
  ...outputRows.map((row) => fields.map((field) => csvEscape(row[field])).join(","))
].join("\n") + "\n";

await writeTextAtomic(outputPath, csv);
if (poolStatePath) {
  await writeJsonAtomic(poolStatePath, Object.fromEntries(stateUsage));
}
console.log(JSON.stringify({
  version: "0.6",
  users: outputRows.length,
  replyCandidates: outputRows.length * 3,
  outputPath
}, null, 2));
