const queueElement = document.querySelector("#queue");
const statsElement = document.querySelector("#stats");
const trendElement = document.querySelector("#trend");
const filtersElement = document.querySelector("#filters");
const noticeElement = document.querySelector("#notice");
const operatorElement = document.querySelector("#operator");
const haltButton = document.querySelector("#haltButton");
const template = document.querySelector("#cardTemplate");
let payload;
let activeStatus = "pending";

function encodeDraft(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function operator() {
  return operatorElement.value.trim();
}

async function post(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ operator: operator(), ...body })
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`);
  return result;
}

function stat(label, value) {
  const item = document.createElement("div");
  item.className = "stat";
  item.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
  return item;
}

function renderStats() {
  const stats = payload.stats;
  statsElement.replaceChildren(
    stat("今日发送", stats.todaySent),
    stat("累计发送", stats.cumulativeSent),
    stat("成功率", `${stats.successRate}%`),
    stat("失败", stats.failedCount),
    stat("待确认", stats.unconfirmedCount)
  );
  const maximum = Math.max(1, ...stats.trend7Days.map((item) => item.sent));
  trendElement.replaceChildren(...stats.trend7Days.map((item) => {
    const column = document.createElement("div");
    column.className = "trend-column";
    column.innerHTML = `
      <span>${item.sent}</span>
      <i style="height:${Math.max(4, item.sent / maximum * 80)}px"></i>
      <small>${item.date.slice(5)}</small>
    `;
    return column;
  }));
  haltButton.textContent = payload.halted ? "恢复发送" : "暂停发送";
  haltButton.classList.toggle("danger", !payload.halted);
  document.querySelector("#safety").classList.toggle("halted", payload.halted);
  if (payload.halted) noticeElement.textContent = `发送已暂停：${payload.halt_reason || "人工安全停止"}`;
}

function blessingOptions(fieldset, candidate) {
  fieldset.replaceChildren(fieldset.querySelector("legend"));
  candidate.blessings.forEach((blessing, index) => {
    const label = document.createElement("label");
    label.className = "blessing-option";
    const input = document.createElement("input");
    input.type = "radio";
    input.name = `blessing-${candidate.candidate_id}`;
    input.value = blessing.blessing_id;
    input.checked = index === 0;
    const span = document.createElement("span");
    span.textContent = blessing.text;
    label.append(input, span);
    fieldset.append(label);
  });
}

function show(element, visible) {
  element.hidden = !visible;
}

function renderQueue() {
  const candidates = payload.candidates.filter((item) => item.status === activeStatus);
  queueElement.replaceChildren();
  if (!candidates.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "此状态下暂无记录。";
    queueElement.append(empty);
    return;
  }
  for (const candidate of candidates) {
    const card = template.content.firstElementChild.cloneNode(true);
    card.dataset.candidateId = candidate.candidate_id;
    card.querySelector("h2").textContent = `@${candidate.username}`;
    const category = candidate.category || "未分类";
    const platformAndCategory = category.toLowerCase().startsWith(candidate.platform.toLowerCase())
      ? category
      : `${candidate.platform} · ${category}`;
    card.querySelector(".meta").textContent =
      `${platformAndCategory} · ${candidate.candidate_id}`;
    card.querySelector(".status").textContent = candidate.status;
    card.querySelector(".original").textContent = candidate.original_text;
    const fieldset = card.querySelector(".blessings");
    blessingOptions(fieldset, candidate);

    const approvalActions = card.querySelector(".approval-actions");
    const sendActions = card.querySelector(".send-actions");
    const resultActions = card.querySelector(".result-actions");
    show(fieldset, candidate.status === "pending");
    show(approvalActions, candidate.status === "pending");
    show(sendActions, candidate.status === "approved");
    show(resultActions, candidate.status === "unconfirmed");

    if (candidate.approved_text) {
      card.querySelector(".approved-copy").textContent = candidate.approved_text;
    }

    const cardNotice = card.querySelector(".card-notice");
    card.querySelector(".approve").addEventListener("click", async () => {
      const blessingId = card.querySelector("input[type=radio]:checked")?.value;
      if (!operator()) return cardNotice.textContent = "请填写 operator。";
      try {
        await post(`/api/candidates/${candidate.candidate_id}/approve`, {
          blessing_id: blessingId
        });
        await refresh("已审批；尚未发送。");
      } catch (error) {
        cardNotice.textContent = error.message;
      }
    });
    card.querySelector(".reject").addEventListener("click", async () => {
      if (!operator()) return cardNotice.textContent = "请填写 operator。";
      const reason = window.prompt("Reject reason", "poor_fit");
      if (reason === null) return;
      try {
        await post(`/api/candidates/${candidate.candidate_id}/reject`, { reason });
        await refresh("候选已拒绝。");
      } catch (error) {
        cardNotice.textContent = error.message;
      }
    });
    card.querySelector(".send").addEventListener("click", async () => {
      if (!operator()) return cardNotice.textContent = "请填写 operator。";
      if (!window.confirm(`只处理这一条：@${candidate.username}\n\n确认打开原帖并填入已审批祝福？`)) {
        return;
      }
      try {
        await post(`/api/candidates/${candidate.candidate_id}/begin-send`, {});
        const url = new URL(candidate.post_url);
        url.hash = `fortune-shrine-draft=${encodeDraft(candidate.approved_text)}`;
        window.open(url, "_blank", "noopener,noreferrer");
        activeStatus = "unconfirmed";
        await refresh("已打开一条发送任务。必须先记录结果，才能处理下一条。");
      } catch (error) {
        cardNotice.textContent = error.message;
      }
    });
    card.querySelector(".mark-sent").addEventListener("click", async () => {
      const messageId = card.querySelector(".message-id").value.trim();
      const messageUrl = card.querySelector(".message-url").value.trim();
      try {
        await post(`/api/candidates/${candidate.candidate_id}/result`, {
          result: "sent",
          message_id: messageId,
          message_url: messageUrl
        });
        activeStatus = "sent";
        await refresh("发送结果已记录为 Sent。");
      } catch (error) {
        cardNotice.textContent = error.message;
      }
    });
    card.querySelector(".mark-failed").addEventListener("click", async () => {
      const failureReason = card.querySelector(".failure-reason").value.trim();
      try {
        await post(`/api/candidates/${candidate.candidate_id}/result`, {
          result: "failed",
          failure_reason: failureReason || "send_failed"
        });
        activeStatus = "failed";
        await refresh("发送结果已记录为 Failed；系统不会自动重试。");
      } catch (error) {
        cardNotice.textContent = error.message;
      }
    });
    queueElement.append(card);
  }
}

async function refresh(message = "") {
  const response = await fetch("/api/send-layer", { cache: "no-store" });
  payload = await response.json();
  if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
  noticeElement.textContent = message;
  renderStats();
  renderQueue();
}

filtersElement.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-status]");
  if (!button) return;
  activeStatus = button.dataset.status;
  filtersElement.querySelectorAll("button").forEach((item) =>
    item.classList.toggle("active", item === button)
  );
  renderQueue();
});

haltButton.addEventListener("click", async () => {
  if (!operator()) return noticeElement.textContent = "请填写 operator。";
  const halted = !payload.halted;
  const reason = halted
    ? window.prompt("暂停原因", "manual safety stop")
    : "manual resume";
  if (reason === null) return;
  try {
    await post("/api/safety", { halted, reason });
    await refresh(halted ? "发送已暂停。" : "发送已恢复。");
  } catch (error) {
    noticeElement.textContent = error.message;
  }
});

refresh().catch((error) => {
  noticeElement.textContent = `发送层载入失败：${error.message}`;
});
