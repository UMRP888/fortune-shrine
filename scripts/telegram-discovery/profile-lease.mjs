import { mkdir, open, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_POLL_MS = 1_000;
const DEFAULT_TIMEOUT_MS = 10 * 60 * 1_000;

function leasePath(profileDir) {
  return path.join(profileDir, ".fortune-shrine-profile-lease");
}

async function processExists(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code === "EPERM";
  }
}

async function readOwner(filePath) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch {
    return null;
  }
}

async function removeStaleLease(filePath) {
  const owner = await readOwner(filePath);
  if (owner && await processExists(Number(owner.pid))) return false;
  await rm(filePath, { force: true });
  return true;
}

export async function acquireProfileLease(profileDir, {
  owner = "telegram-discovery",
  timeoutMs = DEFAULT_TIMEOUT_MS,
  pollMs = DEFAULT_POLL_MS
} = {}) {
  await mkdir(profileDir, { recursive: true });
  const filePath = leasePath(profileDir);
  const startedAt = Date.now();
  const token = `${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  while (Date.now() - startedAt < timeoutMs) {
    let handle;
    try {
      handle = await open(filePath, "wx");
      await writeFile(handle, `${JSON.stringify({
        pid: process.pid,
        owner,
        token,
        acquiredAt: new Date().toISOString()
      }, null, 2)}\n`);
      await handle.close();

      let released = false;
      return {
        filePath,
        async release() {
          if (released) return;
          released = true;
          const current = await readOwner(filePath);
          if (current?.token === token) {
            await rm(filePath, { force: true });
          }
        }
      };
    } catch (error) {
      await handle?.close().catch(() => {});
      if (error.code !== "EEXIST") throw error;
      if (await removeStaleLease(filePath)) continue;
      await new Promise((resolve) => setTimeout(resolve, pollMs));
    }
  }

  const current = await readOwner(filePath);
  throw new Error(
    `Telegram browser profile is busy${current?.owner ? ` (${current.owner}, PID ${current.pid})` : ""}.`
  );
}
