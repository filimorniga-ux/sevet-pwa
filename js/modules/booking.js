/**
 * SEVET – Booking Module
 * Multi-step appointment booking connected to Supabase
 */
import { supabase } from '/js/supabase.js';

// ── State ──
const state = {
  currentStep: 1,
  selectedService: null,
  selectedProfessional: null,
  selectedDate: null,
  selectedTime: null,
  services: [],
  professionals: [],
  currentMonth: new Date().getMonth(),
  currentYear: new Date().getFullYear(),
};

// ── Init ──
document.addEventListener('DOMContentLoaded', async () => {
  await loadServices();
  setupSpecialtyTabs();
  setupCalendar();
  setupConfirmButton();
});

// ── Step Navigation ──
window.goToStep = function(step) {
  if (step < 1 || step > 4) return;
  
  // Hide all steps
  document.querySelectorAll('.booking-step').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.progress-step').forEach(s => {
    const sNum = parseInt(s.dataset.step);
    s.classList.toggle('active', sNum <= step);
    s.classList.toggle('completed', sNum < step);
  });
  
  // Show target step
  document.getElementById(`step${step}`).classList.add('active');
  state.currentStep = step;
  
  // Scroll to top of section
  window.scrollTo({ top: 100, behavior: 'smooth' });
  
  // Load step-specific data
  if (step === 2 && state.selectedService) loadProfessionals();
  if (step === 3) renderCalendar();
  if (step === 4) renderConfirmation();
};

// ── STEP 1: Load Services from Supabase ──
async function loadServices() {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('active', true)
    .order('specialty')
    .order('name');

  if (error) {
    console.error('Error loading services:', error);
    document.getElementById('servicesGrid').innerHTML = 
      '<p class="summary-empty">Error al cargar servicios. Intenta recargar la página.</p>';
    return;
  }

  state.services = data || [];
  renderServices('all');
}

function renderServices(specialty) {
  const grid = document.getElementById('servicesGrid');
  const filtered = specialty === 'all' 
    ? state.services 
    : state.services.filter(s => s.specialty === specialty);

  if (!filtered.length) {
    grid.innerHTML = '<p class="summary-empty">No hay servicios disponibles en esta categoría</p>';
    return;
  }

  grid.innerHTML = filtered.map(s => `
    <div class="service-card-v2 ${state.selectedService?.id === s.id ? 'selected' : ''}" 
         data-id="${s.id}" onclick="selectService('${s.id}')">
      <div class="svc-icon">${s.icon || '🩺'}</div>
      <div class="svc-info">
        <div class="svc-name">${s.name}</div>
        <div class="svc-desc">${s.description || ''}</div>
        <div class="svc-meta">
          <span class="svc-duration">⏱️ ${s.duration_min} min</span>
          <span class="svc-price">💰 $${(s.price || 0).toLocaleString('es-CL')}</span>
        </div>
      </div>
      <span class="svc-specialty-badge">${getSpecialtyLabel(s.specialty)}</span>
    </div>
  `).join('');
}

function getSpecialtyLabel(spec) {
  const labels = {
    general: 'General', cirugia: 'Cirugía', dermatologia: 'Dermatología',
    cardiologia: 'Cardiología', traumatologia: 'Traumatología',
    peluqueria: 'Peluquería', laboratorio: 'Laboratorio', urgencia: 'Urgencia'
  };
  return labels[spec] || spec;
}

window.selectService = function(id) {
  state.selectedService = state.services.find(s => s.id === id);
  // Brief visual feedback then advance
  renderServices(document.querySelector('.spec-tab.active')?.dataset.specialty || 'all');
  setTimeout(() => goToStep(2), 300);
};

function setupSpecialtyTabs() {
  document.getElementById('specialtyTabs')?.addEventListener('click', (e) => {
    const tab = e.target.closest('.spec-tab');
    if (!tab) return;
    document.querySelectorAll('.spec-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    renderServices(tab.dataset.specialty);
  });
}

// ── STEP 2: Load Professionals ──
async function loadProfessionals() {
  const grid = document.getElementById('professionalsGrid');
  grid.innerHTML = '<div class="loading-spinner">Cargando profesionales...</div>';
  
  const subtitle = document.getElementById('step2Subtitle');
  subtitle.textContent = `Profesionales disponibles para: ${state.selectedService.name}`;

  // For peluqueria, show groomers; for medical, show vets
  const roles = state.selectedService.requires_vet !== false ? ['vet', 'owner'] : ['groomer'];
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .in('role', roles)
    .eq('is_active', true);

  if (error || !data?.length) {
    // No specific professionals - allow "any available"
    state.professionals = [];
    grid.innerHTML = `
      <div class="prof-card selected" onclick="selectProfessional(null)">
        <div class="prof-avatar">🏥</div>
        <div class="prof-name">Cualquier profesional disponible</div>
        <div class="prof-specialty">Asignaremos al mejor profesional</div>
      </div>
    `;
    state.selectedProfessional = { id: null, full_name: 'Cualquier disponible' };
    return;
  }

  state.professionals = data;
  grid.innerHTML = `
    <div class="prof-card ${!state.selectedProfessional?.id ? 'selected' : ''}" onclick="selectProfessional(null)">
      <div class="prof-avatar">🏥</div>
      <div class="prof-name">Cualquier disponible</div>
      <div class="prof-specialty">Primer profesional libre</div>
    </div>
    ${data.map(p => `
      <div class="prof-card ${state.selectedProfessional?.id === p.id ? 'selected' : ''}" 
           onclick="selectProfessional('${p.id}')">
        <div class="prof-avatar">${p.avatar_url ? `<img src="${p.avatar_url}" alt="${p.full_name}"/>` : (p.role === 'groomer' ? '✂️' : '👨‍⚕️')}</div>
        <div class="prof-name">${p.full_name}</div>
        <div class="prof-specialty">${p.specialty || getRoleLabel(p.role)}</div>
      </div>
    `).join('')}
  `;
}

function getRoleLabel(role) {
  const labels = { vet: 'Médico Veterinario', groomer: 'Peluquero/a', owner: 'Director Médico' };
  return labels[role] || role;
}

window.selectProfessional = function(id) {
  if (id) {
    state.selectedProfessional = state.professionals.find(p => p.id === id);
  } else {
    state.selectedProfessional = { id: null, full_name: 'Cualquier disponible' };
  }
  // Visual feedback
  document.querySelectorAll('.prof-card').forEach(c => c.classList.remove('selected'));
  event.currentTarget.classList.add('selected');
  setTimeout(() => goToStep(3), 300);
};

// ── STEP 3: Calendar ──
function setupCalendar() {
  document.getElementById('prevMonth')?.addEventListener('click', () => {
    state.currentMonth--;
    if (state.currentMonth < 0) { state.currentMonth = 11; state.currentYear--; }
    renderCalendar();
  });
  document.getElementById('nextMonth')?.addEventListener('click', () => {
    state.currentMonth++;
    if (state.currentMonth > 11) { state.currentMonth = 0; state.currentYear++; }
    renderCalendar();
  });
}

function renderCalendar() {
  const grid = document.getElementById('calendarGrid');
  const label = document.getElementById('calendarMonthLabel');
  if (!grid || !label) return;

  const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  label.textContent = `${months[state.currentMonth]} ${state.currentYear}`;

  const firstDay = new Date(state.currentYear, state.currentMonth, 1);
  const lastDay = new Date(state.currentYear, state.currentMonth + 1, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Monday-based week (0=Mon, 6=Sun)
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  let html = '';
  // Empty cells for days before month start
  for (let i = 0; i < startDow; i++) html += '<div class="cal-day empty"></div>';

  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(state.currentYear, state.currentMonth, d);
    const isPast = date < today;
    const isSunday = date.getDay() === 0;
    const isSelected = state.selectedDate && 
      date.toDateString() === state.selectedDate.toDateString();
    
    const cls = [
      'cal-day',
      isPast ? 'past' : '',
      isSunday ? 'past' : '', // Clinic closed Sundays
      isSelected ? 'selected' : '',
      !isPast && !isSunday ? 'available' : ''
    ].filter(Boolean).join(' ');

    html += `<div class="${cls}" ${!isPast && !isSunday ? `onclick="selectDate(${state.currentYear},${state.currentMonth},${d})"` : ''}>${d}</div>`;
  }

  grid.innerHTML = html;
}

window.selectDate = function(y, m, d) {
  state.selectedDate = new Date(y, m, d);
  renderCalendar();
  loadTimeSlots();
};

async function loadTimeSlots() {
  const grid = document.getElementById('timeSlotsGrid');
  grid.innerHTML = '<div class="loading-spinner">Cargando horarios...</div>';

  const duration = state.selectedService?.duration_min || 30;
  
  // Generate time slots from 9:00 to 20:00
  const slots = [];
  for (let h = 9; h <= 20; h++) {
    for (let m = 0; m < 60; m += 30) {
      if (h === 20 && m > 0) break; // Last slot at 20:00
      const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      slots.push(timeStr);
    }
  }

  // Check existing appointments for this date + professional
  const dateStr = state.selectedDate.toISOString().split('T')[0];
  let query = supabase
    .from('appointments')
    .select('date_time, duration_min')
    .gte('date_time', `${dateStr}T00:00:00`)
    .lte('date_time', `${dateStr}T23:59:59`)
    .not('status', 'eq', 'cancelada');

  if (state.selectedProfessional?.id) {
    query = query.eq('vet_id', state.selectedProfessional.id);
  }

  const { data: existing } = await query;
  const bookedTimes = (existing || []).map(a => {
    const d = new Date(a.date_time);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  });

  // Check staff time off  
  if (state.selectedProfessional?.id) {
    const { data: timeOff } = await supabase
      .from('staff_time_off')
      .select('*')
      .eq('staff_id', state.selectedProfessional.id)
      .eq('status', 'approved')
      .lte('start_date', dateStr)
      .gte('end_date', dateStr);
    
    if (timeOff?.length) {
      grid.innerHTML = '<p class="summary-empty">⚠️ Este profesional no está disponible en esta fecha (día libre/vacaciones)</p>';
      return;
    }
  }

  const availableSlots = slots.filter(s => !bookedTimes.includes(s));

  if (!availableSlots.length) {
    grid.innerHTML = '<p class="summary-empty">No hay horarios disponibles para esta fecha</p>';
    return;
  }

  grid.innerHTML = availableSlots.map(s => {
    const isSelected = state.selectedTime === s;
    return `<button class="time-slot ${isSelected ? 'selected' : ''}" onclick="selectTime('${s}')">${s}</button>`;
  }).join('');
}

window.selectTime = function(time) {
  state.selectedTime = time;
  document.querySelectorAll('.time-slot').forEach(t => t.classList.remove('selected'));
  event.currentTarget.classList.add('selected');
  setTimeout(() => goToStep(4), 300);
};

// ── STEP 4: Confirmation ──
function renderConfirmation() {
  const s = state.selectedService;
  const p = state.selectedProfessional;
  const d = state.selectedDate;
  
  const months = ['enero','febrero','marzo','abril','mayo','junio',
    'julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const days = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];

  document.getElementById('confService').textContent = s?.name || '-';
  document.getElementById('confProfessional').textContent = p?.full_name || '-';
  document.getElementById('confDate').textContent = d 
    ? `${days[d.getDay()]} ${d.getDate()} de ${months[d.getMonth()]} ${d.getFullYear()}`
    : '-';
  document.getElementById('confTime').textContent = state.selectedTime || '-';
  document.getElementById('confDuration').textContent = s ? `${s.duration_min} minutos` : '-';
  document.getElementById('confPrice').textContent = s ? `$${(s.price || 0).toLocaleString('es-CL')} CLP` : '-';
}

function setupConfirmButton() {
  document.getElementById('confirmBookingBtn')?.addEventListener('click', confirmBooking);
}

async function confirmBooking() {
  const btn = document.getElementById('confirmBookingBtn');
  btn.disabled = true;
  btn.textContent = '⏳ Procesando...';

  try {
    // Build appointment datetime
    const [hours, minutes] = state.selectedTime.split(':');
    const dateTime = new Date(state.selectedDate);
    dateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    // Check if user is logged in
    const { data: { session } } = await supabase.auth.getSession();
    
    let petId = null;
    let bookedBy = null;
    const notes = document.getElementById('guestNotes')?.value || '';
    const guestName = document.getElementById('guestName')?.value || '';
    const guestPhone = document.getElementById('guestPhone')?.value || '';
    const guestEmail = document.getElementById('guestEmail')?.value || '';
    const guestPetName = document.getElementById('guestPetName')?.value || '';

    if (session) {
      // Get user's profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', session.user.id)
        .single();
      bookedBy = profile?.id;

      // Get first pet (or create one)
      const { data: pets } = await supabase
        .from('pets')
        .select('id')
        .eq('owner_id', profile?.id)
        .limit(1);
      petId = pets?.[0]?.id;
    }

    // Build combined notes with guest info
    const combinedNotes = [
      notes,
      !session && guestName ? `Contacto: ${guestName}` : '',
      !session && guestPhone ? `Tel: ${guestPhone}` : '',
      !session && guestEmail ? `Email: ${guestEmail}` : '',
      !session && guestPetName ? `Mascota: ${guestPetName}` : '',
    ].filter(Boolean).join(' | ');

    // Determine service_type from service
    const serviceType = mapServiceType(state.selectedService.specialty);

    const { error } = await supabase.from('appointments').insert({
      pet_id: petId,
      vet_id: state.selectedProfessional?.id || null,
      service_type: serviceType,
      service_id: state.selectedService.id,
      date_time: dateTime.toISOString(),
      status: 'pendiente',
      triage_level: state.selectedService.specialty === 'urgencia' ? 'urgente' : 'normal',
      notes: combinedNotes,
      booked_by: bookedBy,
      source: 'web',
      duration_min: state.selectedService.duration_min,
    });

    if (error) throw error;

    // Show success
    document.querySelector('.confirmation-card').classList.add('hidden');
    document.getElementById('bookingSuccess').classList.remove('hidden');

  } catch (err) {
    console.error('Booking error:', err);
    btn.disabled = false;
    btn.textContent = '❌ Error — Intentar de nuevo';
    setTimeout(() => { btn.textContent = '✅ Confirmar Cita'; }, 3000);
  }
}

function mapServiceType(specialty) {
  const map = {
    general: 'consulta', cirugia: 'cirugia', urgencia: 'urgencia',
    peluqueria: 'peluqueria', laboratorio: 'control',
    dermatologia: 'consulta', cardiologia: 'consulta', traumatologia: 'consulta'
  };
  return map[specialty] || 'consulta';
}
