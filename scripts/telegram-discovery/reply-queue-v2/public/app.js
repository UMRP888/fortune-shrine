const queueElement = document.querySelector("#queue");
const summaryElement = document.querySelector("#summary");
const loadLatestButton = document.querySelector("#loadLatest");
const loadTodayButton = document.querySelector("#loadToday");
const template = document.querySelector("#cardTemplate");
let lastQueueSignature = "";

function selectedDraft(card, item) {
  const selected = card.querySelector("input[type=radio]:checked");
  return selected ? item[selected.value] : "";
}

async function copyText(text) {
  if (!text) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    let copiedByEvent = false;
    const handleCopy = (event) => {
      event.clipboardData.setData("text/plain", text);
      event.preventDefault();
      copiedByEvent = true;
    };
    document.addEventListener("copy", handleCopy, { once: true });
    document.execCommand("copy");
    document.removeEventListener("copy", handleCopy);
    return copiedByEvent;
  }
}

function itemTitle(item) {
  if (item.author) return `@${item.author}`;
  if (item.username) return `@${item.username}`;
  return item.group || item.community || "Telegram";
}

function itemHomeUrl(item) {
  return item.profileUrl
    || item.profile_url
    || item.authorUrl
    || item.author_url
    || item.originalUrl
    || item.messageUrl
    || "https://web.telegram.org/k/";
}

function itemStatusText(item) {
  if (!item.originalUrl && !item.messageUrl) return "缺少原帖 URL";
  if (item.status === "reviewed" || item.status === "sent") return "已人工发送";
  return "原帖已核验";
}

function render(items) {
  queueElement.replaceChildren();

  for (const item of items) {
    const card = template.content.firstElementChild.cloneNode(true);
    card.dataset.id = item.id;
    card.querySelector("h2").textContent = itemTitle(item);
    card.querySelector(".category").textContent = [
      item.group,
      item.expressionCategory || item.category
    ].filter(Boolean).join(" · ") || "未分类";
    card.querySelector(".post").textContent = item.original || item.message || "无帖子正文";
    card.querySelector(".profile").href = itemHomeUrl(item);

    const status = card.querySelector(".status");
    status.textContent = itemStatusText(item);
    const notice = card.querySelector(".notice");
    if (!item.originalUrl && !item.messageUrl) {
      notice.textContent = "只能复制草稿并打开主页；不会把主页冒充原帖。";
    }

    const options = [...card.querySelectorAll(".reply-option")];
    ["replyDraftA", "replyDraftB", "replyDraftC"].forEach((key, index) => {
      const input = options[index].querySelector("input");
      input.name = `reply-${item.id}`;
      input.value = key;
      input.checked = index === 0;
      options[index].querySelector("span").textContent = item[key] || item.blessingDraft || "";
    });

    card.querySelector(".copy").addEventListener("click", async () => {
      const draft = selectedDraft(card, item);
      const copied = await copyText(draft);
      notice.textContent = copied
        ? "回复草稿已复制。发送前请再次阅读。"
        : "复制失败。请手动选择草稿文本。";
    });

    const openButton = card.querySelector(".open");
    const originalUrl = item.originalUrl || item.messageUrl;
    openButton.disabled = !originalUrl;
    openButton.title = originalUrl
      ? "打开真实原帖；不会自动发送。"
      : "缺少原帖 URL。";
    openButton.addEventListener("click", () => {
      if (!originalUrl) {
        notice.textContent = "缺少原帖 URL，无法打开。";
        return;
      }
      window.open(originalUrl, "_blank", "noopener,noreferrer");
      notice.textContent = "已打开原帖。请人工确认上下文，再手动发送。";
    });

    const markButton = card.querySelector(".mark");
    const updateMarkedState = () => {
      const marked = item.status === "reviewed" || item.status === "sent";
      card.classList.toggle("sent", marked);
      markButton.textContent = marked ? "已人工发送" : "标记为已人工发送";
      status.textContent = itemStatusText(item);
    };
    markButton.disabled = true;
    markButton.title = "Queue Freeze: UI is render-only.";
    markButton.addEventListener("click", () => {
      notice.textContent = "Queue Freeze：状态写入已停用；UI 当前只读。";
    });

    updateMarkedState();
    queueElement.append(card);
  }

  summaryElement.textContent = `${items.length} 位用户 · ${items.filter((item) => item.originalUrl || item.messageUrl).length} 条可直接打开原帖`;
}

async function loadLatest({ force = false } = {}) {
  const response = await fetch("/api/reply-queue", { cache: "no-store" });
  if (!response.ok) throw new Error("Operation Queue 尚未生成");
  const payload = await response.json();
  const queue = payload.queue || [];
  const signature = [
    payload.generatedAt,
    payload.completedAt,
    payload.boundSource,
    queue.length,
    queue.map((item) => `${item.id}:${item.status}`).join("|")
  ].join("::");
  if (!force && signature === lastQueueSignature) return;
  lastQueueSignature = signature;
  render(queue);
}

loadLatestButton.addEventListener("click", () => {
  loadLatest({ force: true }).catch((error) => {
    summaryElement.textContent = error.message;
  });
});

loadTodayButton.addEventListener("click", () => {
  loadLatest({ force: true }).catch((error) => {
    summaryElement.textContent = error.message;
  });
});

loadLatest().catch((error) => {
  summaryElement.textContent = error.message;
});
