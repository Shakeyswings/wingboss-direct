/*
Wing⚡Boss Telegram Ordering Bot — Wingboss-bot-4.0

Reality locks:
- Termux/Android runtime (polling)
- No paid services
- Menu bundle source of truth: ./menu/menu_bundle.v1.json
- English source of truth; Khmer supported; other languages fall back to English UI
- USD canonical; optional KHR display
- Pay-first-before-cook (bank transfer requires proof photo before staff dispatch)
- Flavor numbering tokens (e.g., #5️⃣9️⃣) must show everywhere
- Dry Rub marker = cactus 🌵

Non-destructive principle:
- All persistent state lives in ./data as JSON with atomic writes.
*/

require('dotenv').config();

const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ------------------ ENV / CONSTANTS ------------------
const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) throw new Error('Missing BOT_TOKEN in .env');

const TIMEZONE = process.env.TIMEZONE || 'Asia/Phnom_Penh';
const USD_KHR_RATE = Number(process.env.USD_KHR_RATE || 4100);

const OWNER_TELEGRAM_ID = Number(process.env.OWNER_TELEGRAM_ID || 5500590901);
const STAFF_CHAT_ID = Number(process.env.STAFF_CHAT_ID || -1003653716341);

const BANK_TRANSFER_ENABLED = (process.env.BANK_TRANSFER_ENABLED || 'true') !== 'false';

// FREE DELIVERY (BPH) — lock
const FREE_DELIVERY_MIN_FOOD_USD = 10.0;

// Heat tier pricing — lock (latest note: Revenge $1.25 then +$1.25 per tier; Nuclear currently enabled only for allowlist)
const HEAT_PRICES_USD = {
  original: 0,
  hot: 0.25,
  spicy: 0.50,
  extreme: 0.75,
  revenge: 1.25,
  nuclear: 2.50,
};

// Multi-flavor fee — lock
// Flavor count rules (non-negotiable)
// Included flavors by wing count (bone-in / standard wings)
const INCLUDED_FLAVORS_BY_COUNT = { 6: 1, 12: 2, 20: 2, 36: 3, 48: 4 };
// Max selectable flavors (allows customers to explore more)
const MAX_FLAVORS_BY_COUNT = { 6: 2, 12: 3, 20: 4, 36: 6, 48: 6 };
// Price per *extra* flavor beyond included
const EXTRA_FLAVOR_PRICE_USD = 1.0;


// Boneless upcharge — lock
const BONELESS_UPCHARGE_USD = 1.25;

// ------------------ PATHS ------------------
const DATA_DIR = path.join(__dirname, 'data');
const MENU_PATH = path.join(__dirname, 'menu', 'menu_bundle.v1.json');
const MENU_BACKUP_PATH = path.join(__dirname, 'menu', 'menu_bundle.last_good.json');

const CUSTOMERS_PATH = path.join(DATA_DIR, 'customers.json');
const ORDERS_PATH = path.join(DATA_DIR, 'orders.json');
const AVAILABILITY_PATH = path.join(DATA_DIR, 'availability.json');

fs.mkdirSync(DATA_DIR, { recursive: true });

// ------------------ JSON IO (CRASH-SAFE) ------------------
function atomicWriteJson(filePath, obj) {
  const tmp = `${filePath}.tmp.${crypto.randomBytes(6).toString('hex')}`;
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2));
  fs.renameSync(tmp, filePath);
}

function readJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

// ------------------ MENU BUNDLE LOAD + VALIDATE ------------------
function validateMenuShape(menu) {
  if (!menu || typeof menu !== 'object') return { ok: false, error: 'Menu JSON is not an object' };
  if (!menu.version) return { ok: false, error: 'Menu missing version' };
  if (!Array.isArray(menu.categories)) return { ok: false, error: 'Menu missing categories[]' };
  if (!menu.flavors || typeof menu.flavors !== 'object') return { ok: false, error: 'Menu missing flavors{}' };
  if (!menu.pricing || typeof menu.pricing !== 'object') return { ok: false, error: 'Menu missing pricing{}' };

  const requiredPricing = ['wings', 'combos', 'burgers', 'sides', 'extra_sauces', 'beverages', 'cocktails_beer', 'hot_sauce'];
  for (const k of requiredPricing) {
    if (!(k in menu.pricing)) return { ok: false, error: `Menu pricing missing ${k}` };
  }

  const catIds = new Set();
  for (const c of menu.categories) {
    if (!c.id || !c.label) return { ok: false, error: 'Category missing id/label' };
    if (catIds.has(c.id)) return { ok: false, error: `Duplicate category id: ${c.id}` };
    catIds.add(c.id);
  }

  for (const group of Object.keys(menu.flavors)) {
    const arr = menu.flavors[group];
    if (!Array.isArray(arr)) return { ok: false, error: `Flavors group ${group} not array` };
    for (const f of arr) {
      if (f.number === undefined || !f.name) return { ok: false, error: `Flavor missing number/name in ${group}` };
    }
  }

  return { ok: true };
}

function loadMenuOrThrow() {
  if (!fs.existsSync(MENU_PATH)) throw new Error(`Missing menu bundle at ${MENU_PATH}`);
  const menu = JSON.parse(fs.readFileSync(MENU_PATH, 'utf8'));
  const v = validateMenuShape(menu);
  if (!v.ok) throw new Error(`Menu validation failed: ${v.error}`);
  return menu;
}

let MENU = loadMenuOrThrow();

// Availability: virtualItemId -> bool
let AVAILABILITY = readJson(AVAILABILITY_PATH, {});
function isAvailable(itemId) {
  if (AVAILABILITY[itemId] === undefined) return true;
  return !!AVAILABILITY[itemId];
}

// ------------------ PERSISTED STATE ------------------
const CUSTOMERS = readJson(CUSTOMERS_PATH, {});
const ORDERS = readJson(ORDERS_PATH, {});

function saveCustomers() { atomicWriteJson(CUSTOMERS_PATH, CUSTOMERS); }
function saveOrders() { atomicWriteJson(ORDERS_PATH, ORDERS); }
function saveAvailability() { atomicWriteJson(AVAILABILITY_PATH, AVAILABILITY); }

// ------------------ CUSTOMER + CL ------------------
function getCustomer(user) {
  const id = String(user.id);
  if (!CUSTOMERS[id]) {
    CUSTOMERS[id] = {
      telegramId: user.id,
      username: user.username || null,
      createdAt: Date.now(),
      language: 'en',
      currency: 'USD',
      preferences: {
        wingType: null,
        tastePrefs: [],
        coreFamilies: [],
        flavorNumbers: [],
        heat: 'original',
      },
      stats: {
        ordersCompleted: 0,
        lifetimeSpendUsd: 0,
        pointsBalance: 0,
        lifetimePointsEarned: 0,
        firstOrderDiscountUsedAt: null,
        lastOrderAt: null,
        spicePointsBalance: 0,
  spicePointsLifetime: 0,
  spicySpendUsdLifetime: 0,
  lastOrderSpicySpendUsd: 0,
  lastOrderHeatScore: 0,
},
      flags: {
        skippedEducation: false,
      },
      lastOrderId: null,
    };
    saveCustomers();
  }
  CUSTOMERS[id].username = user.username || CUSTOMERS[id].username || null;
  return CUSTOMERS[id];
}

function confidenceLevel(profile) {
  const n = Number(profile?.stats?.ordersCompleted || 0);
  if (n <= 1) return 1;
  if (n <= 3) return 2;
  if (n <= 6) return 3;
  return 4;
}

// ------------------ MONEY ------------------
function usdToKhr(usd) { return Math.round(usd * USD_KHR_RATE); }
function money(profile, usd) {
  if (profile.currency === 'KHR') return `${usdToKhr(usd).toLocaleString('en-US')}៛ (≈ $${usd.toFixed(2)})`;
  return `$${usd.toFixed(2)}`;
}

// ------------------ SPICE METER + SPICE POINTS ------------------
function calcHeatScore(spiceSpendUsd) {
  // 100 points per $1 spent on heat/variety (simple, explainable)
  return Math.max(0, Math.round((spiceSpendUsd || 0) * 100));
}

function heatScoreMeter(score) {
  // 0..500+ -> 0..5 fill
  const fill = Math.max(0, Math.min(5, Math.floor((score || 0) / 100)));
  const empty = 5 - fill;
  const bar = '🧴'.repeat(fill) + '▫️'.repeat(empty);
  return `${bar}  (${score} pts)`;
}

function redeemableSpicePoints(profile) {
  const s = profile?.stats || {};
  const eligible = (s.completedOrders || 0) >= 2 || (s.lifetimeSpendUsd || 0) >= 10;
  return eligible ? (s.spicePointsBalance || 0) : 0;
}

function spicePointsValueUsd(points) {
  // 1000 points = $1.00 off (food only)
  return Math.floor((points || 0) / 1000) * 1.0;
}

function nowIso() { return new Date().toISOString(); }
function shortId() { return crypto.randomBytes(5).toString('hex').toUpperCase(); }

// ------------------ LANGUAGE (EN + KH; others fallback to EN) ------------------
const STRINGS = {
  en: {
    welcome: 'Welcome to WING⚡BOSS 🍗\nHand-Cut Daily • Never Frozen',
    firstQ: 'First time here?',
    firstYes: '🆕 First time',
    firstNo: '🔁 Returning',
    menu: 'Main Menu',
    orderNow: '✅ Order Now',
    browse: '📋 Browse Menu',
    cart: '🛒 Cart',
    lang: '🌐 Language',
    cur: '💲 Currency',
    firstTime: '🏁 FIRST TIME',
    help: 'ℹ️ Help / Contact',
    back: '⬅️ Back',
    next: 'Next ➜',
    skip: 'Skip',
    save: '✅ Remember',
    clear: '🧹 Clear',
    payBeforeCook: 'Pay-first-before-cook: bank transfer requires payment proof photo before we cook.',
    notAvailable: '⚠️ Not available right now.',
  },
  kh: {
    welcome: 'ស្វាគមន៍មកកាន់ WING⚡BOSS 🍗\nHand-Cut Daily • Never Frozen',
    firstQ: 'តើនេះជាលើកដំបូងរបស់អ្នកទេ?',
    firstYes: '🆕 លើកដំបូង',
    firstNo: '🔁 ធ្លាប់ញ៉ាំហើយ',
    menu: 'ម៉ឺនុយ',
    orderNow: '✅ បញ្ជាទិញឥឡូវ',
    browse: '📋 មើលម៉ឺនុយ',
    cart: '🛒 កន្ត្រក',
    lang: '🌐 ភាសា',
    cur: '💲 រូបិយប័ណ្ណ',
    firstTime: '🏁 លើកដំបូង',
    help: 'ℹ️ ជំនួយ / ទំនាក់ទំនង',
    back: '⬅️ ថយក្រោយ',
    next: 'បន្ត ➜',
    skip: 'រំលង',
    save: '✅ ចងចាំ',
    clear: '🧹 លុប',
    payBeforeCook: 'សូមទូទាត់មុនចម្អិន: បង់តាមធនាគារ ត្រូវផ្ញើរូបថតបញ្ជាក់ការទូទាត់ មុនចាប់ផ្តើមចម្អិន។',
    notAvailable: '⚠️ មិនមានទេឥឡូវនេះ',
  },
};

function t(profile, key) {
  const lang = (profile.language in STRINGS) ? profile.language : 'en';
  return STRINGS[lang][key] ?? STRINGS.en[key] ?? key;
}

// ------------------ TELEGRAM BOT ------------------
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Session (in-memory)
const SESS = new Map();
function getSess(userId) { return SESS.get(userId) || {}; }
function setSess(userId, patch) {
  const cur = getSess(userId);
  const next = { ...cur, ...patch };
  SESS.set(userId, next);
  return next;
}

function kb(rows) { return { reply_markup: { inline_keyboard: rows } }; }

function mainMenuKeyboard(profile) {
  const cl = confidenceLevel(profile);
  const rows = [
    [{ text: t(profile, 'orderNow'), callback_data: 'main:order' }],
    [{ text: t(profile, 'browse'), callback_data: 'main:browse' }],
    [{ text: t(profile, 'cart'), callback_data: 'main:cart' }],
    [
      { text: t(profile, 'lang'), callback_data: 'main:lang' },
      { text: t(profile, 'cur'), callback_data: 'main:cur' },
    ],
    [{ text: t(profile, 'firstTime'), callback_data: 'main:first' }],
    [{ text: t(profile, 'help'), callback_data: 'main:help' }],
  ];
  if (cl >= 3) {
    rows.splice(3, 0, [{ text: '🧾 Last Order', callback_data: 'main:last' }]);
  }
  return kb(rows);
}

function languageKeyboard(profile) {
  return kb([
    [{ text: '🇺🇸 English', callback_data: 'lang:set:en' }],
    [{ text: '🇰🇭 Khmer', callback_data: 'lang:set:kh' }],
    [{ text: '🇰🇷 Korean', callback_data: 'lang:set:ko' }],
    [{ text: '🇨🇳 Chinese', callback_data: 'lang:set:zh' }],
    [{ text: t(profile, 'back'), callback_data: 'main:home' }],
  ]);
}

function currencyKeyboard(profile) {
  return kb([
    [
      { text: 'USD', callback_data: 'cur:set:USD' },
      { text: 'KHR (៛)', callback_data: 'cur:set:KHR' },
    ],
    [{ text: t(profile, 'back'), callback_data: 'main:home' }],
  ]);
}

// ------------------ MENU: virtual items built from pricing ------------------
function categoriesSorted() {
  return [...MENU.categories].sort((a, b) => (a.sort || 0) - (b.sort || 0));
}

function buildVirtualItemsForCategory(categoryId) {
  // Return [{id, name, priceUsd, description, categoryId}]
  if (categoryId === 'wings') {
    return [
      { id: 'wings:builder', categoryId, name: '🍗 Build Wings Order', priceUsd: null, description: 'Guided wing order with flavors + heat.' },
      { id: 'wings:prices', categoryId, name: '📌 Wings Price List', priceUsd: null, description: 'View base prices (classic / boneless / extreme).' },
    ];
  }

  const map = {
    combos: MENU.pricing.combos,
    burgers: MENU.pricing.burgers,
    sides: MENU.pricing.sides,
    extra_sauces: MENU.pricing.extra_sauces,
    beverages: MENU.pricing.beverages,
    cocktails_beer: MENU.pricing.cocktails_beer,
    hot_sauce: MENU.pricing.hot_sauce,
  };

  const src = map[categoryId];
  if (!src) return [];
  return src.map((x) => ({
    id: `${categoryId}:${x.id}`,
    categoryId,
    name: x.name,
    priceUsd: Number(x.priceUsd || 0),
    description: x.description || null,
  }));
}

function categoryListMessage(profile) {
  const rows = categoriesSorted().map((c) => [{ text: c.label, callback_data: `cat:${c.id}` }]);
  rows.push([{ text: t(profile, 'back'), callback_data: 'main:home' }]);
  return { text: 'Browse Menu', opts: kb(rows) };
}

function itemsListMessage(profile, categoryId) {
  const cat = MENU.categories.find((c) => c.id === categoryId);
  const items = buildVirtualItemsForCategory(categoryId).filter((it) => isAvailable(it.id));
  const title = cat ? cat.label : 'Category';
  if (!items.length) {
    return { text: `${title}\n\n${t(profile, 'notAvailable')}`, opts: kb([[{ text: t(profile, 'back'), callback_data: 'main:browse' }]]) };
  }
  const rows = items.slice(0, 40).map((it) => [{ text: it.priceUsd !== null ? `${it.name} — ${money(profile, it.priceUsd)}` : it.name, callback_data: `item:${it.id}` }]);
  rows.push([{ text: t(profile, 'back'), callback_data: 'main:browse' }]);
  return { text: title, opts: kb(rows) };
}

function itemDetailMessage(profile, virtualId) {
  const [categoryId] = virtualId.split(':');
  const items = buildVirtualItemsForCategory(categoryId);
  const it = items.find((x) => x.id === virtualId);
  if (!it) return { text: 'Item not found.', opts: kb([[{ text: t(profile, 'back'), callback_data: 'main:browse' }]]) };
  if (!isAvailable(it.id)) return { text: `${it.name}\n\n${t(profile, 'notAvailable')}`, opts: kb([[{ text: t(profile, 'back'), callback_data: `cat:${categoryId}` }]]) };

  // Special virtual items
  if (it.id === 'wings:builder') {
    return { text: 'Use Order Now to build your wings.', opts: kb([
      [{ text: t(profile, 'orderNow'), callback_data: 'main:order' }],
      [{ text: t(profile, 'back'), callback_data: `cat:${categoryId}` }],
    ]) };
  }
  if (it.id === 'wings:prices') {
    const w = MENU.pricing.wings;
    const lines = [];
    lines.push('Wings Base Prices');
    lines.push('');
    lines.push('Classic (Bone-in):');
    for (const k of Object.keys(w.classic)) lines.push(`• ${k} wings: ${money(profile, w.classic[k])}`);
    lines.push('');
    lines.push('Boneless:');
    for (const k of Object.keys(w.boneless)) lines.push(`• ${k} wings: ${money(profile, w.boneless[k])}`);
    lines.push('');
    lines.push('Extreme Base (Fusion/Firestorm):');
    for (const k of Object.keys(w.extreme_base)) lines.push(`• ${k} wings: ${money(profile, w.extreme_base[k])}`);
    return { text: lines.join('\n'), opts: kb([[{ text: t(profile, 'back'), callback_data: `cat:${categoryId}` }]]) };
  }

  const lines = [];
  lines.push(it.name);
  if (it.description) lines.push(it.description);
  if (it.priceUsd !== null) lines.push(`Price: ${money(profile, it.priceUsd)}`);

  return {
    text: lines.join('\n'),
    opts: kb([
      [{ text: 'Add to Cart', callback_data: `cart:add:${it.id}` }],
      [{ text: t(profile, 'back'), callback_data: `cat:${categoryId}` }],
    ]),
  };
}

// ------------------ FLAVORS: search + tokens ------------------
function allFlavorsFlat() {
  const out = [];
  for (const group of Object.keys(MENU.flavors)) {
    for (const f of MENU.flavors[group]) {
      const numPlain = String(f.number);
      const numTok = f.token || `#${numPlain}`;
      out.push({ group, number: numPlain, token: numTok, name: f.name, emojis: f.emojis || '' });
    }
  }
  return out;
}

function findFlavorByNumber(numPlain) {
  const n = String(numPlain).replace(/[^0-9]/g, '');
  return allFlavorsFlat().find((f) => f.number === n) || null;
}

// Nuclear allowlist (numbers)
const NUCLEAR_ALLOWLIST = new Set(['46', '47', '49', '50', '22', '27']);
function allowNuclearForSelectedFlavors(flavors) {
  return flavors.some((f) => NUCLEAR_ALLOWLIST.has(String(f.number)));
}

// ------------------ DRAFT ORDER + CART ------------------
function getDraft(userId) {
  const s = getSess(userId);
  if (!s.draft) {
    s.draft = {
      orderType: null, // delivery|pickup
      items: [],
      wings: null, // built wing order
      hotSauceBottle: null, // optional bottle upsell
      redeemSpicePoints: 0,
      payment: { method: null, proofFileId: null },
      delivery: { name: null, phone: null, address: null, mapsUrl: null, note: null },
      createdAt: Date.now(),
    };
    setSess(userId, s);
  }
  return s.draft;
}

function cartTotalUsd(draft) {
  let total = 0;
  for (const li of draft.items) total += (li.unitPriceUsd || 0) * (li.qty || 1);
  if (draft.wings?.totalUsd) total += draft.wings.totalUsd;
  return total;
}

function computeFinalTotals(profile, draft) {
  const baseFood = cartTotalUsd(draft) + (draft.hotSauceBottle ? (draft.hotSauceBottle.priceUsd || 0) : 0);
  const canRedeem = redeemableSpicePoints(profile);
  const redeemPts = Math.min(draft.redeemSpicePoints || 0, canRedeem);
  const redeemUsdRaw = spicePointsValueUsd(redeemPts);
  const redeemUsdCap = Math.round((baseFood * 0.10) * 100) / 100;
  const redeemUsd = Math.min(redeemUsdRaw, redeemUsdCap);
  const finalFood = Math.max(0, baseFood - redeemUsd);
  return { baseFood, redeemPts, redeemUsd, finalFood };
}

function foodSubtotalUsd(draft) {
  // Treat beverages/cocktails/beer as non-food
  let total = 0;
  for (const li of draft.items) {
    const cat = (li.categoryId || '').toLowerCase();
    const isDrink = cat.includes('beverages') || cat.includes('cocktails') || cat.includes('beer') || cat.includes('beverage') || cat.includes('cocktails_beer');
    if (!isDrink) total += (li.unitPriceUsd || 0) * (li.qty || 1);
  }
  if (draft.wings?.totalUsd) total += draft.wings.totalUsd;
  return total;
}

function cartMessage(profile, userId) {
  const draft = getDraft(userId);
  const lines = [];
  lines.push('🛒 Cart');
  lines.push('');

  if (draft.wings) {
    lines.push(`🍗 Wings: ${draft.wings.summary}`);
    lines.push(`   ${money(profile, draft.wings.totalUsd)}`);
    lines.push('');
  }

  if (!draft.items.length && !draft.wings) {
    lines.push('(empty)');
  } else {
    for (const li of draft.items) {
      lines.push(`• ${li.qty}× ${li.name} — ${money(profile, (li.unitPriceUsd || 0) * li.qty)}`);
    }
  }

  const total = cartTotalUsd(draft);
  lines.push('');
  lines.push(`Total: ${money(profile, total)}`);

  if (draft.orderType === 'delivery') {
    const food = foodSubtotalUsd(draft);
    if (food > 0 && food < FREE_DELIVERY_MIN_FOOD_USD) {
      const missing = FREE_DELIVERY_MIN_FOOD_USD - food;
      lines.push('');
      lines.push(`💡 Free delivery (BPH) needs $${FREE_DELIVERY_MIN_FOOD_USD.toFixed(0)} food subtotal.`);
      lines.push(`Add ${money(profile, missing)} more food to qualify.`);
    }
  }

  return {
    text: lines.join('\n'),
    opts: kb([
      [
        { text: 'Delivery', callback_data: 'cart:ordertype:delivery' },
        { text: 'Pickup', callback_data: 'cart:ordertype:pickup' },
      ],
      [{ text: 'Checkout', callback_data: 'checkout:start' }],
      [{ text: 'Clear Cart', callback_data: 'cart:clear' }],
      [{ text: t(profile, 'back'), callback_data: 'main:home' }],
    ]),
  };
}

// ------------------ WING BUILDER (ORDER NOW) ------------------
function startWingBuilder(profile, userId) {
  profile._userId = userId;
  const draft = getDraft(userId);
  draft.wings = {
    wingType: profile.preferences.wingType || null, // bonein|boneless
    count: null,
    flavors: [], // [{number, token, name}]
    tossedOrSide: null,
    heat: profile.preferences.heat || 'original',
    totalUsd: 0,
    summary: '',
  };
  setSess(userId, { state: 'WING:TYPE', draft });
  return wingTypeStep(profile);
}

function wingTypeStep(profile) {
  return {
    text: 'Order Now — Wings\n\nChoose wing type:',
    opts: kb([
      [
        { text: '🍗 Bone-in', callback_data: 'wing:type:bonein' },
        { text: `🍖 Boneless (+$${BONELESS_UPCHARGE_USD.toFixed(2)})`, callback_data: 'wing:type:boneless' },
      ],
      [{ text: t(profile, 'back'), callback_data: 'main:home' }],
    ]),
  };
}

function wingCountStep(profile) {
  // Boneless standalone starts at 8 (no 6 boneless)
  const userId = profile._userId;
  const draft = userId ? getDraft(userId) : null;
  const isBoneless = draft?.wings?.wingType === 'boneless';
  const counts = isBoneless ? [8, 12, 20] : [6, 12, 20];

  return {
    text: 'Choose wing count:',
    opts: kb([
      counts.map((c) => ({ text: String(c), callback_data: `wing:count:${c}` })),
      [{ text: t(profile, 'back'), callback_data: 'wing:back:type' }],
    ]),
  };
}


function wingFlavorStep(profile, draft) {
  const max = MAX_FLAVORS_BY_COUNT[draft.wings.count] || 2;
  const chosen = draft.wings.flavors.map((f) => f.token).join(' ') || '(none)';
  const saved = (profile.preferences.flavorNumbers || []).join(' ') || '(none)';
  return {
    text: `Pick flavors (${draft.wings.flavors.length}/${max})\n\nChosen: ${chosen}\nSaved picks: ${saved}\n\nSend a number to add (example: 17, 59, 46).`,
    opts: kb([
      [{ text: 'Use My Picks', callback_data: 'wing:flav:usepicks' }],
      [{ text: t(profile, 'clear'), callback_data: 'wing:flav:clear' }],
      [{ text: t(profile, 'next'), callback_data: 'wing:next:tossside' }],
      [{ text: t(profile, 'back'), callback_data: 'wing:back:count' }],
    ]),
  };
}

function wingTossSideStep(profile) {
  return {
    text: 'Tossed in sauce or side sauce?',
    opts: kb([
      [
        { text: '🔁 Tossed', callback_data: 'wing:tossside:tossed' },
        { text: '🥣 Side sauce', callback_data: 'wing:tossside:side' },
      ],
      [{ text: t(profile, 'back'), callback_data: 'wing:back:flavor' }],
    ]),
  };
}

function wingHeatStep(profile, draft) {
  const allowNuclear = allowNuclearForSelectedFlavors(draft.wings.flavors);
  const rows = [
    [{ text: 'Original (+$0)', callback_data: 'wing:heat:original' }],
    [{ text: '🌶️ Hot (+$0.25)', callback_data: 'wing:heat:hot' }],
    [{ text: '🌶️🌶️ Spicy (+$0.50)', callback_data: 'wing:heat:spicy' }],
    [{ text: '🌶️🌶️🌶️ Extreme (+$0.75)', callback_data: 'wing:heat:extreme' }],
    [{ text: '☠️ Revenge (+$1.25)', callback_data: 'wing:heat:revenge' }],
  ];
  if (allowNuclear) rows.push([{ text: '☢️ Nuclear (+$2.50)', callback_data: 'wing:heat:nuclear' }]);
  rows.push([{ text: t(profile, 'next'), callback_data: 'wing:next:finalize' }]);
  rows.push([{ text: t(profile, 'back'), callback_data: 'wing:back:tossside' }]);
  return { text: 'Choose heat level:', opts: kb(rows) };
}

function baseWingPriceUsd(draft) {
  const p = MENU.pricing.wings;
  const countKey = String(draft.wings.count);
  if (draft.wings.wingType === 'boneless') return Number(p.boneless[countKey]);

  // If any selected flavor is in fusion/firestorm groups, use extreme_base.
  const extremeNumbers = new Set([
    ...MENU.flavors.fusion.map((f) => String(f.number)),
    ...MENU.flavors.firestorm.map((f) => String(f.number)),
  ]);
  const usesExtreme = draft.wings.flavors.some((f) => extremeNumbers.has(String(f.number)));
  if (usesExtreme) return Number(p.extreme_base[countKey]);

  return Number(p.classic[countKey]);
}

function finalizeWings(profile, draft) {
  const base = baseWingPriceUsd(draft);
  const bonelessUp = draft.wings.wingType === 'boneless' ? BONELESS_UPCHARGE_USD : 0;
  const heatUp = HEAT_PRICES_USD[draft.wings.heat] || 0;
  const includedFlavors = INCLUDED_FLAVORS_BY_COUNT[draft.wings.count] ?? 1;
  const extraFlavorCount = Math.max(0, (draft.wings.flavors.length || 0) - includedFlavors);
  const extraFlavorFee = extraFlavorCount * EXTRA_FLAVOR_PRICE_USD;

  draft.wings.heatUpUsd = heatUp;
  draft.wings.extraFlavorFeeUsd = extraFlavorFee;
  // Spice spend for meter/points: heat ups + extra flavor fees
  draft.wings.spiceSpendUsd = Math.max(0, heatUp) + Math.max(0, extraFlavorFee);

  const total = base + bonelessUp + heatUp + extraFlavorFee;
  const tok = draft.wings.flavors.map((f) => f.token).join(' ') || '(no flavor)';
  const typeTxt = draft.wings.wingType === 'boneless' ? 'Boneless' : 'Bone-in';

  draft.wings.totalUsd = total;
  draft.wings.summary = `${draft.wings.count}pc ${typeTxt} — ${tok} — Heat: ${draft.wings.heat}`;

  // Save preferences (flavor picks)
  const saved = profile.preferences.flavorNumbers || [];
  const newTokens = draft.wings.flavors.map((f) => f.token);
  profile.preferences.flavorNumbers = [...new Set([...saved, ...newTokens])].slice(0, 4);
  profile.preferences.wingType = draft.wings.wingType;
  profile.preferences.heat = draft.wings.heat;
  saveCustomers();

  return { totalUsd: total, summary: draft.wings.summary };
}

// ------------------ CHECKOUT + STAFF DISPATCH ------------------
function checkoutStartMessage(profile, userId) {
  const draft = getDraft(userId);
  if (!draft.items.length && !draft.wings) return { text: 'Cart is empty.', opts: kb([[{ text: t(profile, 'back'), callback_data: 'main:home' }]]) };
  const rows = [[{ text: 'Cash', callback_data: 'pay:set:cash' }]];
  if (BANK_TRANSFER_ENABLED) rows.push([{ text: 'Bank Transfer', callback_data: 'pay:set:bank' }]);
  rows.push([{ text: t(profile, 'back'), callback_data: 'main:cart' }]);
  return { text: 'Checkout\n\nChoose payment method:', opts: kb(rows) };
}

function checkoutReviewMessage(profile, draft) {
  const lines = [];
  lines.push('Review Order');
  lines.push('');
  lines.push(`Order type: ${draft.orderType || '-'}`);

  // --- Spice spend this order ---
  const wingsSpice = draft.wings ? (draft.wings.spiceSpendUsd || 0) : 0;
  const bottleSpice = draft.hotSauceBottle ? (draft.hotSauceBottle.priceUsd || 0) : 0;
  const spiceSpendUsd = wingsSpice + bottleSpice;
  const score = calcHeatScore(spiceSpendUsd);

  if (draft.wings) {
    lines.push(`Wings: ${draft.wings.summary}`);
    lines.push(`Wings total: ${money(profile, draft.wings.totalUsd)}`);
  }
  for (const li of draft.items) lines.push(`${li.qty}× ${li.name} — ${money(profile, (li.unitPriceUsd || 0) * li.qty)}`);

  if (draft.hotSauceBottle) {
    lines.push(`🧴 Hot Sauce Bottle: ${draft.hotSauceBottle.name} — ${money(profile, draft.hotSauceBottle.priceUsd)}`);
  }

  lines.push('');
  const foodTotal = cartTotalUsd(draft) + (draft.hotSauceBottle ? draft.hotSauceBottle.priceUsd : 0);

  // Spice points redemption (food-only, no delivery)
  const canRedeem = redeemableSpicePoints(profile);
  const redeemPts = Math.min(draft.redeemSpicePoints || 0, canRedeem);
  const redeemUsdRaw = spicePointsValueUsd(redeemPts);
  const redeemUsdCap = Math.round((foodTotal * 0.10) * 100) / 100; // max 10% off
  const redeemUsd = Math.min(redeemUsdRaw, redeemUsdCap);
  const finalTotal = Math.max(0, foodTotal - redeemUsd);

  lines.push(`Total: ${money(profile, finalTotal)}`);
  if (redeemUsd > 0) lines.push(`(Spice Points −${money(profile, redeemUsd)})`);

  // Spice meter (always visible)
  lines.push('');
  lines.push(`Heat Score: ${heatScoreMeter(score)}`);

  const last = profile.stats?.lastOrderSpicySpendUsd || 0;
  const lastScore = profile.stats?.lastOrderHeatScore || 0;
  if (last > 0 || lastScore > 0) {
    lines.push(`Last order heat: ${money(profile, last)} (${lastScore} pts)`);
  }

  if (canRedeem > 0) {
    lines.push(`Spice Points Balance: ${canRedeem}`);
  }

  lines.push('');
  lines.push(`Payment: ${draft.payment.method ? draft.payment.method.toUpperCase() : '-'}`);
  if (draft.payment.method === 'bank' && !draft.payment.proofFileId) lines.push('⚠️ Bank transfer needs proof photo before staff dispatch.');

  const rows = [];
  rows.push([{ text: draft.hotSauceBottle ? '🧴 Change Hot Sauce Bottle' : '🧴 Add Hot Sauce Bottle', callback_data: 'hotsauce:add' }]);
  if (canRedeem >= 1000) {
    rows.push([
      { text: '🎟️ Use 1000 pts (−$1)', callback_data: 'spice:redeem:1000' },
      { text: '❌ No points', callback_data: 'spice:redeem:0' },
    ]);
  }
  rows.push([{ text: 'Place Order', callback_data: 'order:place' }]);
  rows.push([{ text: t(profile, 'back'), callback_data: 'checkout:start' }]);
  return { text: lines.join('\n'), opts: kb(rows) };
}


function formatStaffOrderText(order) {
  const lines = [];
  lines.push('🟥 WING⚡BOSS — ORDER');
  lines.push(`Order ID: ${order.id}`);
  lines.push(`Time: ${order.createdAtIso}`);
  lines.push(`Customer: ${order.customerName}${order.customerUsername ? ` (@${order.customerUsername})` : ''}`);
  lines.push('');
  lines.push(`Order Type: ${order.orderType}`);
  if (order.orderType === 'delivery') {
    lines.push(`Phone: ${order.delivery.phone || '-'}`);
    lines.push(`Address: ${order.delivery.address || '-'}`);
    if (order.delivery.mapsUrl) lines.push(`Map: ${order.delivery.mapsUrl}`);
    if (order.delivery.note) lines.push(`Note: ${order.delivery.note}`);
  }
  lines.push('');
  lines.push('Items:');
  if (order.wings) {
    lines.push(`• 🍗 Wings — ${order.wings.summary} — $${order.wings.totalUsd.toFixed(2)}`);
  }
  for (const li of order.items) lines.push(`• ${li.qty}× ${li.name} — $${(li.unitPriceUsd || 0).toFixed(2)}`);
  lines.push('');
  lines.push(`Payment: ${order.payment.method.toUpperCase()}`);
  if (order.payment.method === 'bank') lines.push(`Proof: ${order.payment.proofFileId ? '✅ received' : '❌ missing'}`);
  lines.push(`TOTAL: $${order.totalUsd.toFixed(2)}`);
  lines.push('');
  lines.push(`STATUS: ${order.status}`);
  return lines.join('\n');
}

function staffKeyboard(orderId) {
  return kb([
    [
      { text: 'Confirm', callback_data: `st:${orderId}:CONFIRMED` },
      { text: 'Cancel', callback_data: `st:${orderId}:CANCELLED` },
    ],
    [
      { text: 'Preparing', callback_data: `st:${orderId}:PREPARING` },
      { text: 'Out', callback_data: `st:${orderId}:OUT_FOR_DELIVERY` },
    ],
    [{ text: 'Completed', callback_data: `st:${orderId}:COMPLETED` }],
  ]);
}

async function dispatchToStaff(order) {
  const text = formatStaffOrderText(order);
  const msg = await bot.sendMessage(STAFF_CHAT_ID, text, {
    reply_markup: staffKeyboard(order.id).reply_markup,
    disable_web_page_preview: true,
  });
  order.staffMessage = { chatId: STAFF_CHAT_ID, messageId: msg.message_id };
}

async function updateStaffStatus(orderId, status) {
  const order = ORDERS[orderId];
  if (!order || !order.staffMessage) return;
  order.status = status;
  const text = formatStaffOrderText(order);
  await bot.editMessageText(text, {
    chat_id: order.staffMessage.chatId,
    message_id: order.staffMessage.messageId,
    reply_markup: staffKeyboard(orderId).reply_markup,
    disable_web_page_preview: true,
  });
  saveOrders();
}

function customerReceipt(profile, order) {
  const lines = [];
  lines.push('✅ WING⚡BOSS');
  lines.push(`Order ID: ${order.id}`);
  lines.push(`Status: ${order.status}`);
  lines.push('');
  if (order.wings) lines.push(`🍗 Wings: ${order.wings.summary}`);
  for (const li of order.items) lines.push(`• ${li.qty}× ${li.name}`);
  lines.push('');
  lines.push(`Total: ${money(profile, order.totalUsd)}`);
  return lines.join('\n');
}

// ------------------ ADMIN: reload menu ------------------
function isOwner(userId) { return Number(userId) === OWNER_TELEGRAM_ID; }

async function adminReloadMenu(chatId, userId) {
  if (!isOwner(userId)) return;
  const before = MENU;
  try {
    const candidate = JSON.parse(fs.readFileSync(MENU_PATH, 'utf8'));
    const v = validateMenuShape(candidate);
    if (!v.ok) {
      await bot.sendMessage(chatId, `❌ Menu validation failed: ${v.error}`);
      return;
    }
    fs.writeFileSync(MENU_BACKUP_PATH, JSON.stringify(before, null, 2));
    MENU = candidate;
    await bot.sendMessage(chatId, `✅ Menu reloaded. Version: ${before.version} → ${MENU.version}`);
  } catch (e) {
    await bot.sendMessage(chatId, `❌ Reload failed: ${e.message}`);
  }
}

// ------------------ COMMANDS ------------------
bot.onText(/\/start/, async (msg) => {
  const profile = getCustomer(msg.from);
  setSess(msg.from.id, { state: 'MAIN' });

  await bot.sendMessage(msg.chat.id, t(profile, 'welcome'));
  await bot.sendMessage(msg.chat.id, t(profile, 'firstQ'), kb([
    [
      { text: t(profile, 'firstYes'), callback_data: 'start:first' },
      { text: t(profile, 'firstNo'), callback_data: 'start:return' },
    ],
    [{ text: t(profile, 'lang'), callback_data: 'main:lang' }],
  ]));
});

bot.onText(/\/menu/, async (msg) => {
  const profile = getCustomer(msg.from);
  await bot.sendMessage(msg.chat.id, t(profile, 'menu'), mainMenuKeyboard(profile));
});

bot.onText(/\/reloadmenu/, async (msg) => {
  await adminReloadMenu(msg.chat.id, msg.from.id);
});

// ------------------ MESSAGE INPUT: flavor number + proof photo ------------------
bot.on('message', async (msg) => {
  if (!msg.text) return;
  const profile = getCustomer(msg.from);
  const sess = getSess(msg.from.id);
  const draft = getDraft(msg.from.id);

  if (sess.state === 'WING:FLAVOR_INPUT') {
    const f = findFlavorByNumber(msg.text.trim());
    if (!f) {
      await bot.sendMessage(msg.chat.id, 'Not found. Send a flavor number like 17, 59, 46.');
      return;
    }
    const max = MAX_FLAVORS_BY_COUNT[draft.wings.count] || 2;
    if (draft.wings.flavors.length >= max) {
      await bot.sendMessage(msg.chat.id, `Max flavors for ${draft.wings.count}pc is ${max}.`);
      return;
    }
    if (draft.wings.flavors.some((x) => x.number === f.number)) {
      await bot.sendMessage(msg.chat.id, `Already added: ${f.token}`);
      return;
    }
    draft.wings.flavors.push({ number: f.number, token: f.token, name: f.name });
    setSess(msg.from.id, { draft });
    const card = wingFlavorStep(profile, draft);
    await bot.sendMessage(msg.chat.id, `Added ${f.token} ${f.name} ✅`);
    await bot.sendMessage(msg.chat.id, card.text, card.opts);
    return;
  }
});

bot.on('photo', async (msg) => {
  const profile = getCustomer(msg.from);
  const sess = getSess(msg.from.id);
  const draft = getDraft(msg.from.id);
  if (sess.state === 'PAY:PROOF' && draft.payment.method === 'bank') {
    const fileId = msg.photo?.[msg.photo.length - 1]?.file_id;
    if (!fileId) return;
    draft.payment.proofFileId = fileId;
    setSess(msg.from.id, { draft, state: 'CHECKOUT:REVIEW' });
    await bot.sendMessage(msg.chat.id, '✅ Payment proof received.');
    const card = checkoutReviewMessage(profile, draft);
    await bot.sendMessage(msg.chat.id, card.text, card.opts);
  }
});

// ------------------ CALLBACKS ------------------
bot.on('callback_query', async (q) => {
  const msg = q.message;
  if (!msg) return;
  const profile = getCustomer(q.from);
  const data = q.data || '';

  try {
    // Start
    if (data === 'start:first') {
      profile.flags.skippedEducation = false;
      saveCustomers();
      await bot.sendMessage(msg.chat.id, 'First-time path: use Browse Menu for the step-by-step education, or Order Now to build quickly.', mainMenuKeyboard(profile));
      return;
    }
    if (data === 'start:return') {
      await bot.sendMessage(msg.chat.id, t(profile, 'menu'), mainMenuKeyboard(profile));
      return;
    }

    // Main
    if (data === 'main:home') {
      await bot.sendMessage(msg.chat.id, t(profile, 'menu'), mainMenuKeyboard(profile));
      return;
    }
    if (data === 'main:order') {
      const draft = getDraft(q.from.id);
      const card = startWingBuilder(profile, q.from.id);
      setSess(q.from.id, { draft, state: 'WING:TYPE' });
      await bot.sendMessage(msg.chat.id, card.text, card.opts);
      return;
    }
    if (data === 'main:browse') {
      const card = categoryListMessage(profile);
      await bot.sendMessage(msg.chat.id, card.text, card.opts);
      return;
    }
    if (data === 'main:cart') {
      const card = cartMessage(profile, q.from.id);
      await bot.sendMessage(msg.chat.id, card.text, card.opts);
      return;
    }
    if (data === 'main:lang') {
      await bot.sendMessage(msg.chat.id, 'Choose language:', languageKeyboard(profile));
      return;
    }
    if (data === 'main:cur') {
      await bot.sendMessage(msg.chat.id, 'Choose currency:', currencyKeyboard(profile));
      return;
    }
    if (data === 'main:first') {
      await bot.sendMessage(msg.chat.id, 'First-time tip: Browse Menu shows the step-by-step education panels.', mainMenuKeyboard(profile));
      return;
    }
    if (data === 'main:help') {
      await bot.sendMessage(msg.chat.id, `${t(profile, 'payBeforeCook')}\n\n(Help contact can be wired later.)`);
      return;
    }
    if (data === 'main:last') {
      if (!profile.lastOrderId || !ORDERS[profile.lastOrderId]) {
        await bot.sendMessage(msg.chat.id, 'No last order found.', kb([[{ text: t(profile, 'back'), callback_data: 'main:home' }]]));
        return;
      }
      const o = ORDERS[profile.lastOrderId];
      await bot.sendMessage(msg.chat.id, `Last order: ${o.id}\nStatus: ${o.status}\nTotal: ${money(profile, o.totalUsd)}`);
      return;
    }

    // Language
    if (data.startsWith('lang:set:')) {
      profile.language = data.split(':')[2];
      saveCustomers();
      await bot.sendMessage(msg.chat.id, '✅ Language set.', mainMenuKeyboard(profile));
      return;
    }

    // Currency
    if (data.startsWith('cur:set:')) {
      profile.currency = data.split(':')[2];
      saveCustomers();
      await bot.sendMessage(msg.chat.id, '✅ Currency set.', mainMenuKeyboard(profile));
      return;
    }

    // Browse
    if (data.startsWith('cat:')) {
      const catId = data.split(':')[1];
      const card = itemsListMessage(profile, catId);
      await bot.sendMessage(msg.chat.id, card.text, card.opts);
      return;
    }
    if (data.startsWith('item:')) {
      const itemId = data.split(':')[1] + ':' + data.split(':')[2];
      const card = itemDetailMessage(profile, itemId);
      await bot.sendMessage(msg.chat.id, card.text, card.opts);
      return;
    }

    // Cart add
    if (data.startsWith('cart:add:')) {
      const virtualId = data.replace('cart:add:', '');
      const [catId] = virtualId.split(':');
      const items = buildVirtualItemsForCategory(catId);
      const it = items.find((x) => x.id === virtualId);
      if (!it) return;
      if (!isAvailable(it.id)) {
        await bot.sendMessage(msg.chat.id, t(profile, 'notAvailable'));
        return;
      }
      const draft = getDraft(q.from.id);
      draft.items.push({
        id: it.id,
        categoryId: it.categoryId,
        name: it.name,
        qty: 1,
        unitPriceUsd: it.priceUsd || 0,
      });
      setSess(q.from.id, { draft });
      await bot.sendMessage(msg.chat.id, 'Added to cart ✅');
      return;
    }

    // Cart order type
    if (data.startsWith('cart:ordertype:')) {
      const typ = data.split(':')[2];
      const draft = getDraft(q.from.id);
      draft.orderType = typ;
      setSess(q.from.id, { draft });
      await bot.answerCallbackQuery(q.id, { text: `Set: ${typ}` });
      return;
    }

    if (data === 'cart:clear') {
      const draft = getDraft(q.from.id);
      draft.items = [];
      draft.wings = null;
      draft.payment = { method: null, proofFileId: null };
      setSess(q.from.id, { draft });
      await bot.sendMessage(msg.chat.id, 'Cart cleared.');
      return;
    }

    // Wing builder
    if (data.startsWith('wing:type:')) {
      const typ = data.split(':')[2];
      const draft = getDraft(q.from.id);
      draft.wings.wingType = typ;
      profile.preferences.wingType = typ;
      saveCustomers();
      setSess(q.from.id, { draft, state: 'WING:COUNT' });
      const card = wingCountStep(profile);
      await bot.sendMessage(msg.chat.id, card.text, card.opts);
      return;
    }
    if (data === 'wing:back:type') {
      const card = wingTypeStep(profile);
      await bot.sendMessage(msg.chat.id, card.text, card.opts);
      return;
    }
    if (data.startsWith('wing:count:')) {
      const count = Number(data.split(':')[2]);
      const draft = getDraft(q.from.id);
      draft.wings.count = count;
      draft.wings.flavors = [];
      setSess(q.from.id, { draft, state: 'WING:FLAVOR_INPUT' });
      const card = wingFlavorStep(profile, draft);
      await bot.sendMessage(msg.chat.id, card.text, card.opts);
      return;
    }
    if (data === 'wing:back:count') {
      const card = wingCountStep(profile);
      await bot.sendMessage(msg.chat.id, card.text, card.opts);
      return;
    }
    if (data === 'wing:flav:usepicks') {
      const draft = getDraft(q.from.id);
      const max = MAX_FLAVORS_BY_COUNT[draft.wings.count] || 2;
      for (const tok of (profile.preferences.flavorNumbers || [])) {
        if (draft.wings.flavors.length >= max) break;
        const plain = String(tok).replace(/[^0-9]/g, '');
        const f = findFlavorByNumber(plain);
        if (f && !draft.wings.flavors.some((x) => x.number === f.number)) draft.wings.flavors.push({ number: f.number, token: f.token, name: f.name });
      }
      setSess(q.from.id, { draft });
      await bot.sendMessage(msg.chat.id, 'Loaded picks ✅');
      const card = wingFlavorStep(profile, draft);
      await bot.sendMessage(msg.chat.id, card.text, card.opts);
      return;
    }
    if (data === 'wing:flav:clear') {
      const draft = getDraft(q.from.id);
      draft.wings.flavors = [];
      setSess(q.from.id, { draft });
      await bot.answerCallbackQuery(q.id, { text: 'Cleared.' });
      return;
    }
    if (data === 'wing:next:tossside') {
      const draft = getDraft(q.from.id);
      if (!draft.wings.flavors.length) {
        await bot.sendMessage(msg.chat.id, 'Add at least 1 flavor number first.');
        return;
      }
      const card = wingTossSideStep(profile);
      setSess(q.from.id, { state: 'WING:TOSSSIDE' });
      await bot.sendMessage(msg.chat.id, card.text, card.opts);
      return;
    }
    if (data === 'wing:back:flavor') {
      const draft = getDraft(q.from.id);
      const card = wingFlavorStep(profile, draft);
      await bot.sendMessage(msg.chat.id, card.text, card.opts);
      return;
    }
    if (data.startsWith('wing:tossside:')) {
      const val = data.split(':')[2];
      const draft = getDraft(q.from.id);
      draft.wings.tossedOrSide = val;
      setSess(q.from.id, { draft, state: 'WING:HEAT' });
      const card = wingHeatStep(profile, draft);
      await bot.sendMessage(msg.chat.id, card.text, card.opts);
      return;
    }
    if (data === 'wing:back:tossside') {
      const card = wingTossSideStep(profile);
      await bot.sendMessage(msg.chat.id, card.text, card.opts);
      return;
    }
    if (data.startsWith('wing:heat:')) {
      const heat = data.split(':')[2];
      const draft = getDraft(q.from.id);
      draft.wings.heat = heat;
      profile.preferences.heat = heat;
      saveCustomers();
      setSess(q.from.id, { draft });
      await bot.answerCallbackQuery(q.id, { text: 'Heat set.' });
      return;
    }
    if (data === 'wing:next:finalize') {
      const draft = getDraft(q.from.id);
      const out = finalizeWings(profile, draft);
      setSess(q.from.id, { draft, state: 'MAIN' });
      await bot.sendMessage(msg.chat.id, `Added wings to cart ✅\n\n${out.summary}\nTotal: ${money(profile, out.totalUsd)}`);
      await bot.sendMessage(msg.chat.id, t(profile, 'menu'), mainMenuKeyboard(profile));
      return;
    }

    // Checkout
        // --- Hot sauce bottle upsell + spice points redemption ---
    if (data === 'hotsauce:add') {
      const rows = [
        [{ text: `Strawberry Armageddon — $${Number(MENU.pricing.hot_sauce.strawberry_armageddon).toFixed(2)}`, callback_data: 'hotsauce:set:strawberry_armageddon' }],
        [{ text: `Mango Mayhem — $${Number(MENU.pricing.hot_sauce.mango_mayhem).toFixed(2)}`, callback_data: 'hotsauce:set:mango_mayhem' }],
        [{ text: 'No bottle', callback_data: 'hotsauce:set:none' }],
        [{ text: t(profile, 'back'), callback_data: 'checkout:start' }],
      ];
      return bot.editMessageText('Add a Hot Sauce Bottle (optional)\n\nYou can save money vs stacking heat upgrades by grabbing a bottle.', {
        chat_id: chatId,
        message_id: msgId,
        reply_markup: { inline_keyboard: rows },
      });
    }
    if (data.startsWith('hotsauce:set:')) {
      const sku = data.split(':')[2];
      if (sku === 'none') {
        draft.hotSauceBottle = null;
      } else if (sku === 'strawberry_armageddon') {
        draft.hotSauceBottle = { sku, name: 'Strawberry Armageddon', priceUsd: Number(MENU.pricing.hot_sauce.strawberry_armageddon) };
      } else if (sku === 'mango_mayhem') {
        draft.hotSauceBottle = { sku, name: 'Mango Mayhem', priceUsd: Number(MENU.pricing.hot_sauce.mango_mayhem) };
      }
      setSess(userId, { draft });
      const r = checkoutReviewMessage(profile, draft);
      return bot.editMessageText(r.text, { chat_id: chatId, message_id: msgId, ...r.opts });
    }
    if (data.startsWith('spice:redeem:')) {
      const pts = Number(data.split(':')[2] || 0);
      draft.redeemSpicePoints = pts;
      setSess(userId, { draft });
      const r = checkoutReviewMessage(profile, draft);
      return bot.editMessageText(r.text, { chat_id: chatId, message_id: msgId, ...r.opts });
    }

if (data === 'checkout:start') {
      const card = checkoutStartMessage(profile, q.from.id);
      setSess(q.from.id, { state: 'CHECKOUT:PAY' });
      await bot.sendMessage(msg.chat.id, card.text, card.opts);
      return;
    }
    if (data.startsWith('pay:set:')) {
      const method = data.split(':')[2];
      const draft = getDraft(q.from.id);
      draft.payment.method = method;
      if (method === 'bank') {
        draft.payment.proofFileId = null;
        setSess(q.from.id, { draft, state: 'PAY:PROOF' });
        await bot.sendMessage(msg.chat.id, `${t(profile, 'payBeforeCook')}\n\nUpload payment proof photo now.`);
        return;
      }
      setSess(q.from.id, { draft, state: 'CHECKOUT:REVIEW' });
      const card = checkoutReviewMessage(profile, draft);
      await bot.sendMessage(msg.chat.id, card.text, card.opts);
      return;
    }
    if (data === 'order:place') {
      const draft = getDraft(q.from.id);
      if (!draft.orderType) {
        await bot.sendMessage(msg.chat.id, 'Choose Delivery or Pickup in Cart first.');
        return;
      }
      if (!draft.payment.method) {
        await bot.sendMessage(msg.chat.id, 'Choose payment method first.');
        return;
      }
      if (draft.payment.method === 'bank' && !draft.payment.proofFileId) {
        setSess(q.from.id, { state: 'PAY:PROOF' });
        await bot.sendMessage(msg.chat.id, 'Bank transfer needs proof photo. Upload it now.');
        return;
      }

      const id = shortId();
      const totals = computeFinalTotals(profile, draft);
      const order = {
        id,
        createdAtIso: nowIso(),
        customerTelegramId: q.from.id,
        customerUsername: q.from.username || null,
        customerName: q.from.first_name || 'Customer',
        orderType: draft.orderType,
        delivery: draft.delivery,
        payment: draft.payment,
        items: draft.items,
        wings: draft.wings,
        hotSauceBottle: draft.hotSauceBottle, // optional
        spicePointsRedeemed: totals.redeemPts || 0,
        spicePointsDiscountUsd: totals.redeemUsd || 0,
        totalUsd: totals.finalFood,
        status: 'PENDING_CONFIRM',
        staffMessage: null,
      };

      ORDERS[id] = order;
      saveOrders();
            // ---- Spice meter persistence + spice points (earned on order placement; redemption gated by eligibility) ----
      try {
        const spiceSpendUsd = (order.wings?.spiceSpendUsd || 0) + (order.hotSauceBottle?.priceUsd || 0);
        const earnedPts = calcHeatScore(spiceSpendUsd);
        const redeemedPts = order.spicePointsRedeemed || 0;

        profile.stats.spicySpendUsdLifetime = (profile.stats.spicySpendUsdLifetime || 0) + spiceSpendUsd;
        profile.stats.lastOrderSpicySpendUsd = spiceSpendUsd;
        profile.stats.lastOrderHeatScore = earnedPts;

        profile.stats.spicePointsLifetime = (profile.stats.spicePointsLifetime || 0) + earnedPts;
        profile.stats.spicePointsBalance = Math.max(0, (profile.stats.spicePointsBalance || 0) - redeemedPts + earnedPts);
      } catch (e) {
        // do not block order flow
      }

await dispatchToStaff(order);
      saveOrders();

      profile.lastOrderId = id;
      profile.stats.lastOrderAt = Date.now();
      saveCustomers();

      await bot.sendMessage(msg.chat.id, `✅ Order placed. Waiting for confirmation.\nOrder ID: ${id}`);

      // Clear draft
      setSess(q.from.id, { draft: null, state: 'MAIN' });
      return;
    }

    // Staff actions
    if (data.startsWith('st:')) {
      const [, orderId, status] = data.split(':');

      // Auth: allow owner always; otherwise only allow if callback is in staff chat
      if (!isOwner(q.from.id) && msg.chat.id !== STAFF_CHAT_ID) {
        await bot.answerCallbackQuery(q.id, { text: 'Not authorized.' });
        return;
      }

      if (!ORDERS[orderId]) {
        await bot.answerCallbackQuery(q.id, { text: 'Order not found.' });
        return;
      }

      await updateStaffStatus(orderId, status);

      // Customer receipt after CONFIRMED (locked)
      if (status === 'CONFIRMED') {
        const o = ORDERS[orderId];
        const cust = CUSTOMERS[String(o.customerTelegramId)] || { language: 'en', currency: 'USD' };
        await bot.sendMessage(o.customerTelegramId, customerReceipt(cust, o));
      }

      await bot.answerCallbackQuery(q.id, { text: `Status set: ${status}` });
      return;
    }

    await bot.answerCallbackQuery(q.id);
  } catch (e) {
    await bot.sendMessage(msg.chat.id, `❌ Error: ${e.message}`);
  }
});

console.log('Wingboss-bot-4.0 running (polling). TZ=', TIMEZONE);
