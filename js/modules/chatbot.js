/* =========================================
   SEVET – Módulo Chatbot IA
   v2.0 — Demo Ready
   • Botón "Agendar" automático al detectar intención
   • Saludo personalizado por usuario logueado
   • Quick-buttons relevantes para demo
   ========================================= */

import { supabase } from '/js/supabase.js';

const CHAT_ENDPOINT = 'https://zyvwcxsqdbegzjlmgtou.supabase.co/functions/v1/chat-ai';
const MAX_HISTORY = 10;

let chatHistory = [];
let isTyping = false;
let userContext = null; // nombre + mascota del usuario logueado

// ── Keywords que disparan el botón de agendar ──
const BOOKING_KEYWORDS = [
  'agendar', 'agenda', 'reservar', 'cita', 'hora', 'turno',
  'quiero ir', 'necesito ir', 'cuándo puedo', 'cuando puedo',
  'disponibilidad', 'appointment', 'consulta hoy', 'consulta mañana'
];

// ── Escape XSS ──
function esc(s) {
  return s ? String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;') : '';
}

// ── Detectar intención de agendar en texto ──
function hasBookingIntent(text) {
  const lower = text.toLowerCase();
  return BOOKING_KEYWORDS.some(kw => lower.includes(kw));
}

// ── Format AI response text ──
function formatReply(text) {
  return esc(text)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>')
    .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener" style="color:var(--purple-600)">$1</a>')
    .replace(/(\+?56[\s\-]?\d[\s\-]?\d{4}[\s\-]?\d{4})/g, '<a href="tel:$1" style="color:var(--purple-600)">$1</a>');
}

// ── Append message to chat UI ──
function appendMessage(role, text, showBookingBtn = false) {
  const messages = document.getElementById('aiMessages');
  if (!messages) return;

  const el = document.createElement('div');
  el.className = `ai-msg ${role}`;
  el.innerHTML = role === 'bot' ? formatReply(text) : esc(text);
  messages.appendChild(el);

  // Si hay intención de agendar → agregar botón CTA
  if (showBookingBtn) {
    const btn = document.createElement('div');
    btn.className = 'ai-booking-cta';
    btn.innerHTML = `
      <a href="/pages/agendar.html" class="ai-booking-btn">
        📅 Agendar cita ahora →
      </a>
    `;
    messages.appendChild(btn);
  }

  messages.scrollTop = messages.scrollHeight;

  // Hide quick buttons after first user message
  if (role === 'user') {
    const qb = document.querySelector('.ai-quick-btns');
    if (qb) qb.style.display = 'none';
  }
}

// ── Cargar contexto del usuario logueado ──
async function loadUserContext() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('user_id', session.user.id)
      .single();

    if (!profile) return null;

    // Buscar mascotas del usuario
    const { data: pets } = await supabase
      .from('pets')
      .select('name, species')
      .eq('owner_id', session.user.id)
      .limit(3);

    return {
      name: profile.full_name?.split(' ')[0] || 'amigo/a', // Solo primer nombre
      role: profile.role,
      pets: pets || [],
    };
  } catch {
    return null;
  }
}

// ── Personalizar saludo inicial ──
function buildWelcomeMessage(ctx) {
  if (!ctx) {
    return '¡Hola! 👋 Soy el asistente virtual de SEVET. ¿En qué puedo ayudarte hoy?';
  }

  const petsText = ctx.pets.length > 0
    ? ` Veo que tienes a **${ctx.pets.map(p => p.name).join(', ')}** registrado${ctx.pets.length > 1 ? 's' : ''} en tu ficha.`
    : '';

  return `¡Hola, ${ctx.name}! 👋${petsText} Soy el asistente de SEVET. ¿En qué te puedo ayudar hoy? 🐾`;
}

// ── Toggle chatbot panel ──
window.toggleAI = function () {
  const chat = document.getElementById('aiChat');
  const toggle = document.getElementById('aiToggle');
  if (!chat || !toggle) return;

  const isOpen = chat.classList.toggle('open');
  toggle.classList.toggle('active', isOpen);

  if (isOpen) {
    const input = document.getElementById('aiInput');
    if (input) setTimeout(() => input.focus(), 200);
  }
};

// ── Quick question buttons ──
window.aiQuick = function (question) {
  const input = document.getElementById('aiInput');
  if (input) input.value = question;
  window.aiSend();
};

// ── Send message to real AI ──
window.aiSend = async function () {
  const input = document.getElementById('aiInput');
  const messages = document.getElementById('aiMessages');
  if (!input || !messages || isTyping) return;

  const text = input.value.trim();
  if (!text) return;

  const shouldShowBookingBtn = hasBookingIntent(text);

  input.value = '';
  appendMessage('user', text);
  chatHistory.push({ role: 'user', content: text });

  // Typing indicator
  isTyping = true;
  const typingEl = document.createElement('div');
  typingEl.className = 'ai-msg bot typing-indicator';
  typingEl.innerHTML = '<span></span><span></span><span></span>';
  typingEl.id = 'aiTyping';
  messages.appendChild(typingEl);
  messages.scrollTop = messages.scrollHeight;

  // Construir contexto personalizado si hay usuario logueado
  let contextMsg = text;
  if (userContext && chatHistory.length === 1) {
    contextMsg = `[Usuario: ${userContext.name}${userContext.pets.length ? `, mascotas: ${userContext.pets.map(p => `${p.name} (${p.species})`).join(', ')}` : ''}] ${text}`;
  }

  try {
    const res = await fetch(CHAT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: contextMsg,
        history: chatHistory.slice(-MAX_HISTORY),
      }),
    });

    typingEl.remove();

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Error ${res.status}`);
    }

    const data = await res.json();
    const reply = data.reply || 'Lo siento, no pude procesar tu consulta.';

    // Mostrar botón si la respuesta o la pregunta tiene intención de agendar
    const replyHasBooking = hasBookingIntent(reply) || shouldShowBookingBtn;
    appendMessage('bot', reply, replyHasBooking);
    chatHistory.push({ role: 'assistant', content: reply });

    if (chatHistory.length > MAX_HISTORY * 2) {
      chatHistory = chatHistory.slice(-(MAX_HISTORY * 2));
    }
  } catch (err) {
    typingEl.remove();
    console.error('Chat AI error:', err);
    appendMessage('bot', '⚠️ No pude conectar con el asistente IA. Puedes llamarnos al +56 2 2773 1554 o por WhatsApp al +56 9 8419 6310.', true);
  } finally {
    isTyping = false;
  }
};

// ── Init ──
export async function initChatbot() {
  // Cargar contexto del usuario (no bloquea la UI)
  userContext = await loadUserContext();

  // Personalizar saludo inicial
  const welcomeEl = document.querySelector('#aiMessages .ai-msg.bot');
  if (welcomeEl) {
    welcomeEl.innerHTML = formatReply(buildWelcomeMessage(userContext));
  }

  // Wiring del input
  const input = document.getElementById('aiInput');
  if (input) {
    input.removeAttribute('onkeydown');
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        window.aiSend();
      }
    });
  }
}
