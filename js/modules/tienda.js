/* =========================================
   SEVET – Módulo Farmacia Inteligente
   Catálogo conectado a Supabase con carrito,
   subcategorías, stock real y validación receta
   ========================================= */

import { supabase } from '/js/supabase.js';

const CATEGORIES = [
  { id: 'todos', label: 'Todos', icon: '🏪' },
  { id: 'alimento', label: 'Alimentos', icon: '🥫' },
  { id: 'medicamento', label: 'Farmacia', icon: '💊' },
  { id: 'suplemento', label: 'Suplementos', icon: '💪' },
  { id: 'higiene', label: 'Higiene', icon: '🧴' },
  { id: 'accesorio', label: 'Accesorios', icon: '🛡️' },
];

const SUBCATEGORIES = {
  medicamento: [
    { id: 'all', label: 'Todos' },
    { id: 'antiparasitario_interno', label: '🪱 Antiparasitario Interno' },
    { id: 'antiparasitario_externo', label: '🦟 Antiparasitario Externo' },
    { id: 'dermatologia', label: '🧴 Dermatología' },
    { id: 'otico', label: '👂 Ótico' },
    { id: 'urgencia', label: '🚨 Urgencia' },
  ],
  suplemento: [
    { id: 'all', label: 'Todos' },
    { id: 'articular', label: '🦴 Articular' },
    { id: 'digestivo', label: '🫧 Digestivo' },
    { id: 'renal', label: '🫘 Renal' },
    { id: 'cardiovascular', label: '❤️ Cardiovascular' },
  ],
};

// Emoji fallback por categoría
const CAT_EMOJI = {
  alimento: '🥫', medicamento: '💊', suplemento: '💪',
  higiene: '🧴', accesorio: '🛡️',
};

let products = [];
let activeCategory = 'todos';
let activeSubcategory = 'all';
let cart = JSON.parse(localStorage.getItem('sevet_cart') || '[]');

export async function initTienda() {
  const container = document.getElementById('tienda-container');
  if (!container) return;

  renderCategoryFilters();
  renderCart();

  // Fetch products from Supabase
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('category')
    .order('name');

  if (error) {
    console.error('Error cargando productos:', error);
    document.getElementById('productsGrid').innerHTML = `
      <div class="tienda-error">
        <span>⚠️</span>
        <p>No se pudieron cargar los productos. Intenta de nuevo.</p>
        <button class="btn-secondary" onclick="location.reload()">Reintentar</button>
      </div>`;
    return;
  }

  products = data || [];
  renderProducts();
}

function renderCategoryFilters() {
  const filtersEl = document.getElementById('categoryFilters');
  if (!filtersEl) return;

  filtersEl.innerHTML = `
    <div class="cat-filters-main">
      ${CATEGORIES.map(c => `
        <button class="cat-filter ${c.id === activeCategory ? 'active' : ''}"
                onclick="window._filterCategory('${c.id}')">
          <span class="cat-icon">${c.icon}</span>
          <span class="cat-label">${c.label}</span>
        </button>
      `).join('')}
    </div>
    ${SUBCATEGORIES[activeCategory] ? `
      <div class="cat-filters-sub">
        ${SUBCATEGORIES[activeCategory].map(s => `
          <button class="cat-sub-filter ${s.id === activeSubcategory ? 'active' : ''}"
                  onclick="window._filterSubcategory('${s.id}')">
            ${s.label}
          </button>
        `).join('')}
      </div>` : ''}
  `;
}

window._filterCategory = function(cat) {
  activeCategory = cat;
  activeSubcategory = 'all';
  renderCategoryFilters();
  renderProducts();
};

window._filterSubcategory = function(sub) {
  activeSubcategory = sub;
  renderCategoryFilters();
  renderProducts();
};

function getStockInfo(stock) {
  if (stock <= 0) return { class: 'stock-out', label: 'Agotado', color: '#ef4444' };
  if (stock <= 5) return { class: 'stock-low', label: `¡Solo ${stock}!`, color: '#f59e0b' };
  if (stock <= 15) return { class: 'stock-med', label: `${stock} disponibles`, color: '#a044a0' };
  return { class: 'stock-ok', label: 'En stock', color: '#10b981' };
}

function renderProducts() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  let filtered = products;
  if (activeCategory !== 'todos') {
    filtered = filtered.filter(p => p.category === activeCategory);
  }
  if (activeSubcategory !== 'all') {
    filtered = filtered.filter(p => p.subcategory === activeSubcategory);
  }

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="tienda-empty">
      <span>🔍</span><p>No hay productos en esta categoría</p>
    </div>`;
    return;
  }

  grid.innerHTML = filtered.map(p => {
    const stock = getStockInfo(p.stock);
    const emoji = CAT_EMOJI[p.category] || '📦';
    return `
      <div class="product-card ${p.stock <= 0 ? 'out-of-stock' : ''}">
        ${p.is_prescription ? '<div class="product-badge rx-badge">🔒 Requiere Receta</div>' : ''}
        ${p.stock <= 5 && p.stock > 0 ? '<div class="product-badge low-stock-badge">⚡ Últimas unidades</div>' : ''}
        <div class="product-image">${p.image_url ? `<img src="${p.image_url}" alt="${p.name}"/>` : `<span class="product-emoji">${emoji}</span>`}</div>
        <div class="product-info">
          <div class="product-cat-tag">${p.subcategory ? p.subcategory.replace(/_/g, ' ') : p.category}</div>
          <h4 class="product-name">${p.name}</h4>
          <p class="product-desc">${p.description || ''}</p>
          <div class="product-stock-row">
            <span class="stock-indicator" style="background:${stock.color}"></span>
            <span class="stock-label">${stock.label}</span>
          </div>
          <div class="product-pricing">
            <span class="product-price">$${p.price_clp.toLocaleString('es-CL')}</span>
          </div>
          <button class="product-add-btn" 
                  ${p.stock <= 0 ? 'disabled' : ''}
                  onclick="window._addToCart('${p.id}')">
            ${p.stock <= 0 ? '🚫 Agotado' : '🛒 Agregar'}
          </button>
        </div>
      </div>`;
  }).join('');
}

window._addToCart = function(id) {
  const product = products.find(p => p.id === id);
  if (!product || product.stock <= 0) return;

  const existing = cart.find(c => c.id === id);
  if (existing) {
    if (existing.qty >= product.stock) {
      showToast('⚠️ No hay más stock disponible');
      return;
    }
    existing.qty++;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price_clp,
      category: product.category,
      is_prescription: product.is_prescription,
      image: CAT_EMOJI[product.category] || '📦',
      qty: 1,
    });
  }
  saveCart();
  renderCart();
  showToast(`✅ ${product.name} agregado`);
};

window._removeFromCart = function(id) {
  cart = cart.filter(c => c.id !== id);
  saveCart();
  renderCart();
};

window._updateQty = function(id, delta) {
  const item = cart.find(c => c.id === id);
  if (!item) return;
  const product = products.find(p => p.id === id);
  item.qty += delta;
  if (item.qty <= 0) { cart = cart.filter(c => c.id !== id); }
  else if (product && item.qty > product.stock) {
    item.qty = product.stock;
    showToast('⚠️ Stock máximo alcanzado');
  }
  saveCart();
  renderCart();
};

function saveCart() { localStorage.setItem('sevet_cart', JSON.stringify(cart)); }

function showToast(msg) {
  const existing = document.querySelector('.tienda-toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'tienda-toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 2500);
}

window._checkout = async function() {
  // Check prescription products
  const rxItems = cart.filter(c => c.is_prescription);
  if (rxItems.length > 0) {
    const names = rxItems.map(r => r.name).join(', ');
    const confirmed = confirm(
      `⚠️ Los siguientes productos requieren receta veterinaria:\n\n${names}\n\n¿Tienes una receta vigente del Dr. Sánchez o de otro veterinario?`
    );
    if (!confirmed) return;
  }

  showToast('🛒 Procesando pedido...');
  // Future: integrate with payment gateway
};

function renderCart() {
  const cartEl = document.getElementById('cartPanel');
  const badgeEl = document.getElementById('cartBadge');
  if (!cartEl) return;

  const totalItems = cart.reduce((s, c) => s + c.qty, 0);
  const totalPrice = cart.reduce((s, c) => s + c.price * c.qty, 0);
  if (badgeEl) badgeEl.textContent = totalItems;

  if (cart.length === 0) {
    cartEl.innerHTML = `
      <h3 class="panel-title">🛒 Tu Carrito</h3>
      <div class="cart-empty">
        <span class="cart-empty-icon">🛍️</span>
        <p>Tu carrito está vacío</p>
        <p class="cart-empty-sub">Explora nuestros productos veterinarios</p>
      </div>`;
    return;
  }

  cartEl.innerHTML = `
    <h3 class="panel-title">🛒 Tu Carrito <span class="cart-count">(${totalItems})</span></h3>
    <div class="cart-items">
      ${cart.map(item => `
        <div class="cart-item">
          <span class="cart-item-icon">${item.image}</span>
          <div class="cart-item-info">
            <div class="cart-item-name">${item.name}</div>
            ${item.is_prescription ? '<div class="cart-rx-tag">🔒 Receta</div>' : ''}
            <div class="cart-item-qty-controls">
              <button class="qty-btn" onclick="window._updateQty('${item.id}', -1)">−</button>
              <span class="qty-num">${item.qty}</span>
              <button class="qty-btn" onclick="window._updateQty('${item.id}', 1)">+</button>
              <span class="cart-item-subtotal">$${(item.price * item.qty).toLocaleString('es-CL')}</span>
            </div>
          </div>
          <button class="cart-remove" onclick="window._removeFromCart('${item.id}')">✕</button>
        </div>
      `).join('')}
    </div>
    <div class="cart-total">
      <span>Total</span>
      <span class="cart-total-price">$${totalPrice.toLocaleString('es-CL')}</span>
    </div>
    <button class="btn-cta cart-checkout" onclick="window._checkout()">Proceder al Pago →</button>`;
}
