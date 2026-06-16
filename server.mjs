import http from "node:http";
import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "public");
const dataDir = path.join(__dirname, "data");
const memoryLogPath = path.join(dataDir, "shrine-memory-log.jsonl");
const port = Number(process.env.PORT || 4188);
const solanaRpcUrls = [
  process.env.SOLANA_RPC_URL,
  ...(process.env.SOLANA_RPC_FALLBACK_URLS || "").split(","),
  "https://solana-rpc.publicnode.com",
  "https://api.mainnet-beta.solana.com"
].map((url) => url?.trim()).filter(Boolean).filter((url, index, urls) => urls.indexOf(url) === index);
const recipientAddress = "HMmUVQx6ToGQa8Fnd6aicHhpF1ti9QrzqNNC8187Y4s1";
const usdcMint = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const recipientUsdcTokenAccounts = [
  process.env.RECIPIENT_USDC_TOKEN_ACCOUNT,
  "x3Z8urUdAuqhT9Ev47krtHvsZ6yKqgWLTFB3yhjaUfd"
].map((account) => account?.trim()).filter(Boolean).filter((account, index, accounts) => accounts.indexOf(account) === index);
const paymentIntents = new Map();
const usedSignatures = new Set();
const manualTransferScanLimit = 35;
const manualTransferCreatedAtToleranceSeconds = 180;
const offerings = new Map([
  ["traveler", { name: "Traveler's Offering", amount: "5" }],
  ["keeper", { name: "Keeper's Offering", amount: "15" }],
  ["sacred", { name: "Sacred Offering", amount: "35" }],
  ["eternal", { name: "Eternal Offering", amount: "88" }]
]);

const types = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".md", "text/markdown; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml; charset=utf-8"]
]);

function sendJson(response, status, body) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(body));
}

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function isLocalRequest(request, url) {
  const host = url.hostname;
  const remoteAddress = request.socket.remoteAddress;
  return host === "127.0.0.1"
    || host === "localhost"
    || remoteAddress === "127.0.0.1"
    || remoteAddress === "::1"
    || remoteAddress === "::ffff:127.0.0.1";
}

const base58Alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function encodeBase58(bytes) {
  let digits = [0];

  for (const byte of bytes) {
    let carry = byte;
    for (let index = 0; index < digits.length; index += 1) {
      carry += digits[index] << 8;
      digits[index] = carry % 58;
      carry = Math.floor(carry / 58);
    }

    while (carry > 0) {
      digits.push(carry % 58);
      carry = Math.floor(carry / 58);
    }
  }

  for (const byte of bytes) {
    if (byte === 0) digits.push(0);
    else break;
  }

  return digits.reverse().map((digit) => base58Alphabet[digit]).join("");
}

function createReference() {
  return encodeBase58(crypto.randomBytes(32));
}

function supersedePendingIntents({ amount, exceptId }) {
  for (const intent of paymentIntents.values()) {
    if (intent.id === exceptId) continue;
    if (intent.amount !== amount) continue;
    if (intent.status !== "created") continue;

    intent.status = "superseded";
    intent.supersededAt = new Date().toISOString();
    console.log("[payment-intent-superseded]", {
      id: intent.id,
      offeringId: intent.offeringId,
      amount: intent.amount,
      supersededBy: exceptId
    });
  }
}

function createPaymentIntent(offeringId, overrides = {}) {
  const offering = offerings.get(offeringId);
  if (!offering) return null;

  const reference = createReference();
  const intent = {
    id: crypto.randomUUID(),
    offeringId,
    offeringName: offering.name,
    amount: offering.amount,
    token: "USDC",
    chain: "solana",
    recipientAddress,
    usdcMint,
    reference,
    status: "created",
    createdAt: new Date().toISOString(),
    expiresAt: Date.now() + 30 * 60 * 1000,
    ...overrides
  };

  intent.solanaPayUrl = createSolanaPayUrl(intent);
  supersedePendingIntents({ amount: intent.amount, exceptId: intent.id });
  paymentIntents.set(intent.id, intent);
  return intent;
}

function paymentIntentPayload(intent) {
  return {
    id: intent.id,
    offeringName: intent.offeringName,
    amount: intent.amount,
    token: intent.token,
    chain: intent.chain,
    recipientAddress: intent.recipientAddress,
    usdcMint: intent.usdcMint,
    reference: intent.reference,
    solanaPayUrl: intent.solanaPayUrl,
    status: intent.status
  };
}

function createSolanaPayUrl({ amount, reference, offeringName }) {
  const params = new URLSearchParams({
    amount,
    "spl-token": usdcMint,
    reference,
    label: "Fortune Shrine",
    message: offeringName
  });

  return `solana:${recipientAddress}?${params.toString()}`;
}

function amountToUnits(amount) {
  const [whole, fractional = ""] = amount.split(".");
  return BigInt(whole + fractional.padEnd(6, "0").slice(0, 6));
}

function hashPublicIdentifier(value) {
  if (!value) return null;
  return `sha256:${crypto.createHash("sha256").update(String(value)).digest("hex").slice(0, 16)}`;
}

function truncateText(value, limit = 2000) {
  if (value == null) return null;
  const text = String(value);
  return text.length > limit ? `${text.slice(0, limit)}...` : text;
}

function extractPayerAddress(transaction, expectedUnits) {
  const instructions = transaction?.transaction?.message?.instructions || [];

  for (const instruction of instructions) {
    const parsed = instruction?.parsed;
    const info = parsed?.info;
    if (parsed?.type !== "transferChecked") continue;
    if (info?.mint !== usdcMint) continue;
    if (BigInt(info?.tokenAmount?.amount || "0") < expectedUnits) continue;
    return info.authority || info.multisigAuthority || null;
  }

  return null;
}

async function appendMemoryLog(entry) {
  await mkdir(dataDir, { recursive: true });
  await appendFile(memoryLogPath, `${JSON.stringify(entry)}\n`, "utf8");
}

async function callSolanaRpcUrl(rpcUrl, method, params, timeoutMs = 6500) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const rpcResponse = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: crypto.randomUUID(),
        method,
        params
      })
    });

    const responseText = await rpcResponse.text();
    if (!rpcResponse.ok) throw new Error(`HTTP ${rpcResponse.status}: ${responseText.slice(0, 120)}`);

    let payload;
    try {
      payload = JSON.parse(responseText);
    } catch {
      throw new Error(`Non-JSON response: ${responseText.slice(0, 120)}`);
    }

    if (payload.error) throw new Error(payload.error.message || "Solana RPC error");
    return payload.result;
  } finally {
    clearTimeout(timeout);
  }
}

async function solanaRpc(method, params) {
  let lastError;

  for (const rpcUrl of solanaRpcUrls) {
    try {
      return await callSolanaRpcUrl(rpcUrl, method, params);
    } catch (error) {
      lastError = error;
      console.warn("[solana-rpc-fallback]", {
        method,
        rpcUrl,
        error: error.message
      });
    }
  }

  throw lastError || new Error("Solana RPC unavailable");
}

async function getSignaturesForAddress(address, options = {}) {
  const params = [
    address,
    {
      commitment: "confirmed",
      ...options
    }
  ];
  const results = await Promise.allSettled(
    solanaRpcUrls.map((rpcUrl) => callSolanaRpcUrl(rpcUrl, "getSignaturesForAddress", params, 1800))
  );
  const signaturesById = new Map();

  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    for (const signatureInfo of result.value || []) {
      if (!signatureInfo?.signature) continue;
      const existing = signaturesById.get(signatureInfo.signature);
      if (!existing || (signatureInfo.blockTime || 0) > (existing.blockTime || 0)) {
        signaturesById.set(signatureInfo.signature, signatureInfo);
      }
    }
  }

  if (signaturesById.size) {
    return [...signaturesById.values()].sort((left, right) => (right.blockTime || 0) - (left.blockTime || 0));
  }

  const errors = results
    .filter((result) => result.status === "rejected")
    .map((result) => result.reason?.message || "unknown error")
    .join("; ");
  throw new Error(errors || "No signatures returned");
}

function tokenBalanceAmount(balance) {
  return BigInt(balance?.uiTokenAmount?.amount || "0");
}

function publicKeyString(account) {
  if (typeof account === "string") return account;
  if (typeof account?.pubkey === "string") return account.pubkey;
  if (account?.pubkey && typeof account.pubkey.toString === "function") return account.pubkey.toString();
  return "";
}

async function isRecipientUsdcTokenAccount(tokenAccountAddress) {
  if (!tokenAccountAddress) return false;

  const account = await solanaRpc("getAccountInfo", [
    tokenAccountAddress,
    { encoding: "jsonParsed" }
  ]);
  const info = account?.value?.data?.parsed?.info;

  return info?.mint === usdcMint && info?.owner === recipientAddress;
}

function verifiedUsdcDelta(transaction, expectedUnits) {
  const preBalances = transaction?.meta?.preTokenBalances || [];
  const postBalances = transaction?.meta?.postTokenBalances || [];
  const accountKeys = transaction?.transaction?.message?.accountKeys || [];
  const instructions = transaction?.transaction?.message?.instructions || [];

  for (const postBalance of postBalances) {
    if (postBalance.mint !== usdcMint || postBalance.owner !== recipientAddress) continue;

    const preBalance = preBalances.find((balance) => balance.accountIndex === postBalance.accountIndex);
    const delta = tokenBalanceAmount(postBalance) - tokenBalanceAmount(preBalance);
    if (delta >= expectedUnits) return delta;
  }

  for (const instruction of instructions) {
    const parsed = instruction?.parsed;
    const info = parsed?.info;
    if (parsed?.type !== "transferChecked") continue;
    if (info?.mint !== usdcMint) continue;
    if (BigInt(info?.tokenAmount?.amount || "0") < expectedUnits) continue;

    const destinationIndex = accountKeys.findIndex((account) => {
      return publicKeyString(account) === info.destination;
    });

    const destinationBalance = postBalances.find((balance) => balance.accountIndex === destinationIndex);
    if (destinationBalance?.mint === usdcMint && destinationBalance?.owner === recipientAddress) {
      return BigInt(info.tokenAmount.amount);
    }
  }

  return 0n;
}

async function verifiedUsdcTransfer(transaction, expectedUnits) {
  const delta = verifiedUsdcDelta(transaction, expectedUnits);
  if (delta) return delta;

  const instructions = transaction?.transaction?.message?.instructions || [];
  for (const instruction of instructions) {
    const parsed = instruction?.parsed;
    const info = parsed?.info;
    if (parsed?.type !== "transferChecked") continue;
    if (info?.mint !== usdcMint) continue;
    if (BigInt(info?.tokenAmount?.amount || "0") < expectedUnits) continue;
    if (await isRecipientUsdcTokenAccount(info.destination)) return BigInt(info.tokenAmount.amount);
  }

  return 0n;
}

async function verifySignaturesForIntent(intent, signatures, { requireCreatedAfter = false } = {}) {
  const expectedUnits = amountToUnits(intent.amount);
  const createdAtSeconds = Math.floor(new Date(intent.createdAt).getTime() / 1000);

  for (const signatureInfo of signatures || []) {
    if (!signatureInfo?.signature) continue;
    if (!intent.allowHistoricalSignature && usedSignatures.has(signatureInfo.signature)) continue;
    if (
      requireCreatedAfter &&
      signatureInfo.blockTime &&
      signatureInfo.blockTime < createdAtSeconds - manualTransferCreatedAtToleranceSeconds
    ) {
      continue;
    }

    const transaction = await solanaRpc("getTransaction", [
      signatureInfo.signature,
      {
        commitment: "confirmed",
        encoding: "jsonParsed",
        maxSupportedTransactionVersion: 0
      }
    ]);

    if (!transaction || transaction?.meta?.err) continue;
    if (
      requireCreatedAfter &&
      transaction.blockTime &&
      transaction.blockTime < createdAtSeconds - manualTransferCreatedAtToleranceSeconds
    ) {
      continue;
    }

    const receivedUnits = await verifiedUsdcTransfer(transaction, expectedUnits);
    if (!receivedUnits) continue;

    const payerAddress = extractPayerAddress(transaction, expectedUnits);
    intent.status = "verified";
    intent.verifiedSignature = signatureInfo.signature;
    intent.verifiedAt = new Date().toISOString();
    intent.verifiedBy = requireCreatedAfter ? "matching-transfer" : "reference";
    intent.receivedAmount = (Number(receivedUnits) / 1_000_000).toFixed(6).replace(/\.?0+$/, "");
    intent.walletHash = hashPublicIdentifier(payerAddress);
    if (!intent.allowHistoricalSignature) usedSignatures.add(signatureInfo.signature);
    console.log("[payment-verified]", {
      id: intent.id,
      offeringId: intent.offeringId,
      amount: intent.amount,
      receivedAmount: intent.receivedAmount,
      verifiedBy: intent.verifiedBy,
      signature: intent.verifiedSignature,
      walletHash: intent.walletHash
    });
    return intent;
  }

  return null;
}

async function getRecipientTokenAccounts() {
  const result = await solanaRpc("getTokenAccountsByOwner", [
    recipientAddress,
    { mint: usdcMint },
    { encoding: "jsonParsed" }
  ]);

  return (result?.value || []).map((account) => account.pubkey).filter(Boolean);
}

async function verifyPaymentIntent(intent) {
  if (intent.status === "verified" || intent.status === "superseded") return intent;
  if (Date.now() > intent.expiresAt) {
    intent.status = "expired";
    return intent;
  }

  if (intent.submittedSignature) {
    const submittedMatch = await verifySignaturesForIntent(intent, [
      { signature: intent.submittedSignature }
    ], {
      requireCreatedAfter: false
    });
    if (submittedMatch) return submittedMatch;
  }

  let tokenAccounts = recipientUsdcTokenAccounts;
  if (!tokenAccounts.length) tokenAccounts = await getRecipientTokenAccounts();

  for (const tokenAccount of tokenAccounts) {
    const tokenAccountSignatures = await getSignaturesForAddress(tokenAccount, {
      limit: manualTransferScanLimit
    });
    const tokenAccountMatch = await verifySignaturesForIntent(intent, tokenAccountSignatures, {
      requireCreatedAfter: true
    });
    if (tokenAccountMatch) return tokenAccountMatch;

    if (!intent.lastScanMissLoggedAt || Date.now() - intent.lastScanMissLoggedAt > 5000) {
      intent.lastScanMissLoggedAt = Date.now();
      console.log("[payment-token-scan-miss]", {
        id: intent.id,
        offeringId: intent.offeringId,
        amount: intent.amount,
        createdAt: intent.createdAt,
        tokenAccount,
        signatures: (tokenAccountSignatures || []).slice(0, 3).map((signatureInfo) => ({
          signature: signatureInfo.signature,
          blockTime: signatureInfo.blockTime,
          date: signatureInfo.blockTime ? new Date(signatureInfo.blockTime * 1000).toISOString() : null
        }))
      });
    }
  }

  const signatures = await getSignaturesForAddress(intent.reference, {
    limit: 12
  });

  const referenceMatch = await verifySignaturesForIntent(intent, signatures);
  if (referenceMatch) return referenceMatch;

  return intent;
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://${request.headers.host}`);

    if (request.method === "POST" && url.pathname === "/api/payment-intents") {
      const body = await readJson(request);
      const intent = createPaymentIntent(body.offeringId);

      if (!intent) {
        sendJson(response, 400, { error: "Unknown offering." });
        return;
      }
      console.log("[payment-intent]", {
        id: intent.id,
        offeringId: intent.offeringId,
        amount: intent.amount,
        token: intent.token,
        recipientAddress: intent.recipientAddress,
        usdcMint: intent.usdcMint,
        reference: intent.reference,
        solanaPayUrl: intent.solanaPayUrl
      });

      sendJson(response, 201, paymentIntentPayload(intent));
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/payment-intents/recover") {
      if (!isLocalRequest(request, url)) {
        sendJson(response, 403, { error: "Recovery is local only." });
        return;
      }

      const body = await readJson(request);
      const signature = String(body.signature || "").trim();
      if (!/^[1-9A-HJ-NP-Za-km-z]{64,100}$/.test(signature)) {
        sendJson(response, 400, { error: "Invalid Solana signature." });
        return;
      }

      const intent = createPaymentIntent(body.offeringId || "traveler", {
        submittedSignature: signature,
        signatureSubmittedAt: new Date().toISOString(),
        allowHistoricalSignature: true
      });
      if (!intent) {
        sendJson(response, 400, { error: "Unknown offering." });
        return;
      }

      console.log("[payment-recovery]", {
        id: intent.id,
        offeringId: intent.offeringId,
        signature: intent.submittedSignature
      });

      sendJson(response, 201, paymentIntentPayload(intent));
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/solana/latest-blockhash") {
      try {
        const latestBlockhash = await solanaRpc("getLatestBlockhash", [
          { commitment: "confirmed" }
        ]);
        sendJson(response, 200, latestBlockhash?.value || latestBlockhash);
      } catch {
        sendJson(response, 502, { error: "Solana RPC unavailable." });
      }
      return;
    }

    const signatureMatch = url.pathname.match(/^\/api\/payment-intents\/([^/]+)\/signature$/);
    if (request.method === "POST" && signatureMatch) {
      const intent = paymentIntents.get(signatureMatch[1]);
      if (!intent) {
        sendJson(response, 404, { error: "Payment intent not found." });
        return;
      }

      const body = await readJson(request);
      const signature = String(body.signature || "").trim();

      if (!/^[1-9A-HJ-NP-Za-km-z]{64,100}$/.test(signature)) {
        sendJson(response, 400, { error: "Invalid Solana signature." });
        return;
      }

      intent.submittedSignature = signature;
      intent.signatureSubmittedAt = new Date().toISOString();
      console.log("[payment-signature]", {
        id: intent.id,
        offeringId: intent.offeringId,
        signature: intent.submittedSignature
      });

      try {
        await verifySignaturesForIntent(intent, [
          { signature: intent.submittedSignature }
        ], {
          requireCreatedAfter: false
        });
      } catch (error) {
        console.warn("[payment-signature-pending]", {
          id: intent.id,
          offeringId: intent.offeringId,
          signature: intent.submittedSignature,
          error: error.message
        });
      }

      sendJson(response, 200, {
        id: intent.id,
        status: intent.status,
        signatureSubmitted: true,
        verifiedSignature: intent.verifiedSignature || null,
        verifiedAt: intent.verifiedAt || null,
        verifiedBy: intent.verifiedBy || null,
        receivedAmount: intent.receivedAmount || null,
        walletHash: intent.walletHash || null
      });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/memory-log") {
      const body = await readJson(request);
      const sessionId = String(body.sessionId || "").trim();
      const paymentAmount = String(body.paymentAmount || "").trim();
      const paymentStatus = String(body.paymentStatus || "unknown").trim();
      const walletHash = body.walletHash ? String(body.walletHash).trim() : null;

      if (!/^[0-9a-f-]{16,64}$/i.test(sessionId)) {
        sendJson(response, 400, { error: "Invalid session id." });
        return;
      }

      const entry = {
        version: "0.1",
        sessionId,
        timestamp: new Date().toISOString(),
        walletHash: walletHash && walletHash.startsWith("sha256:") ? walletHash : null,
        userInput: truncateText(body.userInput),
        generatedBlessing: {
          recognition: truncateText(body.generatedBlessing?.recognition),
          blessing: truncateText(body.generatedBlessing?.blessing),
          oracle: truncateText(body.generatedBlessing?.oracle)
        },
        paymentStatus,
        paymentAmount,
        category: null,
        emotion: null,
        need: null,
        theme: null,
        return_count: null,
        language: "en",
        metadata: {
          offeringId: truncateText(body.metadata?.offeringId, 120),
          offeringName: truncateText(body.metadata?.offeringName, 160),
          token: truncateText(body.metadata?.token, 40),
          chain: truncateText(body.metadata?.chain, 40),
          verifiedBy: truncateText(body.metadata?.verifiedBy, 80),
          verifiedAt: truncateText(body.metadata?.verifiedAt, 80),
          source: "fortune-shrine-web"
        }
      };

      appendMemoryLog(entry).catch((error) => {
        console.warn("[memory-log-failed]", {
          sessionId,
          error: error.message
        });
      });

      sendJson(response, 202, { ok: true });
      return;
    }

    const statusMatch = url.pathname.match(/^\/api\/payment-intents\/([^/]+)\/status$/);
    if (request.method === "GET" && statusMatch) {
      const intent = paymentIntents.get(statusMatch[1]);
      if (!intent) {
        sendJson(response, 404, { error: "Payment intent not found." });
        return;
      }

      try {
        await verifyPaymentIntent(intent);
      } catch (error) {
        console.warn("[payment-status-pending]", {
          id: intent.id,
          offeringId: intent.offeringId,
          amount: intent.amount,
          status: intent.status,
          error: error.message
        });
        sendJson(response, 200, {
          id: intent.id,
          status: intent.status,
          signatureSubmitted: Boolean(intent.submittedSignature),
          verificationPending: true,
          error: "Verification is still pending."
        });
        return;
      }

      sendJson(response, 200, {
        id: intent.id,
        status: intent.status,
        signatureSubmitted: Boolean(intent.submittedSignature),
        verifiedSignature: intent.verifiedSignature || null,
        verifiedAt: intent.verifiedAt || null,
        verifiedBy: intent.verifiedBy || null,
        receivedAmount: intent.receivedAmount || null,
        walletHash: intent.walletHash || null
      });
      return;
    }

    const recoverStatusMatch = url.pathname.match(/^\/api\/payment-intents\/([^/]+)\/recover-status$/);
    if (request.method === "GET" && recoverStatusMatch) {
      const intent = paymentIntents.get(recoverStatusMatch[1]);
      if (!intent) {
        sendJson(response, 404, { error: "Payment intent not found." });
        return;
      }

      if (!intent.submittedSignature) {
        sendJson(response, 400, { error: "No submitted signature." });
        return;
      }

      try {
        await verifySignaturesForIntent(intent, [
          { signature: intent.submittedSignature }
        ], {
          requireCreatedAfter: false
        });
      } catch (error) {
        sendJson(response, 200, {
          id: intent.id,
          status: intent.status,
          signatureSubmitted: true,
          verificationPending: true,
          error: error.message
        });
        return;
      }

      sendJson(response, 200, {
        id: intent.id,
        status: intent.status,
        signatureSubmitted: true,
        verifiedSignature: intent.verifiedSignature || null,
        verifiedAt: intent.verifiedAt || null,
        verifiedBy: intent.verifiedBy || null,
        receivedAmount: intent.receivedAmount || null,
        walletHash: intent.walletHash || null
      });
      return;
    }

    const requestedPath = url.pathname === "/" ? "/index.html" : url.pathname;
    const safePath = path.normalize(decodeURIComponent(requestedPath)).replace(/^(\.\.[/\\])+/, "");
    const filePath = path.join(publicDir, safePath);

    if (!filePath.startsWith(publicDir)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    const body = await readFile(filePath);
    response.writeHead(200, {
      "Content-Type": types.get(path.extname(filePath)) || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    response.end(body);
  } catch (error) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Fortune Shrine running at http://127.0.0.1:${port}`);
});
