export const DEFAULTS = {
  totalTarget: 100,
  polymarketTarget: 50,
  xTarget: 50,
  polymarketEventLimit: 40,
  polymarketCommentsPerEvent: 100,
  xResultsPerQuery: 100,
  maxXPagesPerQuery: 3,
  requestTimeoutMs: 25_000,
  maxRetries: 2
};

export const X_QUERIES = [
  {
    community: "Polymarket",
    query: '(Polymarket OR @Polymarket) -is:retweet -is:reply lang:en'
  },
  {
    community: "Prediction Markets",
    query: '("prediction market" OR "prediction markets" OR Kalshi) -is:retweet -is:reply lang:en'
  },
  {
    community: "Crypto Trading",
    query: '(crypto OR bitcoin OR ethereum) (trade OR trading OR trader OR position OR leverage OR liquidated) -is:retweet -is:reply lang:en'
  },
  {
    community: "Meme Coin",
    query: '("meme coin" OR memecoin OR degen OR "ape in") -is:retweet -is:reply lang:en'
  },
  {
    community: "Risk / Luck",
    query: '("wish me luck" OR "need luck" OR "all in" OR nervous OR afraid OR uncertain OR waiting) (crypto OR bet OR market OR trade) -is:retweet -is:reply lang:en'
  }
];

export const PUBLIC_X_QUERIES = [
  { community: "Polymarket", query: "site:x.com Polymarket" },
  { community: "Prediction Markets", query: 'site:x.com "prediction market"' },
  { community: "Prediction Markets", query: "site:x.com Kalshi trader" },
  { community: "Crypto Traders", query: 'site:x.com "crypto trader"' },
  { community: "Crypto Traders", query: "site:x.com bitcoin trading leverage" },
  { community: "Crypto Traders", query: "site:x.com crypto liquidated trader" },
  { community: "Meme Coin", query: "site:x.com memecoin trader" },
  { community: "All In", query: 'site:x.com "all in" crypto' },
  { community: "Betting", query: "site:x.com betting odds" },
  { community: "Betting", query: 'site:x.com "sports betting"' },
  { community: "Election Markets", query: 'site:x.com "election betting"' },
  { community: "Election Markets", query: 'site:x.com "election odds"' }
];

export const PUBLIC_X_SEEDS = [
  { community: "Polymarket", handles: [
    "Polymarket", "PolymarketSport", "PolymarketDevs", "PolymarketCS2",
    "PolymarketLoL", "PolymarketFC", "SuhailKakar", "esidery", "steventey",
    "billsperos", "garooya", "bernardbulletin", "llamaonthebrink"
  ] },
  { community: "Prediction Markets", handles: [
    "Kalshi", "KalshiPolitics", "NateSilver538", "ElectionBetting",
    "manifoldmarkets", "Metaculus", "RobinHanson", "fmeetsdata", "PollTracker2024"
  ] },
  { community: "Crypto Traders", handles: [
    "Cobie", "CryptoCred", "Pentoshi", "HsakaTrades", "DegenSpartan",
    "traderSZ", "CryptoHayes", "Arthur_0x", "TheFlowHorse", "AltcoinSherpa",
    "ColdBloodShill", "CryptoCapo_", "gainzy222", "GCRClassic", "inversebrah",
    "0xngmi", "loomdart", "Ansem", "MustStopMurad", "blknoiz06", "zachxbt",
    "tier10k", "WhalePanda", "TheWolfOfAllStreets", "RektCapital",
    "CryptoKaleo", "DonAlt", "CredibleCrypto", "IncomeSharks", "PeterLBrandt",
    "ToneVays", "filbfilb", "100trillionUSD", "Josh_Rager",
    "michaelvandepoppe", "lookonchain", "Whale_Alert", "ArkhamIntel",
    "WuBlockchain", "DefiLlama", "CoinMarketCap", "coingecko"
  ] },
  { community: "Betting", handles: [
    "BTFOdds", "BestOddsBets", "BetDEXLabs", "GetBettorOdds", "JTFOz",
    "Mrbankstips", "PickTheOdd", "Route2FI", "bettingelection",
    "bettingoddsuk", "bettingoddsusa", "mmamania", "oddschecker",
    "oddscheckerus", "oddsmarket", "thespread", "ActionNetworkHQ",
    "Covers", "BettingPros", "DraftKings", "FanDuel", "BetMGM",
    "CaesarsSports", "Pinnacle", "bet365", "Betfair", "SBRReview",
    "RotoGrinders", "SportsLine", "VegasInsider", "propsdotcash"
  ] },
  { community: "Election Markets", handles: [
    "RealClearPolling", "DecisionDeskHQ", "SplitTicket_", "RacetotheWH",
    "ElectionMapsCo", "CookPolitical", "LarrySabato", "538politics"
  ] }
];

export const SIGNALS = {
  uncertainty: [
    "waiting", "wait", "uncertain", "nervous", "afraid", "hope", "wish",
    "pray", "luck", "resolve", "resolution", "result", "outcome", "pending"
  ],
  risk: [
    "all in", "ape in", "position", "bet", "trade", "trading", "leverage",
    "liquidated", "liquidation", "loss", "lost", "risk", "odds", "prediction"
  ],
  restraint: [
    "pause", "patience", "patient", "discipline", "restraint", "slow down",
    "step back", "not trading", "sitting out", "cut my losses"
  ]
};

export const EXCLUSION_SIGNALS = [
  "giveaway", "airdrop", "dm me", "join my telegram", "free signals",
  "guaranteed", "risk-free", "100% win", "promo code", "referral link"
];
