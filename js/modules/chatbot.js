/* =========================================
   SEVET – Módulo Chatbot IA
   Asistente veterinario con IA
   ========================================= */

const BOT_RESPONSES = {
  saludo: [
    '¡Hola! 🐾 Soy el asistente virtual de SEVET. ¿En qué puedo ayudarte hoy?',
    '¡Bienvenido! 🏥 Estoy aquí para resolver tus dudas veterinarias.',
  ],
  emergencia: [
    '⚠️ **Si tu mascota tiene una emergencia, llama al 📞 +56 2 2773 1554 inmediatamente.**\n\nMientras tanto:\n- Mantén la calma\n- No le des medicamentos sin indicación\n- Transporta a tu mascota de forma segura',
  ],
  cita: [
    '📅 Puedes agendar una cita directamente desde nuestra plataforma. Te recomiendo visitar la sección de **Agendamiento Inteligente** donde podrás:\n\n1. Elegir el tipo de servicio\n2. Seleccionar fecha y hora\n3. Confirmar tu reserva\n\n👉 [Ir a Agendar](/pages/agendar.html)',
  ],
  vacunas: [
    '💉 **Calendario de Vacunación Canino:**\n- **8 semanas**: Parvovirus, Distemper\n- **12 semanas**: Séxtuple (refuerzo)\n- **16 semanas**: Séxtuple + Antirrábica\n- **Anual**: Refuerzo Séxtuple + Antirrábica\n\n🐈 **Calendario Felino:**\n- **8 semanas**: Triple Felina\n- **12 semanas**: Triple Felina (refuerzo)\n- **16 semanas**: Antirrábica + Leucemia\n- **Anual**: Refuerzos',
  ],
  horario: [
    '🕐 **Nuestros horarios:**\n- Lunes a Viernes: 9:00 – 20:00\n- Sábados: 9:00 – 14:00\n- Domingos: Cerrado\n- Urgencias: 24/7 📞 +56 2 2773 1554',
  ],
  default: [
    'Entiendo tu consulta. Te recomiendo agendar una cita con nuestros veterinarios para una evaluación profesional. 🩺\n\n¿Hay algo más en lo que pueda ayudarte?',
    'Esa es una buena pregunta. Para darte una respuesta más precisa, te sugiero consultar directamente con nuestro equipo médico. ¿Te gustaría agendar una cita? 📅',
  ],
};

const QUICK_ACTIONS = [
  { label: '📅 Agendar cita', query: 'cita' },
  { label: '💉 Vacunas', query: 'vacunas' },
  { label: '🕐 Horarios', query: 'horario' },
  { label: '🚨 Emergencia', query: 'emergencia' },
];

let chatMessages = [];

export function initChatbot() {
  const container = document.getElementById('chatbot-container');
  if (!container) return;

  container.innerHTML = `
    <div class="chat-window">
      <div class="chat-messages" id="chatMessages"></div>
      <div class="chat-quick-actions" id="quickActions">
        ${QUICK_ACTIONS.map(a => `
          <button class="quick-action-btn" onclick="window._chatSend('${a.query}')">${a.label}</button>
        `).join('')}
      </div>
      <div class="chat-input-area">
        <input type="text" class="chat-input" id="chatInput" placeholder="Escribe tu consulta..." 
               onkeypress="if(event.key==='Enter') window._chatSend()"/>
        <button class="chat-send-btn" onclick="window._chatSend()">→</button>
      </div>
    </div>`;

  // Initial greeting
  addBotMessage(BOT_RESPONSES.saludo[0]);
}

function addBotMessage(text) {
  chatMessages.push({ role: 'bot', text, time: new Date() });
  renderMessages();
}

function addUserMessage(text) {
  chatMessages.push({ role: 'user', text, time: new Date() });
  renderMessages();
}

window._chatSend = function(predefined) {
  const input = document.getElementById('chatInput');
  const text = predefined || (input ? input.value.trim() : '');
  if (!text) return;
  if (input) input.value = '';

  addUserMessage(text);

  // Simulate typing delay
  setTimeout(() => {
    const response = getResponse(text);
    addBotMessage(response);
  }, 600 + Math.random() * 400);
};

function getResponse(text) {
  const lower = text.toLowerCase();
  if (lower.includes('hola') || lower.includes('buenas') || lower === 'saludo')
    return pick(BOT_RESPONSES.saludo);
  if (lower.includes('emergencia') || lower.includes('urgente') || lower.includes('grave'))
    return pick(BOT_RESPONSES.emergencia);
  if (lower.includes('cita') || lower.includes('agendar') || lower.includes('reservar'))
    return pick(BOT_RESPONSES.cita);
  if (lower.includes('vacuna') || lower.includes('vacunas'))
    return pick(BOT_RESPONSES.vacunas);
  if (lower.includes('horario') || lower.includes('hora') || lower.includes('cuando'))
    return pick(BOT_RESPONSES.horario);
  return pick(BOT_RESPONSES.default);
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function renderMessages() {
  const el = document.getElementById('chatMessages');
  if (!el) return;
  el.innerHTML = chatMessages.map(m => `
    <div class="chat-msg ${m.role}">
      ${m.role === 'bot' ? '<span class="chat-bot-avatar">🤖</span>' : ''}
      <div class="chat-bubble">${formatChatText(m.text)}</div>
    </div>
  `).join('');
  el.scrollTop = el.scrollHeight;
}

function formatChatText(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="chat-link">$1</a>');
}
