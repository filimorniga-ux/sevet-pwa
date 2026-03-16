/**
 * SEVET – Booking Module
 * Multi-step appointment booking connected to Supabase
 */
import { supabase } from '/js/supabase.js';
import { initAuth } from '/js/auth.js';
import { buildCombinedBookingNotes, validateGuestBookingInput } from '/js/modules/booking-utils.js';

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
  await initAuth(); // Esperar a que se resuelva la sesión antes de hacer fetch
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
    : state.services.filter(s => matchesSpecialtyFilter(s, specialty));

  if (!filtered.length) {
    grid.innerHTML = '<p class="summary-empty">No hay servicios disponibles en esta categoría</p>';
    return;
  }

  grid.innerHTML = (filtered || []).map(s => `
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
      <span class="svc-specialty-badge">${getSpecialtyLabel(getServiceClassifier(s))}</span>
    </div>
  `).join('');
}

function getSpecialtyLabel(spec) {
  const labels = {
    consulta: 'Consulta',
    general: 'General', cirugia: 'Cirugía', dermatologia: 'Dermatología',
    cardiologia: 'Cardiología', traumatologia: 'Traumatología',
    peluqueria: 'Peluquería', laboratorio: 'Laboratorio', urgencia: 'Urgencia',
    estetica: 'Peluquería', preventivo: 'Preventivo', teleconsulta: 'Telemedicina',
    guarderia: 'Guardería', nutricion: 'Nutrición'
  };
  return labels[spec] || spec;
}

function getServiceClassifier(service) {
  return (service?.specialty || service?.category || 'general').toLowerCase();
}

function matchesSpecialtyFilter(service, filter) {
  const classifier = getServiceClassifier(service);
  if (classifier === filter) return true;

  const aliases = {
    general: ['consulta', 'preventivo', 'nutricion', 'teleconsulta'],
    peluqueria: ['estetica', 'grooming'],
  };

  return (aliases[filter] || []).includes(classifier);
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

  // For peluqueria, show groomers; for medical, show vets/owner
  const classifier = getServiceClassifier(state.selectedService);
  const isGrooming = ['peluqueria', 'estetica', 'grooming'].includes(classifier);
  const roles = isGrooming ? ['groomer'] : ['vet', 'owner'];
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .in('role', roles);

  state.professionals = data || [];

  // Always show "any available" option + individual professionals
  grid.innerHTML = `
    <div class="prof-card ${!state.selectedProfessional?.id ? 'selected' : ''}" onclick="selectProfessional(null, this)">
      <div class="prof-avatar">🏥</div>
      <div class="prof-name">Cualquier disponible</div>
      <div class="prof-specialty">Primer profesional libre</div>
    </div>
    ${(data || []).map(p => `
      <div class="prof-card ${state.selectedProfessional?.id === p.id ? 'selected' : ''}" 
           onclick="selectProfessional('${p.id}', this)">
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

window.selectProfessional = function(id, el) {
  if (id) {
    state.selectedProfessional = state.professionals.find(p => p.id === id);
  } else {
    state.selectedProfessional = { id: null, full_name: 'Cualquier disponible' };
  }
  // Visual feedback
  document.querySelectorAll('.prof-card').forEach(c => c.classList.remove('selected'));
  if (el) el.classList.add('selected');
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
    const isToday = date.toDateString() === today.toDateString();
    const isSelected = state.selectedDate && 
      date.toDateString() === state.selectedDate.toDateString();
    
    const cls = [
      'cal-day',
      isPast ? 'past' : '',
      isSunday ? 'past' : '',
      isToday ? 'today' : '',
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

  // Fix timezone shift by extracting local date string directly
  const y = state.selectedDate.getFullYear();
  const m = String(state.selectedDate.getMonth() + 1).padStart(2, '0');
  const d = String(state.selectedDate.getDate()).padStart(2, '0');
  const dateStr = `${y}-${m}-${d}`;

  // Check existing appointments for this date + professional
  let query = supabase
    .from('appointments')
    .select('date_time')
    .gte('date_time', `${dateStr}T00:00:00`)
    .lte('date_time', `${dateStr}T23:59:59`)
    .not('status', 'eq', 'cancelada');

  const availableStaffIds = state.professionals.map(p => p.id);

  if (state.selectedProfessional?.id) {
    query = query.eq('vet_id', state.selectedProfessional.id);
  } else {
    // If "Cualquier disponible", filter existing appointments by the eligible staff for this service
    query = query.in('vet_id', availableStaffIds);
  }

  const { data: existing } = await query;
  const bookedTimes = (existing || []).map(a => {
    const dObj = new Date(a.date_time);
    return `${dObj.getHours().toString().padStart(2, '0')}:${dObj.getMinutes().toString().padStart(2, '0')}`;
  });

  // Calculate capacity
  let capacity = 1;
  let availableSlots = [];

  if (state.selectedProfessional?.id) {
    // Check staff time off
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
    availableSlots = slots.filter(s => !bookedTimes.includes(s));
  } else {
    // "Cualquier disponible" capacity logic
    // We already loaded state.professionals filtered by the correct role in step 2 (loadProfessionals)
    const totalProfessionals = availableStaffIds.length;

    // Check how many of THESE specific professionals are on time off
    const { data: timeOffs } = await supabase
      .from('staff_time_off')
      .select('staff_id')
      .eq('status', 'approved')
      .lte('start_date', dateStr)
      .gte('end_date', dateStr)
      .in('staff_id', availableStaffIds);

    const staffOnLeave = new Set((timeOffs || []).map(t => t.staff_id)).size;
    capacity = Math.max(0, totalProfessionals - staffOnLeave);

    if (capacity === 0) {
      grid.innerHTML = '<p class="summary-empty">No hay profesionales disponibles en esta fecha.</p>';
      return;
    }

    // Filter slots based on total booked count vs capacity
    const bookedCountPerSlot = {};
    for (const time of bookedTimes) {
      bookedCountPerSlot[time] = (bookedCountPerSlot[time] || 0) + 1;
    }

    availableSlots = slots.filter(s => (bookedCountPerSlot[s] || 0) < capacity);
  }

  if (!availableSlots.length) {
    grid.innerHTML = '<p class="summary-empty">No hay horarios disponibles para esta fecha</p>';
    return;
  }

  grid.innerHTML = availableSlots.map(s => {
    const isSelected = state.selectedTime === s;
    return `<button class="time-slot ${isSelected ? 'selected' : ''}" onclick="selectTime('${s}', this)">${s}</button>`;
  }).join('');
}

window.selectTime = function(time, el) {
  state.selectedTime = time;
  document.querySelectorAll('.time-slot').forEach(t => t.classList.remove('selected'));
  if (el) el.classList.add('selected');
  setTimeout(() => goToStep(4), 300);
};

// ── STEP 4: Confirmation ──
async function renderConfirmation() {
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

  // Check auth to hide guest contact form if logged in
  const { data: { session } } = await supabase.auth.getSession();
  const guestContact = document.getElementById('guestContact');
  if (guestContact) {
    guestContact.style.display = session ? 'none' : 'block';

    // Disable inputs when hidden to prevent HTML5 validation issues
    const inputs = guestContact.querySelectorAll('input, textarea');
    inputs.forEach(input => {
      if (session) {
        input.disabled = true;
        input.removeAttribute('required');
      } else {
        input.disabled = false;
      }
    });
  }
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
    let profileId = null;
    const notes = document.getElementById('guestNotes')?.value || '';
    const guestName = (document.getElementById('guestName')?.value || '').trim();
    const guestPhone = (document.getElementById('guestPhone')?.value || '').trim();
    const guestEmail = (document.getElementById('guestEmail')?.value || '').trim();
    const guestPetName = (document.getElementById('guestPetName')?.value || '').trim();

    if (session) {
      // Get user's profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      profileId = profile?.id || null;

      // Get first pet (mínimo requerido para usuarios autenticados)
      const { data: pets } = await supabase
        .from('pets')
        .select('id')
        .eq('owner_id', profileId)
        .limit(1);
      petId = pets?.[0]?.id || null;

      // Si no tiene mascotas, permitir agendar igual (se puede agregar después)
      if (!petId) {
        console.warn('[booking] Usuario sin mascotas registradas, agendando sin pet_id');
      }
    } else {
      const guestValidationError = validateGuestBookingInput({ guestName, guestPhone, guestPetName });
      if (guestValidationError) throw new Error(guestValidationError);
    }

    // Build combined notes with guest info only for guest bookings
    const combinedNotes = buildCombinedBookingNotes({
      notes,
      guestName,
      guestPhone,
      guestEmail,
      guestPetName,
      includeGuestMetadata: !session,
    });

    // Determine service_type from service
    const classifier = getServiceClassifier(state.selectedService);
    const serviceType = mapServiceType(classifier);

    const { error } = await supabase.from('appointments').insert({
      pet_id: petId || null,
      service_id: state.selectedService?.id || null,
      vet_id: state.selectedProfessional?.id || null,
      booked_by: profileId || null,
      service_type: serviceType,
      date_time: dateTime.toISOString(),
      source: 'web',
      duration_min: state.selectedService?.duration_min || 30,
      status: 'pendiente',
      triage_level: classifier === 'urgencia' ? 'urgente' : 'normal',
      notes: combinedNotes,
      guest_name: session ? null : guestName,
      guest_phone: session ? null : guestPhone,
      guest_email: session ? null : (guestEmail || null),
      guest_pet_name: session ? null : guestPetName,
    });

    if (error) throw error;

    // Fire webhook to Make.com for notifications (non-blocking)
    const webhookUrl = 'https://zyvwcxsqdbegzjlmgtou.supabase.co/functions/v1/webhook-appointment';
    const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    const days = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
    const friendlyDate = `${days[dateTime.getDay()]} ${dateTime.getDate()} de ${months[dateTime.getMonth()]} ${dateTime.getFullYear()}`;
    
    fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'new_appointment',
        service: state.selectedService?.name || serviceType,
        professional: state.selectedProfessional?.full_name || 'Cualquier disponible',
        vet_id: state.selectedProfessional?.id || null,
        date: friendlyDate,
        time: state.selectedTime,
        duration: state.selectedService?.duration_min || 30,
        price: state.selectedService?.price || 0,
        guest_name: guestName || session?.user?.user_metadata?.full_name || '',
        guest_email: guestEmail || session?.user?.email || '',
        guest_phone: guestPhone || '',
        guest_pet_name: guestPetName || '',
        source: 'web',
      }),
    }).catch(e => console.warn('[booking] Webhook notification failed:', e));

    // Show success
    document.querySelector('.confirmation-card').classList.add('hidden');
    document.getElementById('bookingSuccess').classList.remove('hidden');

    // Show registration invite for guests
    if (!session) {
      document.getElementById('registerInvite')?.classList.remove('hidden');
    }

  } catch (err) {
    console.error('Booking error:', err);
    btn.disabled = false;
    btn.textContent = `❌ ${err?.message || 'Error — Intentar de nuevo'}`;
    setTimeout(() => { btn.textContent = '✅ Confirmar Cita'; }, 3000);
  }
}

function mapServiceType(specialty) {
  const map = {
    general: 'consulta',
    consulta: 'consulta',
    cirugia: 'cirugia',
    urgencia: 'urgencia',
    peluqueria: 'peluqueria',
    estetica: 'peluqueria',
    guarderia: 'guarderia',
    laboratorio: 'control',
    preventivo: 'control',
    nutricion: 'control',
    teleconsulta: 'consulta',
    dermatologia: 'consulta', cardiologia: 'consulta', traumatologia: 'consulta'
  };
  return map[specialty] || 'consulta';
}
