import path from "node:path";
import { fileURLToPath } from "node:url";

const directory = path.dirname(fileURLToPath(import.meta.url));

export const KEYWORDS = [
  "wish me luck",
  "good luck",
  "pray for me",
  "pray",
  "fingers crossed",
  "waiting",
  "still waiting",
  "waiting for results",
  "waiting for reward",
  "waiting for approval",
  "need this",
  "please work",
  "nervous",
  "anxious",
  "worried",
  "uncertain",
  "not sure",
  "don't know",
  "all in",
  "liquidated",
  "liquidation",
  "leverage",
  "margin call",
  "opened a long",
  "opened a short",
  "my long",
  "my short",
  "rekt",
  "got rekt",
  "wiped out",
  "blew my account",
  "fomo",
  "panic sell"
];

export const DEFAULT_ALLOWED_CHATS = [
  "GMX",
  "Gains Network",
  "Bitget English",
  "Bybit English"
];

export const RECENT_CHAT_SOURCES = [
  { chat: "GMX", peerId: "-1001127341229", aliases: ["GMX", "GMX_IO"] },
  {
    chat: "Gains Network",
    peerId: "-1307554905",
    aliases: ["Gains Network", "GainsNetwork", "gTrade"]
  },
  {
    chat: "Bitget English",
    peerId: "-1872223162",
    aliases: ["Bitget English", "BitgetENOfficial"]
  },
  {
    chat: "Bybit English",
    peerId: "-1453035653",
    aliases: ["Bybit English", "Bybit_English"]
  }
];

export const COMMUNITY_ALIASES = [
  { group: "GMX", aliases: ["GMX", "GMX_IO"] },
  {
    group: "Gains Network",
    aliases: ["Gains Network", "GainsNetwork", "gTrade"]
  },
  {
    group: "Bitget English",
    aliases: ["Bitget English", "BitgetENOfficial"]
  },
  {
    group: "Bybit English",
    aliases: ["Bybit English", "Bybit_English"]
  }
];

export const SIGNALS = {
  blessingRequest: [
    "wish me luck",
    "good luck",
    "pray for me",
    "pray",
    "fingers crossed"
  ],
  uncertainty: [
    "hope",
    "waiting",
    "need this",
    "please work",
    "nervous",
    "uncertain"
  ],
  exposure: [
    "all in",
    "liquidation",
    "leverage",
    "margin call",
    "funding rate",
    "open interest",
    "BTC dump",
    "BTC pump",
    "ETH dump",
    "ETH pump",
    "reversal",
    "breakout",
    "bounce",
    "long",
    "short",
    "entry",
    "exit",
    "take profit",
    "stop loss",
    "TP",
    "SL",
    "opened position",
    "closed position",
    "fomo",
    "panic sell"
  ],
  outcomeLanguage: [
    "win",
    "lose",
    "rekt",
    "got rekt",
    "wiped out",
    "blew my account"
  ],
  lowSignal: [
    "announcement"
  ]
};

export function allowedChatsFromEnvironment() {
  const configured = process.env.TELEGRAM_DISCOVERY_CHATS;
  if (!configured) return DEFAULT_ALLOWED_CHATS;
  return configured.split(",").map((item) => item.trim()).filter(Boolean);
}

export const DEFAULTS = {
  telegramUrl: "https://web.telegram.org/k/",
  intervalMs: 10 * 60 * 1000,
  searchSettleMs: 1_800,
  keywordTimeoutMs: 15_000,
  cycleTimeoutMs: 4 * 60 * 1_000,
  writerTimeoutMs: 30_000,
  seenAgainCooldownMs: 6 * 60 * 60 * 1000,
  freshnessWindowMs: 4 * 60 * 60 * 1000,
  freshnessFutureToleranceMs: 5 * 60 * 1000,
  shutdownTimeoutMs: 10_000,
  loginTimeoutMs: 10 * 60 * 1000,
  maxResultsPerKeyword: 50,
  maxRecentMessagesPerChat: 80,
  recentChatSettleMs: 2_500,
  minimumScore: 0.7,
  watchTimeZone: "Asia/Shanghai",
  watchStartHour: 21,
  watchEndHour: 1,
  profileDir: path.join(directory, "state", "browser-profile"),
  outputDir: path.join(directory, "output")
};

export const SEARCH_INPUT_SELECTORS = [
  "input.input-search-input",
  'input[placeholder="Search"]',
  '.input-search input',
  '.input-search[contenteditable="true"]',
  '.sidebar-header [contenteditable="true"][data-placeholder="Search"]',
  '.sidebar-header .input-field-input[contenteditable="true"]',
  '[contenteditable="true"][data-placeholder="Search"]'
];

export const RESULT_ROW_SELECTORS = [
  ".search-group-messages a.chatlist-chat[data-mid]",
  ".search-super-container .search-group .row",
  ".search-super-container .row",
  ".search-results .row",
  ".search-group .row",
  '[class*="search"] .row',
  '.search-super-container [data-peer-id]',
  '.search-results [data-peer-id]',
  '[class*="search"] [data-mid]',
  '[class*="search"] [data-message-id]',
  '[class*="search"] .message'
];
