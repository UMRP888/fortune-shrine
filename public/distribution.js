const state = {
  token: sessionStorage.getItem("fortune-shrine-admin-token") || "",
  targets: [],
  selected: new Set()
};

const elements = {
  authPanel: document.querySelector("#authPanel"),
  adminToken: document.querySelector("#adminToken"),
  unlockButton: document.querySelector("#unlockButton"),
  workspace: document.querySelector("#workspace"),
  connectionState: document.querySelector("#connectionState"),
  refreshButton: document.querySelector("#refreshButton"),
  totalCount: document.querySelector("#totalCount"),
  qualifiedCount: document.querySelector("#qualifiedCount"),
  approvedCount: document.querySelector("#approvedCount"),
  sentCount: document.querySelector("#sentCount"),
  platformFilter: document.querySelector("#platformFilter"),
  decisionFilter: document.querySelector("#decisionFilter"),
  searchRedditButton: document.querySelector("#searchRedditButton"),
  searchXButton: document.querySelector("#searchXButton"),
  importButton: document.querySelector("#importButton"),
  exportButton: document.querySelector("#exportButton"),
  selectAll: document.querySelector("#selectAll"),
  selectedCount: document.querySelector("#selectedCount"),
  approveSelected: document.querySelector("#approveSelected"),
  rejectSelected: document.querySelector("#rejectSelected"),
  targetList: document.querySelector("#targetList"),
  emptyState: document.querySelector("#emptyState"),
  importDialog: document.querySelector("#importDialog"),
  importText: document.querySelector("#importText"),
  submitImport: document.querySelector("#submitImport"),
  toast: document.querySelector("#toast")
};

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.remove("hidden");
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => elements.toast.classList.add("hidden"), 3600);
}

async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("X-Admin-Token", state.token);
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const response = await fetch(path, { ...options, headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `Request failed with ${response.status}.`);
  return payload;
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;"
  })[character]);
}

function visibleTargets() {
  const platform = elements.platformFilter.value;
  const decision = elements.decisionFilter.value;
  return state.targets.filter((target) => {
    return target.score >= 70
      && (platform === "all" || target.platform === platform)
      && (decision === "all" || target.decision === decision);
  });
}

function renderMetrics() {
  elements.totalCount.textContent = state.targets.length;
  elements.qualifiedCount.textContent = state.targets.filter((target) => target.score >= 70).length;
  elements.approvedCount.textContent = state.targets.filter((target) => target.decision === "approved").length;
  elements.sentCount.textContent = state.targets.filter((target) => target.sent).length;
}

function render() {
  renderMetrics();
  const targets = visibleTargets();
  elements.emptyState.classList.toggle("hidden", targets.length > 0);
  elements.targetList.innerHTML = targets.map((target) => `
    <article class="target ${state.selected.has(target.id) ? "selected" : ""}" data-id="${target.id}">
      <input class="target-check" type="checkbox" ${state.selected.has(target.id) ? "checked" : ""} aria-label="Select target" />
      <div class="target-main">
        <div class="target-meta">
          <span class="platform">${escapeHtml(target.platform)}</span>
          <span>@${escapeHtml(target.username)}</span>
          <span>${escapeHtml(target.theme)}</span>
          <span class="decision-${escapeHtml(target.decision)}">${escapeHtml(target.decision)}</span>
          <span>${new Date(target.timestamp).toLocaleString()}</span>
        </div>
        <p class="target-content">${escapeHtml(target.content)}</p>
        <p class="reply-label">Suggested blessing</p>
        <textarea class="reply-input">${escapeHtml(target.suggestedReply)}</textarea>
        <div class="target-actions">
          <button data-action="approve" type="button">Approve</button>
          <button data-action="reject" class="quiet" type="button">Reject</button>
          <button data-action="copy" class="quiet" type="button">Copy reply</button>
          <button data-action="sent" class="quiet" type="button">${target.sent ? "Mark unsent" : "Mark sent"}</button>
          ${target.postUrl ? `<a href="${escapeHtml(target.postUrl)}" target="_blank" rel="noreferrer">Open post</a>` : ""}
        </div>
        <details class="interaction-editor">
          <summary>Interaction record</summary>
          <div class="interaction-grid">
            <label>Likes<input data-interaction="likes" type="number" min="0" value="${target.interaction.likes}" /></label>
            <label>Replies<input data-interaction="replies" type="number" min="0" value="${target.interaction.replies}" /></label>
            <label>Reposts<input data-interaction="reposts" type="number" min="0" value="${target.interaction.reposts}" /></label>
            <label>Profile visits<input data-interaction="profileVisits" type="number" min="0" value="${target.interaction.profileVisits}" /></label>
            <label>Link clicks<input data-interaction="linkClicks" type="number" min="0" value="${target.interaction.linkClicks}" /></label>
            <button data-action="save-interaction" type="button">Save</button>
          </div>
        </details>
      </div>
      <div class="target-score">
        <strong>${target.score}</strong>
        <span>relevance</span>
      </div>
    </article>
  `).join("");

  elements.selectedCount.textContent = `${state.selected.size} selected`;
  elements.selectAll.checked = targets.length > 0 && targets.every((target) => state.selected.has(target.id));
}

async function loadTargets() {
  const payload = await api("/api/distribution/targets?minScore=0&decision=all&platform=all");
  state.targets = payload.targets;
  state.selected.clear();
  elements.connectionState.textContent = "Connected";
  elements.authPanel.classList.add("hidden");
  elements.workspace.classList.remove("hidden");
  render();
}

async function unlock() {
  state.token = elements.adminToken.value.trim();
  sessionStorage.setItem("fortune-shrine-admin-token", state.token);
  try {
    await loadTargets();
  } catch (error) {
    sessionStorage.removeItem("fortune-shrine-admin-token");
    state.token = "";
    showToast(error.message);
  }
}

async function decide(ids, decision) {
  if (!ids.length) return;
  await api("/api/distribution/decisions", {
    method: "POST",
    body: JSON.stringify({ ids, decision })
  });
  await loadTargets();
  showToast(`${ids.length} target${ids.length === 1 ? "" : "s"} ${decision}.`);
}

async function updateTarget(id, patch) {
  await api(`/api/distribution/targets/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch)
  });
}

async function runSearch(platform) {
  showToast(`Searching ${platform === "x" ? "X" : "Reddit"}...`);
  const payload = await api("/api/distribution/search", {
    method: "POST",
    body: JSON.stringify({ platform, limit: 60 })
  });
  await loadTargets();
  showToast(`Added ${payload.created.length} new targets.`);
}

elements.unlockButton.addEventListener("click", unlock);
elements.adminToken.addEventListener("keydown", (event) => {
  if (event.key === "Enter") unlock();
});
elements.refreshButton.addEventListener("click", () => loadTargets().catch((error) => showToast(error.message)));
elements.platformFilter.addEventListener("change", render);
elements.decisionFilter.addEventListener("change", render);
elements.searchRedditButton.addEventListener("click", () => runSearch("reddit").catch((error) => showToast(error.message)));
elements.searchXButton.addEventListener("click", () => runSearch("x").catch((error) => showToast(error.message)));
elements.importButton.addEventListener("click", () => elements.importDialog.showModal());
elements.exportButton.addEventListener("click", async () => {
  const payload = await api("/api/distribution/export");
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `fortune-shrine-targets-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
});
elements.selectAll.addEventListener("change", () => {
  for (const target of visibleTargets()) {
    if (elements.selectAll.checked) state.selected.add(target.id);
    else state.selected.delete(target.id);
  }
  render();
});
elements.approveSelected.addEventListener("click", () => decide([...state.selected], "approved").catch((error) => showToast(error.message)));
elements.rejectSelected.addEventListener("click", () => decide([...state.selected], "rejected").catch((error) => showToast(error.message)));
elements.submitImport.addEventListener("click", async (event) => {
  event.preventDefault();
  try {
    const posts = JSON.parse(elements.importText.value);
    const payload = await api("/api/distribution/import", {
      method: "POST",
      body: JSON.stringify({ posts })
    });
    elements.importDialog.close();
    await loadTargets();
    showToast(`Imported ${payload.created.length} new targets.`);
  } catch (error) {
    showToast(error.message);
  }
});

elements.targetList.addEventListener("change", async (event) => {
  const card = event.target.closest(".target");
  if (!card) return;
  if (event.target.classList.contains("target-check")) {
    if (event.target.checked) state.selected.add(card.dataset.id);
    else state.selected.delete(card.dataset.id);
    render();
  }
  if (event.target.classList.contains("reply-input")) {
    await updateTarget(card.dataset.id, { suggestedReply: event.target.value });
    const target = state.targets.find((item) => item.id === card.dataset.id);
    if (target) target.suggestedReply = event.target.value;
    showToast("Reply saved.");
  }
});

elements.targetList.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  const card = event.target.closest(".target");
  if (!button || !card) return;
  const target = state.targets.find((item) => item.id === card.dataset.id);
  if (!target) return;

  try {
    if (button.dataset.action === "approve") await decide([target.id], "approved");
    if (button.dataset.action === "reject") await decide([target.id], "rejected");
    if (button.dataset.action === "copy") {
      const reply = card.querySelector(".reply-input").value;
      await navigator.clipboard.writeText(reply);
      showToast("Reply copied. Review it before sending.");
    }
    if (button.dataset.action === "sent") {
      await updateTarget(target.id, { sent: !target.sent });
      await loadTargets();
      showToast(target.sent ? "Marked unsent." : "Marked sent.");
    }
    if (button.dataset.action === "save-interaction") {
      const interaction = {};
      for (const input of card.querySelectorAll("[data-interaction]")) {
        interaction[input.dataset.interaction] = Number(input.value || 0);
      }
      await updateTarget(target.id, { interaction });
      Object.assign(target.interaction, interaction);
      showToast("Interaction record saved.");
    }
  } catch (error) {
    showToast(error.message);
  }
});

if (state.token) {
  elements.adminToken.value = state.token;
  loadTargets().catch(() => {
    sessionStorage.removeItem("fortune-shrine-admin-token");
    state.token = "";
  });
}
