const STORAGE_KEY = 'gartenbistro_kasse_state_v1';
const FALLBACK_CATEGORY = 'Weitere Artikel';

const COLOR_THEMES = [
  { id: 'theme-green', label: 'Gartengrün' },
  { id: 'theme-amber', label: 'Sonnengelb' },
  { id: 'theme-rose', label: 'Beerenrosa' },
  { id: 'theme-blue', label: 'Himmelblau' },
  { id: 'theme-terracotta', label: 'Terracotta' },
  { id: 'theme-teal', label: 'Minze' },
  { id: 'theme-purple', label: 'Lavendel' },
  { id: 'theme-slate', label: 'Stein' }
];

const QUICK_EMOJIS = [
  '☕', '🫖', '🥐', '🍰', '🧁', '🥧', '🍦', '🍓',
  '🥤', '🧃', '🍋', '🍺', '🍷', '🥂', '🥪', '🥗',
  '🍲', '🧀', '🥨', '🥖', '🌭', '🍕', '🌻', '🌿'
];

const DEFAULT_CATEGORIES = [
  'Kaffee & Warmes',
  'Kaltgetränke',
  'Kuchen & Süsses',
  'Herzhaftes'
];

const DEFAULT_PRODUCTS = [
  { id: 'p1', name: 'Kaffee / Espresso', price: 4.20, category: 'Kaffee & Warmes', emoji: '☕', color: 'theme-amber', active: true },
  { id: 'p2', name: 'Cappuccino / Latte', price: 4.80, category: 'Kaffee & Warmes', emoji: '☕', color: 'theme-amber', active: true },
  { id: 'p3', name: 'Bio-Tee (Krug)', price: 4.50, category: 'Kaffee & Warmes', emoji: '🫖', color: 'theme-amber', active: true },
  { id: 'p4', name: 'Hausgemachter Eistee', price: 4.50, category: 'Kaltgetränke', emoji: '🍋', color: 'theme-teal', active: true },
  { id: 'p5', name: 'Apfelschorle / Citro', price: 4.50, category: 'Kaltgetränke', emoji: '🥤', color: 'theme-blue', active: true },
  { id: 'p6', name: 'Mineralwasser (3 dl)', price: 3.50, category: 'Kaltgetränke', emoji: '🥤', color: 'theme-blue', active: true },
  { id: 'p7', name: 'Bier lokal (3.3 dl)', price: 5.50, category: 'Kaltgetränke', emoji: '🍺', color: 'theme-green', active: true },
  { id: 'p8', name: 'Weisswein / Rosé (1 dl)', price: 6.00, category: 'Kaltgetränke', emoji: '🍷', color: 'theme-purple', active: true },
  { id: 'p9', name: 'Hausgemachter Kuchen', price: 5.50, category: 'Kuchen & Süsses', emoji: '🍰', color: 'theme-rose', active: true },
  { id: 'p10', name: 'Gipfeli / Brioche', price: 3.50, category: 'Kuchen & Süsses', emoji: '🥐', color: 'theme-rose', active: true },
  { id: 'p11', name: 'Glace im Becher', price: 4.00, category: 'Kuchen & Süsses', emoji: '🍦', color: 'theme-rose', active: true },
  { id: 'p12', name: 'Frische Wähe / Quiche', price: 8.50, category: 'Herzhaftes', emoji: '🥧', color: 'theme-terracotta', active: true },
  { id: 'p13', name: 'Gartensalat mit Brot', price: 9.50, category: 'Herzhaftes', emoji: '🥗', color: 'theme-green', active: true },
  { id: 'p14', name: 'Tagessuppe mit Brot', price: 9.00, category: 'Herzhaftes', emoji: '🍲', color: 'theme-terracotta', active: true },
  { id: 'p15', name: 'Focaccia / Sandwich', price: 8.00, category: 'Herzhaftes', emoji: '🥪', color: 'theme-terracotta', active: true }
];

// Application State
let state = {
  bistroName: 'Gartenbistro',
  categories: [...DEFAULT_CATEGORIES],
  products: structuredClone(DEFAULT_PRODUCTS),
  orders: [],
  activeView: 'pos',
  posCategory: 'ALL',
  editorCategory: 'ALL',
  reorderMode: false,
  cart: [], // Array of { id, name, price, category, emoji, qty }
  cashGiven: 0,
  selectedColor: 'theme-green'
};

// Format number as CHF
function formatCHF(value) {
  const num = Number(value) || 0;
  return `CHF ${num.toFixed(2)}`;
}

// Round to Swiss 5 Rappen (0.05)
function roundRappen(value) {
  return Math.round((Number(value) || 0) * 20) / 20;
}

// Return effective category name for a product
function getEffectiveCategory(prod) {
  if (prod && state.categories.includes(prod.category)) {
    return prod.category;
  }
  return FALLBACK_CATEGORY;
}

// Group an array of products into ordered category sections
function groupProductsByCategory(productsList, includeEmptyCategories = false) {
  const groups = [];

  state.categories.forEach((cat) => {
    const items = productsList.filter((p) => getEffectiveCategory(p) === cat);
    if (items.length > 0 || includeEmptyCategories) {
      groups.push({ category: cat, items });
    }
  });

  // Any products whose category is not in state.categories
  const uncategorized = productsList.filter((p) => getEffectiveCategory(p) === FALLBACK_CATEGORY);
  if (uncategorized.length > 0) {
    groups.push({ category: FALLBACK_CATEGORY, items: uncategorized });
  }

  return groups;
}

// Sanitize a product object
function sanitizeProduct(raw, idx = 0) {
  const validColors = new Set(COLOR_THEMES.map((t) => t.id));
  const rawPrice = Number(raw?.price);
  return {
    id: String(raw?.id || `p_${Date.now()}_${idx}`),
    name: String(raw?.name || 'Artikel').trim() || 'Artikel',
    price: Number.isFinite(rawPrice) && rawPrice >= 0 ? roundRappen(rawPrice) : 0,
    category: String(raw?.category || DEFAULT_CATEGORIES[0]).trim(),
    emoji: String(raw?.emoji || '🌿').trim() || '🌿',
    color: validColors.has(raw?.color) ? raw.color : 'theme-green',
    active: raw?.active !== false
  };
}

// Sync cart items with current product catalog (keep custom_* items intact)
function syncCartWithCatalog() {
  const prodMap = new Map(state.products.map((p) => [p.id, p]));
  state.cart = state.cart.filter((item) => {
    if (String(item.id).startsWith('custom_')) return true;
    const prod = prodMap.get(item.id);
    if (!prod || prod.active === false) return false;
    item.name = prod.name;
    item.price = roundRappen(prod.price);
    item.category = prod.category || 'Diverses';
    item.emoji = prod.emoji || '🌿';
    return true;
  });
  if (state.cart.length === 0) {
    state.cashGiven = 0;
  }
}

// Load & Save State
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed.bistroName && typeof parsed.bistroName === 'string') {
      state.bistroName = parsed.bistroName.trim() || 'Gartenbistro';
    }
    if (Array.isArray(parsed.categories)) {
      const cleanCats = parsed.categories
        .map((c) => String(c || '').trim())
        .filter((c) => c && c !== FALLBACK_CATEGORY);
      if (cleanCats.length > 0) {
        state.categories = Array.from(new Set(cleanCats));
      }
    }
    if (Array.isArray(parsed.products)) {
      state.products = parsed.products.map((p, idx) => sanitizeProduct(p, idx));
    }
    if (Array.isArray(parsed.orders)) {
      state.orders = parsed.orders;
    }
  } catch (err) {
    console.error('Fehler beim Laden des Speichers:', err);
  }
}

function saveState() {
  try {
    const payload = {
      bistroName: state.bistroName,
      categories: state.categories,
      products: state.products,
      orders: state.orders
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.error('Fehler beim Speichern:', err);
  }
}

// Toast helper
function showToast(message) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 2600);
}

// Escape HTML
function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Update Header & Navigation
function renderHeader() {
  document.getElementById('bistro-title').textContent = state.bistroName;
  const now = new Date();
  const dateStr = now.toLocaleDateString('de-CH', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  document.getElementById('current-date-display').textContent = `Kasse • ${dateStr}`;

  const totalRevenue = roundRappen(state.orders.reduce((sum, o) => sum + o.total, 0));
  document.getElementById('nav-stats-badge').textContent = formatCHF(totalRevenue);
}

// Switch active view
function switchView(viewName) {
  state.activeView = viewName;
  setMobileCartOpen(false);
  document.querySelectorAll('.nav-tab').forEach((tab) => {
    const isMatch = tab.dataset.view === viewName;
    tab.classList.toggle('active', isMatch);
    tab.setAttribute('aria-selected', isMatch ? 'true' : 'false');
  });

  document.querySelectorAll('.view').forEach((v) => {
    v.classList.toggle('active', v.id === `view-${viewName}`);
  });

  if (viewName === 'pos') {
    renderPOS();
  } else if (viewName === 'stats') {
    renderStats();
  } else if (viewName === 'menu') {
    renderMenuEditor();
  }
}

// ==========================================
// VIEW 1: POS / KASSE
// ==========================================

function renderPOS() {
  renderPOSCategories();
  renderPOSProducts();
  renderCart();
}

function renderPOSCategories() {
  const bar = document.getElementById('pos-category-bar');
  const activeProducts = state.products.filter((p) => p.active !== false);

  // Reset filter if selected category has no active products
  if (
    state.posCategory !== 'ALL' &&
    !activeProducts.some((p) => getEffectiveCategory(p) === state.posCategory)
  ) {
    state.posCategory = 'ALL';
  }

  let html = `
    <button type="button" class="cat-pill ${state.posCategory === 'ALL' ? 'active' : ''}" data-cat="ALL">
      <span>Alle</span>
      <span class="cat-count">${activeProducts.length}</span>
    </button>
  `;

  state.categories.forEach((cat) => {
    const count = activeProducts.filter((p) => getEffectiveCategory(p) === cat).length;
    if (count === 0) return;
    const isActive = state.posCategory === cat;
    html += `
      <button type="button" class="cat-pill ${isActive ? 'active' : ''}" data-cat="${escapeHtml(cat)}">
        <span>${escapeHtml(cat)}</span>
        <span class="cat-count">${count}</span>
      </button>
    `;
  });

  const fallbackCount = activeProducts.filter((p) => getEffectiveCategory(p) === FALLBACK_CATEGORY).length;
  if (fallbackCount > 0) {
    const isActive = state.posCategory === FALLBACK_CATEGORY;
    html += `
      <button type="button" class="cat-pill ${isActive ? 'active' : ''}" data-cat="${escapeHtml(FALLBACK_CATEGORY)}">
        <span>${escapeHtml(FALLBACK_CATEGORY)}</span>
        <span class="cat-count">${fallbackCount}</span>
      </button>
    `;
  }

  bar.innerHTML = html;
}

function renderProductTileHtml(prod, cartMap) {
  const qtyInCart = cartMap.get(prod.id) || 0;
  const colorClass = prod.color || 'theme-green';
  return `
    <button type="button" class="product-tile ${escapeHtml(colorClass)}" data-prod-id="${escapeHtml(prod.id)}">
      <div class="product-tile-top">
        <span class="product-emoji">${escapeHtml(prod.emoji || '🌿')}</span>
        ${qtyInCart > 0 ? `<span class="product-qty-badge">${qtyInCart}</span>` : ''}
      </div>
      <div class="product-tile-bottom">
        <div class="product-name">${escapeHtml(prod.name)}</div>
        <div class="product-price">${formatCHF(prod.price)}</div>
      </div>
    </button>
  `;
}

function renderPOSProducts() {
  const container = document.getElementById('pos-catalog-container');
  const activeProducts = state.products.filter((p) => p.active !== false);
  const filtered = state.posCategory === 'ALL'
    ? activeProducts
    : activeProducts.filter((p) => getEffectiveCategory(p) === state.posCategory);

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-icon">🌱</div>
        <p>Keine aktiven Artikel in dieser Kategorie.</p>
      </div>
    `;
    return;
  }

  const cartMap = new Map(state.cart.map((c) => [c.id, c.qty]));

  if (state.posCategory === 'ALL') {
    const groups = groupProductsByCategory(filtered, false);
    container.innerHTML = groups.map((group) => `
      <section class="pos-category-section">
        <div class="pos-category-header">
          <span class="pos-category-title">${escapeHtml(group.category)}</span>
          <span class="pos-category-line"></span>
        </div>
        <div class="product-grid">
          ${group.items.map((prod) => renderProductTileHtml(prod, cartMap)).join('')}
        </div>
      </section>
    `).join('');
  } else {
    container.innerHTML = `
      <section class="pos-category-section">
        <div class="pos-category-header">
          <span class="pos-category-title">${escapeHtml(state.posCategory)}</span>
          <span class="pos-category-line"></span>
        </div>
        <div class="product-grid">
          ${filtered.map((prod) => renderProductTileHtml(prod, cartMap)).join('')}
        </div>
      </section>
    `;
  }
}

function addToCart(product) {
  const existing = state.cart.find((item) => item.id === product.id);
  if (existing) {
    existing.name = product.name;
    existing.price = roundRappen(product.price);
    existing.category = product.category || 'Diverses';
    existing.emoji = product.emoji || '🌿';
    existing.qty += 1;
  } else {
    state.cart.push({
      id: product.id,
      name: product.name,
      price: roundRappen(product.price),
      category: product.category || 'Diverses',
      emoji: product.emoji || '🌿',
      qty: 1
    });
  }
  renderPOSProducts();
  renderCart();
}

function updateCartItemQty(id, delta) {
  const idx = state.cart.findIndex((item) => item.id === id);
  if (idx === -1) return;
  state.cart[idx].qty += delta;
  if (state.cart[idx].qty <= 0) {
    state.cart.splice(idx, 1);
  }
  if (state.cart.length === 0) {
    state.cashGiven = 0;
  }
  renderPOSProducts();
  renderCart();
}

function setMobileCartOpen(isOpen) {
  const panel = document.getElementById('pos-cart-panel');
  const backdrop = document.getElementById('mobile-cart-backdrop');
  if (!panel || !backdrop) return;
  panel.classList.remove('sheet-dragging');
  panel.style.transform = '';
  backdrop.style.opacity = '';
  panel.classList.toggle('mobile-open', Boolean(isOpen));
  backdrop.classList.toggle('hidden', !isOpen);
}

function initMobileSheetSwipe() {
  const panel = document.getElementById('pos-cart-panel');
  const backdrop = document.getElementById('mobile-cart-backdrop');
  const dock = document.getElementById('mobile-bottom-dock');
  const cartItemsEl = document.getElementById('cart-items-list');
  if (!panel || !backdrop) return;

  let swipeState = null;

  function startSwipe(clientX, clientY, target) {
    if (window.innerWidth > 720 || !panel.classList.contains('mobile-open')) return false;
    const handle = target.closest('#cart-sheet-handle');
    const inItems = target.closest('#cart-items-list');
    const interactiveControl = target.closest('.qty-btn, .cash-btn, .btn-checkout, .btn-clear-cart, .btn-close-mobile-cart, .btn-reset-cash, .btn-undo-last');

    // Don't hijack taps on interactive buttons unless it's the drag handle
    if (interactiveControl && !handle) return false;

    const now = performance.now();
    swipeState = {
      startX: clientX,
      startY: clientY,
      lastY: clientY,
      prevY: clientY,
      lastTime: now,
      prevTime: now,
      hasMoved: false,
      aborted: false,
      startedOnHandle: Boolean(handle),
      startedInItems: Boolean(inItems),
      sheetHeight: panel.offsetHeight || 400
    };
    return true;
  }

  function moveSwipe(clientX, clientY, originalEvent) {
    if (!swipeState || swipeState.aborted) return;
    const rawDeltaY = clientY - swipeState.startY;
    const rawDeltaX = clientX - swipeState.startX;

    if (!swipeState.hasMoved) {
      if (Math.abs(rawDeltaY) < 6 && Math.abs(rawDeltaX) < 6) return;

      // If horizontal movement dominates, abort sheet swipe
      if (Math.abs(rawDeltaX) > Math.abs(rawDeltaY) * 1.2) {
        swipeState.aborted = true;
        return;
      }

      // If started inside the scrollable cart items list, only drag sheet when at top and pulling down
      if (swipeState.startedInItems) {
        const atTop = !cartItemsEl || cartItemsEl.scrollTop <= 2;
        if (!atTop || rawDeltaY <= 0) {
          swipeState.aborted = true;
          return;
        }
      }

      swipeState.hasMoved = true;
      panel.classList.add('sheet-dragging');
    }

    if (swipeState.hasMoved) {
      if (originalEvent.cancelable) {
        originalEvent.preventDefault();
      }
      swipeState.prevY = swipeState.lastY;
      swipeState.prevTime = swipeState.lastTime;
      swipeState.lastY = clientY;
      swipeState.lastTime = performance.now();

      const translateY = rawDeltaY >= 0 ? rawDeltaY : rawDeltaY * 0.15;
      panel.style.transform = `translateY(${translateY}px)`;
      const progress = Math.min(1, Math.max(0, rawDeltaY / swipeState.sheetHeight));
      backdrop.style.opacity = String(1 - progress * 0.85);
    }
  }

  function endSwipe(endClientY) {
    if (!swipeState) return;
    const { startY, lastY, prevY, lastTime, prevTime, hasMoved, aborted, startedOnHandle, sheetHeight } = swipeState;
    swipeState = null;

    panel.classList.remove('sheet-dragging');
    panel.style.transform = '';
    backdrop.style.opacity = '';

    if (aborted) return;

    if (!hasMoved) {
      if (startedOnHandle) {
        setMobileCartOpen(false);
      }
      return;
    }

    const finalY = typeof endClientY === 'number' ? endClientY : lastY;
    const totalDeltaY = finalY - startY;
    const dt = Math.max(1, lastTime - prevTime);
    const velocity = (lastY - prevY) / dt; // px per ms

    if (totalDeltaY > 55 || totalDeltaY > sheetHeight * 0.18 || (totalDeltaY > 18 && velocity > 0.28)) {
      setMobileCartOpen(false);
    } else {
      setMobileCartOpen(true);
    }
  }

  // Touch events for mobile phones / tablets
  panel.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    startSwipe(t.clientX, t.clientY, e.target);
  }, { passive: true });

  panel.addEventListener('touchmove', (e) => {
    if (!swipeState || e.touches.length !== 1) return;
    const t = e.touches[0];
    moveSwipe(t.clientX, t.clientY, e);
  }, { passive: false });

  panel.addEventListener('touchend', (e) => {
    const t = e.changedTouches?.[0];
    endSwipe(t ? t.clientY : undefined);
  });

  panel.addEventListener('touchcancel', () => {
    endSwipe(undefined);
  });

  // Mouse fallback for testing on desktop responsive view
  panel.addEventListener('mousedown', (e) => {
    if (!startSwipe(e.clientX, e.clientY, e.target)) return;
    const onMouseMove = (ev) => moveSwipe(ev.clientX, ev.clientY, ev);
    const onMouseUp = (ev) => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      endSwipe(ev.clientY);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  });

  // Also allow swiping up on the bottom dock to open the sheet
  if (dock) {
    let dockStartY = null;
    dock.addEventListener('touchstart', (e) => {
      if (window.innerWidth > 720 || e.touches.length !== 1) return;
      dockStartY = e.touches[0].clientY;
    }, { passive: true });
    dock.addEventListener('touchmove', (e) => {
      if (dockStartY === null || e.touches.length !== 1) return;
      if (dockStartY - e.touches[0].clientY > 24) {
        dockStartY = null;
        if (e.cancelable) e.preventDefault();
        setMobileCartOpen(true);
      }
    }, { passive: false });
    dock.addEventListener('touchend', () => {
      dockStartY = null;
    });
  }
}

function clearCart() {
  state.cart = [];
  state.cashGiven = 0;
  setMobileCartOpen(false);
  renderPOSProducts();
  renderCart();
}

function getCartTotal() {
  return roundRappen(state.cart.reduce((sum, item) => sum + item.price * item.qty, 0));
}

function renderCart() {
  const listEl = document.getElementById('cart-items-list');
  const countEl = document.getElementById('cart-item-count');
  const totalEl = document.getElementById('cart-total-amount');
  const clearBtn = document.getElementById('btn-clear-cart');
  const payCashBtn = document.getElementById('btn-pay-cash');
  const payTwintBtn = document.getElementById('btn-pay-twint');
  const lastBanner = document.getElementById('last-order-banner');
  const lastSummary = document.getElementById('last-order-summary');

  // Mobile Dock Elements
  const mobBadge = document.getElementById('mobile-cart-badge');
  const mobTotal = document.getElementById('mobile-cart-total');
  const mobHint = document.getElementById('mobile-cart-hint');
  const mobPayCash = document.getElementById('btn-mobile-pay-cash');
  const mobPayTwint = document.getElementById('btn-mobile-pay-twint');
  const mobUndoBanner = document.getElementById('mobile-undo-banner');
  const mobUndoSummary = document.getElementById('mobile-undo-summary');

  const totalItems = state.cart.reduce((sum, item) => sum + item.qty, 0);
  const totalAmount = getCartTotal();

  countEl.textContent = `${totalItems} Artikel`;
  totalEl.textContent = formatCHF(totalAmount);

  const isEmpty = state.cart.length === 0;
  clearBtn.disabled = isEmpty;
  payCashBtn.disabled = isEmpty;
  payTwintBtn.disabled = isEmpty;

  if (mobBadge) mobBadge.textContent = String(totalItems);
  if (mobTotal) mobTotal.textContent = formatCHF(totalAmount);
  if (mobHint) {
    mobHint.textContent = isEmpty
      ? 'Artikel antippen zum Starten'
      : 'Warenkorb & Rückgeld ▲';
  }
  if (mobPayCash) mobPayCash.disabled = isEmpty;
  if (mobPayTwint) mobPayTwint.disabled = isEmpty;

  // Show Undo banner if cart is empty and there is at least 1 order
  if (isEmpty && state.orders.length > 0) {
    const latest = state.orders[0];
    const timeStr = new Date(latest.timestamp).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' });
    const methodLabel = latest.paymentMethod === 'twint' ? 'TWINT' : 'Bar';
    const summaryText = `${formatCHF(latest.total)} (${methodLabel}, ${timeStr})`;
    lastSummary.textContent = summaryText;
    lastBanner.classList.remove('hidden');
    if (mobUndoSummary) mobUndoSummary.textContent = `Letzte: ${summaryText}`;
    if (mobUndoBanner) mobUndoBanner.classList.remove('hidden');
  } else {
    lastBanner.classList.add('hidden');
    if (mobUndoBanner) mobUndoBanner.classList.add('hidden');
  }

  if (isEmpty) {
    listEl.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-icon">🧺</div>
        <p>Tippe links auf die Artikel,<br/>um eine Bestellung aufzunehmen.</p>
      </div>
    `;
  } else {
    listEl.innerHTML = state.cart.map((item) => {
      const lineTotal = roundRappen(item.price * item.qty);
      return `
        <div class="cart-row">
          <div class="cart-row-info">
            <div class="cart-row-title">${escapeHtml(item.emoji)} ${escapeHtml(item.name)}</div>
            <div class="cart-row-unit">${formatCHF(item.price)} / Stk.</div>
          </div>
          <div class="cart-row-controls">
            <button type="button" class="qty-btn" data-cart-action="dec" data-id="${escapeHtml(item.id)}" aria-label="Weniger">−</button>
            <span class="cart-row-qty">${item.qty}</span>
            <button type="button" class="qty-btn" data-cart-action="inc" data-id="${escapeHtml(item.id)}" aria-label="Mehr">＋</button>
          </div>
          <div class="cart-row-total">${formatCHF(lineTotal)}</div>
        </div>
      `;
    }).join('');
  }

  renderChangeCalculator(totalAmount);
}

function renderChangeCalculator(totalAmount) {
  const resultBox = document.getElementById('change-result-box');
  const resetCashBtn = document.getElementById('btn-reset-cash');
  const givenDisplay = document.getElementById('cash-given-display');
  const dueDisplay = document.getElementById('change-due-display');
  const dueLabel = document.getElementById('change-due-label');
  const highlightRow = dueDisplay.closest('.change-row');

  if (state.cashGiven <= 0 || totalAmount <= 0) {
    resultBox.classList.add('hidden');
    resetCashBtn.classList.add('hidden');
    return;
  }

  resultBox.classList.remove('hidden');
  resetCashBtn.classList.remove('hidden');
  givenDisplay.textContent = formatCHF(state.cashGiven);

  const diff = roundRappen(state.cashGiven - totalAmount);
  if (diff >= 0) {
    dueLabel.textContent = 'Rückgeld:';
    dueDisplay.textContent = formatCHF(diff);
    highlightRow.classList.remove('insufficient');
  } else {
    dueLabel.textContent = 'Es fehlen noch:';
    dueDisplay.textContent = formatCHF(Math.abs(diff));
    highlightRow.classList.add('insufficient');
  }
}

function completeCheckout(paymentMethod) {
  if (state.cart.length === 0) return;
  const total = getCartTotal();
  const order = {
    id: 'ord_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    timestamp: new Date().toISOString(),
    paymentMethod, // 'cash' or 'twint'
    total,
    cashGiven: paymentMethod === 'cash' && state.cashGiven >= total ? state.cashGiven : total,
    changeDue: paymentMethod === 'cash' && state.cashGiven > total ? roundRappen(state.cashGiven - total) : 0,
    items: structuredClone(state.cart)
  };

  state.orders.unshift(order);
  state.cart = [];
  state.cashGiven = 0;
  setMobileCartOpen(false);
  saveState();
  renderHeader();
  renderPOS();

  const methodText = paymentMethod === 'twint' ? 'TWINT / Karte' : 'Bar';
  if (order.changeDue > 0) {
    showToast(`✓ ${formatCHF(total)} (${methodText}) verbucht • Rückgeld: ${formatCHF(order.changeDue)}`);
  } else {
    showToast(`✓ Bestellung über ${formatCHF(total)} (${methodText}) verbucht`);
  }
}

// ==========================================
// VIEW 2: DAILY STATS & HISTORY
// ==========================================

function renderStats() {
  const totalRev = roundRappen(state.orders.reduce((s, o) => s + o.total, 0));
  const cashOrders = state.orders.filter((o) => o.paymentMethod === 'cash');
  const twintOrders = state.orders.filter((o) => o.paymentMethod === 'twint');
  const cashRev = roundRappen(cashOrders.reduce((s, o) => s + o.total, 0));
  const twintRev = roundRappen(twintOrders.reduce((s, o) => s + o.total, 0));

  let totalItemsSold = 0;
  const itemStatsMap = new Map();

  state.orders.forEach((order) => {
    order.items.forEach((item) => {
      totalItemsSold += item.qty;
      const key = `${item.name}||${item.category}`;
      const current = itemStatsMap.get(key) || {
        name: item.name,
        emoji: item.emoji || '🌿',
        category: item.category || 'Diverses',
        qty: 0,
        revenue: 0
      };
      current.qty += item.qty;
      current.revenue = roundRappen(current.revenue + item.price * item.qty);
      itemStatsMap.set(key, current);
    });
  });

  const avgOrder = state.orders.length > 0 ? roundRappen(totalRev / state.orders.length) : 0;

  document.getElementById('stat-total-revenue').textContent = formatCHF(totalRev);
  document.getElementById('stat-total-orders').textContent = `${state.orders.length} Bestellungen`;
  document.getElementById('stat-cash-revenue').textContent = formatCHF(cashRev);
  document.getElementById('stat-cash-orders').textContent = `${cashOrders.length} Bar-Zahlungen`;
  document.getElementById('stat-twint-revenue').textContent = formatCHF(twintRev);
  document.getElementById('stat-twint-orders').textContent = `${twintOrders.length} TWINT/Karten-Zahlungen`;
  document.getElementById('stat-total-items').textContent = `${totalItemsSold} Stk.`;
  document.getElementById('stat-avg-order').textContent = `Ø ${formatCHF(avgOrder)} pro Bestellung`;

  // Render Sold Items Breakdown
  const sortedItems = Array.from(itemStatsMap.values()).sort((a, b) => b.revenue - a.revenue);
  document.getElementById('sold-items-unique-count').textContent = `${sortedItems.length} Produkte`;

  const itemsContainer = document.getElementById('stats-items-table-wrapper');
  if (sortedItems.length === 0) {
    itemsContainer.innerHTML = `
      <div class="cart-empty">
        <p>Noch keine Verkäufe erfasst.</p>
      </div>
    `;
  } else {
    const maxRev = Math.max(...sortedItems.map((i) => i.revenue), 1);
    itemsContainer.innerHTML = sortedItems.map((item) => {
      const pct = Math.max(4, Math.round((item.revenue / maxRev) * 100));
      return `
        <div class="sold-item-row">
          <div class="sold-item-top">
            <div class="sold-item-info">
              <span class="sold-item-name">${escapeHtml(item.emoji)} ${escapeHtml(item.name)}</span>
              <span class="sold-item-cat">${escapeHtml(item.category)}</span>
            </div>
            <div class="sold-item-numbers">
              <span class="sold-item-qty">${item.qty}×</span>
              <span class="sold-item-rev">${formatCHF(item.revenue)}</span>
            </div>
          </div>
          <div class="sold-bar-bg">
            <div class="sold-bar-fill" style="width: ${pct}%"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Render Order History
  const ordersContainer = document.getElementById('stats-orders-list');
  if (state.orders.length === 0) {
    ordersContainer.innerHTML = `
      <div class="cart-empty">
        <p>Noch keine Bestellungen vorhanden.</p>
      </div>
    `;
  } else {
    ordersContainer.innerHTML = state.orders.map((order) => {
      const timeStr = new Date(order.timestamp).toLocaleTimeString('de-CH', {
        hour: '2-digit',
        minute: '2-digit'
      });
      const isTwint = order.paymentMethod === 'twint';
      const summaryText = order.items.map((i) => `${i.qty}× ${i.name}`).join(', ');
      return `
        <div class="order-history-item">
          <div class="order-history-left">
            <div class="order-history-meta">
              <span class="order-time">${timeStr} Uhr</span>
              <span class="pay-badge ${isTwint ? 'twint' : 'cash'}">
                ${isTwint ? '📱 TWINT / Karte' : '💵 Bar'}
              </span>
            </div>
            <div class="order-items-text">${escapeHtml(summaryText)}</div>
          </div>
          <div class="order-history-right">
            <span class="order-total-val">${formatCHF(order.total)}</span>
            <button type="button" class="btn-cancel-order" data-cancel-order="${escapeHtml(order.id)}">
              Stornieren
            </button>
          </div>
        </div>
      `;
    }).join('');
  }
}

function cancelOrder(orderId) {
  const order = state.orders.find((o) => o.id === orderId);
  if (!order) return;
  const confirmCancel = window.confirm(
    `Bestellung über ${formatCHF(order.total)} wirklich stornieren?`
  );
  if (!confirmCancel) return;

  state.orders = state.orders.filter((o) => o.id !== orderId);
  saveState();
  renderHeader();
  if (state.activeView === 'stats') renderStats();
  if (state.activeView === 'pos') renderPOS();
  showToast('Bestellung wurde storniert');
}

function exportSalesCSV() {
  if (state.orders.length === 0) {
    showToast('Noch keine Verkäufe zum Exportieren vorhanden');
    return;
  }

  const lines = [
    ['Bestell-ID', 'Datum', 'Uhrzeit', 'Zahlungsart', 'Artikel', 'Kategorie', 'Anzahl', 'Einzelpreis CHF', 'Zeilentotal CHF']
  ];

  state.orders.slice().reverse().forEach((order) => {
    const dt = new Date(order.timestamp);
    const dateStr = dt.toLocaleDateString('de-CH');
    const timeStr = dt.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const payLabel = order.paymentMethod === 'twint' ? 'TWINT / Karte' : 'Bar';

    order.items.forEach((item) => {
      const unitPrice = Number(item.price) || 0;
      const qty = Number(item.qty) || 1;
      lines.push([
        order.id,
        dateStr,
        timeStr,
        payLabel,
        item.name,
        item.category || '',
        String(qty),
        unitPrice.toFixed(2),
        roundRappen(unitPrice * qty).toFixed(2)
      ]);
    });
  });

  const csvContent = '\uFEFF' + lines.map((row) =>
    row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';')
  ).join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const todayIso = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `gartenbistro-umsatz-${todayIso}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast('CSV-Datei wurde heruntergeladen');
}

function resetDailySales() {
  if (state.orders.length === 0) {
    showToast('Der Tagesumsatz ist bereits leer');
    return;
  }
  const totalRev = roundRappen(state.orders.reduce((s, o) => s + o.total, 0));
  const ok = window.confirm(
    `Tag abschliessen und alle ${state.orders.length} Bestellungen (${formatCHF(totalRev)}) zurücksetzen?\n\nDas Sortiment bleibt selbstverständlich erhalten.`
  );
  if (!ok) return;

  state.orders = [];
  saveState();
  renderHeader();
  renderStats();
  showToast('Tagesumsatz wurde für den neuen Tag zurückgesetzt');
}

// ==========================================
// VIEW 3: MENU / SORTIMENT EDITOR
// ==========================================

function renderMenuEditor() {
  const fallbackProductsCount = state.products.filter((p) => getEffectiveCategory(p) === FALLBACK_CATEGORY).length;

  // Reset editorCategory if it was deleted or no longer valid
  if (
    state.editorCategory !== 'ALL' &&
    !state.categories.includes(state.editorCategory) &&
    !(state.editorCategory === FALLBACK_CATEGORY && fallbackProductsCount > 0)
  ) {
    state.editorCategory = 'ALL';
  }

  const catBar = document.getElementById('editor-category-bar');
  let catHtml = `
    <button type="button" class="cat-pill ${state.editorCategory === 'ALL' ? 'active' : ''}" data-editor-cat="ALL">
      <span>Alle Kategorien</span>
      <span class="cat-count">${state.products.length}</span>
    </button>
  `;
  state.categories.forEach((cat) => {
    const count = state.products.filter((p) => getEffectiveCategory(p) === cat).length;
    const isActive = state.editorCategory === cat;
    catHtml += `
      <button type="button" class="cat-pill ${isActive ? 'active' : ''}" data-editor-cat="${escapeHtml(cat)}">
        <span>${escapeHtml(cat)}</span>
        <span class="cat-count">${count}</span>
      </button>
    `;
  });
  if (fallbackProductsCount > 0) {
    const isActive = state.editorCategory === FALLBACK_CATEGORY;
    catHtml += `
      <button type="button" class="cat-pill ${isActive ? 'active' : ''}" data-editor-cat="${escapeHtml(FALLBACK_CATEGORY)}">
        <span>${escapeHtml(FALLBACK_CATEGORY)}</span>
        <span class="cat-count">${fallbackProductsCount}</span>
      </button>
    `;
  }
  catBar.innerHTML = catHtml;

  const listEl = document.getElementById('editor-product-list');
  const filteredProducts = state.editorCategory === 'ALL'
    ? state.products
    : state.products.filter((p) => getEffectiveCategory(p) === state.editorCategory);

  const groups = state.editorCategory === 'ALL'
    ? groupProductsByCategory(filteredProducts, false)
    : [{ category: state.editorCategory, items: filteredProducts }];

  if (groups.length === 0 || (groups.length === 1 && groups[0].items.length === 0)) {
    listEl.innerHTML = `
      <div class="editor-category-card">
        <div class="cart-empty">
          <div class="cart-empty-icon">🌱</div>
          <p>Noch keine Artikel in dieser Kategorie.<br/>Tippe oben rechts auf «＋ Neuer Artikel».</p>
        </div>
      </div>
    `;
    return;
  }

  const canDragCategories = state.editorCategory === 'ALL' && groups.length > 1;

  listEl.innerHTML = groups.map((group) => {
    const isFallbackGroup = group.category === FALLBACK_CATEGORY;
    const itemsHtml = group.items.map((prod) => {
      const isInactive = prod.active === false;

      return `
        <div class="editor-item-row ${isInactive ? 'inactive' : ''}" data-item-id="${escapeHtml(prod.id)}">
          <div class="editor-item-left">
            <button type="button" class="drag-handle" data-drag-handle="item" title="Ziehen zum Verschieben" aria-label="Artikel verschieben">⠿</button>
            <div class="editor-color-swatch ${escapeHtml(prod.color || 'theme-green')}">
              ${escapeHtml(prod.emoji || '🌿')}
            </div>
            <div class="editor-item-details">
              <div class="editor-item-name">${escapeHtml(prod.name)}</div>
              <div class="editor-item-sub">
                <span class="editor-item-price">${formatCHF(prod.price)}</span>
                ${isInactive ? '<span class="status-pill hidden-item">In der Kasse ausgeblendet</span>' : ''}
              </div>
            </div>
          </div>
          <div class="editor-item-actions">
            <button type="button" class="btn-row-action" data-toggle-active="${escapeHtml(prod.id)}" title="${isInactive ? 'Einblenden' : 'Ausblenden'}">
              ${isInactive ? '👁️ <span class="action-text-mobile-hide">Einblenden</span>' : '⏸ <span class="action-text-mobile-hide">Ausblenden</span>'}
            </button>
            <button type="button" class="btn-row-action btn-edit-primary" data-edit-prod="${escapeHtml(prod.id)}">
              ✏️ Bearbeiten
            </button>
          </div>
        </div>
      `;
    }).join('');

    const targetCategoryForAdd = state.categories.includes(group.category)
      ? group.category
      : (state.categories[0] || '');

    return `
      <section class="editor-category-card" data-category-card="${escapeHtml(group.category)}">
        <div class="editor-category-header">
          <div class="editor-category-title-group">
            ${canDragCategories && !isFallbackGroup ? '<button type="button" class="drag-handle" data-drag-handle="category-card" title="Kategorie ziehen zum Verschieben" aria-label="Kategorie verschieben">⠿</button>' : ''}
            <h3 class="editor-category-title">${escapeHtml(group.category)}</h3>
            <span class="badge-subtle">${group.items.length} Artikel</span>
          </div>
          <button type="button" class="btn-row-action" data-add-in-cat="${escapeHtml(targetCategoryForAdd)}">
            ＋ Artikel
          </button>
        </div>
        <div class="editor-rows-list" data-category-list="${escapeHtml(group.category)}">
          ${itemsHtml}
        </div>
      </section>
    `;
  }).join('');
}

// Touch + Mouse Drag-and-Drop for Items and Categories
function initDragAndDrop() {
  let dragState = null;

  function moveDrag(clientX, clientY, originalEvent) {
    if (!dragState) return;
    if (originalEvent.cancelable) {
      originalEvent.preventDefault();
    }

    const { ghost, dragEl, offsetY, offsetX, mode, scrollContainer } = dragState;
    ghost.style.top = `${clientY - offsetY}px`;
    ghost.style.left = `${clientX - offsetX}px`;

    // Auto-scroll if near top/bottom of scroll container
    if (scrollContainer) {
      const rect = scrollContainer.getBoundingClientRect();
      const threshold = 60;
      if (clientY < rect.top + threshold) {
        scrollContainer.scrollTop -= 10;
      } else if (clientY > rect.bottom - threshold) {
        scrollContainer.scrollTop += 10;
      }
    }

    const elemBelow = document.elementFromPoint(clientX, clientY);
    if (!elemBelow) return;

    if (mode === 'item') {
      const targetRow = elemBelow.closest('.editor-item-row');
      if (targetRow && targetRow !== dragEl) {
        const rect = targetRow.getBoundingClientRect();
        const isAfter = clientY > rect.top + rect.height / 2;
        targetRow.parentNode.insertBefore(dragEl, isAfter ? targetRow.nextSibling : targetRow);
        return;
      }
      const targetCard = elemBelow.closest('.editor-category-card');
      if (targetCard) {
        const list = targetCard.querySelector('.editor-rows-list');
        if (list && !list.contains(dragEl)) {
          list.appendChild(dragEl);
        }
      }
    } else if (mode === 'category-card') {
      const targetCard = elemBelow.closest('.editor-category-card');
      if (
        targetCard &&
        targetCard !== dragEl &&
        targetCard.dataset.categoryCard !== FALLBACK_CATEGORY
      ) {
        const rect = targetCard.getBoundingClientRect();
        const isAfter = clientY > rect.top + rect.height / 2;
        targetCard.parentNode.insertBefore(dragEl, isAfter ? targetCard.nextSibling : targetCard);
      }
    } else if (mode === 'category-modal') {
      const targetRow = elemBelow.closest('.category-manage-row');
      if (targetRow && targetRow !== dragEl) {
        const rect = targetRow.getBoundingClientRect();
        const isAfter = clientY > rect.top + rect.height / 2;
        targetRow.parentNode.insertBefore(dragEl, isAfter ? targetRow.nextSibling : targetRow);
      }
    }
  }

  function endDrag() {
    if (!dragState) return;
    const { ghost, dragEl, mode } = dragState;
    dragState = null;

    ghost.remove();
    dragEl.classList.remove('is-dragging-placeholder');
    document.body.classList.remove('is-dragging');

    if (mode === 'item') {
      commitItemOrderFromDOM();
    } else if (mode === 'category-card') {
      commitCategoryOrderFromCardsDOM();
    } else if (mode === 'category-modal') {
      commitCategoryOrderFromModalDOM();
    }
  }

  function beginDrag(clientX, clientY, target, originalEvent) {
    const handle = target.closest('[data-drag-handle]');
    if (!handle) return false;

    const mode = handle.dataset.dragHandle;
    let dragEl = null;
    let scrollContainer = null;

    if (mode === 'item') {
      dragEl = handle.closest('.editor-item-row');
      scrollContainer = document.querySelector('#view-menu .page-container');
    } else if (mode === 'category-card') {
      dragEl = handle.closest('.editor-category-card');
      scrollContainer = document.querySelector('#view-menu .page-container');
    } else if (mode === 'category-modal') {
      dragEl = handle.closest('.category-manage-row');
      scrollContainer = document.getElementById('categories-manage-list');
    }

    if (!dragEl) return false;
    if (originalEvent.cancelable) {
      originalEvent.preventDefault();
    }

    const rect = dragEl.getBoundingClientRect();
    const ghost = dragEl.cloneNode(true);
    ghost.classList.add('drag-ghost');
    ghost.style.width = `${rect.width}px`;
    ghost.style.height = `${rect.height}px`;
    ghost.style.top = `${rect.top}px`;
    ghost.style.left = `${rect.left}px`;
    document.body.appendChild(ghost);

    dragEl.classList.add('is-dragging-placeholder');
    document.body.classList.add('is-dragging');

    dragState = {
      mode,
      dragEl,
      ghost,
      scrollContainer,
      offsetX: clientX - rect.left,
      offsetY: clientY - rect.top
    };
    return true;
  }

  // Touch listeners (iOS / iPadOS / Android)
  document.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    beginDrag(t.clientX, t.clientY, e.target, e);
  }, { passive: false });

  document.addEventListener('touchmove', (e) => {
    if (!dragState || e.touches.length !== 1) return;
    const t = e.touches[0];
    moveDrag(t.clientX, t.clientY, e);
  }, { passive: false });

  document.addEventListener('touchend', () => {
    if (dragState) endDrag();
  });

  document.addEventListener('touchcancel', () => {
    if (dragState) endDrag();
  });

  // Mouse listeners (Desktop)
  document.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    if (!beginDrag(e.clientX, e.clientY, e.target, e)) return;
    const onMouseMove = (ev) => moveDrag(ev.clientX, ev.clientY, ev);
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      endDrag();
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  });
}

function commitItemOrderFromDOM() {
  const prodMap = new Map(state.products.map((p) => [p.id, p]));
  const container = document.getElementById('editor-product-list');

  if (state.editorCategory === 'ALL') {
    const nextProducts = [];
    container.querySelectorAll('.editor-category-card').forEach((card) => {
      const catName = card.dataset.categoryCard;
      card.querySelectorAll('.editor-item-row[data-item-id]').forEach((row) => {
        const prod = prodMap.get(row.dataset.itemId);
        if (prod) {
          if (catName && catName !== FALLBACK_CATEGORY && state.categories.includes(catName)) {
            prod.category = catName;
          }
          nextProducts.push(prod);
          prodMap.delete(prod.id);
        }
      });
    });
    // Append any remaining products just in case
    prodMap.forEach((prod) => nextProducts.push(prod));
    state.products = nextProducts;
  } else {
    // Reordered within a single filtered category view
    const orderedIds = Array.from(
      container.querySelectorAll('.editor-item-row[data-item-id]')
    ).map((r) => r.dataset.itemId);
    const orderedProds = orderedIds.map((id) => prodMap.get(id)).filter(Boolean);
    let ptr = 0;
    state.products = state.products.map((p) => {
      if (getEffectiveCategory(p) === state.editorCategory && ptr < orderedProds.length) {
        return orderedProds[ptr++];
      }
      return p;
    });
  }

  syncCartWithCatalog();
  saveState();
  renderMenuEditor();
  renderPOS();
}

function commitCategoryOrderFromCardsDOM() {
  const container = document.getElementById('editor-product-list');
  const domCats = Array.from(container.querySelectorAll('.editor-category-card[data-category-card]'))
    .map((c) => c.dataset.categoryCard)
    .filter((c) => c && c !== FALLBACK_CATEGORY && state.categories.includes(c));

  state.categories.forEach((cat) => {
    if (!domCats.includes(cat)) domCats.push(cat);
  });

  state.categories = domCats;
  saveState();
  renderMenuEditor();
  renderPOS();
}

function commitCategoryOrderFromModalDOM() {
  const container = document.getElementById('categories-manage-list');
  const domCats = Array.from(container.querySelectorAll('.category-manage-row[data-cat-row]'))
    .map((r) => r.dataset.catRow)
    .filter((c) => c && state.categories.includes(c));

  if (domCats.length === state.categories.length) {
    state.categories = domCats;
    saveState();
    renderCategoriesManageList();
    renderMenuEditor();
    renderPOS();
  }
}

function toggleProductActive(prodId) {
  const prod = state.products.find((p) => p.id === prodId);
  if (!prod) return;
  prod.active = prod.active === false ? true : false;
  syncCartWithCatalog();
  saveState();
  renderMenuEditor();
  renderPOS();
  showToast(prod.active ? `«${prod.name}» ist wieder in der Kasse sichtbar` : `«${prod.name}» wurde ausgeblendet`);
}

// Product Modal
function openProductModal(productId = null, prefillCategory = null) {
  const modal = document.getElementById('modal-product');
  const titleEl = document.getElementById('modal-product-title');
  const idInput = document.getElementById('prod-id');
  const nameInput = document.getElementById('prod-name');
  const priceInput = document.getElementById('prod-price');
  const catSelect = document.getElementById('prod-category');
  const emojiInput = document.getElementById('prod-emoji');
  const activeCheck = document.getElementById('prod-active');
  const deleteBtn = document.getElementById('btn-delete-product');

  // Populate category dropdown
  catSelect.innerHTML = state.categories.map((c) =>
    `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`
  ).join('');

  const existing = productId ? state.products.find((p) => p.id === productId) : null;

  if (existing) {
    titleEl.textContent = 'Artikel bearbeiten';
    idInput.value = existing.id;
    nameInput.value = existing.name;
    priceInput.value = Number(existing.price).toFixed(2);
    if (!state.categories.includes(existing.category) && existing.category) {
      catSelect.innerHTML += `<option value="${escapeHtml(existing.category)}">${escapeHtml(existing.category)}</option>`;
    }
    catSelect.value = existing.category || state.categories[0] || '';
    emojiInput.value = existing.emoji || '☕';
    activeCheck.checked = existing.active !== false;
    state.selectedColor = existing.color || 'theme-green';
    deleteBtn.classList.remove('hidden');
  } else {
    titleEl.textContent = 'Neuer Artikel';
    idInput.value = '';
    nameInput.value = '';
    priceInput.value = '';
    const candidateCat = prefillCategory || (state.editorCategory !== 'ALL' ? state.editorCategory : '');
    const defaultCat = state.categories.includes(candidateCat)
      ? candidateCat
      : (state.categories[0] || '');
    catSelect.value = defaultCat;
    emojiInput.value = '☕';
    activeCheck.checked = true;
    state.selectedColor = 'theme-green';
    deleteBtn.classList.add('hidden');
  }

  renderEmojiAndColorPickers();
  modal.classList.remove('hidden');
  setTimeout(() => nameInput.focus(), 50);
}

function renderEmojiAndColorPickers() {
  const currentEmoji = document.getElementById('prod-emoji').value.trim();
  const emojiList = document.getElementById('emoji-picker-list');
  emojiList.innerHTML = QUICK_EMOJIS.map((em) => `
    <button type="button" class="emoji-option ${currentEmoji === em ? 'selected' : ''}" data-pick-emoji="${em}">
      ${em}
    </button>
  `).join('');

  const colorList = document.getElementById('color-picker-list');
  colorList.innerHTML = COLOR_THEMES.map((theme) => `
    <button type="button" class="color-option ${theme.id} ${state.selectedColor === theme.id ? 'selected' : ''}" data-pick-color="${theme.id}">
      ${escapeHtml(theme.label)}
    </button>
  `).join('');
}

function saveProductFromModal(e) {
  e.preventDefault();
  const id = document.getElementById('prod-id').value;
  const name = document.getElementById('prod-name').value.trim();
  const price = roundRappen(parseFloat(document.getElementById('prod-price').value));
  const category = document.getElementById('prod-category').value;
  const emoji = document.getElementById('prod-emoji').value.trim() || '🌿';
  const active = document.getElementById('prod-active').checked;

  if (!name || isNaN(price) || price < 0) return;

  if (id) {
    const prod = state.products.find((p) => p.id === id);
    if (prod) {
      prod.name = name;
      prod.price = price;
      prod.category = category;
      prod.emoji = emoji;
      prod.color = state.selectedColor;
      prod.active = active;
    }
    syncCartWithCatalog();
    showToast(`«${name}» aktualisiert`);
  } else {
    state.products.push({
      id: 'p_' + Date.now(),
      name,
      price,
      category,
      emoji,
      color: state.selectedColor,
      active
    });
    showToast(`«${name}» zum Sortiment hinzugefügt`);
  }

  saveState();
  closeModal('modal-product');
  renderMenuEditor();
  renderPOS();
}

function deleteCurrentProduct() {
  const id = document.getElementById('prod-id').value;
  const prod = state.products.find((p) => p.id === id);
  if (!prod) return;

  if (!window.confirm(`Artikel «${prod.name}» wirklich aus dem Sortiment löschen?`)) return;

  state.products = state.products.filter((p) => p.id !== id);
  syncCartWithCatalog();
  saveState();
  closeModal('modal-product');
  renderMenuEditor();
  renderPOS();
  showToast(`«${prod.name}» gelöscht`);
}

// Categories Modal
function openCategoriesModal() {
  renderCategoriesManageList();
  document.getElementById('modal-categories').classList.remove('hidden');
}

function renderCategoriesManageList() {
  const container = document.getElementById('categories-manage-list');
  const isOnlyOne = state.categories.length <= 1;
  container.innerHTML = state.categories.map((cat) => {
    const count = state.products.filter((p) => p.category === cat).length;
    return `
      <div class="category-manage-row" data-cat-row="${escapeHtml(cat)}">
        <div class="editor-item-left">
          <button type="button" class="drag-handle" data-drag-handle="category-modal" title="Ziehen zum Verschieben" aria-label="Kategorie verschieben">⠿</button>
          <span class="category-manage-name">${escapeHtml(cat)} <small style="color: var(--text-muted)">(${count} Artikel)</small></span>
        </div>
        <div class="editor-item-actions">
          <button type="button" class="btn-cancel-order" data-delete-cat="${escapeHtml(cat)}" ${isOnlyOne ? 'disabled' : ''}>Löschen</button>
        </div>
      </div>
    `;
  }).join('');
}

function closeModal(modalId) {
  document.getElementById(modalId)?.classList.add('hidden');
}

// ==========================================
// EVENT LISTENERS & INITIALIZATION
// ==========================================

function initEvents() {
  // Top navigation tabs
  document.querySelectorAll('.nav-tab').forEach((tab) => {
    tab.addEventListener('click', () => switchView(tab.dataset.view));
  });

  // Edit Bistro Name
  document.getElementById('btn-edit-bistro-name').addEventListener('click', () => {
    const next = window.prompt('Name des Bistros ändern:', state.bistroName);
    if (next && next.trim()) {
      state.bistroName = next.trim();
      saveState();
      renderHeader();
    }
  });

  // POS Category Filter
  document.getElementById('pos-category-bar').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-cat]');
    if (!btn) return;
    state.posCategory = btn.dataset.cat;
    renderPOSCategories();
    renderPOSProducts();
  });

  // POS Product Click
  document.getElementById('pos-catalog-container').addEventListener('click', (e) => {
    const tile = e.target.closest('[data-prod-id]');
    if (!tile) return;
    const prod = state.products.find((p) => p.id === tile.dataset.prodId);
    if (prod) addToCart(prod);
  });

  // Cart item quantity buttons
  document.getElementById('cart-items-list').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-cart-action]');
    if (!btn) return;
    const id = btn.dataset.id;
    const delta = btn.dataset.cartAction === 'inc' ? 1 : -1;
    updateCartItemQty(id, delta);
  });

  // Clear Cart
  document.getElementById('btn-clear-cart').addEventListener('click', clearCart);

  // Undo Last Order Banner
  document.getElementById('btn-undo-last').addEventListener('click', () => {
    if (state.orders.length > 0) {
      cancelOrder(state.orders[0].id);
    }
  });

  // Change Calculator Quick Cash Buttons
  document.getElementById('cash-quick-buttons').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-cash]');
    if (!btn) return;
    const total = getCartTotal();
    if (total <= 0) {
      showToast('Wähle zuerst Artikel für die Bestellung aus');
      return;
    }
    const val = btn.dataset.cash;
    if (val === 'exact') {
      state.cashGiven = total;
    } else {
      state.cashGiven = roundRappen(state.cashGiven + parseFloat(val));
    }
    renderChangeCalculator(total);
  });

  document.getElementById('btn-reset-cash').addEventListener('click', () => {
    state.cashGiven = 0;
    renderChangeCalculator(getCartTotal());
  });

  // Checkout Buttons
  document.getElementById('btn-pay-cash').addEventListener('click', () => completeCheckout('cash'));
  document.getElementById('btn-pay-twint').addEventListener('click', () => completeCheckout('twint'));

  // Mobile Cart Sheet & Quick Pay
  document.getElementById('btn-open-mobile-cart')?.addEventListener('click', () => setMobileCartOpen(true));
  document.getElementById('btn-close-mobile-cart')?.addEventListener('click', () => setMobileCartOpen(false));
  document.getElementById('mobile-cart-backdrop')?.addEventListener('click', () => setMobileCartOpen(false));
  document.getElementById('btn-mobile-pay-cash')?.addEventListener('click', () => completeCheckout('cash'));
  document.getElementById('btn-mobile-pay-twint')?.addEventListener('click', () => completeCheckout('twint'));
  document.getElementById('btn-mobile-undo')?.addEventListener('click', () => {
    if (state.orders.length > 0) {
      cancelOrder(state.orders[0].id);
    }
  });

  // Custom Amount Modal
  document.getElementById('btn-open-custom-item').addEventListener('click', () => {
    document.getElementById('custom-item-price').value = '';
    document.getElementById('custom-item-name').value = '';
    document.getElementById('modal-custom-item').classList.remove('hidden');
    setTimeout(() => document.getElementById('custom-item-price').focus(), 50);
  });

  document.getElementById('custom-quick-prices').addEventListener('click', (e) => {
    const chip = e.target.closest('[data-add-price]');
    if (!chip) return;
    const priceInput = document.getElementById('custom-item-price');
    const current = parseFloat(priceInput.value) || 0;
    const next = roundRappen(current + parseFloat(chip.dataset.addPrice));
    priceInput.value = next.toFixed(2);
  });

  document.getElementById('form-custom-item').addEventListener('submit', (e) => {
    e.preventDefault();
    const price = roundRappen(parseFloat(document.getElementById('custom-item-price').value));
    const name = document.getElementById('custom-item-name').value.trim() || 'Freier Betrag';
    if (isNaN(price) || price <= 0) return;

    addToCart({
      id: 'custom_' + Date.now(),
      name,
      price,
      category: 'Diverses',
      emoji: '✨'
    });
    closeModal('modal-custom-item');
  });

  // Stats Actions
  document.getElementById('btn-export-csv').addEventListener('click', exportSalesCSV);
  document.getElementById('btn-print-report').addEventListener('click', () => window.print());
  document.getElementById('btn-reset-day').addEventListener('click', resetDailySales);

  document.getElementById('stats-orders-list').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-cancel-order]');
    if (!btn) return;
    cancelOrder(btn.dataset.cancelOrder);
  });

  // Menu Editor Actions
  document.getElementById('editor-category-bar').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-editor-cat]');
    if (!btn) return;
    state.editorCategory = btn.dataset.editorCat;
    renderMenuEditor();
  });

  document.getElementById('btn-add-product').addEventListener('click', () => openProductModal(null));

  document.getElementById('editor-product-list').addEventListener('click', (e) => {
    const editBtn = e.target.closest('[data-edit-prod]');
    if (editBtn) {
      openProductModal(editBtn.dataset.editProd);
      return;
    }
    const toggleBtn = e.target.closest('[data-toggle-active]');
    if (toggleBtn) {
      toggleProductActive(toggleBtn.dataset.toggleActive);
      return;
    }
    const addInCatBtn = e.target.closest('[data-add-in-cat]');
    if (addInCatBtn) {
      openProductModal(null, addInCatBtn.dataset.addInCat);
    }
  });

  // Product Modal Events
  document.getElementById('form-product').addEventListener('submit', saveProductFromModal);
  document.getElementById('btn-delete-product').addEventListener('click', deleteCurrentProduct);
  document.getElementById('prod-emoji').addEventListener('input', renderEmojiAndColorPickers);

  document.getElementById('emoji-picker-list').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-pick-emoji]');
    if (!btn) return;
    document.getElementById('prod-emoji').value = btn.dataset.pickEmoji;
    renderEmojiAndColorPickers();
  });

  document.getElementById('color-picker-list').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-pick-color]');
    if (!btn) return;
    state.selectedColor = btn.dataset.pickColor;
    renderEmojiAndColorPickers();
  });

  // Categories Modal Events
  document.getElementById('btn-manage-categories').addEventListener('click', openCategoriesModal);

  document.getElementById('form-add-category').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('new-category-name');
    const name = input.value.trim();
    if (!name) return;
    if (name === FALLBACK_CATEGORY || state.categories.some((c) => c.toLowerCase() === name.toLowerCase())) {
      showToast(`Kategorie «${name}» existiert bereits`);
      return;
    }
    state.categories.push(name);
    saveState();
    renderCategoriesManageList();
    renderMenuEditor();
    renderPOS();
    showToast(`Kategorie «${name}» hinzugefügt`);
    input.value = '';
  });

  document.getElementById('categories-manage-list').addEventListener('click', (e) => {
    const moveCatBtn = e.target.closest('[data-move-cat]');
    if (moveCatBtn) {
      const cat = moveCatBtn.dataset.moveCat;
      const dir = parseInt(moveCatBtn.dataset.dir, 10);
      const idx = state.categories.indexOf(cat);
      const targetIdx = idx + dir;
      if (idx !== -1 && targetIdx >= 0 && targetIdx < state.categories.length) {
        const tmp = state.categories[idx];
        state.categories[idx] = state.categories[targetIdx];
        state.categories[targetIdx] = tmp;
        saveState();
        renderCategoriesManageList();
        renderMenuEditor();
        renderPOS();
      }
      return;
    }

    const btn = e.target.closest('[data-delete-cat]');
    if (!btn) return;
    if (state.categories.length <= 1) {
      showToast('Mindestens eine Kategorie muss erhalten bleiben');
      return;
    }
    const cat = btn.dataset.deleteCat;
    const count = state.products.filter((p) => p.category === cat).length;
    const msg = count > 0
      ? `Kategorie «${cat}» wirklich entfernen?\n(${count} Artikel werden unter «${FALLBACK_CATEGORY}» eingeordnet)`
      : `Kategorie «${cat}» wirklich entfernen?`;
    if (!window.confirm(msg)) return;
    state.categories = state.categories.filter((c) => c !== cat);
    saveState();
    renderCategoriesManageList();
    renderMenuEditor();
    renderPOS();
  });

  // Backup Modal Events
  document.getElementById('btn-backup-menu').addEventListener('click', () => {
    document.getElementById('modal-backup').classList.remove('hidden');
  });

  document.getElementById('btn-export-json').addEventListener('click', () => {
    const data = {
      bistroName: state.bistroName,
      categories: state.categories,
      products: state.products
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gartenbistro-sortiment-backup.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast('Sortiment-Backup gespeichert');
  });

  document.getElementById('input-import-json').addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (Array.isArray(parsed.products)) {
          state.products = parsed.products.map((p, idx) => sanitizeProduct(p, idx));
          if (Array.isArray(parsed.categories)) {
            const cleanCats = parsed.categories
              .map((c) => String(c || '').trim())
              .filter((c) => c && c !== FALLBACK_CATEGORY);
            if (cleanCats.length > 0) {
              state.categories = Array.from(new Set(cleanCats));
            }
          }
          if (parsed.bistroName && typeof parsed.bistroName === 'string' && parsed.bistroName.trim()) {
            state.bistroName = parsed.bistroName.trim();
          }
          state.posCategory = 'ALL';
          state.editorCategory = 'ALL';
          syncCartWithCatalog();
          saveState();
          renderHeader();
          renderMenuEditor();
          renderPOS();
          closeModal('modal-backup');
          showToast('Sortiment erfolgreich geladen!');
        } else {
          alert('Ungültige Backup-Datei.');
        }
      } catch {
        alert('Datei konnte nicht gelesen werden.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  document.getElementById('btn-reset-default-menu').addEventListener('click', () => {
    if (!window.confirm('Aktuelles Sortiment durch das Gartenbistro-Standardmenü ersetzen?')) return;
    state.categories = [...DEFAULT_CATEGORIES];
    state.products = structuredClone(DEFAULT_PRODUCTS);
    state.posCategory = 'ALL';
    state.editorCategory = 'ALL';
    syncCartWithCatalog();
    saveState();
    renderMenuEditor();
    renderPOS();
    closeModal('modal-backup');
    showToast('Standard-Sortiment geladen');
  });

  // Close Modals
  document.querySelectorAll('[data-close-modal]').forEach((btn) => {
    btn.addEventListener('click', () => closeModal(btn.dataset.closeModal));
  });

  document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) backdrop.classList.add('hidden');
    });
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop:not(.hidden)').forEach((backdrop) => {
        backdrop.classList.add('hidden');
      });
    }
  });
}

// Request persistent storage and register Service Worker for offline use on iPad
if (navigator.storage && navigator.storage.persist) {
  navigator.storage.persist().catch(() => {});
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

// Boot
loadState();
initEvents();
initDragAndDrop();
initMobileSheetSwipe();
renderHeader();
renderPOS();
