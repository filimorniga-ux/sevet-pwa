/* =========================================
   SEVET – main.js (Entry Point Vite)
   Ecosistema Pet-Tech 360
   ========================================= */

import '../styles.css';
import { initAuth } from './auth.js';
import { initAgendamiento } from './modules/agendamiento.js';
import { initMiMascota } from './modules/mi-mascota.js';
import { initTienda } from './modules/tienda.js';
import { initPeluqueria } from './modules/peluqueria.js';
import { initChatbot } from './modules/chatbot.js';
import { initAnatomia } from './modules/anatomia.js';
import { initTelemedicina } from './modules/telemedicina.js';
import { initHistorial } from './modules/historial.js';
import { initImagenes } from './modules/imagenes.js';
import { initFinanciero } from './modules/financiero.js';

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
  if (!bar || !dog || !loader) { initApp(); return; }
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
  initAgendamiento();
  initMiMascota();
  initTienda();
  initPeluqueria();
  initChatbot();
  initAnatomia();
  initTelemedicina();
  initHistorial();
  initImagenes();
  initFinanciero();
  initParticles();
  initNavScroll();
  initHeroSlider();
  initScrollReveal();
  initCounters();
  initComparison();
  initCarousel();
}

// ── HUELLITAS FLOTANTES 🐾 ──
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

  const pawEmojis = ['🐾', '🐾', '🐾', '🐱', '🐶'];
  const paws = Array.from({ length: 40 }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    size: Math.random() * 12 + 30,
    vx: (Math.random() - 0.5) * 0.4,
    vy: (Math.random() - 0.5) * 0.4,
    alpha: Math.random() * 0.18 + 0.12,
    rotation: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.008,
    emoji: pawEmojis[Math.floor(Math.random() * pawEmojis.length)],
  }));

  function draw() {
    ctx.clearRect(0, 0, W, H);
    paws.forEach(p => {
      const dx = p.x - mouseX, dy = p.y - mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) {
        p.x += dx / dist * 0.6;
        p.y += dy / dist * 0.6;
      }
      p.x += p.vx; p.y += p.vy;
      p.rotation += p.rotSpeed;
      if (p.x < -20) p.x = W + 20;
      if (p.x > W + 20) p.x = -20;
      if (p.y < -20) p.y = H + 20;
      if (p.y > H + 20) p.y = -20;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.alpha;
      ctx.font = `${p.size}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.emoji, 0, 0);
      ctx.restore();
    });
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
function initCarousel() {
  updateCarousel();
}
window.carouselNext = function() { carouselIndex++; updateCarousel(); };
window.carouselPrev = function() { carouselIndex--; updateCarousel(); };
window.addEventListener('resize', updateCarousel);

// ── WIDGET IA (OpenAI via Supabase Edge Function) ──
const CHAT_AI_URL = import.meta.env.VITE_CHAT_AI_URL || 'https://zyvwcxsqdbegzjlmgtou.supabase.co/functions/v1/chat-ai';
let chatHistory = [];

window.toggleAI = function() {
  document.getElementById('aiChat').classList.toggle('open');
};

const aiFallback = {
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

window.aiSend = async function() {
  const input = document.getElementById('aiInput');
  const messages = document.getElementById('aiMessages');
  const text = input.value.trim();
  if (!text) return;

  // User message
  const userEl = document.createElement('div');
  userEl.className = 'ai-msg user';
  userEl.textContent = text;
  messages.appendChild(userEl);
  input.value = '';
  messages.scrollTop = messages.scrollHeight;

  // Typing indicator
  const typingEl = document.createElement('div');
  typingEl.className = 'ai-msg bot ai-typing';
  typingEl.innerHTML = '<span>●</span><span>●</span><span>●</span>';
  messages.appendChild(typingEl);
  messages.scrollTop = messages.scrollHeight;

  try {
    const res = await fetch(CHAT_AI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, history: chatHistory }),
    });

    typingEl.remove();

    if (res.ok) {
      const data = await res.json();
      chatHistory.push({ role: 'user', content: text });
      chatHistory.push({ role: 'assistant', content: data.reply });
      if (chatHistory.length > 20) chatHistory = chatHistory.slice(-20);

      const botEl = document.createElement('div');
      botEl.className = 'ai-msg bot';
      botEl.innerHTML = data.reply.replace(/\n/g, '<br>');
      messages.appendChild(botEl);
    } else {
      throw new Error('API error');
    }
  } catch {
    typingEl.remove();
    // Fallback local
    const lower = text.toLowerCase();
    let response = aiFallback.default;
    if (lower.includes('horario') || lower.includes('hora')) response = aiFallback.horario;
    else if (lower.includes('precio') || lower.includes('costo') || lower.includes('cuánto')) response = aiFallback.precio;
    else if (lower.includes('urgent') || lower.includes('ahora') || lower.includes('emergencia')) response = aiFallback.urgencia;

    const botEl = document.createElement('div');
    botEl.className = 'ai-msg bot';
    botEl.innerHTML = response;
    messages.appendChild(botEl);
  }
  messages.scrollTop = messages.scrollHeight;
};
