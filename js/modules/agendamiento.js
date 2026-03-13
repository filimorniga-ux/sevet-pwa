/* =========================================
   SEVET – Módulo Agendamiento
   Lógica de calendario y reserva de citas
   ========================================= */

import { supabase } from '../supabase.js';

// ── Estado del formulario ──
let selectedService = null;
let selectedDate = null;
let selectedTime = null;
let currentMonth = new Date();

// ── Servicios disponibles ──
const SERVICES = {
  consulta: { label: 'Consulta Médica', icon: '🩺', triage: 'normal', duration: 30 },
  vacuna:   { label: 'Vacunación', icon: '💉', triage: 'normal', duration: 20 },
  urgencia: { label: 'Urgencia', icon: '🚨', triage: 'urgente', duration: 45 },
  cirugia:  { label: 'Cirugía', icon: '🔬', triage: 'prioritario', duration: 90 },
  control:  { label: 'Control', icon: '📋', triage: 'normal', duration: 20 },
};

// ── Horarios disponibles ──
const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
  '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
  '22:00', '22:30', '23:00', '23:30', '00:00', '00:30',
];

// ── Inicializar módulo ──
export function initAgendamiento() {
  const calendarEl = document.getElementById('calendarGrid');
  if (!calendarEl) return; // no estamos en la página de agendar

  // Service cards click
  document.querySelectorAll('[data-service]').forEach(card => {
    card.addEventListener('click', () => selectService(card.dataset.service));
  });

  // Nav buttons
  document.getElementById('prevMonth')?.addEventListener('click', () => changeMonth(-1));
  document.getElementById('nextMonth')?.addEventListener('click', () => changeMonth(1));

  renderCalendar();
}

// ── Seleccionar servicio ──
function selectService(type) {
  selectedService = type;
  document.querySelectorAll('[data-service]').forEach(card => {
    card.classList.toggle('selected', card.dataset.service === type);
  });
  updateSummary();

  // Scroll suave al calendario
  document.getElementById('calendarSection')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ── Cambiar mes ──
function changeMonth(delta) {
  currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + delta, 1);
  renderCalendar();
}

// ── Renderizar calendario ──
function renderCalendar() {
  const grid = document.getElementById('calendarGrid');
  const label = document.getElementById('calendarMonthLabel');
  if (!grid || !label) return;

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  label.textContent = `${monthNames[month]} ${year}`;

  // Primer día y total de días
  const firstDay = new Date(year, month, 1).getDay(); // 0=Dom
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Generar HTML
  let html = '';
  // Días vacíos al inicio
  for (let i = 0; i < firstDay; i++) {
    html += '<div class="cal-day empty"></div>';
  }
  // Días del mes
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const isPast = date < today;
    const isToday = date.getTime() === today.getTime();
    const isSunday = date.getDay() === 0;
    const isSelected = selectedDate && date.getTime() === selectedDate.getTime();

    const classes = ['cal-day'];
    if (isPast || isSunday) classes.push('disabled');
    if (isToday) classes.push('today');
    if (isSelected) classes.push('selected');

    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    html += `<div class="${classes.join(' ')}" data-date="${dateStr}" ${(isPast || isSunday) ? '' : `onclick="window._selectDate('${dateStr}')"`}>${d}</div>`;
  }

  grid.innerHTML = html;
}

// ── Seleccionar fecha (expuesta a window para onclick) ──
window._selectDate = function(dateStr) {
  selectedDate = new Date(dateStr + 'T00:00:00');
  renderCalendar();
  renderTimeSlots();
  updateSummary();
};

// ── Renderizar horarios ──
function renderTimeSlots() {
  const container = document.getElementById('timeSlots');
  if (!container || !selectedDate) return;

  let html = '<div class="time-grid">';
  TIME_SLOTS.forEach(time => {
    const isSelected = selectedTime === time;
    html += `<button class="time-slot ${isSelected ? 'selected' : ''}" onclick="window._selectTime('${time}')">${time}</button>`;
  });
  html += '</div>';
  container.innerHTML = html;
  container.style.display = 'block';
}

// ── Seleccionar hora ──
window._selectTime = function(time) {
  selectedTime = time;
  renderTimeSlots();
  updateSummary();
};

// ── Actualizar resumen ──
function updateSummary() {
  const summaryEl = document.getElementById('bookingSummary');
  const confirmBtn = document.getElementById('confirmBtn');
  if (!summaryEl) return;

  const svc = selectedService ? SERVICES[selectedService] : null;

  let html = '';
  if (svc) {
    html += `<div class="summary-item"><span class="summary-label">Servicio</span><span class="summary-value">${svc.icon} ${svc.label}</span></div>`;
    html += `<div class="summary-item"><span class="summary-label">Triage</span><span class="summary-triage triage-${svc.triage}">${svc.triage.toUpperCase()}</span></div>`;
    html += `<div class="summary-item"><span class="summary-label">Duración est.</span><span class="summary-value">${svc.duration} min</span></div>`;
  }
  if (selectedDate) {
    const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    html += `<div class="summary-item"><span class="summary-label">Fecha</span><span class="summary-value">${selectedDate.toLocaleDateString('es-CL', opts)}</span></div>`;
  }
  if (selectedTime) {
    html += `<div class="summary-item"><span class="summary-label">Hora</span><span class="summary-value">${selectedTime} hrs</span></div>`;
  }

  if (!html) {
    html = '<p class="summary-empty">Selecciona un servicio, fecha y hora para ver el resumen de tu reserva.</p>';
  }

  summaryEl.innerHTML = html;

  if (confirmBtn) {
    const canConfirm = selectedService && selectedDate && selectedTime;
    confirmBtn.disabled = !canConfirm;
    confirmBtn.textContent = canConfirm ? 'Confirmar Cita →' : 'Completa la selección';
  }
}

// ── Confirmar cita ──
window._confirmBooking = async function() {
  if (!selectedService || !selectedDate || !selectedTime) return;

  const confirmBtn = document.getElementById('confirmBtn');
  if (confirmBtn) {
    confirmBtn.disabled = true;
    confirmBtn.textContent = '⏳ Procesando...';
  }

  // TODO: Verificar autenticación y crear cita en Supabase
  // Por ahora, mostrar éxito simulado
  setTimeout(() => {
    if (confirmBtn) {
      confirmBtn.textContent = '✅ ¡Cita Reservada!';
      confirmBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';

      // Reset después de 3 seg
      setTimeout(() => {
        selectedService = null;
        selectedDate = null;
        selectedTime = null;
        document.querySelectorAll('[data-service]').forEach(c => c.classList.remove('selected'));
        renderCalendar();
        const timeSlots = document.getElementById('timeSlots');
        if (timeSlots) timeSlots.style.display = 'none';
        updateSummary();
        if (confirmBtn) {
          confirmBtn.textContent = 'Completa la selección';
          confirmBtn.disabled = true;
          confirmBtn.style.background = '';
        }
      }, 3000);
    }
  }, 1200);
};
