import path from "node:path";
import { fileURLToPath } from "node:url";

const directory = path.dirname(fileURLToPath(import.meta.url));

export const KEYWORDS = [
  "wish me luck",
  "good luck",
  "pray",
  "pray for me",
  "all in",
  "hope",
  "waiting",
  "fingers crossed",
  "need this",
  "please work",
  "nervous",
  "uncertain",
  "announcement",
  "trade",
  "win",
  "lose",
  "liquidation",
  "long",
  "short"
];

export const DEFAULT_ALLOWED_CHATS = [
  "GMX",
  "Gains Network",
  "Bitget English",
  "Bybit English"
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
    "long",
    "short",
    "trade"
  ],
  outcomeLanguage: [
    "win",
    "lose"
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
  loginTimeoutMs: 10 * 60 * 1000,
  maxResultsPerKeyword: 50,
  minimumScore: 0.7,
  watchTimeZone: "Asia/Shanghai",
  watchStartHour: 21,
  watchEndHour: 1,
  profileDir: path.join(directory, "state", "browser-profile"),
  outputDir: path.join(directory, "output")
};

export const SEARCH_INPUT_SELECTORS = [
  'input[placeholder="Search"]',
  '.input-search input',
  '.input-search[contenteditable="true"]',
  '.sidebar-header [contenteditable="true"][data-placeholder="Search"]',
  '.sidebar-header .input-field-input[contenteditable="true"]',
  '[contenteditable="true"][data-placeholder="Search"]'
];

export const RESULT_ROW_SELECTORS = [
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
