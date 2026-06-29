(() => {
  const marker = "fortune-shrine-pm=";
  if (!location.hash.startsWith(`#${marker}`)) return;

  const logPrefix = "[Fortune Shrine V0.7 Polymarket]";
  const encoded = location.hash.slice(marker.length + 1);

  function decode(value) {
    const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  function normalize(text) {
    return String(text || "").replace(/\s+/g, " ").trim();
  }

  function banner(message, warning = false) {
    const existing = document.querySelector("#fortune-shrine-polymarket-banner");
    existing?.remove();
    const element = document.createElement("div");
    element.id = "fortune-shrine-polymarket-banner";
    element.textContent = message;
    Object.assign(element.style, {
      position: "fixed",
      top: "18px",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: "2147483647",
      maxWidth: "720px",
      padding: "12px 18px",
      borderRadius: "10px",
      border: `1px solid ${warning ? "#9c574f" : "#8d6b35"}`,
      background: warning ? "#331d1a" : "#211b12",
      color: "#f4ead7",
      boxShadow: "0 12px 36px rgba(0,0,0,.45)",
      font: "14px/1.45 system-ui, sans-serif"
    });
    document.documentElement.append(element);
  }

  function visible(element) {
    if (!(element instanceof HTMLElement)) return false;
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== "none"
      && style.visibility !== "hidden"
      && rect.width > 0
      && rect.height > 0;
  }

  function leafTextMatches(text) {
    const target = normalize(text);
    const shortTarget = target.slice(0, 120);
    return [...document.querySelectorAll("p, span, div")]
      .filter((element) => element.children.length === 0 && visible(element))
      .filter((element) => {
        const current = normalize(element.textContent);
        return current === target
          || current.includes(target)
          || target.includes(current)
          || (shortTarget.length >= 20 && current.includes(shortTarget));
      });
  }

  function replyControlWithin(container) {
    const labels = new Set(["reply", "回复", "回覆"]);
    return [...container.querySelectorAll("button, [role=button]")]
      .filter(visible)
      .find((element) => {
        const text = normalize(element.innerText).toLowerCase();
        const aria = normalize(element.getAttribute("aria-label")).toLowerCase();
        return labels.has(text) || labels.has(aria);
      });
  }

  function findComment(text) {
    for (const leaf of leafTextMatches(text)) {
      let current = leaf;
      for (let depth = 0; current && depth < 10; depth += 1) {
        const reply = replyControlWithin(current);
        if (reply) return { container: current, reply, leaf };
        current = current.parentElement;
      }
    }
    return null;
  }

  function writableWithin(container) {
    return [...container.querySelectorAll(
      'textarea, [contenteditable="true"], input[type="text"]'
    )].find(visible) || null;
  }

  function findNearbyWritable(container) {
    const direct = writableWithin(container);
    if (direct) return direct;
    let current = container.parentElement;
    for (let depth = 0; current && depth < 5; depth += 1) {
      const writable = writableWithin(current);
      if (writable) return writable;
      current = current.parentElement;
    }
    const visibleWritables = [...document.querySelectorAll(
      'textarea, [contenteditable="true"], input[type="text"]'
    )].filter(visible);
    return visibleWritables.length === 1 ? visibleWritables[0] : null;
  }

  function setDraft(element, draft) {
    element.click();
    element.focus();
    if (element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement) {
      const prototype = element instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
      setter?.call(element, draft);
      element.dispatchEvent(new InputEvent("input", {
        bubbles: true,
        inputType: "insertText",
        data: draft
      }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
      return normalize(element.value).length > 0;
    }
    element.textContent = draft;
    element.dispatchEvent(new InputEvent("beforeinput", {
      bubbles: true,
      inputType: "insertText",
      data: draft
    }));
    element.dispatchEvent(new InputEvent("input", {
      bubbles: true,
      inputType: "insertText",
      data: draft
    }));
    return normalize(element.innerText || element.textContent).length > 0;
  }

  async function waitFor(getValue, timeout = 15_000) {
    const started = Date.now();
    while (Date.now() - started < timeout) {
      const value = getValue();
      if (value) return value;
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
    return null;
  }

  async function findCommentByScrolling(originalText) {
    const existing = findComment(originalText);
    if (existing) return existing;

    const startingY = window.scrollY;
    const step = Math.max(420, Math.floor(window.innerHeight * 0.72));
    let previousHeight = 0;
    let unchangedHeightCount = 0;

    for (let attempt = 0; attempt < 32; attempt += 1) {
      window.scrollBy({ top: step, behavior: "auto" });
      await new Promise((resolve) => setTimeout(resolve, 450));

      const match = findComment(originalText);
      if (match) return match;

      const currentHeight = document.documentElement.scrollHeight;
      if (currentHeight === previousHeight) unchangedHeightCount += 1;
      else unchangedHeightCount = 0;
      previousHeight = currentHeight;

      const nearBottom =
        window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 80;
      if (nearBottom && unchangedHeightCount >= 3) break;
    }

    window.scrollTo({ top: startingY, behavior: "auto" });
    return null;
  }

  async function run() {
    let payload;
    try {
      payload = JSON.parse(decode(encoded));
    } catch (error) {
      console.error(logPrefix, "无法读取队列数据", error);
      return;
    }
    const draft = normalize(payload.draft);
    const originalText = normalize(payload.originalText)
      .replace(/^\[[^\]]+\]\s*/, "")
      .split(" || ")[0];
    history.replaceState(null, "", `${location.pathname}${location.search}`);
    if (!draft || !originalText) return;

    banner("正在向下扫描评论区并定位目标评论…");
    const initialMatch = await waitFor(() => findComment(originalText), 4_000);
    const match = initialMatch || await findCommentByScrolling(originalText);
    if (!match) {
      await navigator.clipboard.writeText(draft).catch(() => {});
      banner("未能定位目标评论。草稿已复制，请不要发布到顶部评论框。", true);
      return;
    }

    match.container.scrollIntoView({ behavior: "smooth", block: "center" });
    match.container.style.outline = "2px solid #c6944c";
    match.container.style.outlineOffset = "5px";
    match.reply.click();

    const writable = await waitFor(() => findNearbyWritable(match.container), 8_000);
    if (!writable) {
      await navigator.clipboard.writeText(draft).catch(() => {});
      banner("已定位原评论，但未找到回复输入框。草稿已复制，请人工粘贴。", true);
      return;
    }

    const loaded = setDraft(writable, draft);
    if (!loaded) {
      await navigator.clipboard.writeText(draft).catch(() => {});
      banner("已定位回复框，但草稿未写入。草稿已复制，请人工粘贴。", true);
      return;
    }
    banner("已定位原评论并填入草稿。请逐字检查；只有你可以点击发布。");
  }

  run().catch(async (error) => {
    console.error(logPrefix, error);
    banner("定位或填入失败。请返回队列复制草稿后人工回复。", true);
  });
})();
