/* =========================================
   SEVET – Módulo Agendamiento
   Lógica de calendario y reserva de citas
   ========================================= */

import { supabase } from '../supabase.js';

let selectedService = null;
let selectedDate = null;
let selectedTime = null;
let selectedVet = null;
let currentMonth = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Santiago' }));

// ── Servicios disponibles ──
const SERVICES = {
  consulta: { label: 'Consulta Médica', icon: '🩺', triage: 'normal', duration: 30 },
  vacuna:   { label: 'Vacunación', icon: '💉', triage: 'normal', duration: 20 },
  urgencia: { label: 'Urgencia', icon: '🚨', triage: 'urgente', duration: 45 },
  cirugia:  { label: 'Cirugía', icon: '🔬', triage: 'prioritario', duration: 90 },
  control:  { label: 'Control', icon: '📋', triage: 'normal', duration: 20 },
  peluqueria: { label: 'Peluquería', icon: '✂️', triage: 'normal', duration: 60 },
  guarderia:  { label: 'Guardería', icon: '🏠', triage: 'normal', duration: 480 },
};

// ── Horarios disponibles ──
const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
  '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
  '22:00', '22:30', '23:00', '23:30', '00:00', '00:30',
];

// ── Veterinarios (cargados desde Supabase o fallback) ──
let availableVets = [
  { id: null, name: 'Sin preferencia', specialty: 'Cualquier disponible' },
];

// ── Inicializar módulo ──
export function initAgendamiento() {
  const calendarEl = document.getElementById('calendarGrid');
  const legacyServiceCards = document.querySelectorAll('[data-service]');
  const summaryEl = document.getElementById('bookingSummary');
  const confirmBtn = document.getElementById('confirmBtn');

  // Guard: evita conflicto con el booking multi-step v2 (pages/agendar.html)
  if (!calendarEl || !summaryEl || !confirmBtn || legacyServiceCards.length === 0) return;

  legacyServiceCards.forEach(card => {
    card.addEventListener('click', () => selectService(card.dataset.service));
  });

  document.getElementById('prevMonth')?.addEventListener('click', () => changeMonth(-1));
  document.getElementById('nextMonth')?.addEventListener('click', () => changeMonth(1));

  loadVets();
  renderCalendar();
}

// ── Cargar veterinarios desde Supabase ──
async function loadVets() {
  try {
    const { data } = await supabase.from('profiles').select('id, full_name, role').eq('role', 'vet');
    if (data && data.length > 0) {
      availableVets = [
        { id: null, name: 'Sin preferencia', specialty: 'Cualquier disponible' },
        ...data.map(v => ({ id: v.id, name: v.full_name, specialty: 'Veterinario' }))
      ];
    }
  } catch { /* use fallback vets */ }
  renderVetSelector();
}

// ── Renderizar selector de veterinario ──
function renderVetSelector() {
  const container = document.getElementById('vetSelector');
  if (!container) return;
  container.innerHTML = availableVets.map(v => `
    <button class="vet-option ${selectedVet === v.id ? 'selected' : ''}" onclick="window._selectVet(${v.id === null ? 'null' : `'${v.id}'`})">
      <span class="vet-icon">🩺</span>
      <span class="vet-name">${v.name}</span>
      <span class="vet-spec">${v.specialty}</span>
    </button>
  `).join('');
  container.style.display = 'grid';
}

window._selectVet = function(id) {
  selectedVet = id;
  renderVetSelector();
  updateSummary();
};

function selectService(type) {
  selectedService = type;
  document.querySelectorAll('[data-service]').forEach(card => {
    card.classList.toggle('selected', card.dataset.service === type);
  });
  updateSummary();
  document.getElementById('calendarSection')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function changeMonth(delta) {
  currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + delta, 1);
  renderCalendar();
}

function renderCalendar() {
  const grid = document.getElementById('calendarGrid');
  const label = document.getElementById('calendarMonthLabel');
  if (!grid || !label) return;

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Santiago' }));
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  label.textContent = `${monthNames[month]} ${year}`;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let html = '';
  for (let i = 0; i < firstDay; i++) {
    html += '<div class="cal-day empty"></div>';
  }
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

window._selectDate = function(dateStr) {
  selectedDate = new Date(dateStr + 'T00:00:00');
  renderCalendar();
  renderTimeSlots();
  updateSummary();
};

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

window._selectTime = function(time) {
  selectedTime = time;
  renderTimeSlots();
  updateSummary();
};

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
    const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/Santiago' };
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

// ── Confirmar cita → Supabase ──
window._confirmBooking = async function() {
  if (!selectedService || !selectedDate || !selectedTime) return;

  const confirmBtn = document.getElementById('confirmBtn');
  if (confirmBtn) {
    confirmBtn.disabled = true;
    confirmBtn.textContent = '⏳ Procesando...';
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      if (confirmBtn) {
        confirmBtn.textContent = '🔐 Debes iniciar sesión';
        confirmBtn.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
        setTimeout(() => { window.location.href = '/pages/auth.html'; }, 1500);
      }
      return;
    }

    const dateStr = selectedDate.toISOString().split('T')[0];
    const dateTime = `${dateStr}T${selectedTime}:00-03:00`;

    const { data: inserted, error } = await supabase.from('appointments').insert({
      pet_id: null,
      vet_id: selectedVet || null,
      service_type: selectedService,
      date_time: dateTime,
      status: 'pendiente',
      triage_level: SERVICES[selectedService]?.triage || 'normal',
      notes: `Reserva online - ${SERVICES[selectedService]?.label}`,
    }).select('id').single();

    if (error) throw error;

    if (confirmBtn) {
      confirmBtn.textContent = '✅ ¡Cita Reservada!';
      confirmBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
    }

    // Webhook para notificaciones + sync Google Calendar
    try {
      const svc = SERVICES[selectedService];
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      try {
        await fetch('https://zyvwcxsqdbegzjlmgtou.supabase.co/functions/v1/webhook-appointment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'new_appointment',
            appointment_id: inserted?.id || null,
            vet_id: selectedVet || null,
            service: svc?.label,
            date: dateStr,
            time: selectedTime,
            start_time: dateTime,                      // ISO 8601 con TZ
            duration_min: svc?.duration || 30,
            userEmail: user.email,
          }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }
    } catch { /* webhook failure is non-blocking */ }

    // ── Google Calendar Sync (fire-and-forget) ──────────────
    if (inserted?.id) {
      try {
        const userIdsToSync = [user.id];
        if (selectedVet) userIdsToSync.push(selectedVet);
        const { data: { session } } = await supabase.auth.getSession();
        const authHeader = session?.access_token
          ? { 'Authorization': `Bearer ${session.access_token}` }
          : {};
        fetch('https://zyvwcxsqdbegzjlmgtou.supabase.co/functions/v1/sync-to-gcal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeader },
          body: JSON.stringify({
            appointment_id: inserted.id,
            user_ids: userIdsToSync,
            action: 'create',
          }),
        }).catch(() => { /* gcal sync failure is non-blocking */ });
      } catch { /* gcal sync failure is non-blocking */ }
    }


    // Reset after 3s
    setTimeout(() => {
      selectedService = null;
      selectedDate = null;
      selectedTime = null;
      selectedVet = null;
      document.querySelectorAll('[data-service]').forEach(c => c.classList.remove('selected'));
      renderCalendar();
      const timeSlots = document.getElementById('timeSlots');
      if (timeSlots) timeSlots.style.display = 'none';
      renderVetSelector();
      updateSummary();
      if (confirmBtn) {
        confirmBtn.textContent = 'Completa la selección';
        confirmBtn.disabled = true;
        confirmBtn.style.background = '';
      }
    }, 3000);

  } catch (err) {
    console.error('Error booking:', err);
    if (confirmBtn) {
      confirmBtn.textContent = '❌ Error al reservar. Intenta de nuevo.';
      confirmBtn.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
      setTimeout(() => {
        confirmBtn.textContent = 'Confirmar Cita →';
        confirmBtn.disabled = false;
        confirmBtn.style.background = '';
      }, 3000);
    }
  }
};
