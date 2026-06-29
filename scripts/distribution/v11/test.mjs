import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  calculateStats,
  dailyStartedCount,
  loadState,
  normalizeQueueRow,
  saveState,
  syncQueue
} from "./store.mjs";

const normalized = normalizeQueueRow({
  id: "123",
  username: "traveler",
  post_url: "https://x.com/traveler/status/123",
  reply_a: "May your hand remain steady.",
  reply_b: "May patience remain beside you."
});
assert.match(normalized.candidate_id, /^cand_/);
assert.match(normalized.attribution_id, /^atr_/);
assert.equal(normalized.blessings.length, 2);
assert.equal(normalized.platform, "X");

const temporary = await mkdtemp(path.join(os.tmpdir(), "fortune-shrine-v11-"));
const queuePath = path.join(temporary, "queue.json");
const statePath = path.join(temporary, "send-state.json");
await writeFile(queuePath, JSON.stringify({ queue: [{
  id: "123",
  username: "traveler",
  post_url: "https://x.com/traveler/status/123",
  reply_a: "May your hand remain steady."
}] }));

let state = await syncQueue({ queuePath, statePath, now: "2026-06-21T10:00:00.000Z" });
const candidate = Object.values(state.candidates)[0];
assert.equal(candidate.status, "pending");
candidate.status = "approved";
candidate.selected_blessing_id = candidate.blessings[0].blessing_id;
candidate.approved_text = candidate.blessings[0].text;
await saveState(statePath, state, "2026-06-21T10:01:00.000Z");

state = await loadState(statePath);
assert.equal(Object.values(state.candidates)[0].status, "approved");
const item = Object.values(state.candidates)[0];
item.status = "sent";
item.send_time = "2026-06-21T10:02:00.000Z";
const stats = calculateStats(state, new Date("2026-06-21T12:00:00.000Z"), "UTC");
assert.equal(stats.todaySent, 1);
assert.equal(stats.cumulativeSent, 1);
assert.equal(stats.successRate, 100);
assert.equal(dailyStartedCount(state, new Date("2026-06-21T12:00:00.000Z"), "UTC"), 1);

const persisted = JSON.parse(await readFile(statePath, "utf8"));
assert.equal(persisted.version, "1.1");
console.log("V1.1 send layer tests passed");

