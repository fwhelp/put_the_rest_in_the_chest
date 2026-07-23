"use strict";

const BUILD_NUMBER = "1.5.33";
const API_STATE_URL = "/api/state";
const API_LOG_TAKE_URL = "/api/log-take";
const API_MOOD_ENTRY_URL = "/api/mood-entry";
const API_SESSION_URL = "/api/session";
const API_READ_AUTH_URL = "/api/auth/read";
const API_EDIT_AUTH_URL = "/api/auth/edit";
const API_LOGOUT_URL = "/api/logout";
const READ_SESSION_KEY = "put-the-rest-in-the-chest:read-key";
const EDIT_SESSION_KEY = "put-the-rest-in-the-chest:edit-key";

const DEFAULT_LOW_STOCK_THRESHOLD = 12;
const DEFAULT_SOFT_DAILY_GOAL = 4;
const STEADY_DAY_LIMIT = 4;
const PACK_COUNT = 24;
const PACK_PRICE_PRE_TAX = 24.59;
const LOCAL_SALES_TAX_RATE = 0.095;
const PACK_PRICE = roundMoney(PACK_PRICE_PRE_TAX * (1 + LOCAL_SALES_TAX_RATE));
const UNIT_PRICE = PACK_PRICE / PACK_COUNT;

const NUTRITION_PER_CAN = {
  calories: 100,
  sodium_mg: 10,
  carbs_g: 2,
  sugars_g: 2,
  protein_g: 0,
  fat_g: 0
};

const ENCOURAGEMENTS = [
  "Small check-ins count. The goal here is awareness and steadiness, not perfection.",
  "A rough day is still useful information. Log it, breathe, and keep moving.",
  "Moderation gets stronger when the tracker feels honest, not scary.",
  "The best pattern is the one you can keep returning to with clarity.",
  "This tool is for noticing the rhythm, not judging it."
];

const MOOD_META = {
  1: { emoji: "😞", label: "Very rough" },
  2: { emoji: "🙁", label: "Low" },
  3: { emoji: "😐", label: "Neutral" },
  4: { emoji: "🙂", label: "Good" },
  5: { emoji: "😄", label: "Great" }
};

const XENA_LINES = {
  empty: [
    "The chest is quiet. Restock when it makes sense, not out of panic.",
    "An empty chest is still a clean read. Breathe and plan the next step."
  ],
  low: [
    "Stock is getting low. Good moment to notice the pace before it sneaks up.",
    "A low count is a heads-up, not a crisis. Plan ahead and stay honest."
  ],
  high: [
    "Plenty on hand. The best move is still a clear count and a steady rhythm.",
    "A full chest is easiest to manage when the log stays honest."
  ],
  aboveGoal: [
    "A faster week just means we noticed it. Adjust gently and keep tracking.",
    "The pattern got a little louder this week. Logging it clearly is still a win."
  ],
  baseline: [
    "Log the truth, then keep moving.",
    "We are tracking the pattern, not grading the person."
  ]
};

const LITTLE_ONE_LINES = {
  empty: [
    "Okay, so the chest is empty. That just means we noticed it before chaos got louder.",
    "No drinks left. I would like to pretend that was the plan all along.",
    "The chest is empty. I am choosing to call that a dramatic but useful update.",
    "Zero in the chest. Good catch before the whole room starts acting weird about it.",
    "Empty chest. I was going to run a lap anyway, so now we know where things stand.",
    "No stock left. I support this number because at least it is honest.",
    "Okay, wow, fully empty. Good thing the tracker noticed before my attention span wandered off."
  ],
  low: [
    "Low stock alert. Tiny paws say maybe plan ahead before everybody gets dramatic.",
    "We are getting low. Xena is doing the stare, so I think that means log carefully.",
    "Low count. This is usually where Xena gets stern and I get suspiciously cooperative.",
    "The chest is getting light. Good time to make the next move on purpose.",
    "Low stock means we noticed the pace in time, which is honestly kind of impressive.",
    "We are getting close to the line. Let us not freestyle the math from here.",
    "Low enough that it matters, not so low that anybody needs to panic."
  ],
  high: [
    "There is plenty on hand, which is exactly why the count should stay honest.",
    "A fuller chest still behaves better when the notes are real and the math is boring.",
    "Plenty in the chest. The trick is keeping it calm, not pretending it manages itself.",
    "A bigger count is easiest to handle when nobody gets sneaky with the log.",
    "The chest is comfortable right now. That is when clean tracking matters most.",
    "Fuller stock. Very nice. Let us not get goofy with the numbers just because it feels roomy.",
    "There is enough on hand to stay deliberate. That is a good place to be."
  ],
  aboveGoal: [
    "The week got a little wobbly. Good thing the tracker is for noticing, not scolding.",
    "That pace jumped a bit. Logging it clearly is still a smart move, even if I was weird about it.",
    "Things got a little zoomy this week. We can still slow down by telling the truth about it.",
    "The count says the pace ran hot. Good news: honesty still counts as progress.",
    "This week got louder than usual. That does not erase the value of tracking it cleanly.",
    "The pattern drifted upward. Fine. We noticed, and now we get to adjust with our eyes open.",
    "A wobbly week is still useful data. I know because I specialize in looking wobbly."
  ],
  baseline: [
    "I may look distractible, but I am still clocking the pattern.",
    "Silly is not the same thing as careless. We can log it and keep going.",
    "I am the fast weird one, but even I know the count works better when it is honest.",
    "A tidy little log keeps the whole week from turning into a mystery novel.",
    "I support accurate numbers and occasional nonsense, in that order.",
    "I get distracted, not unserious. The tracker still matters.",
    "The pattern only gets slippery when nobody writes it down."
  ]
};

const DUO_DIALOGUE_SETS = {
  baseline: [
    {
      xena: "Count it right the first time, baby cat.",
      littleOne: "I got distracted, but I still remembered the drink log... mostly."
    },
    {
      xena: "We are not guessing. We are counting.",
      littleOne: "I love guessing, but okay, yes, counting is safer."
    },
    {
      xena: "Honest numbers first. Feelings can sit down for a second.",
      littleOne: "My feelings are standing on a chair, but I did still write it down."
    },
    {
      xena: "The tracker is here so nobody has to pretend.",
      littleOne: "Pretending is exhausting anyway. Logging is faster."
    },
    {
      xena: "You can be messy and still be accurate.",
      littleOne: "Finally, a workflow that respects my brand."
    },
    {
      xena: "Baby cat, the point is steady truth, not dramatic math.",
      littleOne: "I contain dramatic math, but I am willing to improve."
    },
    {
      xena: "Keep the count clean and the rest gets easier.",
      littleOne: "I do love when the hard part is just typing the number."
    },
    {
      xena: "We are building a pattern, not a courtroom.",
      littleOne: "Good, because I would be an unreliable witness with excellent vibes."
    }
  ],
  low: [
    {
      xena: "Stock is low. Plan the next move before the room gets emotional.",
      littleOne: "I was already emotional, but yes, planning sounds smarter."
    },
    {
      xena: "This is the part where we notice the pace and stay calm.",
      littleOne: "Calm-ish. I can do calm-ish and still log the number."
    },
    {
      xena: "Low count. No spiraling, just clarity.",
      littleOne: "Clarity first, tiny panic second. Understood."
    },
    {
      xena: "Do not let a short chest turn into sloppy tracking.",
      littleOne: "I can be short on stock without being short on honesty."
    },
    {
      xena: "Baby cat, this is a heads-up, not a catastrophe.",
      littleOne: "Okay, good, because I only brought heads-up energy today."
    }
  ],
  high: [
    {
      xena: "A full chest behaves best under adult supervision.",
      littleOne: "Perfect. I know an adult cat with opinions."
    },
    {
      xena: "More stock does not mean less discipline.",
      littleOne: "Rude, accurate, and honestly kind of inspiring."
    },
    {
      xena: "This is when the tracker keeps comfort from getting sloppy.",
      littleOne: "Comfort plus numbers. Cozy accountability."
    },
    {
      xena: "Plenty on hand. Keep the notes cleaner than the impulses.",
      littleOne: "I can absolutely write one neat line before I get weird again."
    },
    {
      xena: "The chest is full enough. Good. Now act like it matters.",
      littleOne: "I am acting like it matters in a whimsical but sincere way."
    }
  ],
  aboveGoal: [
    {
      xena: "The pace climbed. That is not a moral event. It is a data point.",
      littleOne: "A loud little data point, but still just data."
    },
    {
      xena: "The week ran hot. Good thing the log stayed honest.",
      littleOne: "Honest and a little frazzled, which still counts."
    },
    {
      xena: "No shame, just adjustment.",
      littleOne: "I love adjustment. It sounds much nicer than doom."
    },
    {
      xena: "The pattern drifted. We correct with attention, not punishment.",
      littleOne: "Attention I can do. Punishment was never going to help my vibe."
    },
    {
      xena: "If the week got messy, then write the mess down and move forward.",
      littleOne: "Document the chaos. That I can absolutely help with."
    }
  ],
  empty: [
    {
      xena: "Empty chest. No drama, just the actual number.",
      littleOne: "A very powerful zero. I respect it."
    },
    {
      xena: "The chest is out. Fine. Now we know.",
      littleOne: "Knowing is very brave of us, actually."
    },
    {
      xena: "Nothing left. Good. The tracker still did its job.",
      littleOne: "And nobody even had to invent a fake count. Huge."
    },
    {
      xena: "Zero stock is still cleaner than confusion.",
      littleOne: "I dislike confusion unless I am the one causing it on purpose."
    },
    {
      xena: "An empty chest is easier to solve than a dishonest one.",
      littleOne: "I would like that embroidered on a pillow immediately."
    }
  ]
};

const MOOD_XENA_LINES = {
  low: [
    "That mood check-in landed low. Good. We log the truth before we start making excuses for it.",
    "A rough last call is exactly the kind of thing the tracker should remember.",
    "If the mood dipped, write it down and let the pattern speak clearly."
  ],
  middle: [
    "Neutral is still useful. Not every night needs a dramatic headline.",
    "A steady middle mood tells us plenty if we keep logging it honestly.",
    "Some nights are just regular. Regular data matters too."
  ],
  high: [
    "A better last-call mood is worth noticing without getting smug about it.",
    "Good mood at the end of the night. Fine. Keep the habits that helped.",
    "If the ending felt lighter, that belongs in the pattern too."
  ]
};

const MOOD_LITTLE_ONE_LINES = {
  low: [
    "Okay, that one ended kind of heavy. I am proud we wrote it down anyway.",
    "Low mood logged. That is brave and annoyingly responsible.",
    "If the night felt off, the tracker should know that before my memory gets weird."
  ],
  middle: [
    "Neutral is a real mood. I respect a perfectly average little check-in.",
    "Middle-of-the-road is still a road, and now we have the map for it.",
    "Honestly, calm-neutral is underrated."
  ],
  high: [
    "A happier last call? Tiny celebration, giant honesty, very efficient.",
    "That one ended pretty okay. Love that for the spreadsheet.",
    "Good mood at the end means we should remember what helped, not just the number."
  ]
};

const BADGES = [
  {
    id: "first-check-in",
    icon: "📝",
    name: "First Check-In",
    text: "Logged the first real entry.",
    unlocked: (stats) => stats.totalEntries >= 1
  },
  {
    id: "first-restock",
    icon: "📦",
    name: "First Restock",
    text: "Added stock back to the chest for the first time.",
    unlocked: (stats) => stats.purchaseEvents >= 1
  },
  {
    id: "mood-witness",
    icon: "🙂",
    name: "Mood Witness",
    text: "Logged three separate mood check-ins.",
    unlocked: (stats) => stats.moodEntriesCount >= 3
  },
  {
    id: "last-call-kept",
    icon: "🌙",
    name: "Last Call Kept",
    text: "Marked last call on three different nights.",
    unlocked: (stats) => stats.lastCallDays >= 3
  },
  {
    id: "week-tracker",
    icon: "📆",
    name: "Week Of Tracking",
    text: "Seven days with at least one check-in.",
    unlocked: (stats) => stats.trackingStreak >= 7
  },
  {
    id: "gentle-week",
    icon: "🫶",
    name: "Gentle Week",
    text: "Fourteen-day window includes at least seven steady days.",
    unlocked: (stats) => stats.steadyDays14 >= 7
  },
  {
    id: "steady-fortnight",
    icon: "🌷",
    name: "Steady Fortnight",
    text: "Fourteen-day window includes ten steady days.",
    unlocked: (stats) => stats.steadyDays14 >= 10
  },
  {
    id: "thoughtful-restock",
    icon: "🛒",
    name: "Thoughtful Restock",
    text: "Restocked at least three separate times.",
    unlocked: (stats) => stats.purchaseEvents >= 3
  },
  {
    id: "receipt-keeper",
    icon: "🧾",
    name: "Receipt Keeper",
    text: "Logged at least ten entries with notes attached.",
    unlocked: (stats) => stats.notedEntries >= 10
  },
  {
    id: "course-corrector",
    icon: "🛠️",
    name: "Course Corrector",
    text: "Used manual corrections or threshold updates at least twice.",
    unlocked: (stats) => stats.correctionEvents >= 2
  },
  {
    id: "pattern-reader",
    icon: "🔎",
    name: "Pattern Reader",
    text: "Reached fourteen distinct drink days in the log.",
    unlocked: (stats) => stats.takeDays >= 14
  },
  {
    id: "honest-month",
    icon: "🏁",
    name: "Honest Month",
    text: "Thirty or more tracked days in the log.",
    unlocked: (stats) => stats.trackedDays >= 30
  }
];

const TIC_WIN_LINES = [
  "You took the round. Xena is pretending this was a systems test.",
  "Yarn wins. Little One says the board looked emotionally cooperative.",
  "Nice. One clean line and both cats have notes about it."
];

const TIC_TIE_LINES = [
  "Cat stalemate. Everyone claims this was the plan.",
  "Draw. Xena calls it disciplined. Little One calls it suspicious.",
  "Nobody won, which somehow feels very on brand."
];

const appState = {
  state: normalizeState({}),
  saveInFlight: false,
  access: "none",
  readPassword: "",
  editPassword: "",
  encouragementIndex: 0,
  dialogueSeed: null,
  selectedHistoryEntryId: ""
};

const dom = {
  lockScreen: document.getElementById("lock-screen"),
  appShell: document.getElementById("app-shell"),
  readAuthForm: document.getElementById("read-auth-form"),
  readPassword: document.getElementById("read-password"),
  authMessage: document.getElementById("auth-message"),
  editAuthForm: document.getElementById("edit-auth-form"),
  editPassword: document.getElementById("edit-password"),
  accessReadout: document.getElementById("access-readout"),
  logoutButton: document.getElementById("logout-button"),
  currentCount: document.getElementById("current-count"),
  stockStatus: document.getElementById("stock-status"),
  stockMeterFill: document.getElementById("stock-meter-fill"),
  thresholdLabel: document.getElementById("threshold-label"),
  inventoryValue: document.getElementById("inventory-value"),
  paceLabel: document.getElementById("pace-label"),
  sevenDayAverage: document.getElementById("seven-day-average"),
  consumedValue: document.getElementById("consumed-value"),
  trackingStreak: document.getElementById("tracking-streak"),
  steadyDays: document.getElementById("steady-days"),
  encouragementButton: document.getElementById("encouragement-button"),
  encouragementText: document.getElementById("encouragement-text"),
  xenaBubble: document.getElementById("xena-bubble"),
  littleOneBubble: document.getElementById("little-one-bubble"),
  duoXenaLine: document.getElementById("duo-xena-line"),
  duoLittleOneLine: document.getElementById("duo-little-one-line"),
  heroGrid: document.querySelector(".hero-grid"),
  miniStatsGrid: document.querySelector(".mini-stats-grid"),
  priorityGrid: document.querySelector(".priority-grid"),
  contentGrid: document.querySelector(".content-grid"),
  mobileHeroSlot: document.getElementById("mobile-hero-slot"),
  mobileStatsSlot: document.getElementById("mobile-stats-slot"),
  addForm: document.getElementById("add-form"),
  addAmount: document.getElementById("add-amount"),
  addNote: document.getElementById("add-note"),
  takeForm: document.getElementById("take-form"),
  takeAmount: document.getElementById("take-amount"),
  takeNote: document.getElementById("take-note"),
  takeLastCall: document.getElementById("take-last-call"),
  takeMood: document.getElementById("take-mood"),
  thresholdForm: document.getElementById("threshold-form"),
  thresholdInput: document.getElementById("threshold-input"),
  countForm: document.getElementById("count-form"),
  countInput: document.getElementById("count-input"),
  countNote: document.getElementById("count-note"),
  resetCountButton: document.getElementById("reset-count-button"),
  tallyForm: document.getElementById("tally-form"),
  tallyTimestamp: document.getElementById("tally-timestamp"),
  tallyAmount: document.getElementById("tally-amount"),
  tallyNote: document.getElementById("tally-note"),
  trendChart: document.getElementById("trend-chart"),
  chartCaption: document.getElementById("chart-caption"),
  weekDrinks: document.getElementById("week-drinks"),
  weekAverage: document.getElementById("week-average"),
  weekValue: document.getElementById("week-value"),
  weekCalories: document.getElementById("week-calories"),
  moodAverage: document.getElementById("mood-average"),
  moodLast: document.getElementById("mood-last"),
  moodCount: document.getElementById("mood-count"),
  moodCaption: document.getElementById("mood-caption"),
  moodLimit: document.getElementById("mood-limit"),
  moodXenaLine: document.getElementById("mood-xena-line"),
  moodLittleOneLine: document.getElementById("mood-little-one-line"),
  moodBody: document.getElementById("mood-body"),
  moodEditorCard: document.getElementById("mood-editor-card"),
  moodEditorForm: document.getElementById("mood-editor-form"),
  moodEntryId: document.getElementById("mood-entry-id"),
  moodTimestamp: document.getElementById("mood-timestamp"),
  moodValue: document.getElementById("mood-value"),
  moodLastCall: document.getElementById("mood-last-call"),
  moodNote: document.getElementById("mood-note"),
  moodSaveStatus: document.getElementById("mood-save-status"),
  monthDrinks: document.getElementById("month-drinks"),
  monthSpent: document.getElementById("month-spent"),
  monthSodium: document.getElementById("month-sodium"),
  monthCarbs: document.getElementById("month-carbs"),
  lifetimeDrinks: document.getElementById("lifetime-drinks"),
  lifetimeSpent: document.getElementById("lifetime-spent"),
  lifetimeValue: document.getElementById("lifetime-value"),
  trackedDays: document.getElementById("tracked-days"),
  historyLimit: document.getElementById("history-limit"),
  historyBody: document.getElementById("history-body"),
  historyEditorCard: document.getElementById("history-editor-card"),
  historyEditorForm: document.getElementById("history-editor-form"),
  historyEntryId: document.getElementById("history-entry-id"),
  historyTimestamp: document.getElementById("history-timestamp"),
  historyAction: document.getElementById("history-action"),
  historyAmount: document.getElementById("history-amount"),
  historyNote: document.getElementById("history-note"),
  historyNewButton: document.getElementById("history-new-button"),
  historyDeleteButton: document.getElementById("history-delete-button"),
  exportButton: document.getElementById("export-button"),
  importInput: document.getElementById("import-input"),
  sideColumn: document.querySelector(".side-column"),
  badgeList: document.getElementById("badge-list"),
  badgeCount: document.getElementById("badge-count"),
  badgeCountCopy: document.getElementById("badge-count-copy"),
  badgeHighlightName: document.getElementById("badge-highlight-name"),
  badgeHighlightText: document.getElementById("badge-highlight-text"),
  badgeCatLine: document.getElementById("badge-cat-line"),
  badgeTemplate: document.getElementById("badge-template"),
  packCount: document.getElementById("pack-count"),
  packPrice: document.getElementById("pack-price"),
  unitPrice: document.getElementById("unit-price"),
  toastLog: document.getElementById("toast-log")
};

init();

async function init() {
  dom.packCount.textContent = `${PACK_COUNT} drinks`;
  dom.packPrice.textContent = formatMoney(PACK_PRICE);
  dom.unitPrice.textContent = formatMoney(UNIT_PRICE);
  syncTakeMoodState();

  bindEvents();
  hydrateStoredAccess();
  syncResponsiveLayout();

  if (appState.access !== "none") {
    await hydrateState();
    refreshSessionDialogue();
    unlockApp();
    addToast(`Loaded build ${BUILD_NUMBER}. JSON-backed tracker ready.`);
    clearHistoryEditor();
    render();
    return;
  }

  clearHistoryEditor();
  renderAccessState();
}

function bindEvents() {
  dom.readAuthForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const password = dom.readPassword.value.trim();
    if (!password) {
      setAuthMessage("Enter the read-only password to load the tracker.");
      return;
    }

    setAuthMessage("Unlocking read view...");
    const ok = await authenticateRead(password);
    dom.readPassword.value = "";
    if (!ok) {
      if (!dom.authMessage.textContent || dom.authMessage.textContent === "Unlocking read view...") {
        setAuthMessage("That read-only password did not work.");
      }
      return;
    }

    try {
      await hydrateState();
      refreshSessionDialogue();
      unlockApp();
      render();
      addToast("Read-only access unlocked.");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setAuthMessage(`Unlock failed after login: ${message}`);
      appState.access = "none";
      clearStoredAccess();
      lockApp();
    }
  });

  dom.editAuthForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const password = dom.editPassword.value.trim();
    if (!password) {
      addToast("Enter the edit password to unlock data changes.");
      return;
    }

    const ok = await authenticateEdit(password);
    dom.editPassword.value = "";
    if (!ok) {
      addToast("Edit password was rejected.");
      renderAccessState();
      return;
    }

    render();
    addToast("Editing unlocked.");
  });

  dom.logoutButton.addEventListener("click", async () => {
    await apiFetch(API_LOGOUT_URL, { method: "POST" });
    appState.access = "none";
    clearStoredAccess();
    lockApp();
    setAuthMessage("Tracker locked. Enter the read-only password to load it again.");
  });

  dom.encouragementButton.addEventListener("click", () => {
    appState.encouragementIndex = (appState.encouragementIndex + 1) % ENCOURAGEMENTS.length;
    dom.encouragementText.textContent = ENCOURAGEMENTS[appState.encouragementIndex];
  });

  dom.addForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!requireEditAccess()) {
      return;
    }
    const amount = positiveInt(dom.addAmount.value);
    if (!amount) {
      return;
    }
    appState.state.count += amount;
    addHistoryEntry("add", amount, dom.addNote.value.trim());
    void persistAndRender(`Added ${amount} drinks to the chest.`);
    dom.addNote.value = "";
    dom.countInput.value = appState.state.count;
  });

  dom.takeForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!requireTakeAccess()) {
      return;
    }
    const amount = positiveInt(dom.takeAmount.value);
    if (!amount) {
      return;
    }
    const lastCall = dom.takeLastCall.checked;
    const mood = normalizeMoodValue(dom.takeMood.value);
    if (appState.access === "edit") {
      appState.state.count = Math.max(0, appState.state.count - amount);
      addHistoryEntry("take", amount, dom.takeNote.value.trim(), { last_call: lastCall, mood });
      void persistAndRender(`Logged ${amount} drink${amount === 1 ? "" : "s"} taken.`);
      dom.takeNote.value = "";
      dom.takeLastCall.checked = false;
      dom.takeMood.value = "";
      syncTakeMoodState();
      dom.countInput.value = appState.state.count;
      return;
    }
    void submitTakeEntry(amount, dom.takeNote.value.trim(), lastCall, mood);
  });
  dom.takeLastCall.addEventListener("change", syncTakeMoodState);

  dom.thresholdForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!requireEditAccess()) {
      return;
    }
    const threshold = clampToZero(dom.thresholdInput.value);
    appState.state.low_stock_threshold = threshold;
    appState.state.history.push({
      id: generateEntryId(),
      timestamp: isoNow(),
      action: "set_threshold",
      amount: threshold,
      note: "Updated low-stock threshold",
      count: appState.state.count
    });
    recalculateStateFromHistory();
    void persistAndRender(`Low-stock alert set to ${threshold}.`);
  });

  dom.countForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!requireEditAccess()) {
      return;
    }
    const count = clampToZero(dom.countInput.value);
    const note = dom.countNote.value.trim() || "Manual correction";
    appState.state.count = count;
    appState.state.history.push({
      id: generateEntryId(),
      timestamp: isoNow(),
      action: "set_count",
      amount: count,
      note,
      count
    });
    recalculateStateFromHistory();
    void persistAndRender(`Current count set to ${count}.`);
    dom.countNote.value = "";
  });

  dom.resetCountButton.addEventListener("click", () => {
    if (!requireEditAccess()) {
      return;
    }
    appState.state.count = 0;
    appState.state.history.push({
      id: generateEntryId(),
      timestamp: isoNow(),
      action: "reset_count",
      amount: 0,
      note: "Reset count to zero",
      count: 0
    });
    recalculateStateFromHistory();
    dom.countInput.value = 0;
    void persistAndRender("Count reset to 0.");
  });

  dom.tallyForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!requireEditAccess()) {
      return;
    }
    const timestamp = fromLocalDateTimeValue(dom.tallyTimestamp.value);
    if (!timestamp) {
      addToast("Pick a valid date and time for the daily tally.");
      return;
    }
    const amount = clampToZero(dom.tallyAmount.value);
    if (amount <= 0) {
      addToast("Daily tally must be at least 1 drink.");
      return;
    }
    const note = dom.tallyNote.value.trim() || "Daily drink tally";
      const dayKey = localDayKey(timestamp);
      const existingTally = appState.state.history.find((entry) => entry.action === "daily_tally" && trackerDayKey(entry) === dayKey);
      const nextEntry = {
        id: existingTally?.id || generateEntryId(),
        timestamp,
        tracker_day: dayKey,
        action: "daily_tally",
        amount,
        note,
        count: 0
    };
    if (existingTally) {
      const existingIndex = appState.state.history.findIndex((entry) => entry.id === existingTally.id);
      appState.state.history.splice(existingIndex, 1, nextEntry);
    } else {
      appState.state.history.push(nextEntry);
    }
    recalculateStateFromHistory();
    dom.tallyTimestamp.value = toLocalDateTimeValue(isoNow());
    dom.tallyAmount.value = "4";
    dom.tallyNote.value = "";
    void persistAndRender(`${existingTally ? "Daily tally updated" : "Daily tally saved"} for ${amount} drink${amount === 1 ? "" : "s"}.`);
  });

  dom.historyLimit.addEventListener("change", renderHistory);
  dom.historyAction.addEventListener("change", syncHistoryEditorActionState);
  dom.historyNewButton.addEventListener("click", () => {
    clearHistoryEditor();
    renderHistory();
    renderHistoryEditor();
  });
  dom.historyDeleteButton.addEventListener("click", () => {
    void deleteSelectedHistoryEntry();
  });
  dom.historyEditorForm.addEventListener("submit", (event) => {
    event.preventDefault();
    void saveHistoryEditorEntry();
  });
  dom.moodEditorForm.addEventListener("submit", (event) => {
    event.preventDefault();
    void saveMoodEditorEntry();
  });
  dom.moodLastCall.addEventListener("change", renderMoodEditor);
  dom.moodTimestamp.addEventListener("input", clearMoodStatus);
  dom.moodValue.addEventListener("change", clearMoodStatus);
  dom.moodNote.addEventListener("input", clearMoodStatus);
  dom.moodLastCall.addEventListener("change", clearMoodStatus);
  dom.moodLimit.addEventListener("change", () => {
    render();
  });

  dom.exportButton.addEventListener("click", exportStateJson);
  dom.importInput.addEventListener("change", importStateJson);

    window.addEventListener("resize", () => {
      syncResponsiveLayout();
      if (appState.access !== "none") {
        render();
      }
    });
  }

function syncResponsiveLayout() {
  if (!dom.heroGrid || !dom.miniStatsGrid || !dom.contentGrid || !dom.priorityGrid || !dom.mobileHeroSlot || !dom.mobileStatsSlot) {
    return;
  }

  const isMobile = (window.innerWidth || 1400) <= 820;

  if (isMobile) {
    if (dom.heroGrid.parentElement !== dom.mobileHeroSlot) {
      dom.mobileHeroSlot.appendChild(dom.heroGrid);
    }
    if (dom.miniStatsGrid.parentElement !== dom.mobileStatsSlot) {
      dom.mobileStatsSlot.appendChild(dom.miniStatsGrid);
    }
  } else {
    if (dom.heroGrid.parentElement !== dom.appShell) {
      dom.appShell.insertBefore(dom.heroGrid, dom.contentGrid);
    }
    if (dom.miniStatsGrid.parentElement !== dom.appShell) {
      dom.appShell.insertBefore(dom.miniStatsGrid, dom.contentGrid);
    }
  }
}

function render() {
  const stats = buildStats(appState.state);
  ensureSessionDialogue();
  renderAccessState();
  renderHero(stats);
  renderXenaBubble(stats);
  renderLittleOneBubble(stats);
  renderDuoDialogue(stats);
  renderTrendChart(getResponsiveTrendDays(stats.daily14));
  renderSummaries(stats);
  renderMoodPanel(stats);
  renderHistory();
  renderHistoryEditor();
  renderBadges(stats);
}

function renderAccessState() {
  const isRead = appState.access === "read" || appState.access === "edit";
  const isEdit = appState.access === "edit";

  dom.accessReadout.textContent = isEdit
    ? "Edit mode unlocked. Data changes are allowed."
    : isRead
      ? "Read mode unlocked. Viewing, charts, export, and logging drinks taken are available."
      : "Read-only mode locked.";

  setDisabledState(dom.addForm, !isEdit);
  setDisabledState(dom.takeForm, !isRead);
  setDisabledState(dom.thresholdForm, !isEdit);
  setDisabledState(dom.countForm, !isEdit);
  dom.importInput.disabled = !isEdit;
  dom.importInput.parentElement?.classList.toggle("is-disabled", !isEdit);
  setDisabledState(dom.historyEditorCard, !isEdit);
  setDisabledState(dom.moodEditorCard, !isRead);
}

function renderHero(stats) {
  dom.currentCount.textContent = String(appState.state.count);
  dom.thresholdLabel.textContent = `Low alert at ${appState.state.low_stock_threshold}`;
  dom.inventoryValue.textContent = `${formatMoney(stats.inventoryValue)} on hand`;
  dom.paceLabel.textContent = `${stats.last7Drinks} drinks in the last 7 days`;
  dom.sevenDayAverage.textContent = stats.last7Average.toFixed(1);
  dom.consumedValue.textContent = formatMoney(stats.monthValue);
  dom.trackingStreak.textContent = String(stats.trackingStreak);
  dom.steadyDays.textContent = String(stats.steadyDays14);
  dom.countInput.value = appState.state.count;
  dom.thresholdInput.value = appState.state.low_stock_threshold;

  const meterPercent = appState.state.count === 0
    ? 0
    : Math.min(100, Math.max(8, (appState.state.count / Math.max(appState.state.low_stock_threshold * 2, 1)) * 100));
  dom.stockMeterFill.style.width = `${meterPercent}%`;

  let statusTone = "calm";
  let statusText = "Chest looks healthy. Plenty of room to be deliberate.";

  if (appState.state.count === 0) {
    statusTone = "low";
    statusText = "Chest is empty. Time for a calm reset and a restock when needed.";
  } else if (appState.state.count <= appState.state.low_stock_threshold) {
    statusTone = "watch";
    statusText = "Stock is getting low. Good time to plan ahead without pressure.";
  }

  dom.stockStatus.textContent = statusText;
  dom.stockMeterFill.dataset.tone = statusTone;
}

function renderXenaBubble(stats) {
  let pool = XENA_LINES.baseline;

  if (appState.state.count === 0) {
    pool = XENA_LINES.empty;
  } else if (appState.state.count <= appState.state.low_stock_threshold) {
    pool = XENA_LINES.low;
  } else if (appState.state.count > appState.state.low_stock_threshold) {
    pool = XENA_LINES.high;
  }

  const indexSeed = getDialogueSeed() + stats.trackingStreak + stats.last7Drinks + appState.state.count;
  dom.xenaBubble.textContent = pool[indexSeed % pool.length];
}

function renderLittleOneBubble(stats) {
  if (!dom.littleOneBubble) {
    return;
  }

  let pool = LITTLE_ONE_LINES.baseline;

  if (appState.state.count === 0) {
    pool = LITTLE_ONE_LINES.empty;
  } else if (appState.state.count <= appState.state.low_stock_threshold) {
    pool = LITTLE_ONE_LINES.low;
  } else if (appState.state.count > appState.state.low_stock_threshold) {
    pool = LITTLE_ONE_LINES.high;
  }

  const indexSeed = getDialogueSeed() + stats.last7Drinks + stats.monthDrinks + appState.state.count + 3;
  dom.littleOneBubble.textContent = pool[indexSeed % pool.length];
}

function renderDuoDialogue(stats) {
  if (!dom.duoXenaLine || !dom.duoLittleOneLine) {
    return;
  }

  const mood = getDialogueMood(stats);
  const options = DUO_DIALOGUE_SETS[mood] || DUO_DIALOGUE_SETS.baseline;
  const choice = options[getDialogueSeed() % options.length];
  dom.duoXenaLine.innerHTML = `<span class="duo-name">Xena:</span> “${escapeHtml(choice.xena)}”`;
  dom.duoLittleOneLine.innerHTML = `<span class="duo-name">Little One:</span> “${escapeHtml(choice.littleOne)}”`;
}

function getDialogueMood(stats) {
  if (appState.state.count === 0) {
    return "empty";
  }
  if (appState.state.count <= appState.state.low_stock_threshold) {
    return "low";
  }
  if (appState.state.count > appState.state.low_stock_threshold) {
    return "high";
  }
  return "baseline";
}

function refreshSessionDialogue() {
  appState.dialogueSeed = Math.floor(Math.random() * 1_000_000);
}

function ensureSessionDialogue() {
  if (appState.dialogueSeed === null) {
    refreshSessionDialogue();
  }
}

function getDialogueSeed() {
  ensureSessionDialogue();
  return appState.dialogueSeed || 0;
}

function renderTrendChart(days) {
  dom.trendChart.innerHTML = "";
  const max = Math.max(1, ...days.map((day) => day.amount));
  dom.chartCaption.textContent = `Last ${days.length} day${days.length === 1 ? "" : "s"}`;

  days.forEach((day) => {
    const bar = document.createElement("div");
    bar.className = "trend-bar";

    const meter = document.createElement("div");
    meter.className = "trend-bar-meter";

    const fill = document.createElement("div");
    fill.className = "trend-bar-fill";
    fill.style.height = `${Math.max(8, (day.amount / max) * 100)}%`;
    meter.append(fill);

    const value = document.createElement("span");
    value.className = "trend-value";
    value.textContent = String(day.amount);

    const label = document.createElement("span");
    label.className = "trend-label";
    label.textContent = formatChartDay(day.date);

    if (day.mood) {
      const mood = document.createElement("span");
      mood.className = "trend-mood";
      mood.textContent = formatMoodEmoji(day.mood);
      mood.title = `Daily mood: ${formatMoodLabel(day.mood)}`;
      bar.append(mood);
    }

    bar.append(value, meter, label);
    dom.trendChart.append(bar);
  });
}

function getResponsiveTrendDays(daily14) {
  const width = window.innerWidth || 1400;
  const count = width <= 420 ? 7 : width <= 560 ? 8 : width <= 820 ? 9 : 14;
  return daily14.slice(-count);
}

function renderSummaries(stats) {
  dom.weekDrinks.textContent = String(stats.last7Drinks);
  dom.weekAverage.textContent = stats.last7Average.toFixed(1);
  dom.weekValue.textContent = formatMoney(stats.last7Value);
  dom.weekCalories.textContent = String(stats.last7Nutrition.calories);

  dom.monthDrinks.textContent = String(stats.monthDrinks);
  dom.monthSpent.textContent = formatMoney(stats.monthSpent);
  dom.monthSodium.textContent = `${stats.monthNutrition.sodium_mg} mg`;
  dom.monthCarbs.textContent = `${stats.monthNutrition.carbs_g} g`;

  dom.lifetimeDrinks.textContent = String(stats.lifetimeDrinks);
  dom.lifetimeSpent.textContent = formatMoney(stats.lifetimeSpent);
  dom.lifetimeValue.textContent = formatMoney(stats.lifetimeValue);
  dom.trackedDays.textContent = String(stats.trackedDays);
}

function renderMoodPanel(stats) {
  dom.moodAverage.textContent = stats.moodAverage14 ? stats.moodAverage14.toFixed(1) : "—";
  dom.moodLast.textContent = stats.latestMoodEntry ? `${formatMoodEmoji(stats.latestMoodEntry.mood)} ${formatMoodLabel(stats.latestMoodEntry.mood)}` : "—";
  dom.moodCount.textContent = String(stats.lastCallCount30);
  dom.moodCaption.textContent = stats.latestMoodEntry
    ? `Latest mood check-in was ${formatDateTime(stats.latestMoodEntry.timestamp)}. Mood emoji above each day bar marks the latest mood logged for that day.`
    : "1 to 5 daily mood check-ins. Mood emoji above each day bar marks the latest mood logged for that day.";

  renderMoodCommentary(stats);
  renderMoodTable(stats);
  renderMoodEditor(stats);
}

function renderMoodCommentary(stats) {
  let tone = "middle";
  if (stats.moodAverage14 && stats.moodAverage14 < 2.75) {
    tone = "low";
  } else if (stats.moodAverage14 && stats.moodAverage14 >= 4) {
    tone = "high";
  }

  const xPool = MOOD_XENA_LINES[tone];
  const lPool = MOOD_LITTLE_ONE_LINES[tone];
  const seed = getDialogueSeed() + stats.lastCallCount30 + Math.round((stats.moodAverage14 || 0) * 10);
  const xLine = xPool[seed % xPool.length];
  const lLine = lPool[(seed + 2) % lPool.length];
  dom.moodXenaLine.innerHTML = `<span class="duo-name">Xena:</span> ${escapeHtml(xLine)}`;
  dom.moodLittleOneLine.innerHTML = `<span class="duo-name">Little One:</span> ${escapeHtml(lLine)}`;
}

function renderMoodTable(stats) {
  dom.moodBody.innerHTML = "";
  const limit = Number.parseInt(dom.moodLimit?.value || "25", 10) || 25;
  const rows = stats.moodEditableEntries.slice(0, limit);
  if (!rows.length) {
    const row = document.createElement("tr");
    row.innerHTML = '<td colspan="6" class="history-empty">No mood check-ins yet. Save a mood whenever you want, with or without a linked drink.</td>';
    dom.moodBody.append(row);
    return;
  }

  rows.forEach((entry) => {
    const linkedTake = entry.linked_take_entry_id
      ? appState.state.history.find((historyEntry) => historyEntry.id === entry.linked_take_entry_id && historyEntry.action === "take")
      : null;
    const row = document.createElement("tr");
    row.innerHTML = `
      <td data-label="When">${formatDateTime(entry.timestamp)}</td>
      <td data-label="Mood">${entry.mood ? `${formatMoodEmoji(entry.mood)} ${formatMoodLabel(entry.mood)}` : "—"}</td>
      <td data-label="Last Call">${entry.last_call ? "Yes" : "No"}</td>
      <td data-label="Note">${escapeHtml(entry.note || "")}</td>
      <td data-label="Linked Drink">${linkedTake ? `${linkedTake.amount} drink${linkedTake.amount === 1 ? "" : "s"}` : "—"}</td>
      <td data-label="Edit"><button class="ghost-button mood-edit-button" type="button" data-mood-edit="${escapeHtml(entry.id)}" ${appState.access === "none" ? "disabled" : ""}>Edit</button></td>
    `;
    dom.moodBody.append(row);
  });

  dom.moodBody.querySelectorAll("[data-mood-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      openMoodEditor(button.getAttribute("data-mood-edit") || "");
    });
  });
}

function renderMoodEditor() {
  const canEditMood = appState.access === "read" || appState.access === "edit";
  dom.moodTimestamp.disabled = !canEditMood;
  dom.moodValue.disabled = !canEditMood;
  dom.moodLastCall.disabled = !canEditMood;
  dom.moodNote.disabled = !canEditMood;
}

function setMoodStatus(message, tone = "info") {
  if (!dom.moodSaveStatus) {
    return;
  }
  dom.moodSaveStatus.textContent = message;
  dom.moodSaveStatus.dataset.tone = tone;
}

function clearMoodStatus() {
  setMoodStatus("");
}

function renderHistory() {
  const limit = Number.parseInt(dom.historyLimit.value, 10) || 25;
  const rows = [...appState.state.history].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, limit);
  dom.historyBody.innerHTML = "";

  if (!rows.length) {
    const row = document.createElement("tr");
    row.innerHTML = '<td colspan="6" class="history-empty">No entries yet. Add stock or log a drink to get started.</td>';
    dom.historyBody.append(row);
    return;
  }

  rows.forEach((entry) => {
    const row = document.createElement("tr");
    if (entry.id === appState.selectedHistoryEntryId) {
      row.classList.add("history-row-selected");
    }
    row.innerHTML = `
      <td data-label="When">${formatDateTime(entry.timestamp)}</td>
      <td data-label="Action">${formatAction(entry.action)}</td>
      <td data-label="Amount">${entry.amount}</td>
      <td data-label="Count">${entry.count}</td>
      <td data-label="Note">${escapeHtml(entry.note || "")}</td>
      <td class="history-edit-cell" data-label="Edit"><button class="ghost-button history-edit-button" type="button" data-history-edit="${escapeHtml(entry.id)}" ${appState.access !== "edit" ? "disabled" : ""}>Edit</button></td>
    `;
    dom.historyBody.append(row);
  });

  dom.historyBody.querySelectorAll("[data-history-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      const entryId = button.getAttribute("data-history-edit") || "";
      openHistoryEditor(entryId);
    });
  });
}

function renderHistoryEditor() {
  const selectedEntry = getSelectedHistoryEntry();
  dom.historyDeleteButton.disabled = appState.access !== "edit" || !selectedEntry || selectedEntry.action === "init";
  syncHistoryEditorActionState();
}

function renderBadges(stats) {
  dom.badgeList.innerHTML = "";
  const unlockedBadges = BADGES.filter((badge) => badge.unlocked(stats));

  if (dom.badgeCount) {
    dom.badgeCount.textContent = String(unlockedBadges.length);
  }

  if (dom.badgeCountCopy) {
    dom.badgeCountCopy.textContent = unlockedBadges.length === 1
      ? "quiet little win so far"
      : "quiet little wins so far";
  }

  const latestBadge = unlockedBadges[unlockedBadges.length - 1] || null;
  if (dom.badgeHighlightName) {
    dom.badgeHighlightName.textContent = latestBadge ? `${latestBadge.icon} ${latestBadge.name}` : "No wins yet";
  }

  if (dom.badgeHighlightText) {
    dom.badgeHighlightText.textContent = latestBadge
      ? latestBadge.text
      : "Wins appear here as the log grows. Nothing to chase, just small signs of consistency.";
  }

  if (dom.badgeCatLine) {
    dom.badgeCatLine.textContent = getBadgeCatLine(unlockedBadges.length, latestBadge);
  }

  unlockedBadges.forEach((badge) => {
    const fragment = dom.badgeTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".badge-card");
    const icon = document.createElement("div");
    icon.className = "badge-icon";
    icon.textContent = badge.icon || "🏅";
    const copy = document.createElement("div");
    copy.className = "badge-copy";
    const name = document.createElement("strong");
    name.className = "badge-name";
    name.textContent = badge.name;
    const text = document.createElement("p");
    text.className = "badge-text";
    text.textContent = badge.text;
    copy.append(name, text);
    card.append(icon, copy);
    dom.badgeList.append(fragment);
  });

  if (!dom.badgeList.children.length) {
    const empty = document.createElement("p");
    empty.className = "panel-copy";
    empty.textContent = "Wins appear here as the log grows. Nothing to chase, just small signs of consistency.";
    dom.badgeList.append(empty);
  }
}

function getBadgeCatLine(count, latestBadge) {
  if (!count) {
    return "Xena says consistency counts. Little One says tiny wins still deserve witness protection.";
  }

  if (!latestBadge) {
    return "The wins are small on purpose. They are here to notice, not to pressure.";
  }

  const pools = [
    `Xena logged another quiet win: ${latestBadge.name}. Little One says that absolutely deserves a tiny parade.`,
    `Collected wins are filling in. Latest stamp: ${latestBadge.name}. Xena approves in a very restrained way.`,
    `Little One says ${latestBadge.name} sounds important. Xena says yes, that is the point.`,
    `Newest win: ${latestBadge.name}. Small signs, clean pattern, fewer mysteries later.`
  ];
  return pools[(getDialogueSeed() + count) % pools.length];
}

function getToyLine(mode, justTapped) {
  const pools = {
    feather: [
      "Xena pretends the feather is beneath her. Little One disagrees at top speed.",
      "Feather mode: grace from Xena, immediate chaos from Little One.",
      "The feather got one dignified swipe and three suspicious zooms."
    ],
    bug: [
      "Bug patrol is active. Xena stares like a manager. Little One is already airborne.",
      "Apartment bug watch: one professional hunter, one delighted little goblin.",
      "A tiny bug just turned this sidebar into a family sport."
    ],
    laser: [
      "Laser dot deployed. Little One is convinced she can outsmart light itself.",
      "Xena treats the laser like a tactical briefing. Little One treats it like destiny.",
      "A tiny red dot can unite this family faster than a spreadsheet ever could."
    ]
  };

  const list = pools[mode] || pools.feather;
  const index = (getDialogueSeed() + appState.toyTaps + mode.length) % list.length;
  if (!justTapped) {
    return list[index];
  }

  const reactions = {
    feather: [
      "Little One launched first. Xena insists she was about to do that.",
      "Feather batted. Household dignity reduced by exactly one whisker.",
      "Tiny pounce registered. Morale improved."
    ],
    bug: [
      "Bug intercepted. Xena looks smug. Little One looks like she invented the concept.",
      "Very suspicious bug neutralized by one dramatic pounce and one supervising glare.",
      "Tiny apartment defender moment. Extremely serious work, obviously."
    ],
    laser: [
      "Laser tapped. Little One believes victory is one leap away.",
      "Dot pursued. Xena remains skeptical, which is part of the charm.",
      "Brief chaos complete. Tracker morale stable."
    ]
  };

  const reactionList = reactions[mode] || reactions.feather;
  return reactionList[(appState.toyTaps + mode.length) % reactionList.length];
}

function getToyMissLine(mode) {
  const misses = {
    feather: [
      "The feather drifted away. Xena blames the wind. Little One blames geometry.",
      "Missed the feather. Morale unchanged, dignity negotiable."
    ],
    bug: [
      "The bug skittered off. Little One saw it, sort of. Xena saw everything.",
      "Bug escaped for now. Apartment security remains emotionally invested."
    ],
    laser: [
      "The dot zipped away. Little One calls that a tactical warm-up.",
      "Laser escaped again. Xena says this is why light should fill out paperwork."
    ]
  };
  const pool = misses[mode] || misses.feather;
  return pool[(getDialogueSeed() + appState.toyTaps + mode.length) % pool.length];
}

function getTicOpponentName() {
  return appState.ticOpponent === "little" ? "Little One" : "Xena";
}

function getTicOpponentEmoji() {
  return appState.ticOpponent === "little" ? "\u{1F408}" : "\u{1F408}\u200D\u{2B1B}";
}

function getTicMarkEmoji(mark) {
  if (mark === "player") {
    return "\u{1F9F6}";
  }
  if (mark === "xena") {
    return "\u{1F408}\u200D\u{2B1B}";
  }
  if (mark === "little") {
    return "\u{1F408}";
  }
  return "";
}

function resetTicGame(statusText = "") {
  appState.ticBoard = Array(9).fill("");
  appState.ticTurn = "player";
  appState.ticWinner = "";
  appState.ticStatus = statusText || `Pick a cat and place your yarn. ${getTicOpponentName()} is ready.`;
}

function handleTicMove(index) {
  if (appState.ticWinner || appState.ticTurn !== "player" || appState.ticBoard[index]) {
    return;
  }

  appState.ticBoard[index] = "player";
  const result = evaluateTicBoard(appState.ticBoard);
  if (finishTicRound(result, "player")) {
    renderTicTacToe();
    return;
  }

  appState.ticTurn = "opponent";
  const aiMove = chooseTicMove(appState.ticBoard, appState.ticOpponent);
  if (aiMove >= 0) {
    appState.ticBoard[aiMove] = appState.ticOpponent;
  }
  const nextResult = evaluateTicBoard(appState.ticBoard);
  finishTicRound(nextResult, appState.ticOpponent);
  if (!appState.ticWinner) {
    appState.ticTurn = "player";
    appState.ticStatus = `${getTicOpponentName()} moved. Your yarn is up.`;
  }
  renderTicTacToe();
}

function finishTicRound(result) {
  if (!result) {
    return false;
  }
  if (result === "tie") {
    appState.ticWinner = "tie";
    appState.ticStatus = TIC_TIE_LINES[(getDialogueSeed() + appState.ticScores.player) % TIC_TIE_LINES.length];
    return true;
  }

  appState.ticWinner = result;
  if (result === "player") {
    appState.ticScores.player += 1;
    appState.ticStatus = TIC_WIN_LINES[(getDialogueSeed() + appState.ticScores.player) % TIC_WIN_LINES.length];
    return true;
  }

  appState.ticScores[result] += 1;
  appState.ticStatus = result === "xena"
    ? "Xena built the line and looked smug about it. New board if you want revenge."
    : "Little One somehow won with pure goblin confidence. Extremely suspicious.";
  return true;
}

function evaluateTicBoard(board) {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];
  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return board.every(Boolean) ? "tie" : "";
}

function chooseTicMove(board, opponent) {
  const player = "player";
  const empties = board.map((value, index) => value ? -1 : index).filter((index) => index >= 0);
  const winningMove = findTicLineMove(board, opponent);
  if (winningMove >= 0) {
    if (opponent === "little" && Math.random() < 0.18 && empties.length > 1) {
      const altMoves = empties.filter((index) => index !== winningMove);
      return altMoves[Math.floor(Math.random() * altMoves.length)];
    }
    return winningMove;
  }
  const blockingMove = findTicLineMove(board, player);
  if (blockingMove >= 0) {
    if (opponent === "little" && Math.random() < 0.28 && empties.length > 1) {
      const altMoves = empties.filter((index) => index !== blockingMove);
      return altMoves[Math.floor(Math.random() * altMoves.length)];
    }
    return blockingMove;
  }
  if (!board[4]) {
    if (opponent === "little" && Math.random() < 0.22) {
      const nonCenterMoves = empties.filter((index) => index !== 4);
      if (nonCenterMoves.length) {
        return nonCenterMoves[Math.floor(Math.random() * nonCenterMoves.length)];
      }
    }
    return 4;
  }
  const corners = [0, 2, 6, 8].filter((index) => !board[index]);
  if (corners.length) {
    if (opponent === "little" && Math.random() < 0.16) {
      const edges = [1, 3, 5, 7].filter((index) => !board[index]);
      if (edges.length) {
        return edges[Math.floor(Math.random() * edges.length)];
      }
    }
    return corners[Math.floor(Math.random() * corners.length)];
  }
  return empties.length ? empties[Math.floor(Math.random() * empties.length)] : -1;
}

function findTicLineMove(board, mark) {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];
  for (const line of lines) {
    const values = line.map((index) => board[index]);
    const markCount = values.filter((value) => value === mark).length;
    const emptyIndex = values.findIndex((value) => !value);
    if (markCount === 2 && emptyIndex >= 0) {
      return line[emptyIndex];
    }
  }
  return -1;
}

function renderTicTacToe() {
  if (!dom.ticBoard || !dom.ticScore || !dom.ticStatus) {
    return;
  }

  dom.ticOpponentButtons.forEach((button) => {
    button.dataset.active = button.getAttribute("data-tic-opponent") === appState.ticOpponent ? "true" : "false";
  });

  dom.ticCells.forEach((button, index) => {
    const mark = appState.ticBoard[index];
    button.textContent = getTicMarkEmoji(mark);
    button.dataset.mark = mark || "empty";
    button.disabled = Boolean(mark) || Boolean(appState.ticWinner) || appState.ticTurn !== "player";
  });

  dom.ticScore.textContent = `\u{1F9F6} ${appState.ticScores.player} · \u{1F408}\u200D\u{2B1B} ${appState.ticScores.xena} · \u{1F408} ${appState.ticScores.little}`;
  dom.ticStatus.textContent = appState.ticStatus;
}

function chooseToyHunter(mode) {
  const roll = Math.random();
  if (mode === "bug") {
    return roll < 0.35 ? "xena" : "little";
  }
  if (mode === "laser") {
    return roll < 0.45 ? "xena" : "little";
  }
  return roll < 0.48 ? "xena" : "little";
}

function buildToyScene(mode, justTapped, hunter = "little") {
  const targetX = randomRange(18, 82);
  const targetY = randomRange(26, 66);
  const baseXena = { x: randomRange(16, 30), y: randomRange(66, 80) };
  const baseLittle = { x: randomRange(64, 80), y: randomRange(68, 82) };
  if (!justTapped) {
    return {
      targetX,
      targetY,
      xenaX: baseXena.x,
      xenaY: baseXena.y,
      littleX: baseLittle.x,
      littleY: baseLittle.y,
      burstX: targetX,
      burstY: targetY
    };
  }

  const hunterX = clamp(targetX + randomRange(-6, 6), 12, 86);
  const hunterY = clamp(targetY + randomRange(6, 12), 24, 84);
  return {
    targetX,
    targetY,
    xenaX: hunter === "xena" ? hunterX : baseXena.x,
    xenaY: hunter === "xena" ? hunterY : baseXena.y,
    littleX: hunter === "little" ? hunterX : baseLittle.x,
    littleY: hunter === "little" ? hunterY : baseLittle.y,
    burstX: targetX,
    burstY: targetY
  };
}

function randomRange(min, max) {
  return Math.round(min + Math.random() * (max - min));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function renderToyPanel() {
  if (!dom.toyStage || !dom.toyLine || !dom.toyCount || !dom.toyTarget || !dom.toyXenaEmoji || !dom.toyLittleEmoji || !dom.toyTargetGlyph || !dom.toyBurst || !dom.toyScore) {
    return;
  }

  dom.toyButtons.forEach((button) => {
    const active = button.getAttribute("data-toy-mode") === appState.toyMode;
    button.dataset.active = active ? "true" : "false";
  });

  const toyGlyph = {
    feather: "🪶",
    bug: appState.toyTaps % 2 === 0 ? "🪲" : "🪰",
    laser: "🔴"
  }[appState.toyMode] || "🪶";
  const burstGlyph = {
    feather: "💨",
    bug: "✨",
    laser: "⚡"
  }[appState.toyMode] || "✨";
  const scene = appState.toyScene || buildToyScene(appState.toyMode, false);

  dom.toyStage.dataset.mode = appState.toyMode;
  dom.toyTargetGlyph.textContent = toyGlyph;
  dom.toyBurst.textContent = burstGlyph;
  dom.toyTarget.style.left = `${scene.targetX}%`;
  dom.toyTarget.style.top = `${scene.targetY}%`;
  dom.toyBurst.style.left = `${scene.burstX}%`;
  dom.toyBurst.style.top = `${scene.burstY}%`;
  dom.toyXenaEmoji.style.left = `${scene.xenaX}%`;
  dom.toyXenaEmoji.style.top = `${scene.xenaY}%`;
  dom.toyLittleEmoji.style.left = `${scene.littleX}%`;
  dom.toyLittleEmoji.style.top = `${scene.littleY}%`;
  dom.toyStage.dataset.burst = "idle";
  void dom.toyStage.offsetWidth;
  dom.toyStage.dataset.burst = appState.toyTaps > 0 ? "pop" : "idle";
  dom.toyBurst.hidden = false;
  dom.toyCount.textContent = `${appState.toyTaps} pounce${appState.toyTaps === 1 ? "" : "s"} this visit`;
  dom.toyScore.textContent = `🐈‍⬛ ${appState.toyXenaScore} · 🐈 ${appState.toyLittleScore}`;
  dom.toyLine.textContent = appState.toyLine;
}

function buildStats(state) {
  const takeEntries = state.history.filter((entry) => entry.action === "take" || entry.action === "daily_tally");
  const addEntries = state.history.filter((entry) => entry.action === "add");
  const moodEntries = [...(state.moods || [])].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const today = new Date();
  const last14 = rangeDays(14, today);
  const last7Start = shiftDate(today, -6);
  const last30Start = shiftDate(today, -29);

  const dailyMap = new Map();
  const moodByDay = new Map();
    takeEntries.forEach((entry) => {
      const key = trackerDayKey(entry);
      dailyMap.set(key, (dailyMap.get(key) || 0) + Number(entry.amount || 0));
    });
    moodEntries.forEach((entry) => {
      if (!entry.mood) {
        return;
      }
      const key = trackerDayKey(entry);
      const current = moodByDay.get(key);
      if (!current || current.timestamp < entry.timestamp) {
        moodByDay.set(key, { mood: entry.mood, timestamp: entry.timestamp });
      }
  });

  const daily14 = last14.map((date) => ({
    date,
    amount: dailyMap.get(localDayKey(date.toISOString())) || 0,
    mood: moodByDay.get(localDayKey(date.toISOString()))?.mood || null
  }));

  const last7Entries = takeEntries.filter((entry) => parseDate(entry.timestamp) >= last7Start);
  const last30TakeEntries = takeEntries.filter((entry) => parseDate(entry.timestamp) >= last30Start);
  const last30AddEntries = addEntries.filter((entry) => parseDate(entry.timestamp) >= last30Start);
  const last7Drinks = sumAmounts(last7Entries);
  const monthDrinks = sumAmounts(last30TakeEntries);
  const last7Average = last7Drinks / 7;
  const inventoryValue = roundMoney(state.count * UNIT_PRICE);
  const steadyDays14 = daily14.filter((day) => day.amount > 0 && day.amount <= STEADY_DAY_LIMIT).length;
  const trackingStreak = computeTrackingStreak(state.history, today);
  const trackedDays = countDistinctDays(state.history);
  const takeDays = countDistinctDays(takeEntries);
  const moodEditableEntries = moodEntries;
  const moodEntriesCount = moodEntries.length;
  const moodEntries14 = daily14
    .map((day) => moodByDay.get(localDayKey(day.date.toISOString()))?.mood || null)
    .filter((mood) => mood);
  const moodAverage14 = moodEntries14.length
    ? moodEntries14.reduce((sum, mood) => sum + Number(mood || 0), 0) / moodEntries14.length
    : 0;
  const latestMoodEntry = moodEntries.find((entry) => entry.mood) || null;
  const lastCallCount30 = moodEntries.filter((entry) => parseDate(entry.timestamp) >= last30Start && entry.last_call).length;
  const lastCallDays = countDistinctDays(moodEntries.filter((entry) => entry.last_call));
  const notedEntries = state.history.filter((entry) => String(entry.note || "").trim()).length
    + moodEntries.filter((entry) => String(entry.note || "").trim()).length;
  const correctionEvents = state.history.filter((entry) => ["set_count", "reset_count", "set_threshold", "note"].includes(entry.action)).length;

  return {
    totalEntries: state.history.filter((entry) => entry.action !== "init").length,
    purchaseEvents: addEntries.length,
    last7Drinks,
    last7Average,
    monthDrinks,
    monthSpent: sumMoneySpent(last30AddEntries),
    monthValue: sumMoneyValue(last30TakeEntries),
    last7Value: sumMoneyValue(last7Entries),
    last7Nutrition: sumNutrition(last7Entries),
    monthNutrition: sumNutrition(last30TakeEntries),
    lifetimeDrinks: sumAmounts(takeEntries),
    lifetimeSpent: sumMoneySpent(addEntries),
    lifetimeValue: sumMoneyValue(takeEntries),
    inventoryValue,
    daily14,
    trackingStreak,
    trackedDays,
    takeDays,
    steadyDays14,
    moodEditableEntries,
    moodEntries,
    moodEntriesCount,
    moodAverage14,
    latestMoodEntry,
    lastCallCount30,
    lastCallDays,
    notedEntries,
    correctionEvents
  };
}

function addHistoryEntry(action, amount, note, extra = {}) {
  const timestamp = isoNow();
  const entry = {
    id: generateEntryId(),
    timestamp,
    tracker_day: localDayKey(timestamp),
    action,
    amount,
    note,
    count: appState.state.count
  };

  if (action === "add") {
    entry.money_spent = eventSpendForAmount(amount);
    entry.unit_price = roundMoney(UNIT_PRICE, 4);
  }

  if (action === "take" || action === "daily_tally") {
    entry.money_value = eventSpendForAmount(amount);
    entry.unit_price = roundMoney(UNIT_PRICE, 4);
    entry.nutrition = nutritionTotalsForAmount(amount);
    if (action === "take") {
      entry.last_call = Boolean(extra.last_call);
      entry.mood = entry.last_call ? normalizeMoodValue(extra.mood) : null;
    }
  }

  appState.state.history.push(entry);
  if (action === "take" && (entry.last_call || entry.mood)) {
    createMoodEntry({
      timestamp: entry.timestamp,
      mood: normalizeMoodValue(extra.mood),
      last_call: entry.last_call,
      note: note || "",
      linked_take_entry_id: entry.id
    });
  }
  recalculateStateFromHistory();
  return entry;
}

function createMoodEntry({ timestamp, mood, last_call = false, note = "", linked_take_entry_id = "" }) {
    appState.state.moods.push(normalizeMoodEntry({
      id: generateEntryId(),
      timestamp: timestamp || isoNow(),
    mood,
    last_call,
    note,
    linked_take_entry_id
  }));
}

function trackerDayKey(entryOrTimestamp) {
    if (entryOrTimestamp && typeof entryOrTimestamp === "object") {
      const trackerDay = String(entryOrTimestamp.tracker_day || "").trim();
      if (trackerDay) {
        return trackerDay.slice(0, 10);
      }
      return localDayKey(entryOrTimestamp.timestamp);
    }
    return localDayKey(entryOrTimestamp);
  }

function enforceSingleLastCall(history) {
  const latestLastCallByDay = new Map();

  history.forEach((entry) => {
      if (entry.action !== "take" || !entry.last_call) {
        return;
      }
      latestLastCallByDay.set(trackerDayKey(entry), entry.id);
    });

  history.forEach((entry) => {
    if (entry.action !== "take") {
      return;
    }
      const winningEntryId = latestLastCallByDay.get(trackerDayKey(entry));
    if (winningEntryId && entry.id === winningEntryId) {
      entry.last_call = true;
      entry.mood = normalizeMoodValue(entry.mood);
      return;
    }
    entry.last_call = false;
    entry.mood = null;
  });
}

function collapseDailyTallyEntries(history) {
  const latestTallyByDay = new Map();

  history.forEach((entry) => {
      if (entry.action !== "daily_tally") {
        return;
      }
      latestTallyByDay.set(trackerDayKey(entry), entry.id);
    });

  return history.filter((entry) => {
      if (entry.action !== "daily_tally") {
        return true;
      }
      return latestTallyByDay.get(trackerDayKey(entry)) === entry.id;
    });
  }

async function persistAndRender(message) {
  await saveState();
  render();
  addToast(message);
}

function addToast(message) {
  const item = document.createElement("p");
  item.className = "toast-item";
  item.textContent = `${formatClock(isoNow())}  ${message}`;
  dom.toastLog.prepend(item);

  while (dom.toastLog.children.length > 8) {
    dom.toastLog.removeChild(dom.toastLog.lastChild);
  }
}

function exportStateJson() {
  const blob = new Blob([JSON.stringify(appState.state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "drink_tracker_state.json";
  link.click();
  URL.revokeObjectURL(url);
  addToast("Exported current tracker JSON.");
}

async function importStateJson(event) {
  if (!requireEditAccess()) {
    event.target.value = "";
    return;
  }

  const [file] = event.target.files || [];
  if (!file) {
    return;
  }

  try {
    const text = await file.text();
    const raw = JSON.parse(text);
    appState.state = normalizeState(raw);
    clearHistoryEditor();
    await saveState();
    render();
    addToast(`Imported state from ${file.name}.`);
  } catch (error) {
    addToast("Import failed. Please use a compatible JSON tracker file.");
  } finally {
    event.target.value = "";
  }
}

async function submitTakeEntry(amount, note, lastCall, mood) {
  try {
    const response = await apiFetch(API_LOG_TAKE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...buildAuthHeaders("read")
      },
      body: JSON.stringify({ amount, note, last_call: lastCall, mood })
    });

    if (!response.ok) {
      if (response.status === 403) {
        addToast("Read password required before drinks can be logged.");
      } else if (response.status === 404) {
        addToast("The server does not have the read-only drink logging route yet. Update backend/app.py and restart the service.");
      } else {
        addToast("Could not log the drink count right now.");
      }
      return;
    }

    const payload = await response.json();
    appState.state = normalizeState(payload);
    ensureSelectedEntryStillExists();
    dom.takeNote.value = "";
    dom.takeLastCall.checked = false;
    dom.takeMood.value = "";
    syncTakeMoodState();
    dom.countInput.value = appState.state.count;
    render();
    addToast(`Logged ${amount} drink${amount === 1 ? "" : "s"} taken.`);
  } catch (error) {
    addToast("Could not log the drink count right now.");
  }
}

async function hydrateState() {
  try {
    const response = await apiFetch(API_STATE_URL, {
      cache: "no-store",
      headers: buildAuthHeaders("read")
    });
    if (!response.ok) {
      if (response.status === 403) {
        clearStoredAccess();
        appState.access = "none";
      }
      throw new Error(`State load failed: ${response.status}`);
    }
    const payload = await response.json();
    appState.state = normalizeState(payload);
    ensureSelectedEntryStillExists();
  } catch (error) {
    if (appState.access === "none") {
      lockApp();
      setAuthMessage("Read-only password required to load the tracker.");
      return;
    }
    addToast("Could not load JSON state file. Using an empty tracker for now.");
    appState.state = normalizeState({});
  }
}

async function saveState() {
  if (appState.saveInFlight) {
    return;
  }

  appState.saveInFlight = true;
  try {
    const response = await apiFetch(API_STATE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...buildAuthHeaders("edit")
      },
      body: JSON.stringify(appState.state)
    });

    if (!response.ok) {
      if (response.status === 403) {
        appState.editPassword = "";
        removeSessionValue(EDIT_SESSION_KEY);
        appState.access = "read";
        renderAccessState();
      }
      throw new Error(`State save failed: ${response.status}`);
    }

    const payload = await response.json();
    appState.state = normalizeState(payload);
    ensureSelectedEntryStillExists();
  } catch (error) {
    addToast("Save failed. The page stayed updated, but the JSON file did not write.");
  } finally {
    appState.saveInFlight = false;
  }
}

async function authenticateRead(password) {
  try {
    let response = await apiFetch(API_READ_AUTH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ password })
    });

    if (!response.ok) {
      response = await apiFetch(API_STATE_URL, {
        cache: "no-store",
        headers: {
          "X-Tracker-Read": password
        }
      });

      if (!response.ok) {
        setAuthMessage(`That read-only password did not work. (${response.status})`);
        return false;
      }
    }

    appState.readPassword = password;
    storeSessionValue(READ_SESSION_KEY, password);
    appState.access = "read";
    return true;
  } catch (error) {
    setAuthMessage("The tracker server is not responding right now.");
    return false;
  }
}

async function authenticateEdit(password) {
  try {
    let response = await apiFetch(API_EDIT_AUTH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ password })
    });

    if (!response.ok) {
      response = await apiFetch(API_STATE_URL, {
        cache: "no-store",
        headers: {
          "X-Tracker-Edit": password
        }
      });

      if (!response.ok) {
        addToast(`Edit password was rejected. (${response.status})`);
        return false;
      }
    }

    appState.readPassword = password;
    appState.editPassword = password;
    storeSessionValue(EDIT_SESSION_KEY, password);
    appState.access = "edit";
    return true;
  } catch (error) {
    addToast("The tracker server is not responding right now.");
    return false;
  }
}

function requireEditAccess() {
  if (appState.access === "edit") {
    return true;
  }
  addToast("Edit password required for data changes.");
  return false;
}

function requireTakeAccess() {
  if (appState.access === "read" || appState.access === "edit") {
    return true;
  }
  addToast("Read password required before drinks can be logged.");
  return false;
}

function syncTakeMoodState() {
  const enabled = Boolean(dom.takeLastCall.checked);
  dom.takeMood.disabled = !enabled;
  if (!enabled) {
    dom.takeMood.value = "";
  }
}

function unlockApp() {
  dom.lockScreen.hidden = true;
  dom.appShell.hidden = false;
  dom.appShell.classList.remove("app-shell-locked");
  setAuthMessage("Read view unlocked.");
}

function lockApp() {
  dom.appShell.hidden = true;
  dom.appShell.classList.add("app-shell-locked");
  dom.lockScreen.hidden = false;
}

function setAuthMessage(message) {
  dom.authMessage.textContent = message;
}

function setDisabledState(container, disabled) {
  container.classList.toggle("is-locked", disabled);
  container.querySelectorAll("input, button").forEach((element) => {
    element.disabled = disabled;
  });
}

function apiFetch(url, options = {}) {
  return fetch(url, {
    credentials: "same-origin",
    ...options
  });
}

window.addEventListener("error", (event) => {
  if (!dom.lockScreen.hidden) {
    setAuthMessage(`Page error: ${event.message}`);
  }
});

window.addEventListener("unhandledrejection", (event) => {
  if (!dom.lockScreen.hidden) {
    const message = event.reason instanceof Error ? event.reason.message : String(event.reason);
    setAuthMessage(`Promise error: ${message}`);
  }
});

function hydrateStoredAccess() {
  const readPassword = readSessionValue(READ_SESSION_KEY);
  const editPassword = readSessionValue(EDIT_SESSION_KEY);
  if (editPassword) {
    appState.readPassword = editPassword;
    appState.editPassword = editPassword;
    appState.access = "edit";
    return;
  }
  if (readPassword) {
    appState.readPassword = readPassword;
    appState.access = "read";
  }
}

function clearStoredAccess() {
  appState.readPassword = "";
  appState.editPassword = "";
  removeSessionValue(READ_SESSION_KEY);
  removeSessionValue(EDIT_SESSION_KEY);
}

function buildAuthHeaders(mode) {
  if (mode === "edit") {
    const editPassword = appState.editPassword || readSessionValue(EDIT_SESSION_KEY);
    return editPassword ? { "X-Tracker-Edit": editPassword } : {};
  }

  const editPassword = appState.editPassword || readSessionValue(EDIT_SESSION_KEY);
  if (editPassword) {
    return { "X-Tracker-Edit": editPassword };
  }

  const readPassword = appState.readPassword || readSessionValue(READ_SESSION_KEY);
  return readPassword ? { "X-Tracker-Read": readPassword } : {};
}

function readSessionValue(key) {
  try {
    return window.sessionStorage.getItem(key) || "";
  } catch (error) {
    return "";
  }
}

function storeSessionValue(key, value) {
  try {
    window.sessionStorage.setItem(key, value);
  } catch (error) {
    return;
  }
}

function removeSessionValue(key) {
  try {
    window.sessionStorage.removeItem(key);
  } catch (error) {
    return;
  }
}

function normalizeState(raw) {
  const legacyCount = Number(raw.storage_count || 0) + Number(raw.chest_count || 0);
  const count = clampToZero(raw.count ?? legacyCount ?? 0);
  const lowStock = clampToZero(raw.low_stock_threshold ?? DEFAULT_LOW_STOCK_THRESHOLD);
  const history = Array.isArray(raw.history)
    ? raw.history
      .filter((entry) => entry && typeof entry === "object" && entry.timestamp)
      .map((entry) => normalizeEntry(entry, count))
    : [];
  const moods = Array.isArray(raw.moods) && raw.moods.length
    ? raw.moods
      .filter((entry) => entry && typeof entry === "object" && entry.timestamp)
      .map(normalizeMoodEntry)
    : synthesizeLegacyMoodEntries(history);

  const normalized = {
    count,
    low_stock_threshold: lowStock,
    history,
    moods,
    support: {
      soft_daily_goal: clampToZero(raw.support?.soft_daily_goal ?? DEFAULT_SOFT_DAILY_GOAL)
    }
  };
  recalculateStateFromHistory(normalized);
  return normalized;
}

function normalizeEntry(entry, fallbackCount) {
  const action = String(entry.action || "note");
  const amount = Number.isFinite(Number(entry.amount)) ? Number(entry.amount) : 0;
  const count = Number.isFinite(Number(entry.count)) ? Number(entry.count) : fallbackCount;
  const normalized = {
      id: String(entry.id || generateEntryId()),
      timestamp: String(entry.timestamp),
      tracker_day: String(entry.tracker_day || localDayKey(entry.timestamp)),
      action,
      amount,
      note: String(entry.note || ""),
      count
  };

  if (normalized.action === "reset_count" && normalized.amount > 0 && normalized.count > 0) {
    normalized.action = "set_count";
    normalized.amount = normalized.count;
  }

  if (action === "add") {
    normalized.money_spent = Number(entry.money_spent ?? eventSpendForAmount(amount));
    normalized.unit_price = Number(entry.unit_price ?? roundMoney(UNIT_PRICE, 4));
  }

  if (action === "take" || action === "daily_tally") {
    normalized.money_value = Number(entry.money_value ?? eventSpendForAmount(amount));
    normalized.unit_price = Number(entry.unit_price ?? roundMoney(UNIT_PRICE, 4));
    normalized.nutrition = entry.nutrition && typeof entry.nutrition === "object"
      ? {
          calories: clampToZero(entry.nutrition.calories),
          sodium_mg: clampToZero(entry.nutrition.sodium_mg),
          carbs_g: clampToZero(entry.nutrition.carbs_g),
          sugars_g: clampToZero(entry.nutrition.sugars_g),
          protein_g: clampToZero(entry.nutrition.protein_g),
          fat_g: clampToZero(entry.nutrition.fat_g)
        }
      : nutritionTotalsForAmount(amount);
    if (action === "take") {
      normalized.last_call = Boolean(entry.last_call);
      normalized.mood = normalizeMoodValue(entry.mood);
    }
  }

  return normalized;
}

function normalizeMoodEntry(entry) {
    return {
      id: String(entry.id || generateEntryId()),
      timestamp: String(entry.timestamp || isoNow()),
      tracker_day: String(entry.tracker_day || localDayKey(entry.timestamp || isoNow())),
      mood: normalizeMoodValue(entry.mood),
      last_call: Boolean(entry.last_call),
      note: String(entry.note || ""),
      linked_take_entry_id: String(entry.linked_take_entry_id || "")
  };
}

function synthesizeLegacyMoodEntries(history) {
  return history
    .filter((entry) => entry.action === "take" && (entry.last_call || entry.mood))
      .map((entry) => ({
        id: `mood-legacy-${entry.id}`,
        timestamp: String(entry.timestamp || isoNow()),
        tracker_day: trackerDayKey(entry),
        mood: normalizeMoodValue(entry.mood),
        last_call: Boolean(entry.last_call),
        note: String(entry.note || ""),
        linked_take_entry_id: String(entry.id || "")
    }));
}

function openMoodEditor(entryId) {
  const entry = (appState.state.moods || []).find((item) => item.id === entryId);
  if (!entry) {
    return;
  }

  dom.moodEntryId.value = entry.id;
  dom.moodTimestamp.value = toLocalDateTimeValue(entry.timestamp);
  dom.moodLastCall.checked = Boolean(entry.last_call);
  dom.moodValue.value = entry.mood ? String(entry.mood) : "";
  dom.moodNote.value = entry.note || "";
  clearMoodStatus();
  renderMoodEditor();
  focusEditorCard(dom.moodEditorCard);
}

async function saveMoodEditorEntry() {
  if (!requireTakeAccess()) {
    return;
  }

  const entryId = dom.moodEntryId.value.trim();
  const timestamp = fromLocalDateTimeValue(dom.moodTimestamp.value);
  if (!timestamp) {
    setMoodStatus("❌ Pick a valid mood check-in time.", "error");
    addToast("Pick a valid mood check-in time.");
    return;
  }

  const payload = {
    entry_id: entryId,
    timestamp,
    note: dom.moodNote.value.trim(),
    last_call: dom.moodLastCall.checked,
    mood: normalizeMoodValue(dom.moodValue.value)
  };

  setMoodStatus("Saving mood update...", "info");

  if (appState.access === "edit") {
    const moodEntries = appState.state.moods || [];
    const targetDay = localDayKey(payload.timestamp);
    const targetEntry = resolveMoodEntryForDaySave(moodEntries, entryId, targetDay);

    if (targetEntry) {
      targetEntry.timestamp = payload.timestamp;
      targetEntry.note = payload.note;
      targetEntry.last_call = payload.last_call;
      targetEntry.mood = payload.mood;
    } else {
      const nextEntry = normalizeMoodEntry({
        id: generateEntryId(),
        timestamp: payload.timestamp,
        note: payload.note,
        last_call: payload.last_call,
        mood: payload.mood,
        linked_take_entry_id: ""
      });
      appState.state.moods.push(nextEntry);
      dom.moodEntryId.value = nextEntry.id;
    }
    recalculateStateFromHistory();
    await persistAndRender("Mood check-in updated.");
    if (payload.last_call) {
      setMoodStatus("\u2705 Daily mood updated. This is now the only last call for that day.", "success");
    } else {
      setMoodStatus("\u2705 Daily mood updated.", "success");
    }
    return;
  }

  try {
    const response = await apiFetch(API_MOOD_ENTRY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...buildAuthHeaders("read")
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      if (response.status === 404) {
        setMoodStatus("❌ Mood update route is missing on the server.", "error");
        addToast("The server does not have the mood update route yet. Update backend/app.py and backend/store.py, then restart the service.");
        return;
      }
      setMoodStatus(`❌ Mood update failed (${response.status}).`, "error");
      addToast("Could not save the mood check-in right now.");
      return;
    }

    const nextState = await response.json();
    appState.state = normalizeState(nextState);
    const savedEntry = [...(appState.state.moods || [])]
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .find((entry) => entry.timestamp === payload.timestamp && (entry.note || "") === payload.note && entry.mood === payload.mood);
    if (savedEntry) {
      dom.moodEntryId.value = savedEntry.id;
    }
    render();
    if (payload.last_call) {
      setMoodStatus("\u2705 Daily mood updated. This is now the only last call for that day.", "success");
    } else {
      setMoodStatus("\u2705 Daily mood updated.", "success");
    }
    addToast("Mood check-in updated.");
  } catch (error) {
    setMoodStatus("❌ Could not save the daily mood right now.", "error");
    addToast("Could not save the mood check-in right now.");
  }
}

function resolveMoodEntryForDaySave(moodEntries, entryId, targetDay) {
  const byId = entryId
    ? moodEntries.find((entry) => entry.id === entryId) || null
    : null;

  if (byId && localDayKey(byId.timestamp) === targetDay) {
    return byId;
  }

  return moodEntries.find((entry) => localDayKey(entry.timestamp) === targetDay) || null;
}

function eventSpendForAmount(amount) {
  return roundMoney(amount * UNIT_PRICE);
}

function normalizeMoodValue(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 1 && parsed <= 5 ? parsed : null;
}

function localDayKey(timestamp) {
  if (!timestamp) {
    return "";
  }
  const date = parseTimestampValue(timestamp);
  if (Number.isNaN(date.getTime())) {
    return String(timestamp).slice(0, 10);
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatMoodEmoji(value) {
  return MOOD_META[value]?.emoji || "—";
}

function formatMoodLabel(value) {
  return MOOD_META[value]?.label || "No mood";
}

function nutritionTotalsForAmount(amount) {
  return {
    calories: NUTRITION_PER_CAN.calories * amount,
    sodium_mg: NUTRITION_PER_CAN.sodium_mg * amount,
    carbs_g: NUTRITION_PER_CAN.carbs_g * amount,
    sugars_g: NUTRITION_PER_CAN.sugars_g * amount,
    protein_g: NUTRITION_PER_CAN.protein_g * amount,
    fat_g: NUTRITION_PER_CAN.fat_g * amount
  };
}

function sumAmounts(entries) {
  return entries.reduce((total, entry) => total + Number(entry.amount || 0), 0);
}

function sumMoneySpent(entries) {
  return roundMoney(entries.reduce((total, entry) => total + Number(entry.money_spent ?? eventSpendForAmount(entry.amount || 0)), 0));
}

function sumMoneyValue(entries) {
  return roundMoney(entries.reduce((total, entry) => total + Number(entry.money_value ?? eventSpendForAmount(entry.amount || 0)), 0));
}

function sumNutrition(entries) {
  return entries.reduce((totals, entry) => {
    const nutrition = entry.nutrition || nutritionTotalsForAmount(Number(entry.amount || 0));
    Object.keys(totals).forEach((key) => {
      totals[key] += Number(nutrition[key] || 0);
    });
    return totals;
  }, {
    calories: 0,
    sodium_mg: 0,
    carbs_g: 0,
    sugars_g: 0,
    protein_g: 0,
    fat_g: 0
  });
}

function computeTrackingStreak(history, today) {
  if (!history.length) {
    return 0;
  }

  const byDay = new Set(history.map((entry) => localDayKey(entry.timestamp)));
  let streak = 0;
  for (let offset = 0; offset < 366; offset += 1) {
    const day = localDayKey(shiftDate(today, -offset).toISOString());
    if (!byDay.has(day)) {
      break;
    }
    streak += 1;
  }
  return streak;
}

function countDistinctDays(history) {
  return new Set(history.map((entry) => localDayKey(entry.timestamp))).size;
}

function rangeDays(length, endDate) {
  const days = [];
  for (let index = length - 1; index >= 0; index -= 1) {
    days.push(shiftDate(endDate, -index));
  }
  return days;
}

function shiftDate(date, offset) {
  const shifted = new Date(date);
  shifted.setHours(12, 0, 0, 0);
  shifted.setDate(shifted.getDate() + offset);
  return shifted;
}

function parseDate(timestamp) {
  return new Date(`${localDayKey(timestamp)}T12:00:00`);
}

function isoNow() {
  return new Date().toISOString();
}

function formatAction(action) {
  return {
    add: "Add stock",
    take: "Log drinks",
    daily_tally: "Daily tally",
    set_threshold: "Set threshold",
    reset_count: "Reset count",
    set_count: "Manual count",
    init: "Init"
  }[action] || action.replaceAll("_", " ");
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(value);
}

function formatDateTime(timestamp) {
  const date = parseTimestampValue(timestamp);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function formatChartDay(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "numeric",
    day: "numeric"
  }).format(date);
}

function formatClock(timestamp) {
  const date = parseTimestampValue(timestamp);
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function roundMoney(value, digits = 2) {
  return Number(value.toFixed(digits));
}

function positiveInt(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function clampToZero(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function generateEntryId() {
  return `entry-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function openHistoryEditor(entryId) {
  const entry = appState.state.history.find((item) => item.id === entryId);
  if (!entry) {
    return;
  }

  appState.selectedHistoryEntryId = entry.id;
  dom.historyEntryId.value = entry.id;
  dom.historyTimestamp.value = toLocalDateTimeValue(entry.timestamp);
  dom.historyAction.value = entry.action;
  dom.historyAmount.value = String(entry.amount ?? 0);
  dom.historyNote.value = entry.note || "";
  syncHistoryEditorActionState();
  renderHistory();
  renderHistoryEditor();
  focusEditorCard(dom.historyEditorCard);
}

function focusEditorCard(card) {
  if (!card || typeof card.scrollIntoView !== "function") {
    return;
  }

  requestAnimationFrame(() => {
    card.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });
}

function clearHistoryEditor() {
  appState.selectedHistoryEntryId = "";
  dom.historyEntryId.value = "";
  dom.historyTimestamp.value = toLocalDateTimeValue(isoNow());
  dom.historyAction.value = "add";
  dom.historyAmount.value = "1";
  dom.historyNote.value = "";
  syncHistoryEditorActionState();
}

function getSelectedHistoryEntry() {
  return appState.state.history.find((entry) => entry.id === appState.selectedHistoryEntryId) || null;
}

function ensureSelectedEntryStillExists() {
  if (!appState.selectedHistoryEntryId) {
    clearHistoryEditor();
    return;
  }

  if (!getSelectedHistoryEntry()) {
    clearHistoryEditor();
  }
}

function syncHistoryEditorActionState() {
  const action = dom.historyAction.value;
  const amountDisabled = action === "note" || action === "reset_count";
  dom.historyAmount.disabled = amountDisabled || appState.access !== "edit";

  if (action === "reset_count" || action === "note") {
    dom.historyAmount.value = "0";
    return;
  }

  if (!dom.historyAmount.value || Number.parseInt(dom.historyAmount.value, 10) < 0) {
    dom.historyAmount.value = "1";
  }
}

async function saveHistoryEditorEntry() {
  if (!requireEditAccess()) {
    return;
  }

  const timestamp = fromLocalDateTimeValue(dom.historyTimestamp.value);
  if (!timestamp) {
    addToast("Pick a valid date and time for the historical entry.");
    return;
  }

  const action = dom.historyAction.value;
  const amount = normalizeEditorAmount(action, dom.historyAmount.value);
  const note = dom.historyNote.value.trim();
  const selectedId = dom.historyEntryId.value.trim();
  const existingIndex = appState.state.history.findIndex((entry) => entry.id === selectedId);
  const target = {
      id: selectedId || generateEntryId(),
      timestamp,
      tracker_day: localDayKey(timestamp),
      action,
      amount,
      note,
      count: 0
  };

  if (existingIndex >= 0) {
    appState.state.history.splice(existingIndex, 1, target);
  } else {
    appState.state.history.push(target);
  }

  recalculateStateFromHistory();
  appState.selectedHistoryEntryId = target.id;
  dom.historyEntryId.value = target.id;
  await persistAndRender(existingIndex >= 0 ? "Historical entry updated." : "Historical entry added.");
}

async function deleteSelectedHistoryEntry() {
  if (!requireEditAccess()) {
    return;
  }

  const selected = getSelectedHistoryEntry();
  if (!selected) {
    addToast("Select a history row first.");
    return;
  }

  if (selected.action === "init") {
    addToast("The initial tracker entry stays in place.");
    return;
  }

  appState.state.history = appState.state.history.filter((entry) => entry.id !== selected.id);
  recalculateStateFromHistory();
  clearHistoryEditor();
  await persistAndRender("Historical entry deleted.");
}

function normalizeEditorAmount(action, rawValue) {
  if (action === "note" || action === "reset_count") {
    return 0;
  }
  return clampToZero(rawValue);
}

function recalculateStateFromHistory(targetState = appState.state) {
  let currentCount = 0;
  let currentThreshold = clampToZero(targetState.low_stock_threshold ?? DEFAULT_LOW_STOCK_THRESHOLD);
  const sorted = collapseDailyTallyEntries(
    [...targetState.history].sort((a, b) => a.timestamp.localeCompare(b.timestamp))
  );
  const sortedMoods = [...(targetState.moods || [])]
    .map((entry) => normalizeMoodEntry(entry))
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  enforceSingleLastCall(sorted);
  enforceSingleLastCall(sortedMoods);

    sorted.forEach((entry) => {
      entry.id = String(entry.id || generateEntryId());
      entry.tracker_day = trackerDayKey(entry);
      entry.amount = clampToZero(entry.amount ?? 0);
      entry.note = String(entry.note || "");

    switch (entry.action) {
      case "init":
        currentCount = clampToZero(entry.count ?? entry.amount ?? 0);
        break;
      case "add":
        currentCount += entry.amount;
        entry.money_spent = eventSpendForAmount(entry.amount);
        entry.unit_price = roundMoney(UNIT_PRICE, 4);
        delete entry.money_value;
        delete entry.nutrition;
        break;
      case "take":
      case "daily_tally":
        currentCount = Math.max(0, currentCount - entry.amount);
        entry.money_value = eventSpendForAmount(entry.amount);
        entry.unit_price = roundMoney(UNIT_PRICE, 4);
        entry.nutrition = nutritionTotalsForAmount(entry.amount);
        if (entry.action === "daily_tally") {
          delete entry.last_call;
          delete entry.mood;
        }
        delete entry.money_spent;
        break;
      case "set_count":
        currentCount = entry.amount;
        delete entry.money_spent;
        delete entry.money_value;
        delete entry.nutrition;
        delete entry.unit_price;
        break;
      case "reset_count":
        currentCount = 0;
        entry.amount = 0;
        delete entry.money_spent;
        delete entry.money_value;
        delete entry.nutrition;
        delete entry.unit_price;
        break;
      case "set_threshold":
        currentThreshold = entry.amount;
        delete entry.money_spent;
        delete entry.money_value;
        delete entry.nutrition;
        delete entry.unit_price;
        break;
      default:
        delete entry.money_spent;
        delete entry.money_value;
        delete entry.nutrition;
        delete entry.unit_price;
        break;
    }

      entry.count = currentCount;
    });

    targetState.history = sorted;
    sortedMoods.forEach((entry) => {
      entry.tracker_day = trackerDayKey(entry);
    });
    targetState.moods = sortedMoods;
  targetState.count = currentCount;
  targetState.low_stock_threshold = currentThreshold;
}

function toLocalDateTimeValue(isoString) {
  const date = parseTimestampValue(isoString);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function fromLocalDateTimeValue(value) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toISOString();
}

function parseTimestampValue(value) {
  if (!value) {
    return new Date(NaN);
  }
  const source = String(value).trim();
  const hasExplicitZone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(source);
  const normalized = !hasExplicitZone && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?$/.test(source)
    ? `${source}Z`
    : source;
  return new Date(normalized);
}
