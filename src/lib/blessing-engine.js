const guardians = [
  {
    name: "Caishen",
    title: "Chinese guardian of wealth",
    sigil: "C",
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

function choice(items) {
  return items[Math.floor(Math.random() * items.length)];
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

export function generateBlessing() {
  const frequency = weightedChoice(frequencyWeights);
  const witnessPool = Math.random() < 0.7 ? silentWitnessLines : explicitWitnessLines;

  return {
    recognition: choice(witnessPool),
    blessing: choice(blessingLines[frequency]),
    mystery: choice(mysteryLines[frequency])
  };
}
