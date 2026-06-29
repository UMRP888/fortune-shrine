const queueElement = document.querySelector("#queue");
const summaryElement = document.querySelector("#summary");
const csvInput = document.querySelector("#csvInput");
const loadDefaultButton = document.querySelector("#loadDefault");
const loadPolymarketButton = document.querySelector("#loadPolymarket");
const template = document.querySelector("#cardTemplate");
const sentKey = "fortune-shrine-v07-sent";
const sent = new Set(JSON.parse(localStorage.getItem(sentKey) || "[]"));

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

function encodeDraft(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function normalizedRow(row) {
  return {
    id: (row.post_id || row.id || row.username || row["用户名"] || "").toLowerCase(),
    post_id: row.post_id || row.id || "",
    username: row.username || row["用户名"] || "",
    profile_url: row.profile_url || row["个人资料网址"] || "",
    post_url: row.post_url || "",
    post_url_status: row.post_url_status || (row.post_url ? "verified" : "missing"),
    platform: row.platform || row["平台"] || (row.post_url?.includes("polymarket.com") ? "Polymarket" : "X"),
    comment_id: row.comment_id || row.post_id || "",
    category: row.category || row["类别"] || "",
    latest_post: row.latest_post || row["最新帖子"] || "",
    reply_a: row.reply_a || row["回复_A"] || "",
    reply_b: row.reply_b || row["回复_B"] || "",
    reply_c: row.reply_c || row["回复_C"] || ""
  };
}

function selectedDraft(card, item) {
  const selected = card.querySelector("input[type=radio]:checked");
  return selected ? item[selected.value] : "";
}

function saveSent() {
  localStorage.setItem(sentKey, JSON.stringify([...sent]));
}

function render(rawItems) {
  const items = rawItems.map(normalizedRow).filter((item) => item.username);
  queueElement.replaceChildren();
  for (const item of items) {
    const card = template.content.firstElementChild.cloneNode(true);
    card.dataset.id = item.id;
    card.querySelector("h2").textContent = `@${item.username}`;
    card.querySelector(".category").textContent = item.category || "未分类";
    card.querySelector(".post").textContent = item.latest_post || "无帖子正文";
    card.querySelector(".profile").href = item.profile_url || `https://x.com/${item.username}`;
    const status = card.querySelector(".status");
    status.textContent = item.post_url ? "原帖已核验" : "缺少原帖 URL";
    const notice = card.querySelector(".notice");
    if (!item.post_url) notice.textContent = "只能复制草稿并打开主页；不会把主页冒充原帖。";

    const options = [...card.querySelectorAll(".reply-option")];
    ["reply_a", "reply_b", "reply_c"].forEach((key, index) => {
      const input = options[index].querySelector("input");
      input.name = `reply-${item.id}`;
      input.value = key;
      input.checked = index === 0;
      options[index].querySelector("span").textContent = item[key];
    });

    card.querySelector(".copy").addEventListener("click", async () => {
      const draft = selectedDraft(card, item);
      if (!draft) return;
      await navigator.clipboard.writeText(draft);
      notice.textContent = "回复草稿已复制。发送前请再次阅读。";
    });

    const openButton = card.querySelector(".open");
    openButton.disabled = !item.post_url;
    openButton.addEventListener("click", async () => {
      const draft = selectedDraft(card, item);
      if (!draft || !item.post_url) return;
      await navigator.clipboard.writeText(draft);
      const url = new URL(item.post_url);
      if (item.platform.toLowerCase() === "polymarket") {
        url.hash = `fortune-shrine-pm=${encodeDraft(JSON.stringify({
          commentId: item.comment_id,
          originalText: item.latest_post,
          draft
        }))}`;
      } else {
        url.hash = `fortune-shrine-draft=${encodeDraft(draft)}`;
      }
      window.open(url, "_blank", "noopener,noreferrer");
      notice.textContent = item.platform.toLowerCase() === "polymarket"
        ? "已打开市场。扩展会定位原评论、展开回复框并填入草稿；请人工确认并发布。"
        : "已打开原帖。扩展只会填入草稿；请在 X 页面人工确认并发送。";
    });

    const markButton = card.querySelector(".mark");
    if (sent.has(item.id)) {
      card.classList.add("sent");
      markButton.textContent = "已人工发送";
    }
    markButton.addEventListener("click", async () => {
      const willBeSent = !sent.has(item.id);
      const historyResponse = await fetch("/api/sent-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: item.post_id || item.id,
          username: item.username,
          blessing: selectedDraft(card, item),
          status: willBeSent ? "sent" : "unmarked"
        })
      });
      if (!historyResponse.ok) {
        notice.textContent = "发送历史保存失败；本地状态未改变。";
        return;
      }
      if (willBeSent) sent.add(item.id);
      else sent.delete(item.id);
      saveSent();
      card.classList.toggle("sent", sent.has(item.id));
      markButton.textContent = sent.has(item.id) ? "已人工发送" : "标记为已人工发送";
    });
    queueElement.append(card);
  }
  summaryElement.textContent = `${items.length} 位用户 · ${items.filter((item) => item.post_url).length} 条可直接打开原帖`;
}

async function loadDefault() {
  return loadQueue("/queue.json", "默认队列不存在");
}

async function loadQueue(path, missingMessage) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(missingMessage);
  const payload = await response.json();
  render(payload.queue || []);
}

loadDefaultButton.addEventListener("click", () => {
  loadDefault().catch((error) => {
    summaryElement.textContent = error.message;
  });
});

loadPolymarketButton.addEventListener("click", () => {
  loadQueue("/polymarket-queue.json", "Polymarket 队列不存在").catch((error) => {
    summaryElement.textContent = error.message;
  });
});

csvInput.addEventListener("change", async () => {
  const file = csvInput.files?.[0];
  if (!file) return;
  render(parseCsv(await file.text()));
});

loadDefault().catch(() => {
  summaryElement.textContent = "请导入 V0.6 CSV，或先运行 prepare-queue.mjs。";
});
