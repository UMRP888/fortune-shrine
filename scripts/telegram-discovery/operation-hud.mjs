const SEPARATOR = "━━━━━━━━━━━━━━━━━━━━━━";

function cardMeta(item) {
  const parts = [
    `@${item.author || "Unknown"}`,
    item.group || item.source || "Telegram",
    item.category
  ].filter(Boolean);
  return parts.join(" · ");
}

function replyLines(item) {
  return [
    item.replyDraftA,
    item.replyDraftB,
    item.replyDraftC
  ]
    .filter((reply) => String(reply || "").trim())
    .map((reply) => `( ) ${reply}`);
}

function queueBlock(item, index) {
  const replies = replyLines(item);
  return [
    `CARD ${index + 1}`,
    cardMeta(item),
    item.original || "",
    "",
    "REPLIES:",
    ...(replies.length ? replies : ["( ) 无可用回复草稿"]),
    "",
    "ACTIONS:",
    "[复制回复] [打开原帖] [填入回复] [标记已发送]",
    "",
    SEPARATOR,
    ""
  ].join("\n");
}

export function formatOperationHud({
  run,
  topQueue
}) {
  const queue = topQueue.queue || [];
  const queueList = queue.length
    ? queue.map(queueBlock)
    : ["当前无可发送候选。", "", SEPARATOR, ""];
  const countLabel = `${queue.length} users · ${queue.length} posts ready`;
  const recentRuns = run?.recentRuns || [];
  const collectorFailures = recentRuns.filter((item) =>
    ["collector_failed", "skipped"].includes(item.status)
  );
  const collectorWarning = collectorFailures.length
    ? [
      "COLLECTOR WARNING",
      ...collectorFailures.map((item) =>
        `${item.chat}: ${item.status} · ${item.error || "无法读取最新消息"}`
      ),
      "",
      SEPARATOR,
      ""
    ]
    : [];
  return [
    "人工发送队列（完整稳定输出版）",
    "",
    SEPARATOR,
    "",
    "安全锁：",
    "禁止自动发送 / 禁止批量打开 / 禁止后台操作",
    "",
    SEPARATOR,
    "",
    "导入区",
    "[载入默认队列] [载入 Polymarket 今日队列]",
    countLabel,
    "",
    SEPARATOR,
    "",
    "QUEUE LIST（稳定输出）",
    "",
    ...collectorWarning,
    ...queueList,
    "END OF QUEUE",
    ""
  ].join("\n");
}
