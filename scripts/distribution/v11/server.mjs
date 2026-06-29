#!/usr/bin/env node
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  appendEvent,
  calculateStats,
  dailyStartedCount,
  eventFor,
  loadState,
  requireCandidate,
  requireStatus,
  saveState,
  syncQueue
} from "./store.mjs";

const directory = path.dirname(fileURLToPath(import.meta.url));
const publicDirectory = path.join(directory, "public");
const stateDirectory = process.env.V11_STATE_DIR
  ? path.resolve(process.env.V11_STATE_DIR)
  : path.join(directory, "state");
const statePath = path.join(stateDirectory, "send-state.json");
const eventsPath = path.join(stateDirectory, "send-events.jsonl");
const queuePath = process.env.V11_QUEUE_PATH
  ? path.resolve(process.env.V11_QUEUE_PATH)
  : path.join(directory, "..", "v07", "data", "queue.json");
const port = Number(process.env.PORT || 4193);
const host = process.env.HOST || "127.0.0.1";
const timeZone = process.env.TZ || "America/Los_Angeles";
const dailyLimit = Math.min(200, Math.max(1, Number(process.env.V11_DAILY_SEND_LIMIT || 100)));
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8"
};

let mutationLock = Promise.resolve();

function withMutationLock(task) {
  const result = mutationLock.then(task, task);
  mutationLock = result.catch(() => {});
  return result;
}

async function readBody(request, maximumBytes = 256 * 1024) {
  const chunks = [];
  let bytes = 0;
  for await (const chunk of request) {
    bytes += chunk.length;
    if (bytes > maximumBytes) throw Object.assign(new Error("Request too large"), { statusCode: 413 });
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function json(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

function operatorFrom(body) {
  const operator = String(body.operator || "").trim();
  if (!operator) throw Object.assign(new Error("Operator is required"), { statusCode: 400 });
  return operator.slice(0, 80);
}

async function currentPayload() {
  const state = await syncQueue({ queuePath, statePath });
  return {
    version: "1.1",
    generated_at: new Date().toISOString(),
    halted: state.halted,
    halt_reason: state.halt_reason,
    daily_limit: dailyLimit,
    daily_hard_limit: 200,
    approval_interface: {
      mode: "human",
      auto_approve_supported: true,
      auto_approve_enabled: false,
      can_execute_without_human: false
    },
    active_send_count: Object.values(state.candidates)
      .filter((item) => item.status === "unconfirmed").length,
    stats: calculateStats(state, new Date(), timeZone),
    candidates: Object.values(state.candidates)
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
  };
}

async function mutateCandidate(candidateId, action, body) {
  return withMutationLock(async () => {
    const state = await loadState(statePath);
    const candidate = requireCandidate(state, candidateId);
    const operator = operatorFrom(body);
    const now = new Date().toISOString();

    if (action === "approve") {
      requireStatus(candidate, ["pending"]);
      const blessing = candidate.blessings.find(
        (item) => item.blessing_id === String(body.blessing_id || "")
      );
      if (!blessing) throw Object.assign(new Error("Select a valid blessing"), { statusCode: 400 });
      candidate.status = "approved";
      candidate.selected_blessing_id = blessing.blessing_id;
      candidate.approved_text = blessing.text;
      candidate.approved_at = now;
      candidate.approved_by = operator;
      candidate.updated_at = now;
      await appendEvent(eventsPath, eventFor("candidate_approved", candidate, operator, {
        approval_origin: "human",
        auto_approve: false
      }));
    } else if (action === "reject") {
      requireStatus(candidate, ["pending", "approved"]);
      candidate.status = "rejected";
      candidate.rejected_at = now;
      candidate.rejected_by = operator;
      candidate.rejection_reason = String(body.reason || "other").slice(0, 200);
      candidate.updated_at = now;
      await appendEvent(eventsPath, eventFor("candidate_rejected", candidate, operator, {
        reason: candidate.rejection_reason
      }));
    } else if (action === "begin-send") {
      requireStatus(candidate, ["approved"]);
      if (state.halted) {
        throw Object.assign(new Error(`Sending is halted: ${state.halt_reason || "manual stop"}`), {
          statusCode: 423
        });
      }
      if (Object.values(state.candidates).some((item) => item.status === "unconfirmed")) {
        throw Object.assign(new Error("Resolve the current unconfirmed send first"), {
          statusCode: 409
        });
      }
      const startedToday = dailyStartedCount(state, new Date(), timeZone);
      if (startedToday >= dailyLimit || startedToday >= 200) {
        throw Object.assign(new Error("Daily send limit reached"), { statusCode: 429 });
      }
      candidate.status = "unconfirmed";
      candidate.send_time = now;
      candidate.result_at = null;
      candidate.result_by = null;
      candidate.updated_at = now;
      await appendEvent(eventsPath, eventFor("send_started", candidate, operator, {
        send_time: now,
        exact_text: candidate.approved_text
      }));
    } else if (action === "result") {
      requireStatus(candidate, ["unconfirmed"]);
      const result = String(body.result || "");
      if (!["sent", "failed"].includes(result)) {
        throw Object.assign(new Error("Result must be sent or failed"), { statusCode: 400 });
      }
      const messageId = String(body.message_id || "").trim();
      if (result === "sent" && !messageId) {
        throw Object.assign(new Error("message_id is required before marking sent"), {
          statusCode: 400
        });
      }
      candidate.status = result;
      candidate.message_id = messageId || null;
      candidate.message_url = String(body.message_url || "").trim() || null;
      candidate.failure_reason = result === "failed"
        ? String(body.failure_reason || "send_failed").slice(0, 300)
        : null;
      candidate.result_at = now;
      candidate.result_by = operator;
      candidate.updated_at = now;
      await appendEvent(eventsPath, eventFor(`send_${result}`, candidate, operator, {
        message_id: candidate.message_id,
        message_url: candidate.message_url,
        send_time: candidate.send_time,
        result_at: now,
        failure_reason: candidate.failure_reason
      }));
    } else {
      throw Object.assign(new Error("Unknown action"), { statusCode: 404 });
    }

    await saveState(statePath, state, now);
    return candidate;
  });
}

async function setHalt(body) {
  return withMutationLock(async () => {
    const state = await loadState(statePath);
    const operator = operatorFrom(body);
    state.halted = Boolean(body.halted);
    state.halt_reason = state.halted
      ? String(body.reason || "manual safety stop").slice(0, 300)
      : null;
    const now = new Date().toISOString();
    await appendEvent(eventsPath, {
      event_id: `safety_${Date.now()}`,
      event_type: state.halted ? "sending_halted" : "sending_resumed",
      timestamp: now,
      operator,
      status: state.halted ? "halted" : "active",
      reason: state.halt_reason
    });
    await saveState(statePath, state, now);
    return state;
  });
}

createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://${request.headers.host}`);
    if (request.method === "GET" && url.pathname === "/api/send-layer") {
      json(response, 200, await currentPayload());
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/safety") {
      const state = await setHalt(await readBody(request));
      json(response, 200, { halted: state.halted, halt_reason: state.halt_reason });
      return;
    }
    const actionMatch = url.pathname.match(
      /^\/api\/candidates\/([^/]+)\/(approve|reject|begin-send|result)$/
    );
    if (request.method === "POST" && actionMatch) {
      const candidate = await mutateCandidate(
        decodeURIComponent(actionMatch[1]),
        actionMatch[2],
        await readBody(request)
      );
      json(response, 200, { ok: true, candidate });
      return;
    }

    const filePath = url.pathname === "/"
      ? path.join(publicDirectory, "index.html")
      : path.join(publicDirectory, url.pathname);
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(path.resolve(publicDirectory))) {
      throw Object.assign(new Error("Invalid path"), { statusCode: 400 });
    }
    const body = await readFile(resolved);
    response.writeHead(200, {
      "Content-Type": contentTypes[path.extname(resolved)] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    response.end(body);
  } catch (error) {
    if (request.url?.startsWith("/api/")) {
      json(response, error.statusCode || 500, { ok: false, error: error.message });
      return;
    }
    response.writeHead(error.code === "ENOENT" ? 404 : 500, {
      "Content-Type": "text/plain; charset=utf-8"
    });
    response.end(error.code === "ENOENT" ? "Not found" : "Server error");
  }
}).listen(port, host, async () => {
  await syncQueue({ queuePath, statePath });
  console.log(`Fortune Shrine V1.1 send layer: http://${host}:${port}`);
  console.log(`Queue: ${queuePath}`);
  console.log(`Daily limit: ${dailyLimit} (hard maximum 200)`);
});
