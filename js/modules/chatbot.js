/* =========================================
   SEVET – Módulo Chatbot IA Real
   Conectado a Supabase Edge Function chat-ai (GPT-4o-mini)
   ========================================= */

const CHAT_ENDPOINT = 'https://zyvwcxsqdbegzjlmgtou.supabase.co/functions/v1/chat-ai';
const MAX_HISTORY = 10;

let chatHistory = [];
let isTyping = false;

// ── Escape XSS ──
function esc(s) {
  return s ? String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;') : '';
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
function appendMessage(role, text) {
  const messages = document.getElementById('aiMessages');
  if (!messages) return;

  const el = document.createElement('div');
  el.className = `ai-msg ${role}`;
  el.innerHTML = role === 'bot' ? formatReply(text) : esc(text);
  messages.appendChild(el);
  messages.scrollTop = messages.scrollHeight;

  // Hide quick buttons after first user message
  if (role === 'user') {
    const qb = document.querySelector('.ai-quick-btns');
    if (qb) qb.style.display = 'none';
  }
}

// ── Toggle chatbot panel ──
window.toggleAI = function() {
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
window.aiQuick = function(question) {
  const input = document.getElementById('aiInput');
  if (input) input.value = question;
  window.aiSend();
};

// ── Send message to real AI ──
window.aiSend = async function() {
  const input = document.getElementById('aiInput');
  const messages = document.getElementById('aiMessages');
  if (!input || !messages || isTyping) return;

  const text = input.value.trim();
  if (!text) return;

  input.value = '';
  appendMessage('user', text);
  chatHistory.push({ role: 'user', content: text });

  // Typing indicator
  isTyping = true;
  const typingEl = document.createElement('div');
  typingEl.className = 'ai-msg bot';
  typingEl.innerHTML = '<span style="animation:pulse 1s infinite">🤖 Pensando...</span>';
  typingEl.id = 'aiTyping';
  messages.appendChild(typingEl);
  messages.scrollTop = messages.scrollHeight;

  try {
    const res = await fetch(CHAT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
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

    appendMessage('bot', reply);
    chatHistory.push({ role: 'assistant', content: reply });

  } catch (err) {
    typingEl.remove();
    console.error('Chat AI error:', err);
    appendMessage('bot', '⚠️ No pude conectar con el asistente IA. Puedes llamarnos al +56 2 2773 1554 o por WhatsApp al +56 9 8419 6310.');
  } finally {
    isTyping = false;
  }
};

// Self-init
export function initChatbot() {
  // The widget HTML already exists in index.html — just ensure events are wired
  const input = document.getElementById('aiInput');
  if (input) {
    // Replace the inline onkeydown to use the real function
    input.removeAttribute('onkeydown');
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        window.aiSend();
      }
    });
  }
}
