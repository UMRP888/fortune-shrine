const guardians = [
  {
    name: "Caishen",
    title: "Chinese guardian of wealth",
    sigil: "C",
    tone: "prosperity, timing, generosity",
    blessings: [
      "May money come without taking your peace.",
      "May your hand be lucky and your heart stay steady.",
      "May you receive enough, and not lose yourself chasing more."
    ],
    oracles: [
      "A red door stands open, and the threshold keeps its silence.",
      "The gold bowl reflects a sky that has not yet chosen its weather.",
      "A small lantern waits near the market before the street begins to wake."
    ]
  },
  {
    name: "Guandi",
    title: "Chinese guardian of loyalty",
    sigil: "G",
    tone: "honor, protection, discipline",
    blessings: [
      "May you stay steady when the noise gets loud.",
      "May your own rules protect you.",
      "May courage come without recklessness."
    ],
    oracles: [
      "The blade remains sheathed, and the banner listens to the wind.",
      "A closed gate may still be under gentle protection.",
      "The oath is quiet, yet the road may have heard it."
    ]
  },
  {
    name: "Mazu",
    title: "Chinese sea protector",
    sigil: "M",
    tone: "voyage, protection, safe passage",
    blessings: [
      "May you cross this moment with a calm heart.",
      "May hidden waves pass under you gently.",
      "May you remember the shore before going too far."
    ],
    oracles: [
      "One wave lowers itself before another begins to rise.",
      "The harbor light appears small, yet it has not left your sight.",
      "The sea keeps its answer beneath moving silver."
    ]
  },
  {
    name: "Benzaiten",
    title: "Japanese guardian of art and fortune",
    sigil: "B",
    tone: "music, eloquence, flowing luck",
    blessings: [
      "May your mind slow down and find its rhythm.",
      "May luck flow without being forced.",
      "May the next sign come softly."
    ],
    oracles: [
      "A string still vibrates after the hand has moved away.",
      "The river bends where the song becomes quiet.",
      "A white serpent watches the cup and leaves the water undisturbed."
    ]
  },
  {
    name: "Lakshmi",
    title: "Hindu goddess of prosperity",
    sigil: "L",
    tone: "abundance, grace, enoughness",
    blessings: [
      "May good fortune visit you gently.",
      "May you receive without fear.",
      "May enough be clear before greed gets loud."
    ],
    oracles: [
      "Coins fall in the painting, while the lotus studies the pond.",
      "Two elephants pour water where the ground is still deciding what to receive.",
      "A lamp glows near the doorway, inviting but not commanding."
    ]
  },
  {
    name: "Ganesha",
    title: "Hindu remover of obstacles",
    sigil: "N",
    tone: "beginnings, obstacles, wisdom",
    blessings: [
      "May the obstacle show its shape before it becomes heavy.",
      "May one small door open for you.",
      "May your next step be lighter than your fear."
    ],
    oracles: [
      "The broken tusk writes where the full moon pauses.",
      "A small doorway appears beside the larger wall.",
      "The mouse crosses first, and the elephant listens before moving."
    ]
  },
  {
    name: "Fortuna",
    title: "Roman goddess of chance",
    sigil: "R",
    tone: "chance, turning, uncertainty",
    blessings: [
      "May luck meet you with a soft hand.",
      "May the wheel turn without throwing you off balance.",
      "May uncertainty leave you stronger, not broken."
    ],
    oracles: [
      "The wheel turns behind a curtain of gold.",
      "A rudder rests in water that has not yet chosen a direction.",
      "The cornucopia is full, and its shadow asks for gentleness."
    ]
  },
  {
    name: "Tyche",
    title: "Greek goddess of fortune",
    sigil: "T",
    tone: "luck, risk, moderation",
    blessings: [
      "May luck come, and may you still keep your head.",
      "May the risk feel lighter after this breath.",
      "May good fortune not make you forget caution."
    ],
    oracles: [
      "Dice rest on the temple step, unread by the morning.",
      "The winged figure passes, leaving only a stirred veil.",
      "A crown shines softly beside a shadow that asks for measure."
    ]
  },
  {
    name: "Hermes",
    title: "Greek messenger and traveler",
    sigil: "H",
    tone: "messages, movement, trade",
    blessings: [
      "May the sign you need reach you in time.",
      "May the road be quick only if it is kind.",
      "May cleverness help you, not trick you."
    ],
    oracles: [
      "A winged sandal touches dust beside an unread letter.",
      "The road splits where a messenger smiles without explaining why.",
      "A light purse and a silent milestone share the same road."
    ]
  },
  {
    name: "Athena",
    title: "Greek goddess of wisdom",
    sigil: "A",
    tone: "strategy, reason, craft",
    blessings: [
      "May a cool mind stand beside a hot heart.",
      "May your plan be stronger than your impulse.",
      "May you see one thing clearly."
    ],
    oracles: [
      "An owl watches the spear lean quietly against the loom.",
      "The olive branch grows beside the shield.",
      "A pattern may appear after the thread is counted."
    ]
  },
  {
    name: "Thoth",
    title: "Egyptian god of writing and reckoning",
    sigil: "Q",
    tone: "measure, record, hidden knowledge",
    blessings: [
      "May the numbers not blind you.",
      "May one hidden thing become a little clearer.",
      "May your guess be humble and your breath steady."
    ],
    oracles: [
      "The ibis writes beside a moon that is not yet full.",
      "A scale waits for a feather and a breath.",
      "The tablet is open, and one column remains mercifully blank."
    ]
  },
  {
    name: "Odin",
    title: "Norse seeker of wisdom",
    sigil: "O",
    tone: "sacrifice, vision, deep knowledge",
    blessings: [
      "May the price of knowing not be too heavy.",
      "May you see far without losing the ground.",
      "May the unknown treat you kindly."
    ],
    oracles: [
      "One eye sees the branch; the other rests with the well.",
      "Runes darken before they begin to speak.",
      "A raven circles twice, and the tree gives silence as its answer."
    ]
  },
  {
    name: "Brigid",
    title: "Celtic guardian of poetry and craft",
    sigil: "D",
    tone: "healing, making, inspired speech",
    blessings: [
      "May fear soften in your hands.",
      "May what is broken not stay broken.",
      "May warmth return before the next step."
    ],
    oracles: [
      "A small flame leans over the forge without choosing the metal.",
      "The well reflects a word that has not yet been spoken.",
      "A woven reed bends, and the pattern keeps breathing."
    ]
  },
  {
    name: "Eshu",
    title: "Yoruba messenger of crossroads",
    sigil: "E",
    tone: "crossroads, messages, ambiguity",
    blessings: [
      "May the crossroads not confuse your heart.",
      "May the message come, even if it comes sideways.",
      "May surprise teach you without owning you."
    ],
    oracles: [
      "Two roads speak in different languages, and both leave room for you.",
      "A message changes hands before its meaning settles.",
      "The doorway is open, but the hinge tells another story."
    ]
  },
  {
    name: "Quetzalcoatl",
    title: "Mesoamerican feathered serpent",
    sigil: "Z",
    tone: "wind, learning, renewal",
    blessings: [
      "May fresh wind reach you.",
      "May the old weight become lighter.",
      "May the next sign be gentle enough to understand."
    ],
    oracles: [
      "The feathered wind passes over an unopened book.",
      "Rain gathers behind a mask of air.",
      "A serpent rises, and the page has not yet turned."
    ]
  }
];

const silentWitnessLines = [
  "Waiting can be long.",
  "Some nights are long.",
  "Some questions do not yet have answers.",
  "The weight carried into this moment has been felt.",
  "The hand can pause before the path continues.",
  "A quiet uncertainty rests at the threshold.",
  "Some hopes stay warm even when the road is hidden.",
  "Not every fear needs to be explained.",
  "The night holds more than one kind of silence.",
  "A small light remains near the door."
];

const explicitWitnessLines = [
  "I see the light you carry.",
  "I see the weight you carry into this moment.",
  "I see the hope you are trying to keep steady.",
  "I see the fear you do not need to explain."
];

const mysteryLines = {
  warm: [
    "A small light is enough to begin the crossing.",
    "The door is quiet, but it has not turned away.",
    "Some warmth remains, even where the night is long.",
    "The path may be hidden, but your breath is here."
  ],
  wisdom: [
    "Some answers become clear only after the step is taken.",
    "Not every sign arrives loudly.",
    "The road does not reveal itself all at once.",
    "A quiet mind may hear what a restless heart misses."
  ],
  cosmic: [
    "The stars keep their own distance, and still they guide.",
    "The moon is incomplete, yet it lights the water.",
    "The wind moves without explaining its direction.",
    "A far light can still belong to your journey."
  ],
  balance: [
    "Every flame has a shadow, and every shadow remembers light.",
    "Movement and stillness may both be forms of courage.",
    "Some burdens leave; some burdens shape the traveler.",
    "The open door and the closed door both teach the hand."
  ],
  melancholic: [
    "Some nights are long, but not empty.",
    "What is uncertain may still be meaningful.",
    "The heart can tremble and still remain true.",
    "Even quiet sorrow may carry a hidden blessing."
  ]
};

const blessingLines = {
  warm: [
    "May you feel less alone as you cross this moment.",
    "May your heart find one small place to rest.",
    "May peace stand near you, even if certainty does not.",
    "May the next breath return you to yourself."
  ],
  wisdom: [
    "May you carry clarity without losing kindness.",
    "May your desire be held by a steady mind.",
    "May you notice the sign that is gentle, not loud.",
    "May wisdom arrive before urgency takes the whole room."
  ],
  cosmic: [
    "May the distant light remember your name.",
    "May the wind pass through you without breaking you.",
    "May the moon keep watch over what you cannot yet see.",
    "May the stars leave room for your own meaning."
  ],
  balance: [
    "May courage walk with humility.",
    "May hope stay warm without becoming blind.",
    "May strength and softness both remain with you.",
    "May light meet shadow without fear."
  ],
  melancholic: [
    "May what hurts become gentle enough to carry.",
    "May longing not make you forget the ground beneath you.",
    "May the quiet part of you still be blessed.",
    "May the unfinished thing find mercy in your hands."
  ]
};

const frequencyWeights = [
  ["warm", 40],
  ["wisdom", 20],
  ["cosmic", 15],
  ["balance", 15],
  ["melancholic", 10]
];

const RECENT_ORACLE_STORAGE_KEY = "fortune-shrine-recent-oracle-v1";
const PENDING_PAYMENT_STORAGE_KEY = "fortune-shrine-pending-payment-v1";
const PENDING_PAYMENT_MAX_AGE_MS = 35 * 60 * 1000;
const BLESSING_CORPUS_URL = "/assets/blessing-corpus-v1.md";
const recentOracleFallback = {
  recognition: [],
  blessing: [],
  oracle: [],
  combination: []
};

const corpusState = {
  entries: [],
  recognition: [],
  blessing: [],
  oracle: [],
  loaded: false
};

const phaseLabel = document.querySelector("#phaseLabel");
const offeringButton = document.querySelector("#offeringButton");
const heroStage = document.querySelector("#heroStage");
const flamePresence = document.querySelector("#flamePresence");
const ambientToggle = document.querySelector("#ambientToggle");
const offeringPage = document.querySelector("#offeringPage");
const offeringGrid = document.querySelector("#offeringGrid");
const continuePaymentButton = document.querySelector("#continuePaymentButton");
const paymentModal = document.querySelector("#paymentModal");
const paymentTitle = document.querySelector("#paymentTitle");
const paymentMeaning = document.querySelector("#paymentMeaning");
const paymentInvocation = document.querySelector("#paymentInvocation");
const paymentPrice = document.querySelector("#paymentPrice");
const paymentQrImage = document.querySelector("#paymentQrImage");
const paymentQrLabel = document.querySelector("#paymentQrLabel");
const paymentRecipient = document.querySelector("#paymentRecipient");
const paymentMint = document.querySelector("#paymentMint");
const paymentReference = document.querySelector("#paymentReference");
const cancelPaymentButton = document.querySelector("#cancelPaymentButton");
const walletPayButton = document.querySelector("#walletPayButton");
const completePaymentButton = document.querySelector("#completePaymentButton");
const ritualStatus = document.querySelector("#ritualStatus");
const ritualMessage = document.querySelector("#ritualMessage");
const confirmOfferingButton = document.querySelector("#confirmOfferingButton");
const returnFromVerificationButton = document.querySelector("#returnFromVerificationButton");
const sacredScene = document.querySelector("#sacredScene");
const sacredFlame = document.querySelector("#sacredFlame");
const doorOfUnknown = document.querySelector("#doorOfUnknown");
const ritualParticles = document.querySelector("#ritualParticles");
const oracleCard = document.querySelector("#oracleCard");
const continueButton = document.querySelector("#continueButton");
const completion = document.querySelector("#completion");

let actionRevealTimer = null;
let flameMotionTimer = null;
let flameRestTimer = null;
let presenceRestTimer = null;
let emberTimer = null;
let arrivalResponseTimer = null;
let revealLineTimers = [];
let ritualScrollFrame = null;
let paymentPollTimer = null;
let solanaLibraryPromise = null;
let currentPaymentIntent = null;
let blessingReleaseInProgress = false;
let selectedOffering = offeringGrid.querySelector(".offering-choice.active");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const adminVerificationEnabled = new URLSearchParams(window.location.search).get("admin") === "1"
  || window.location.hash === "#admin";
const ambientPresence = {
  context: null,
  masterGain: null,
  fireGain: null,
  emberGain: null,
  spaceGain: null,
  crackleTimer: null,
  modulationTimer: null,
  enabled: false,
  initialized: false
};

function createNoiseBuffer(audioContext, duration = 2) {
  const length = Math.floor(audioContext.sampleRate * duration);
  const buffer = audioContext.createBuffer(1, length, audioContext.sampleRate);
  const data = buffer.getChannelData(0);

  for (let index = 0; index < length; index += 1) {
    data[index] = Math.random() * 2 - 1;
  }

  return buffer;
}

function createNoiseSource(audioContext, buffer) {
  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  return source;
}

function rampGain(gainNode, value, duration = 1.4) {
  if (!ambientPresence.context || !gainNode) return;

  const now = ambientPresence.context.currentTime;
  gainNode.gain.cancelScheduledValues(now);
  gainNode.gain.setTargetAtTime(value, now, duration / 4);
}

function setAmbientToggleLabel() {
  if (!ambientToggle) return;

  ambientToggle.textContent = ambientPresence.enabled ? "Breath" : "Silence";
  ambientToggle.setAttribute("aria-pressed", ambientPresence.enabled ? "true" : "false");
  ambientToggle.setAttribute(
    "aria-label",
    ambientPresence.enabled ? "Silence the shrine ambience" : "Restore the shrine ambience"
  );
}

function scheduleAmbientModulation() {
  window.clearTimeout(ambientPresence.modulationTimer);

  if (!ambientPresence.enabled || !ambientPresence.context) return;

  rampGain(ambientPresence.fireGain, randomBetween(0.008, 0.014), randomBetween(2.4, 4.8));
  rampGain(ambientPresence.spaceGain, randomBetween(0.002, 0.0045), randomBetween(5.5, 9.5));

  ambientPresence.modulationTimer = window.setTimeout(scheduleAmbientModulation, randomBetween(2600, 7200));
}

function scheduleAmbientCrackle() {
  window.clearTimeout(ambientPresence.crackleTimer);

  if (!ambientPresence.enabled || !ambientPresence.context) return;

  ambientPresence.crackleTimer = window.setTimeout(() => {
    if (!ambientPresence.enabled || !ambientPresence.context) return;

    const audioContext = ambientPresence.context;
    const now = audioContext.currentTime;
    const burst = audioContext.createBufferSource();
    const burstGain = audioContext.createGain();
    const burstFilter = audioContext.createBiquadFilter();
    const length = Math.floor(audioContext.sampleRate * randomBetween(0.018, 0.052));
    const buffer = audioContext.createBuffer(1, length, audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let index = 0; index < length; index += 1) {
      data[index] = (Math.random() * 2 - 1) * (1 - index / length);
    }

    burst.buffer = buffer;
    burstFilter.type = "bandpass";
    burstFilter.frequency.setValueAtTime(randomBetween(950, 2200), now);
    burstFilter.Q.setValueAtTime(randomBetween(0.7, 1.6), now);
    burstGain.gain.setValueAtTime(0.0001, now);
    burstGain.gain.exponentialRampToValueAtTime(randomBetween(0.008, 0.018), now + 0.012);
    burstGain.gain.exponentialRampToValueAtTime(0.0001, now + randomBetween(0.08, 0.16));
    burst.connect(burstFilter);
    burstFilter.connect(burstGain);
    burstGain.connect(ambientPresence.masterGain);
    burst.start(now);
    burst.stop(now + 0.18);
    scheduleAmbientCrackle();
  }, randomBetween(2800, 9200));
}

function initializeAmbientPresence() {
  if (ambientPresence.initialized) return true;

  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return false;

  const audioContext = new AudioContext();
  const masterGain = audioContext.createGain();
  const fireGain = audioContext.createGain();
  const emberGain = audioContext.createGain();
  const spaceGain = audioContext.createGain();
  const fireFilter = audioContext.createBiquadFilter();
  const emberFilter = audioContext.createBiquadFilter();
  const spaceLowpass = audioContext.createBiquadFilter();
  const spaceHighpass = audioContext.createBiquadFilter();
  const fireBuffer = createNoiseBuffer(audioContext, 2.4);
  const spaceBuffer = createNoiseBuffer(audioContext, 5.2);
  const fireSource = createNoiseSource(audioContext, fireBuffer);
  const emberSource = createNoiseSource(audioContext, fireBuffer);
  const spaceSource = createNoiseSource(audioContext, spaceBuffer);

  masterGain.gain.value = 0;
  fireGain.gain.value = 0.01;
  emberGain.gain.value = 0.0016;
  spaceGain.gain.value = 0.003;

  fireFilter.type = "lowpass";
  fireFilter.frequency.value = 640;
  fireFilter.Q.value = 0.7;

  emberFilter.type = "bandpass";
  emberFilter.frequency.value = 1850;
  emberFilter.Q.value = 0.55;

  spaceLowpass.type = "lowpass";
  spaceLowpass.frequency.value = 148;
  spaceLowpass.Q.value = 0.45;

  spaceHighpass.type = "highpass";
  spaceHighpass.frequency.value = 46;
  spaceHighpass.Q.value = 0.35;

  fireSource.connect(fireFilter);
  fireFilter.connect(fireGain);
  fireGain.connect(masterGain);

  emberSource.connect(emberFilter);
  emberFilter.connect(emberGain);
  emberGain.connect(masterGain);

  spaceSource.connect(spaceLowpass);
  spaceLowpass.connect(spaceHighpass);
  spaceHighpass.connect(spaceGain);
  spaceGain.connect(masterGain);

  masterGain.connect(audioContext.destination);
  fireSource.start();
  emberSource.start();
  spaceSource.start();

  ambientPresence.context = audioContext;
  ambientPresence.masterGain = masterGain;
  ambientPresence.fireGain = fireGain;
  ambientPresence.emberGain = emberGain;
  ambientPresence.spaceGain = spaceGain;
  ambientPresence.initialized = true;

  return true;
}

async function setAmbientPresence(enabled) {
  if (enabled && !initializeAmbientPresence()) return;

  ambientPresence.enabled = enabled;
  setAmbientToggleLabel();

  if (!ambientPresence.context) return;

  if (ambientPresence.context.state === "suspended") {
    await ambientPresence.context.resume();
  }

  rampGain(ambientPresence.masterGain, enabled ? 0.38 : 0, enabled ? 2.2 : 1.1);

  if (enabled) {
    scheduleAmbientModulation();
    scheduleAmbientCrackle();
  } else {
    window.clearTimeout(ambientPresence.modulationTimer);
    window.clearTimeout(ambientPresence.crackleTimer);
  }
}

function awakenAmbientPresence() {
  if (ambientPresence.enabled) return;
  setAmbientPresence(true);
}

function followRitual(element, block = "center", { delay = 240, duration = 1500 } = {}) {
  if (!element) return;

  window.setTimeout(() => {
    const rect = element.getBoundingClientRect();
    const pageHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
    const maxScroll = Math.max(0, pageHeight - window.innerHeight);
    const viewportOffset = block === "start"
      ? Math.min(34, window.innerHeight * 0.05)
      : block === "end"
        ? window.innerHeight - rect.height - Math.min(72, window.innerHeight * 0.1)
        : (window.innerHeight - rect.height) / 2;
    const targetY = Math.min(maxScroll, Math.max(0, window.scrollY + rect.top - viewportOffset));
    const startY = window.scrollY;
    const distance = targetY - startY;
    const startTime = window.performance.now();

    if (ritualScrollFrame) window.cancelAnimationFrame(ritualScrollFrame);
    if (reducedMotion || Math.abs(distance) < 2) {
      window.scrollTo(0, targetY);
      return;
    }

    function easeInOutCubic(progress) {
      return progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    }

    function step(now) {
      const progress = Math.min(1, (now - startTime) / duration);
      window.scrollTo(0, startY + distance * easeInOutCubic(progress));
      if (progress < 1) {
        ritualScrollFrame = window.requestAnimationFrame(step);
      } else {
        ritualScrollFrame = null;
      }
    }

    ritualScrollFrame = window.requestAnimationFrame(step);
  }, delay);
}

function choice(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function loadRecentOracleHistory() {
  try {
    const stored = window.localStorage.getItem(RECENT_ORACLE_STORAGE_KEY);
    if (!stored) return structuredClone(recentOracleFallback);
    return { ...structuredClone(recentOracleFallback), ...JSON.parse(stored) };
  } catch {
    return structuredClone(recentOracleFallback);
  }
}

function saveRecentOracleHistory(history) {
  try {
    window.localStorage.setItem(RECENT_ORACLE_STORAGE_KEY, JSON.stringify(history));
  } catch {
    // The ritual still works if local storage is unavailable.
  }
}

function loadPendingPayment() {
  try {
    const stored = window.localStorage.getItem(PENDING_PAYMENT_STORAGE_KEY);
    if (!stored) return null;

    const pending = JSON.parse(stored);
    if (!pending?.id || !pending?.storedAt) return null;

    if (Date.now() - pending.storedAt > PENDING_PAYMENT_MAX_AGE_MS) {
      window.localStorage.removeItem(PENDING_PAYMENT_STORAGE_KEY);
      return null;
    }

    return pending;
  } catch {
    return null;
  }
}

function savePendingPayment(update = {}) {
  if (!currentPaymentIntent) return;

  Object.assign(currentPaymentIntent, update);

  const pending = {
    id: currentPaymentIntent.id,
    offeringId: currentPaymentIntent.offeringId,
    offeringName: currentPaymentIntent.offeringName,
    amount: currentPaymentIntent.amount,
    token: currentPaymentIntent.token,
    chain: currentPaymentIntent.chain,
    recipientAddress: currentPaymentIntent.recipientAddress,
    usdcMint: currentPaymentIntent.usdcMint,
    reference: currentPaymentIntent.reference,
    solanaPayUrl: currentPaymentIntent.solanaPayUrl,
    status: currentPaymentIntent.paymentStatus || currentPaymentIntent.status,
    signatureSubmitted: Boolean(currentPaymentIntent.signatureSubmitted),
    verifiedSignature: currentPaymentIntent.verifiedSignature || null,
    verifiedAt: currentPaymentIntent.verifiedAt || null,
    verifiedBy: currentPaymentIntent.verifiedBy || null,
    receivedAmount: currentPaymentIntent.receivedAmount || null,
    walletHash: currentPaymentIntent.walletHash || null,
    blessingReleaseStarted: Boolean(currentPaymentIntent.blessingReleaseStarted),
    generatedBlessing: currentPaymentIntent.generatedBlessing || null,
    memoryLogged: Boolean(currentPaymentIntent.memoryLogged),
    storedAt: currentPaymentIntent.storedAt || Date.now()
  };

  try {
    window.localStorage.setItem(PENDING_PAYMENT_STORAGE_KEY, JSON.stringify(pending));
  } catch {
    // Recovery is protective only; payment flow must continue without it.
  }
}

function clearPendingPayment() {
  try {
    window.localStorage.removeItem(PENDING_PAYMENT_STORAGE_KEY);
  } catch {
    // Local storage may be unavailable.
  }
}

function rememberRecent(history, key, value, maxItems) {
  history[key] = [value, ...(history[key] || []).filter((item) => item !== value)].slice(0, maxItems);
}

function choiceAvoidingRecent(items, recentItems, reserveCount = 1) {
  if (items.length <= reserveCount) return choice(items);

  const recentSet = new Set(recentItems || []);
  const available = items.filter((item) => !recentSet.has(item));

  return choice(available.length ? available : items);
}

function parseBlessingCorpus(markdown) {
  const entries = [];
  let pending = null;

  for (const rawLine of markdown.split("\n")) {
    const line = rawLine.trim();
    const heading = line.match(/^###\s+(\d{2}-\d{3})\s+\[([SAB])]\s+\[([^\]]+)]/);

    if (heading) {
      pending = {
        id: heading[1],
        tier: heading[2],
        categories: heading[3].split(",").map((category) => category.trim()),
        text: ""
      };
      continue;
    }

    if (!pending || !line || line.startsWith("#") || line === "---") continue;

    pending.text = line;
    entries.push(pending);
    pending = null;
  }

  return entries;
}

function buildCorpusPools(entries) {
  const hasCategory = (entry, categories) => entry.categories.some((category) => categories.includes(category));
  const tierWeight = { S: 3, A: 2, B: 1 };
  const expandByTier = (items) => items.flatMap((entry) => Array.from({ length: tierWeight[entry.tier] || 1 }, () => entry.text));

  const recognitionCategories = ["Understanding", "Waiting & Uncertainty", "Loss & Regret", "Self-Blame", "Loneliness", "Choice & Judgment"];
  const blessingCategories = ["Hope & Continuation", "New Beginning", "Risk & Burden", "Shame & Dignity", "Confidence & Recovery"];
  const oracleCategories = ["Results & Value", "Loss & Regret", "Hope & Continuation", "Waiting & Uncertainty", "Risk & Burden"];

  return {
    recognition: expandByTier(entries.filter((entry) => hasCategory(entry, recognitionCategories))),
    blessing: expandByTier(entries.filter((entry) => hasCategory(entry, blessingCategories))),
    oracle: expandByTier(entries.filter((entry) => hasCategory(entry, oracleCategories)))
  };
}

async function loadBlessingCorpus() {
  try {
    const response = await fetch(BLESSING_CORPUS_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`Corpus request failed: ${response.status}`);

    const markdown = await response.text();
    const entries = parseBlessingCorpus(markdown);
    const pools = buildCorpusPools(entries);

    if (entries.length < 20 || !pools.recognition.length || !pools.blessing.length || !pools.oracle.length) {
      throw new Error("Corpus did not contain enough usable blessings.");
    }

    corpusState.entries = entries;
    corpusState.recognition = pools.recognition;
    corpusState.blessing = pools.blessing;
    corpusState.oracle = pools.oracle;
    corpusState.loaded = true;
  } catch (error) {
    console.warn("Fortune Shrine corpus fallback active.", error);
  }
}

function weightedChoice(weightedItems) {
  const total = weightedItems.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = Math.random() * total;

  for (const [item, weight] of weightedItems) {
    roll -= weight;
    if (roll <= 0) return item;
  }

  return weightedItems[0][0];
}

function generateOracle() {
  const history = loadRecentOracleHistory();
  let reading;
  let combinationKey;

  if (corpusState.loaded) {
    for (let attempt = 0; attempt < 24; attempt += 1) {
      const recognition = choiceAvoidingRecent(corpusState.recognition, history.recognition, 12);
      const blessing = choiceAvoidingRecent(
        corpusState.blessing.filter((line) => line !== recognition),
        history.blessing,
        12
      );
      const oracle = choiceAvoidingRecent(
        corpusState.oracle.filter((line) => line !== recognition && line !== blessing),
        history.oracle,
        12
      );

      reading = { frequency: "corpus", recognition, blessing, oracle };
      combinationKey = [recognition, blessing, oracle].join("||");

      if (!history.combination.includes(combinationKey)) break;
    }

    rememberRecent(history, "recognition", reading.recognition, 24);
    rememberRecent(history, "blessing", reading.blessing, 36);
    rememberRecent(history, "oracle", reading.oracle, 36);
    rememberRecent(history, "combination", combinationKey, 60);
    saveRecentOracleHistory(history);

    return reading;
  }

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const frequency = weightedChoice(frequencyWeights);
    const witnessPool = Math.random() < 0.7 ? silentWitnessLines : explicitWitnessLines;
    const recognition = choiceAvoidingRecent(witnessPool, history.recognition, 3);
    const blessing = choiceAvoidingRecent(blessingLines[frequency], history.blessing, 1);
    const oracle = choiceAvoidingRecent(mysteryLines[frequency], history.oracle, 1);

    reading = { frequency, recognition, blessing, oracle };
    combinationKey = [recognition, blessing, oracle].join("||");

    if (!history.combination.includes(combinationKey)) break;
  }

  rememberRecent(history, "recognition", reading.recognition, 8);
  rememberRecent(history, "blessing", reading.blessing, 12);
  rememberRecent(history, "oracle", reading.oracle, 12);
  rememberRecent(history, "combination", combinationKey, 18);
  saveRecentOracleHistory(history);

  return reading;
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function setFlameVariables({
  auraOpacity,
  auraScale,
  brightness,
  saturation,
  rise,
  lean,
  backScale,
  frontScale,
  baseOpacity,
  baseScale,
  sceneOpacity,
  sceneScale
}) {
  sacredFlame.style.setProperty("--flame-aura-opacity", auraOpacity.toFixed(3));
  sacredFlame.style.setProperty("--flame-aura-scale", auraScale.toFixed(3));
  sacredFlame.style.setProperty("--flame-brightness", brightness.toFixed(3));
  sacredFlame.style.setProperty("--flame-saturation", saturation.toFixed(3));
  sacredFlame.style.setProperty("--flame-rise", `${rise.toFixed(1)}px`);
  sacredFlame.style.setProperty("--flame-lean", `${lean.toFixed(2)}deg`);
  sacredFlame.style.setProperty("--flame-back-scale", backScale.toFixed(3));
  sacredFlame.style.setProperty("--flame-front-scale", frontScale.toFixed(3));
  sacredFlame.style.setProperty("--flame-base-opacity", baseOpacity.toFixed(3));
  sacredFlame.style.setProperty("--flame-base-scale", baseScale.toFixed(3));
  sacredScene.style.setProperty("--scene-light-opacity", sceneOpacity.toFixed(3));
  sacredScene.style.setProperty("--scene-light-scale", sceneScale.toFixed(3));
}

function setIdleFlame() {
  setFlameVariables({
    auraOpacity: randomBetween(0.52, 0.59),
    auraScale: randomBetween(0.96, 1.04),
    brightness: randomBetween(0.95, 1.02),
    saturation: randomBetween(0.98, 1.04),
    rise: randomBetween(-2.2, 1.2),
    lean: randomBetween(-2.6, 2.2),
    backScale: randomBetween(0.98, 1.025),
    frontScale: randomBetween(0.97, 1.035),
    baseOpacity: randomBetween(0.68, 0.8),
    baseScale: randomBetween(0.96, 1.04),
    sceneOpacity: randomBetween(0.03, 0.09),
    sceneScale: randomBetween(0.7, 0.78)
  });
}

function scheduleLivingFlame() {
  if (reducedMotion) return;
  window.clearTimeout(flameMotionTimer);
  setIdleFlame();
  flameMotionTimer = window.setTimeout(scheduleLivingFlame, randomBetween(850, 2600));
}

function spawnEmber({ count = 1, delay = 0 } = {}) {
  if (reducedMotion || !flamePresence) return;

  for (let index = 0; index < count; index += 1) {
    window.setTimeout(() => {
      const ember = document.createElement("span");
      ember.className = "flame-ember";
      ember.style.setProperty("--ember-x", `${randomBetween(-18, 18).toFixed(1)}px`);
      ember.style.setProperty("--ember-size", `${randomBetween(1.5, 2.8).toFixed(1)}px`);
      ember.style.setProperty("--ember-drift", `${randomBetween(-16, 16).toFixed(1)}px`);
      ember.style.setProperty("--ember-duration", `${randomBetween(1800, 3200).toFixed(0)}ms`);
      ember.style.setProperty("--ember-opacity", randomBetween(0.42, 0.72).toFixed(2));
      flamePresence.append(ember);
      ember.addEventListener("animationend", () => ember.remove(), { once: true });
    }, delay + index * randomBetween(240, 620));
  }
}

function scheduleEmber() {
  if (reducedMotion) return;
  window.clearTimeout(emberTimer);
  emberTimer = window.setTimeout(() => {
    spawnEmber({ count: Math.random() < 0.82 ? 1 : 2 });
    scheduleEmber();
  }, randomBetween(5200, 14800));
}

function acknowledgePresence({ duration = randomBetween(1500, 2000), embers = 2 } = {}) {
  if (!flamePresence) return;
  window.clearTimeout(presenceRestTimer);
  flamePresence.classList.add("listening");
  spawnEmber({ count: embers, delay: 120 });
  presenceRestTimer = window.setTimeout(() => {
    flamePresence.classList.remove("listening");
  }, duration);
}

function acknowledgeBlessing() {
  window.clearTimeout(flameMotionTimer);
  window.clearTimeout(flameRestTimer);
  sacredScene.classList.add("received");
  sacredFlame.classList.add("lit");
  acknowledgePresence({ duration: randomBetween(3600, 5200), embers: 2 });
  setFlameVariables({
    auraOpacity: randomBetween(0.66, 0.72),
    auraScale: randomBetween(1.08, 1.16),
    brightness: randomBetween(1.1, 1.15),
    saturation: randomBetween(1.04, 1.08),
    rise: randomBetween(-7, -4),
    lean: randomBetween(-1.2, 1.2),
    backScale: randomBetween(1.08, 1.15),
    frontScale: randomBetween(1.08, 1.15),
    baseOpacity: randomBetween(0.86, 0.92),
    baseScale: randomBetween(1.05, 1.12),
    sceneOpacity: randomBetween(0.13, 0.18),
    sceneScale: randomBetween(0.78, 0.86)
  });

  flameRestTimer = window.setTimeout(() => {
    sacredScene.classList.remove("received");
    sacredFlame.classList.remove("lit");
    scheduleLivingFlame();
  }, randomBetween(3600, 5600));
}

function revealOracle(storedReading = null) {
  const reading = storedReading || generateOracle();
  const recognitionLine = document.querySelector("#recognition");
  const blessingLine = document.querySelector("#blessing");
  const oracleLine = document.querySelector("#oracle");

  phaseLabel.textContent = "Blessing";
  for (const timer of revealLineTimers) window.clearTimeout(timer);
  revealLineTimers = [];
  oracleCard.classList.remove("revealing");
  for (const line of [recognitionLine, blessingLine, oracleLine]) {
    line.classList.remove("line-emerging", "line-visible");
  }
  recognitionLine.textContent = reading.recognition;
  blessingLine.textContent = reading.blessing;
  oracleLine.textContent = reading.oracle;
  savePendingPayment({
    generatedBlessing: reading,
    blessingReleaseStarted: true
  });
  recordShrineMemory(reading);

  ritualStatus.classList.add("hidden");
  ritualParticles.classList.add("hidden");
  oracleCard.classList.remove("hidden");
  void oracleCard.offsetWidth;
  oracleCard.classList.add("revealing");
  followRitual(oracleCard, "center", { delay: 620, duration: 2100 });
  revealLineTimers = [
    window.setTimeout(() => {
      recognitionLine.classList.add("line-emerging");
    }, 150),
    window.setTimeout(() => {
      recognitionLine.classList.add("line-visible");
    }, 900),
    window.setTimeout(() => {
      blessingLine.classList.add("line-emerging");
    }, 1050),
    window.setTimeout(() => {
      blessingLine.classList.add("line-visible");
    }, 1800),
    window.setTimeout(() => {
      oracleLine.classList.add("line-emerging");
    }, 1950),
    window.setTimeout(() => {
      oracleLine.classList.add("line-visible");
    }, 2700)
  ];

  window.clearTimeout(actionRevealTimer);
  actionRevealTimer = window.setTimeout(() => {
    continueButton.classList.remove("hidden");
    followRitual(continueButton, "end", { delay: 700, duration: 1900 });
  }, 4300);
}

function resetPaymentAction({ clearStored = false } = {}) {
  walletPayButton.disabled = false;
  walletPayButton.textContent = "Pay With Wallet";
  completePaymentButton.disabled = false;
  completePaymentButton.textContent = "I Have Sent It";
  confirmOfferingButton.disabled = false;
  confirmOfferingButton.textContent = "Confirm Offering";
  paymentQrImage.src = "/assets/solana-wallet-recipient-qr.png";
  paymentQrImage.classList.remove("loading");
  paymentQrLabel.textContent = "Scan recipient address";
  paymentReference.textContent = "Created when the offering begins.";
  currentPaymentIntent = null;
  if (clearStored) clearPendingPayment();
  window.clearTimeout(paymentPollTimer);
}

function resetRitualStatusCopy() {
  ritualStatus.querySelector(".eyebrow").textContent = "The offering is received.";
  ritualStatus.querySelector("h2").textContent = "The Eternal Flame grows brighter.";
  ritualMessage.textContent = "The door opens slowly. The Shrine keeps silence.";
}

function returnToThreshold() {
  blessingReleaseInProgress = false;
  phaseLabel.textContent = "The Threshold";
  oracleCard.classList.add("hidden");
  oracleCard.classList.remove("revealing");
  for (const timer of revealLineTimers) window.clearTimeout(timer);
  revealLineTimers = [];
  for (const line of oracleCard.querySelectorAll(".blessing-text p")) {
    line.classList.remove("line-emerging", "line-visible");
  }
  continueButton.classList.add("hidden");
  confirmOfferingButton.classList.add("hidden");
  returnFromVerificationButton.classList.add("hidden");
  completion.classList.add("hidden");
  offeringPage.classList.add("hidden");
  ritualStatus.classList.add("hidden");
  ritualParticles.classList.add("hidden");
  paymentModal.classList.add("hidden");
  heroStage.classList.remove("compact");
  offeringButton.classList.remove("activating");
  offeringButton.disabled = false;
  sacredScene.classList.remove("received");
  sacredFlame.classList.remove("lit");
  doorOfUnknown.classList.remove("open");
  resetPaymentAction({ clearStored: true });
  resetRitualStatusCopy();
  scheduleLivingFlame();
  followRitual(heroStage, "start", { delay: 120, duration: 1500 });
}

async function createPaymentIntent(offeringId) {
  const response = await fetch("/api/payment-intents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ offeringId })
  });

  if (!response.ok) throw new Error("The offering could not be prepared.");
  return response.json();
}

async function createRecoveredPaymentIntent({ offeringId, signature }) {
  const response = await fetch("/api/payment-intents/recover", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ offeringId, signature })
  });

  if (!response.ok) throw new Error("The recovered offering could not be prepared.");
  return response.json();
}

async function checkPaymentIntent(intentId) {
  const path = currentPaymentIntent?.signatureSubmitted
    ? `/api/payment-intents/${encodeURIComponent(intentId)}/recover-status`
    : `/api/payment-intents/${encodeURIComponent(intentId)}/status`;
  const response = await fetch(path, {
    cache: "no-store"
  });

  if (!response.ok) throw new Error("The offering could not be verified yet.");
  const status = await response.json();
  if (currentPaymentIntent?.id === intentId && status?.status === "verified") {
    Object.assign(currentPaymentIntent, {
      paymentStatus: status.status,
      verifiedAt: status.verifiedAt,
      verifiedBy: status.verifiedBy,
      verifiedSignature: status.verifiedSignature,
      receivedAmount: status.receivedAmount,
      walletHash: status.walletHash
    });
    savePendingPayment();
  }
  return status;
}

async function submitPaymentSignature(intentId, signature) {
  const response = await fetch(`/api/payment-intents/${encodeURIComponent(intentId)}/signature`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ signature })
  });

  if (!response.ok) throw new Error("The offering signature could not be submitted.");
  const status = await response.json();
  if (currentPaymentIntent?.id === intentId && status?.status === "verified") {
    Object.assign(currentPaymentIntent, {
      paymentStatus: status.status,
      verifiedAt: status.verifiedAt,
      verifiedBy: status.verifiedBy,
      verifiedSignature: status.verifiedSignature,
      receivedAmount: status.receivedAmount,
      walletHash: status.walletHash
    });
    savePendingPayment();
  }
  return status;
}

function recordShrineMemory(reading) {
  if (!currentPaymentIntent || currentPaymentIntent.memoryLogged) return;
  currentPaymentIntent.memoryLogged = true;
  savePendingPayment({ memoryLogged: true });

  const entry = {
    sessionId: currentPaymentIntent.id,
    walletHash: currentPaymentIntent.walletHash || null,
    userInput: null,
    generatedBlessing: {
      recognition: reading.recognition,
      blessing: reading.blessing,
      oracle: reading.oracle
    },
    paymentStatus: currentPaymentIntent.paymentStatus || "verified",
    paymentAmount: currentPaymentIntent.receivedAmount || currentPaymentIntent.amount,
    metadata: {
      offeringId: currentPaymentIntent.offeringId,
      offeringName: currentPaymentIntent.offeringName,
      token: currentPaymentIntent.token,
      chain: currentPaymentIntent.chain,
      verifiedBy: currentPaymentIntent.verifiedBy,
      verifiedAt: currentPaymentIntent.verifiedAt
    }
  };

  fetch("/api/memory-log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
    keepalive: true
  }).catch(() => {
    // Memory must never interrupt the ritual.
  });
}

async function getLatestSolanaBlockhash() {
  const response = await fetch("/api/solana/latest-blockhash", {
    cache: "no-store"
  });

  if (!response.ok) throw new Error("The Shrine could not prepare the wallet request.");
  return response.json();
}

function loadSolanaLibraries() {
  if (!solanaLibraryPromise) {
    solanaLibraryPromise = Promise.all([
      import("https://esm.sh/@solana/web3.js@1.98.2"),
      import("https://esm.sh/@solana/spl-token@0.4.13")
    ]).then(([web3, splToken]) => ({ web3, splToken }));
  }

  return solanaLibraryPromise;
}

function wait(duration) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, duration);
  });
}

function getSolanaProvider() {
  return window.phantom?.solana || window.solana || null;
}

function amountToTokenUnits(amount) {
  const [whole, fractional = ""] = String(amount).split(".");
  return BigInt(`${whole}${fractional.padEnd(6, "0").slice(0, 6)}`);
}

async function sendWalletOffering(intent) {
  const provider = getSolanaProvider();

  if (!provider) {
    throw new Error("Open this page in a Solana wallet browser, or install a Solana wallet extension.");
  }

  if (provider.isPhantom === false && !provider.isSolflare && !provider.signAndSendTransaction) {
    throw new Error("This Solana wallet cannot sign the offering here.");
  }

  const { web3, splToken } = await loadSolanaLibraries();
  const {
    PublicKey,
    Transaction
  } = web3;
  const {
    getAssociatedTokenAddress,
    createTransferCheckedInstruction
  } = splToken;

  const connectResult = await provider.connect();
  const sender = new PublicKey((connectResult?.publicKey || provider.publicKey).toString());
  const recipient = new PublicKey(intent.recipientAddress);
  const mint = new PublicKey(intent.usdcMint);
  const sourceAccount = await getAssociatedTokenAddress(mint, sender);
  const recipientAccount = await getAssociatedTokenAddress(mint, recipient);
  const transaction = new Transaction();

  transaction.add(createTransferCheckedInstruction(
    sourceAccount,
    mint,
    recipientAccount,
    sender,
    amountToTokenUnits(intent.amount),
    6
  ));

  transaction.feePayer = sender;
  const latestBlockhash = await getLatestSolanaBlockhash();
  transaction.recentBlockhash = latestBlockhash.blockhash;

  let signatureResult;
  if (typeof provider.signAndSendTransaction === "function") {
    signatureResult = await provider.signAndSendTransaction(transaction);
  } else {
    throw new Error("This Solana wallet cannot sign the offering here.");
  }

  return typeof signatureResult === "string" ? signatureResult : signatureResult.signature;
}

async function waitForSubmittedOffering(intentId) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    if (attempt > 0) await wait(650);
    const status = await checkPaymentIntent(intentId);
    if (status.status === "verified") return status;
  }

  return null;
}

function beginVerificationWait({ submitted = false } = {}) {
  paymentModal.classList.add("hidden");
  offeringPage.classList.add("hidden");
  ritualStatus.classList.remove("hidden");
  ritualParticles.classList.add("hidden");
  confirmOfferingButton.classList.toggle("hidden", !adminVerificationEnabled);
  returnFromVerificationButton.classList.remove("hidden");
  phaseLabel.textContent = "Awaiting Verification";
  ritualStatus.querySelector(".eyebrow").textContent = submitted
    ? "The offering has been sent."
    : "The offering is being verified.";
  ritualStatus.querySelector("h2").textContent = "The Shrine keeps silence.";
  ritualMessage.textContent = "Your blessing will arrive after the offering is confirmed.";
  followRitual(ritualStatus, "center", { delay: 180, duration: 1600 });
  pollPaymentIntent();
}

function releaseVerifiedOfferingFromPayment() {
  paymentModal.classList.add("hidden");
  offeringPage.classList.add("hidden");
  ritualStatus.classList.remove("hidden");
  releaseBlessingAfterVerification();
}

function listenForPaymentFromModal() {
  window.clearTimeout(paymentPollTimer);

  if (!currentPaymentIntent || paymentModal.classList.contains("hidden")) return;

  checkPaymentIntent(currentPaymentIntent.id)
    .then((status) => {
      if (status.status === "verified") {
        releaseVerifiedOfferingFromPayment();
        return;
      }

      if (status.status === "expired" || status.status === "superseded") return;

      paymentPollTimer = window.setTimeout(listenForPaymentFromModal, 650);
    })
    .catch(() => {
      paymentPollTimer = window.setTimeout(listenForPaymentFromModal, 1200);
    });
}

async function recoverBlessingFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const signature = params.get("recover");
  if (!signature) return false;

  try {
    currentPaymentIntent = await createRecoveredPaymentIntent({
      offeringId: params.get("offering") || "traveler",
      signature
    });
    currentPaymentIntent.offeringId = params.get("offering") || "traveler";
    currentPaymentIntent.signatureSubmitted = true;
    currentPaymentIntent.storedAt = Date.now();
    savePendingPayment();
    awakenAmbientPresence();
    heroStage.classList.add("compact");
    offeringPage.classList.add("hidden");
    paymentModal.classList.add("hidden");
    beginVerificationWait({ submitted: true });
    const status = await waitForSubmittedOffering(currentPaymentIntent.id);
    if (status?.status === "verified") releaseBlessingAfterVerification();
  } catch {
    phaseLabel.textContent = "Offering Recovery Failed";
  }

  return true;
}

function recoverPendingPayment() {
  const pending = loadPendingPayment();
  if (!pending) return false;

  currentPaymentIntent = {
    ...pending,
    paymentStatus: pending.status,
    storedAt: pending.storedAt
  };

  awakenAmbientPresence();
  heroStage.classList.add("compact");
  offeringPage.classList.add("hidden");
  paymentModal.classList.add("hidden");
  completion.classList.add("hidden");

  if (pending.generatedBlessing) {
    ritualStatus.classList.add("hidden");
    revealOracle(pending.generatedBlessing);
    return true;
  }

  beginVerificationWait({ submitted: Boolean(pending.signatureSubmitted) });
  return true;
}

function releaseBlessingAfterVerification() {
  if (blessingReleaseInProgress) return;
  blessingReleaseInProgress = true;
  window.clearTimeout(paymentPollTimer);
  confirmOfferingButton.classList.add("hidden");
  returnFromVerificationButton.classList.add("hidden");
  savePendingPayment({ paymentStatus: "verified" });
  phaseLabel.textContent = "The offering is received.";
  ritualStatus.querySelector(".eyebrow").textContent = "The offering is received.";
  ritualStatus.querySelector("h2").textContent = "The Eternal Flame grows brighter.";
  ritualMessage.textContent = "The Shrine keeps silence.";

  window.setTimeout(() => {
    acknowledgeBlessing();
    ritualMessage.textContent = "The flame has heard the offering.";
    doorOfUnknown.classList.add("open");
  }, 700);

  window.setTimeout(() => {
    revealOracle(currentPaymentIntent?.generatedBlessing || null);
    blessingReleaseInProgress = false;
    resetPaymentAction();
  }, 2300);
}

function pollPaymentIntent() {
  window.clearTimeout(paymentPollTimer);

  if (!currentPaymentIntent) return;

  checkPaymentIntent(currentPaymentIntent.id)
    .then((status) => {
      if (status.status === "verified") {
        releaseBlessingAfterVerification();
        return;
      }

      if (status.status === "expired" || status.status === "superseded") {
        ritualStatus.querySelector(".eyebrow").textContent = "The offering was not verified.";
        ritualStatus.querySelector("h2").textContent = "The Shrine remains still.";
        ritualMessage.textContent = "Please return to the Shrine and begin a new offering.";
        return;
      }

      paymentPollTimer = window.setTimeout(pollPaymentIntent, 750);
    })
    .catch(() => {
      paymentPollTimer = window.setTimeout(pollPaymentIntent, 1400);
    });
}

offeringButton.addEventListener("click", () => {
  if (offeringButton.disabled) return;
  awakenAmbientPresence();
  offeringButton.disabled = true;
  offeringButton.classList.add("activating");
  phaseLabel.textContent = "Choose An Offering";
  oracleCard.classList.add("hidden");
  oracleCard.classList.remove("revealing");
  for (const timer of revealLineTimers) window.clearTimeout(timer);
  revealLineTimers = [];
  for (const line of oracleCard.querySelectorAll(".blessing-text p")) {
    line.classList.remove("line-emerging", "line-visible");
  }
  completion.classList.add("hidden");
  ritualStatus.classList.add("hidden");
  resetRitualStatusCopy();
  confirmOfferingButton.classList.add("hidden");
  returnFromVerificationButton.classList.add("hidden");
  window.clearTimeout(flameRestTimer);
  acknowledgePresence({ duration: randomBetween(1500, 2000), embers: Math.random() < 0.5 ? 1 : 2 });
  sacredScene.classList.remove("received");
  sacredFlame.classList.remove("lit");
  doorOfUnknown.classList.remove("open");
  scheduleLivingFlame();
  heroStage.classList.add("compact");
  window.clearTimeout(arrivalResponseTimer);
  arrivalResponseTimer = window.setTimeout(() => {
    offeringPage.classList.remove("hidden");
    offeringPage.scrollIntoView({ behavior: "smooth", block: "start" });
    offeringButton.classList.remove("activating");
    offeringButton.disabled = false;
  }, 900);
});

continueButton.addEventListener("click", () => {
  returnToThreshold();
});

offeringGrid.addEventListener("click", (event) => {
  const button = event.target.closest(".offering-choice");
  if (!button) return;

  for (const option of offeringGrid.querySelectorAll(".offering-choice")) {
    option.classList.toggle("active", option === button);
  }
  selectedOffering = button;
});

continuePaymentButton.addEventListener("click", async () => {
  selectedOffering = offeringGrid.querySelector(".offering-choice.active") || selectedOffering;
  resetPaymentAction({ clearStored: true });
  continuePaymentButton.disabled = true;
  continuePaymentButton.textContent = "Preparing Offering...";

  try {
    const intent = await createPaymentIntent(selectedOffering.dataset.offering);
    currentPaymentIntent = {
      ...intent,
      offeringId: selectedOffering.dataset.offering,
      storedAt: Date.now()
    };
    paymentTitle.textContent = intent.offeringName;
    paymentMeaning.textContent = selectedOffering.dataset.meaning;
    paymentInvocation.textContent = `May this flame accompany ${selectedOffering.dataset.offering === "traveler" ? "your steps through the unknown." : selectedOffering.dataset.offering === "keeper" ? "your keeping through the long night." : selectedOffering.dataset.offering === "sacred" ? "the blessing you carry forward." : "those who arrive after you."}`;
    paymentPrice.textContent = `${intent.amount} ${intent.token}`;
    paymentRecipient.textContent = intent.recipientAddress;
    paymentMint.textContent = intent.usdcMint;
    paymentReference.textContent = intent.reference;
    console.info("[payment-intent]", {
      id: intent.id,
      amount: intent.amount,
      token: intent.token,
      recipientAddress: intent.recipientAddress,
      usdcMint: intent.usdcMint,
      reference: intent.reference,
      solanaPayUrl: intent.solanaPayUrl
    });

    paymentQrImage.src = "/assets/solana-wallet-recipient-qr.png";
    paymentQrImage.classList.remove("loading");
    paymentQrLabel.textContent = "Scan recipient address";
    walletPayButton.textContent = "Pay With Wallet";
    savePendingPayment();

    paymentModal.classList.remove("hidden");
    phaseLabel.textContent = "Commitment";
    listenForPaymentFromModal();
  } catch {
    phaseLabel.textContent = "Offering Unavailable";
  } finally {
    continuePaymentButton.disabled = false;
    continuePaymentButton.textContent = "Offer to the Flame";
  }
});

cancelPaymentButton.addEventListener("click", () => {
  paymentModal.classList.add("hidden");
  resetPaymentAction({ clearStored: true });
  phaseLabel.textContent = "Make An Offering";
});

walletPayButton.addEventListener("click", async () => {
  if (!currentPaymentIntent) return;

  awakenAmbientPresence();
  window.clearTimeout(paymentPollTimer);
  walletPayButton.disabled = true;
  walletPayButton.textContent = "Opening Wallet...";
  paymentQrLabel.textContent = "Wallet confirmation will carry the Offering Mark.";

  try {
    const signature = await sendWalletOffering(currentPaymentIntent);
    currentPaymentIntent.signatureSubmitted = true;
    savePendingPayment({ signatureSubmitted: true });
    const submittedStatus = await submitPaymentSignature(currentPaymentIntent.id, signature);
    walletPayButton.textContent = "Confirming...";
    if (submittedStatus?.status === "verified") {
      paymentModal.classList.add("hidden");
      offeringPage.classList.add("hidden");
      ritualStatus.classList.remove("hidden");
      releaseBlessingAfterVerification();
      return;
    }

    const status = await waitForSubmittedOffering(currentPaymentIntent.id);
    if (status?.status === "verified") {
      paymentModal.classList.add("hidden");
      offeringPage.classList.add("hidden");
      ritualStatus.classList.remove("hidden");
      releaseBlessingAfterVerification();
      return;
    }

    beginVerificationWait({ submitted: true });
  } catch (error) {
    walletPayButton.disabled = false;
    walletPayButton.textContent = "Pay With Wallet";
    paymentQrLabel.textContent = error?.message || "Wallet payment was not completed.";
  }
});

completePaymentButton.addEventListener("click", async () => {
  if (!currentPaymentIntent) return;

  awakenAmbientPresence();
  completePaymentButton.disabled = true;
  completePaymentButton.textContent = "Listening...";

  try {
    const status = await waitForSubmittedOffering(currentPaymentIntent.id);
    if (status?.status === "verified") {
      paymentModal.classList.add("hidden");
      offeringPage.classList.add("hidden");
      ritualStatus.classList.remove("hidden");
      releaseBlessingAfterVerification();
      return;
    }
  } catch {
    // The waiting screen continues polling if the first verification pass misses the transfer.
  }

  completePaymentButton.textContent = "Awaiting Verification...";
  window.setTimeout(() => beginVerificationWait({ submitted: true }), 300);
});

confirmOfferingButton.addEventListener("click", () => {
  confirmOfferingButton.disabled = true;
  confirmOfferingButton.textContent = "Offering Confirmed";
  releaseBlessingAfterVerification();
});

returnFromVerificationButton.addEventListener("click", () => {
  returnToThreshold();
});

ambientToggle.addEventListener("click", () => {
  setAmbientPresence(!ambientPresence.enabled);
});

loadBlessingCorpus();
setAmbientToggleLabel();
scheduleLivingFlame();
scheduleEmber();
recoverBlessingFromUrl().then((recoveredFromUrl) => {
  if (!recoveredFromUrl) recoverPendingPayment();
});
