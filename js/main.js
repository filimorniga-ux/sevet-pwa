/* =========================================
   SEVET – main.js (Entry Point Vite)
   Ecosistema Pet-Tech 360
   ========================================= */

import '../styles.css';
import { initAuth } from './auth.js';

// ── Registro Service Worker (Offline-First) ──
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

// ── LOADER ──
(function runLoader() {
  const bar = document.getElementById('loaderBar');
  const dog = document.getElementById('loaderDog');
  const loader = document.getElementById('loader');
  if (!bar || !dog || !loader) return;
  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 15 + 5;
    if (progress >= 100) { progress = 100; clearInterval(interval); }
    bar.style.width = progress + '%';
    dog.style.left = progress + '%';
    if (progress >= 100) {
      setTimeout(() => {
        loader.classList.add('fade-out');
        setTimeout(() => { loader.style.display = 'none'; initApp(); }, 650);
      }, 400);
    }
  }, 120);
})();

// ── INICIALIZAR APP ──
function initApp() {
  initAuth();
  initCursor();
  initParticles();
  initNavScroll();
  initHeroSlider();
  initScrollReveal();
  initCounters();
  initComparison();
  initCarousel();
}

// ── CURSOR PERSONALIZADO ──
function initCursor() {
  const cursor = document.getElementById('cursor');
  const follower = document.getElementById('cursorFollower');
  if (!cursor || !follower) return;
  let fx = 0, fy = 0, cx = 0, cy = 0;

  document.addEventListener('mousemove', e => {
    cx = e.clientX; cy = e.clientY;
    cursor.style.left = cx + 'px';
    cursor.style.top = cy + 'px';
  });

  function animateFollower() {
    fx += (cx - fx) * 0.12;
    fy += (cy - fy) * 0.12;
    follower.style.left = fx + 'px';
    follower.style.top = fy + 'px';
    requestAnimationFrame(animateFollower);
  }
  animateFollower();

  document.querySelectorAll('a, button, .bento-card, .product-card').forEach(el => {
    el.addEventListener('mouseenter', () => { cursor.style.transform = 'translate(-50%,-50%) scale(2.5)'; follower.style.transform = 'translate(-50%,-50%) scale(1.5)'; });
    el.addEventListener('mouseleave', () => { cursor.style.transform = 'translate(-50%,-50%) scale(1)'; follower.style.transform = 'translate(-50%,-50%) scale(1)'; });
  });
}

// ── PARTÍCULAS ──
function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W = window.innerWidth, H = window.innerHeight;
  let mouseX = W / 2, mouseY = H / 2;
  canvas.width = W; canvas.height = H;

  window.addEventListener('resize', () => {
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W; canvas.height = H;
  });

  document.addEventListener('mousemove', e => { mouseX = e.clientX; mouseY = e.clientY; });

  const BLUE = '37, 99, 235';
  const particles = Array.from({ length: 70 }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: Math.random() * 2.5 + 0.5,
    vx: (Math.random() - 0.5) * 0.4,
    vy: (Math.random() - 0.5) * 0.4,
    alpha: Math.random() * 0.5 + 0.1,
  }));

  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      const dx = p.x - mouseX, dy = p.y - mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 140) {
        p.x += dx / dist * 0.8;
        p.y += dy / dist * 0.8;
      }
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${BLUE}, ${p.alpha})`;
      ctx.fill();
    });

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 110) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(${BLUE}, ${0.12 * (1 - d / 110)})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }
  draw();
}

// ── NAVBAR SCROLL ──
function initNavScroll() {
  const nav = document.getElementById('navbar');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  });
}

// ── MENÚ MOBILE ──
window.toggleNav = function() {
  document.getElementById('navLinks').classList.toggle('open');
};
document.addEventListener('click', e => {
  if (e.target.closest('#navLinks a')) {
    document.getElementById('navLinks').classList.remove('open');
  }
});

// ── HERO SLIDER ──
function initHeroSlider() {
  const slides = document.querySelectorAll('.hero-slide');
  if (!slides.length) return;
  let current = 0;
  setInterval(() => {
    slides[current].classList.remove('active');
    current = (current + 1) % slides.length;
    slides[current].classList.add('active');
  }, 5000);
}

// ── SCROLL REVEAL ──
function initScrollReveal() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const delay = parseFloat(getComputedStyle(entry.target).getPropertyValue('--delay') || '0');
        setTimeout(() => entry.target.classList.add('visible'), delay * 1000);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// ── CONTADORES ANIMADOS ──
function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = parseInt(entry.target.dataset.count);
        const suffix = target > 100 ? '+' : target === 5 ? '' : '+';
        let current = 0;
        const step = Math.ceil(target / 50);
        const timer = setInterval(() => {
          current = Math.min(current + step, target);
          entry.target.textContent = current.toLocaleString('es-CL') + suffix;
          if (current >= target) clearInterval(timer);
        }, 40);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  counters.forEach(c => observer.observe(c));
}

// ── COMPARACIÓN ANTES/DESPUÉS ──
function initComparison() {
  const container = document.getElementById('comparisonContainer');
  const after = document.getElementById('comparisonAfter');
  const divider = document.getElementById('comparisonDivider');
  const handle = document.getElementById('comparisonHandle');
  if (!container) return;

  let dragging = false;

  function updatePosition(x) {
    const rect = container.getBoundingClientRect();
    let pct = Math.max(5, Math.min(95, ((x - rect.left) / rect.width) * 100));
    after.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
    divider.style.left = pct + '%';
    handle.style.left = pct + '%';
  }

  container.addEventListener('mousedown', () => { dragging = true; });
  document.addEventListener('mouseup', () => { dragging = false; });
  document.addEventListener('mousemove', e => { if (dragging) updatePosition(e.clientX); });

  container.addEventListener('touchstart', e => { dragging = true; updatePosition(e.touches[0].clientX); }, { passive: true });
  document.addEventListener('touchend', () => { dragging = false; });
  document.addEventListener('touchmove', e => { if (dragging) updatePosition(e.touches[0].clientX); }, { passive: true });

  updatePosition(container.getBoundingClientRect().left + container.offsetWidth / 2);
}

// ── CARRUSEL PRODUCTOS ──
let carouselIndex = 0;
function getVisibleCards() {
  return window.innerWidth < 768 ? 1 : window.innerWidth < 1024 ? 2 : 3;
}
function updateCarousel() {
  const track = document.getElementById('carouselTrack');
  if (!track) return;
  const cards = track.querySelectorAll('.product-card');
  if (!cards.length) return;
  const visible = getVisibleCards();
  const cardWidth = cards[0].offsetWidth;
  const gap = 24;
  const maxIndex = Math.max(0, cards.length - visible);
  carouselIndex = Math.max(0, Math.min(carouselIndex, maxIndex));
  track.style.transform = `translateX(-${carouselIndex * (cardWidth + gap)}px)`;
}
window.carouselNext = function() { carouselIndex++; updateCarousel(); };
window.carouselPrev = function() { carouselIndex--; updateCarousel(); };
window.addEventListener('resize', updateCarousel);

// ── WIDGET IA ──
window.toggleAI = function() {
  document.getElementById('aiChat').classList.toggle('open');
};

const aiResponses = {
  default: '¡Gracias por tu consulta! Para atención inmediata, llama al +56 9 8419 6310 o al +56 2 2773 1554. El Dr. Sánchez y su equipo están disponibles hasta la 01:00 AM. 🐾',
  horario: '📅 Atendemos de <strong>Lunes a Viernes hasta la 01:00 AM</strong>. Para urgencias nocturnas, llama directamente al +56 9 8419 6310.',
  precio: '💰 Nuestras tarifas varían según el tipo de consulta. Te recomendamos llamar al +56 2 2773 1554 para obtener información actualizada sobre precios.',
  urgencia: '🚨 <strong>¡Llama ahora!</strong> +56 9 8419 6310. Estamos ubicados en Av. San Pablo 6106, Lo Prado. El Dr. Alberto Sánchez está disponible.',
};

window.aiQuick = function(text) {
  const input = document.getElementById('aiInput');
  input.value = text;
  window.aiSend();
};

window.aiSend = function() {
  const input = document.getElementById('aiInput');
  const messages = document.getElementById('aiMessages');
  const text = input.value.trim();
  if (!text) return;

  const userEl = document.createElement('div');
  userEl.className = 'ai-msg user';
  userEl.textContent = text;
  messages.appendChild(userEl);
  input.value = '';
  messages.scrollTop = messages.scrollHeight;

  const lower = text.toLowerCase();
  let response = aiResponses.default;
  if (lower.includes('horario') || lower.includes('hora')) response = aiResponses.horario;
  else if (lower.includes('precio') || lower.includes('costo') || lower.includes('cuánto')) response = aiResponses.precio;
  else if (lower.includes('urgent') || lower.includes('ahora') || lower.includes('emergencia')) response = aiResponses.urgencia;

  setTimeout(() => {
    const botEl = document.createElement('div');
    botEl.className = 'ai-msg bot';
    botEl.innerHTML = response;
    messages.appendChild(botEl);
    messages.scrollTop = messages.scrollHeight;
  }, 700);
};
