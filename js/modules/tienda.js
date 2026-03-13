/* =========================================
   SEVET – Módulo Tienda Premium
   Catálogo de productos con carrito y filtros
   ========================================= */

const PRODUCTS = [
  {
    id: 1, name: 'Royal Canin Veterinary Diet', category: 'alimento',
    price: 45990, oldPrice: 52990, image: '🥫', rating: 4.8,
    desc: 'Alimento terapéutico para perros con sensibilidad digestiva. 10kg.',
    badge: 'Más vendido', tags: ['perro', 'digestivo']
  },
  {
    id: 2, name: 'Hills Science Diet Indoor', category: 'alimento',
    price: 38990, oldPrice: null, image: '🍗', rating: 4.6,
    desc: 'Fórmula para gatos de interior. Control de peso y bolas de pelo. 7kg.',
    badge: null, tags: ['gato', 'indoor']
  },
  {
    id: 3, name: 'Frontline Plus Triple Acción', category: 'farmacia',
    price: 18990, oldPrice: 22990, image: '💊', rating: 4.9,
    desc: 'Pipeta antiparasitaria. Protección 30 días contra pulgas y garrapatas.',
    badge: 'Oferta', tags: ['perro', 'gato', 'desparasitante']
  },
  {
    id: 4, name: 'Collar Isabelino Premium', category: 'accesorios',
    price: 12990, oldPrice: null, image: '🛡️', rating: 4.3,
    desc: 'Collar protector post-operatorio transparente. Ajustable y cómodo.',
    badge: null, tags: ['perro', 'post-cirugía']
  },
  {
    id: 5, name: 'Kit Dental Veterinario', category: 'higiene',
    price: 15990, oldPrice: 19990, image: '🪥', rating: 4.7,
    desc: 'Cepillo triple acción + pasta enzimática sabor pollo. Uso profesional.',
    badge: 'Recomendado', tags: ['perro', 'gato', 'dental']
  },
  {
    id: 6, name: 'Pro Plan Cachorro Razas Medianas', category: 'alimento',
    price: 42990, oldPrice: null, image: '🐶', rating: 4.5,
    desc: 'Alimento premium con OptiStart para cachorros de 2-12 meses. 12kg.',
    badge: null, tags: ['perro', 'cachorro']
  },
  {
    id: 7, name: 'Shampoo Medicado Clorhexidina', category: 'higiene',
    price: 8990, oldPrice: null, image: '🧴', rating: 4.4,
    desc: 'Shampoo antibacteriano y antifúngico. Para dermatitis y pioderma.',
    badge: null, tags: ['perro', 'dermatología']
  },
  {
    id: 8, name: 'Suplemento Articular Condroitina', category: 'farmacia',
    price: 24990, oldPrice: 29990, image: '💪', rating: 4.8,
    desc: 'Glucosamina + Condroitina + MSM. Para articulaciones de perros senior.',
    badge: 'Veterinario recomienda', tags: ['perro', 'senior', 'articular']
  },
];

const CATEGORIES = [
  { id: 'todos', label: 'Todos', icon: '🏪' },
  { id: 'alimento', label: 'Alimentos', icon: '🥫' },
  { id: 'farmacia', label: 'Farmacia', icon: '💊' },
  { id: 'higiene', label: 'Higiene', icon: '🧴' },
  { id: 'accesorios', label: 'Accesorios', icon: '🛡️' },
];

let activeCategory = 'todos';
let cart = [];

export function initTienda() {
  const container = document.getElementById('tienda-container');
  if (!container) return;
  renderCategoryFilters();
  renderProducts();
  renderCart();
}

function renderCategoryFilters() {
  const filtersEl = document.getElementById('categoryFilters');
  if (!filtersEl) return;
  filtersEl.innerHTML = CATEGORIES.map(c => `
    <button class="cat-filter ${c.id === activeCategory ? 'active' : ''}"
            onclick="window._filterCategory('${c.id}')">
      <span class="cat-icon">${c.icon}</span>
      <span class="cat-label">${c.label}</span>
    </button>
  `).join('');
}

window._filterCategory = function(cat) {
  activeCategory = cat;
  renderCategoryFilters();
  renderProducts();
};

function renderProducts() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;
  const filtered = activeCategory === 'todos'
    ? PRODUCTS
    : PRODUCTS.filter(p => p.category === activeCategory);

  grid.innerHTML = filtered.map(p => `
    <div class="product-card">
      ${p.badge ? `<div class="product-badge">${p.badge}</div>` : ''}
      <div class="product-image">${p.image}</div>
      <div class="product-info">
        <h4 class="product-name">${p.name}</h4>
        <p class="product-desc">${p.desc}</p>
        <div class="product-rating">
          ${'★'.repeat(Math.floor(p.rating))}${'☆'.repeat(5 - Math.floor(p.rating))}
          <span class="rating-num">${p.rating}</span>
        </div>
        <div class="product-pricing">
          <span class="product-price">$${p.price.toLocaleString('es-CL')}</span>
          ${p.oldPrice ? `<span class="product-old-price">$${p.oldPrice.toLocaleString('es-CL')}</span>` : ''}
        </div>
        <button class="product-add-btn" onclick="window._addToCart(${p.id})">
          🛒 Agregar
        </button>
      </div>
    </div>
  `).join('');
}

window._addToCart = function(id) {
  const existing = cart.find(c => c.id === id);
  if (existing) {
    existing.qty++;
  } else {
    const product = PRODUCTS.find(p => p.id === id);
    cart.push({ ...product, qty: 1 });
  }
  renderCart();
  // Flash animation
  const badge = document.getElementById('cartBadge');
  if (badge) { badge.classList.add('pop'); setTimeout(() => badge.classList.remove('pop'), 300); }
};

window._removeFromCart = function(id) {
  cart = cart.filter(c => c.id !== id);
  renderCart();
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
            <div class="cart-item-qty">×${item.qty} · $${(item.price * item.qty).toLocaleString('es-CL')}</div>
          </div>
          <button class="cart-remove" onclick="window._removeFromCart(${item.id})">✕</button>
        </div>
      `).join('')}
    </div>
    <div class="cart-total">
      <span>Total</span>
      <span class="cart-total-price">$${totalPrice.toLocaleString('es-CL')}</span>
    </div>
    <button class="btn-cta cart-checkout">Proceder al Pago →</button>`;
}
