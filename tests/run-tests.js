// Zero-dependency test suite for Gartenbistro Kasse
// Runs in Node.js (`node tests/run-tests.js`) or macOS JavaScriptCore (`jsc tests/run-tests.js`)

const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;
const printLine = typeof console !== 'undefined' && console.log ? (...a) => console.log(...a) : (...a) => print(...a);

function readProjectFile(relPath) {
  if (isNode) {
    const fs = require('fs');
    const path = require('path');
    return fs.readFileSync(path.resolve(__dirname, '..', relPath), 'utf8');
  }
  return readFile(relPath);
}

function exitWithCode(code) {
  if (isNode) {
    process.exit(code);
  } else if (typeof quit === 'function') {
    quit(code);
  }
}

// Minimal DOM & Browser Environment Stub for app.js
function createMockElement(id = '') {
  const classes = new Set();
  return {
    id,
    textContent: '',
    innerHTML: '',
    value: '',
    disabled: false,
    dataset: {},
    style: {},
    classList: {
      add: (...c) => c.forEach((x) => classes.add(x)),
      remove: (...c) => c.forEach((x) => classes.delete(x)),
      toggle: (c, force) => {
        const shouldAdd = force === undefined ? !classes.has(c) : Boolean(force);
        if (shouldAdd) classes.add(c);
        else classes.delete(c);
        return shouldAdd;
      },
      contains: (c) => classes.has(c)
    },
    appendChild() {},
    remove() {},
    addEventListener() {},
    querySelector: () => createMockElement(),
    querySelectorAll: () => [],
    closest: () => createMockElement()
  };
}

const elementStore = new Map();
const storageMap = new Map();

globalThis.__KASSE_TEST_ENV__ = true;
globalThis.window = globalThis;
globalThis.console = globalThis.console || { log: printLine, error: () => {}, warn: () => {} };
globalThis.navigator = { storage: { persist: () => Promise.resolve() } };
globalThis.confirm = () => true;
globalThis.alert = () => {};
globalThis.localStorage = {
  getItem: (k) => (storageMap.has(k) ? storageMap.get(k) : null),
  setItem: (k, v) => storageMap.set(k, String(v)),
  removeItem: (k) => storageMap.delete(k),
  clear: () => storageMap.clear()
};
globalThis.document = {
  getElementById: (id) => {
    if (!elementStore.has(id)) elementStore.set(id, createMockElement(id));
    return elementStore.get(id);
  },
  createElement: (tag) => createMockElement(tag),
  querySelector: () => createMockElement(),
  querySelectorAll: () => [],
  addEventListener() {}
};

if (typeof structuredClone !== 'function') {
  globalThis.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}

// Load app.js into global scope so all top-level functions & state are accessible
const appSource = readProjectFile('app.js');
if (isNode) {
  const vm = require('vm');
  vm.runInThisContext(appSource, { filename: 'app.js' });
} else {
  (0, eval)(appSource);
}

const { state, DEFAULT_CATEGORIES, DEFAULT_PRODUCTS, STORAGE_KEY, FALLBACK_CATEGORY } = globalThis.__kasse;

// Simple assertion helpers
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEqual(actual, expected, message = '') {
  if (actual !== expected) {
    throw new Error(`${message ? message + ': ' : ''}Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function test(name, fn) {
  try {
    fn();
    passed++;
    printLine(`  ✓ ${name}`);
  } catch (err) {
    failed++;
    printLine(`  ✗ ${name}`);
    printLine(`    -> ${err && err.message ? err.message : err}`);
  }
}

function resetTestState() {
  storageMap.clear();
  state.bistroName = 'Gartenbistro';
  state.categories = [...DEFAULT_CATEGORIES];
  state.products = structuredClone(DEFAULT_PRODUCTS);
  state.orders = [];
  state.cart = [];
  state.cashGiven = 0;
  state.posCategory = 'ALL';
  state.editorCategory = 'ALL';
}

printLine('\nRunning Gartenbistro Kasse Tests...\n');

// 1. Swiss 5-Rappen Rounding & Currency Formatting
test('roundRappen rounds to nearest 0.05 CHF and avoids float drift', () => {
  assertEqual(roundRappen(0), 0);
  assertEqual(roundRappen(4.5), 4.5);
  assertEqual(roundRappen(0.1 + 0.2), 0.3);
  assertEqual(roundRappen(3 * 4.55), 13.65);
  assertEqual(roundRappen(1.024), 1.0);
  assertEqual(roundRappen(1.026), 1.05);
  assertEqual(roundRappen(1.074), 1.05);
  assertEqual(roundRappen(1.076), 1.1);
  assertEqual(roundRappen('invalid'), 0);
});

test('formatCHF formats numbers as CHF X.XX', () => {
  assertEqual(formatCHF(0), 'CHF 0.00');
  assertEqual(formatCHF(6), 'CHF 6.00');
  assertEqual(formatCHF(4.55), 'CHF 4.55');
  assertEqual(formatCHF(null), 'CHF 0.00');
});

// 2. Product Sanitization & Category Grouping
test('sanitizeProduct normalizes fields, rounds price, and validates color theme', () => {
  const clean = sanitizeProduct({
    id: 'test_1',
    name: '  Bio Eistee  ',
    price: 4.526,
    category: '  Kaltgetränke ',
    emoji: ' 🍹 ',
    color: 'non-existent-theme',
    active: false
  });
  assertEqual(clean.id, 'test_1');
  assertEqual(clean.name, 'Bio Eistee');
  assertEqual(clean.price, 4.55);
  assertEqual(clean.category, 'Kaltgetränke');
  assertEqual(clean.emoji, '🍹');
  assertEqual(clean.color, 'theme-green');
  assertEqual(clean.active, false);

  const fallback = sanitizeProduct({ name: '   ', price: -10 });
  assertEqual(fallback.name, 'Artikel');
  assertEqual(fallback.price, 0);
  assertEqual(fallback.active, true);
});

test('groupProductsByCategory groups known categories and collects unknown in FALLBACK_CATEGORY', () => {
  resetTestState();
  const sample = [
    { id: '1', name: 'Cüpli', category: 'Kaltgetränke' },
    { id: '2', name: 'Spezial', category: 'Unbekannte Kategorie' },
    { id: '3', name: 'Espresso', category: 'Kaffee & Warmes' }
  ];
  const grouped = groupProductsByCategory(sample, false);
  assertEqual(grouped.length, 3);
  assertEqual(grouped[0].category, 'Kaffee & Warmes');
  assertEqual(grouped[0].items[0].name, 'Espresso');
  assertEqual(grouped[1].category, 'Kaltgetränke');
  assertEqual(grouped[1].items[0].name, 'Cüpli');
  assertEqual(grouped[2].category, FALLBACK_CATEGORY);
  assertEqual(grouped[2].items[0].name, 'Spezial');
});

// 3. Cart Math & Catalog Sync
test('addToCart, updateCartItemQty, and getCartTotal compute exact totals', () => {
  resetTestState();
  const cuepli = state.products.find((p) => p.name === 'Cüpli');
  const kaffee = state.products.find((p) => p.name.includes('Kaffee'));
  assert(cuepli && kaffee, 'Default drinks should exist');

  addToCart(cuepli); // 6.00
  addToCart(cuepli); // 12.00
  addToCart(kaffee); // + 4.20 = 16.20
  assertEqual(state.cart.length, 2);
  assertEqual(state.cart[0].qty, 2);
  assertEqual(getCartTotal(), 16.2);

  state.cashGiven = 20;
  updateCartItemQty(cuepli.id, -1); // 10.20
  assertEqual(getCartTotal(), 10.2);

  // Removing remaining items resets cashGiven
  updateCartItemQty(cuepli.id, -1);
  updateCartItemQty(kaffee.id, -1);
  assertEqual(state.cart.length, 0);
  assertEqual(state.cashGiven, 0);
});

test('syncCartWithCatalog updates edited products, removes inactive ones, and keeps custom items', () => {
  resetTestState();
  const p1 = state.products[0];
  const p2 = state.products[1];
  addToCart(p1);
  addToCart(p2);
  addToCart({ id: 'custom_123', name: 'Blumenstrauss', price: 15.0, category: FALLBACK_CATEGORY, emoji: '💐' });

  // Edit p1 price & name, deactivate p2
  p1.name = 'Doppelter Espresso';
  p1.price = 5.5;
  p2.active = false;

  syncCartWithCatalog();

  assertEqual(state.cart.length, 2);
  assertEqual(state.cart[0].name, 'Doppelter Espresso');
  assertEqual(state.cart[0].price, 5.5);
  assertEqual(state.cart[1].id, 'custom_123');
  assertEqual(getCartTotal(), 20.5);
});

// 4. Checkout & Order History
test('completeCheckout records cash changeDue and TWINT exact total, and cancelOrder removes order', () => {
  resetTestState();
  const prod = state.products[0]; // 4.20
  addToCart(prod);
  addToCart(prod); // 8.40
  state.cashGiven = 20.0;

  completeCheckout('cash');

  assertEqual(state.cart.length, 0);
  assertEqual(state.cashGiven, 0);
  assertEqual(state.orders.length, 1);
  assertEqual(state.orders[0].total, 8.4);
  assertEqual(state.orders[0].cashGiven, 20.0);
  assertEqual(state.orders[0].changeDue, 11.6);
  assertEqual(state.orders[0].paymentMethod, 'cash');

  // TWINT checkout ignores leftover cashGiven
  addToCart(prod); // 4.20
  completeCheckout('twint');
  assertEqual(state.orders.length, 2);
  assertEqual(state.orders[0].paymentMethod, 'twint');
  assertEqual(state.orders[0].total, 4.2);
  assertEqual(state.orders[0].changeDue, 0);

  // Cancel latest order
  const latestId = state.orders[0].id;
  cancelOrder(latestId);
  assertEqual(state.orders.length, 1);
});

// 5. LocalStorage Persistence
test('saveState and loadState persist and sanitize state, and handle corrupt JSON gracefully', () => {
  resetTestState();
  state.bistroName = 'Gartentropfen';
  state.categories = ['Warmes', 'Kaltes', 'Warmes', FALLBACK_CATEGORY];
  saveState();

  state.bistroName = 'Other';
  state.categories = [];
  loadState();

  assertEqual(state.bistroName, 'Gartentropfen');
  // Deduplicated and FALLBACK_CATEGORY stripped from custom category list
  assertEqual(JSON.stringify(state.categories), JSON.stringify(['Warmes', 'Kaltes']));

  // Corrupt JSON does not throw
  localStorage.setItem(STORAGE_KEY, '{not-valid-json');
  loadState();
  assertEqual(state.bistroName, 'Gartentropfen');
});

// 6. Static Assets & Service Worker Cache Consistency
test('index.html, sw.js, and manifest.json have matching cache-busting versions and valid syntax', () => {
  const indexHtml = readProjectFile('index.html');
  const swJs = readProjectFile('sw.js');
  const manifestJson = readProjectFile('manifest.json');

  // Validate manifest.json parses cleanly
  const manifest = JSON.parse(manifestJson);
  assert(Boolean(manifest.name && manifest.icons && manifest.icons.length > 0), 'manifest.json must have name and icons');

  // Extract ?v=X from index.html
  const cssMatch = indexHtml.match(/href="(styles\.css\?v=(\d+))"/);
  const jsMatch = indexHtml.match(/src="(app\.js\?v=(\d+))"/);
  assert(Boolean(cssMatch), 'index.html must reference styles.css?v=N');
  assert(Boolean(jsMatch), 'index.html must reference app.js?v=N');
  assertEqual(cssMatch[2], jsMatch[2], 'styles.css and app.js version numbers in index.html must match');

  const version = cssMatch[2];
  assert(swJs.includes(`gartenbistro-kasse-v${version}`), `sw.js CACHE_NAME must match v${version}`);
  assert(swJs.includes(`./styles.css?v=${version}`), `sw.js ASSETS must include ./styles.css?v=${version}`);
  assert(swJs.includes(`./app.js?v=${version}`), `sw.js ASSETS must include ./app.js?v=${version}`);
});

printLine(`\nResults: ${passed} passed, ${failed} failed.\n`);
if (failed > 0) {
  exitWithCode(1);
}
