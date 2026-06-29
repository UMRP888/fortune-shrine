#!/usr/bin/env node
import { createServer } from "node:http";
import { mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const directory = path.dirname(fileURLToPath(import.meta.url));
const publicDirectory = path.join(directory, "public");
const dataDirectory = path.join(directory, "data");
const domSamplesDirectory = path.join(directory, "fortune-shrine-v07-dom-样本");
const sentHistoryPath = path.join(directory, "..", "v08", "state", "sent-history.json");
const port = Number(process.env.PORT || 4191);
const host = process.env.HOST || "127.0.0.1";
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

async function readJsonBody(request, maximumBytes = 20 * 1024 * 1024) {
  const chunks = [];
  let bytes = 0;
  for await (const chunk of request) {
    bytes += chunk.length;
    if (bytes > maximumBytes) throw new Error("Sample exceeds 20 MB");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function sampleCounts() {
  await mkdir(domSamplesDirectory, { recursive: true });
  const files = await readdir(domSamplesDirectory);
  return {
    success: files.filter((name) => name.startsWith("success-") && name.endsWith(".json")).length,
    failure: files.filter((name) => name.startsWith("failure-") && name.endsWith(".json")).length
  };
}

async function readSentHistory() {
  try {
    const payload = JSON.parse(await readFile(sentHistoryPath, "utf8"));
    return {
      version: payload.version || "0.8",
      updatedAt: payload.updatedAt || null,
      records: Array.isArray(payload.records) ? payload.records : []
    };
  } catch (error) {
    if (error.code === "ENOENT") return { version: "0.8", updatedAt: null, records: [] };
    throw error;
  }
}

async function writeSentHistory(history) {
  await mkdir(path.dirname(sentHistoryPath), { recursive: true });
  const temporary = `${sentHistoryPath}.tmp`;
  await writeFile(temporary, `${JSON.stringify(history, null, 2)}\n`, "utf8");
  await rename(temporary, sentHistoryPath);
}

createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://${request.headers.host}`);
    if (request.method === "POST" && url.pathname === "/api/dom-samples") {
      const sample = await readJsonBody(request);
      if (!["success", "failure"].includes(sample?.outcome)) {
        throw new Error("Invalid sample outcome");
      }
      const countsBefore = await sampleCounts();
      if (countsBefore[sample.outcome] >= 20) {
        response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        response.end(JSON.stringify({
          saved: false,
          reason: `${sample.outcome} sample target reached`,
          counts: countsBefore,
          collectionComplete: countsBefore.success >= 20 && countsBefore.failure >= 20
        }));
        return;
      }
      const timestamp = String(sample.capturedAt || new Date().toISOString())
        .replaceAll(":", "-")
        .replaceAll(".", "-");
      const sampleId = String(sample.sampleId || "sample").replace(/[^a-zA-Z0-9_-]/g, "");
      const filename = `${sample.outcome}-${timestamp}-${sampleId}.json`;
      await mkdir(domSamplesDirectory, { recursive: true });
      await writeFile(
        path.join(domSamplesDirectory, filename),
        `${JSON.stringify(sample, null, 2)}\n`,
        "utf8"
      );
      const counts = await sampleCounts();
      response.writeHead(201, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({
        saved: true,
        filename,
        directory: domSamplesDirectory,
        counts,
        collectionComplete: counts.success >= 20 && counts.failure >= 20
      }));
      return;
    }
    if (request.method === "GET" && url.pathname === "/api/dom-samples/status") {
      const counts = await sampleCounts();
      response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({
        directory: domSamplesDirectory,
        counts,
        collectionComplete: counts.success >= 20 && counts.failure >= 20
      }));
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/sent-history") {
      const body = await readJsonBody(request, 256 * 1024);
      const postId = String(body.postId || "").trim();
      const username = String(body.username || "").trim();
      const blessing = String(body.blessing || "").trim();
      const status = body.status === "unmarked" ? "unmarked" : "sent";
      if (!postId || !username || !blessing) throw new Error("Invalid sent history record");

      const history = await readSentHistory();
      const now = new Date().toISOString();
      const existing = history.records.find((record) => String(record.postId) === postId);
      if (existing) {
        existing.username = username;
        existing.blessing = blessing;
        existing.status = status;
        if (status === "sent" && !existing.sentAt) existing.sentAt = now;
        existing.updatedAt = now;
      } else {
        history.records.push({
          postId,
          username,
          blessing,
          sentAt: status === "sent" ? now : null,
          status,
          updatedAt: now
        });
      }
      history.updatedAt = now;
      await writeSentHistory(history);
      response.writeHead(201, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ saved: true, postId, status }));
      return;
    }
    if (request.method === "GET" && url.pathname === "/api/sent-history") {
      const history = await readSentHistory();
      response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify(history));
      return;
    }
    const filePath = url.pathname === "/"
      ? path.join(publicDirectory, "index.html")
      : url.pathname === "/queue.json"
        ? path.join(dataDirectory, "queue.json")
        : url.pathname === "/polymarket-queue.json"
          ? path.join(dataDirectory, "polymarket-queue.json")
        : path.join(publicDirectory, url.pathname);
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(path.resolve(directory))) throw new Error("Invalid path");
    const body = await readFile(resolved);
    response.writeHead(200, {
      "Content-Type": contentTypes[path.extname(resolved)] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    response.end(body);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
}).listen(port, host, () => {
  console.log(`Fortune Shrine V0.7 sender: http://${host}:${port}`);
});
