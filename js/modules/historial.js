/* =========================================
   SEVET – Módulo 4: Historial Médico Veterinario
   Ficha clínica SOAP con datos reales (Supabase)
   ========================================= */

import { supabase } from '../supabase.js';

const STAFF_ROLES = new Set(['vet', 'admin', 'owner']);

const FALLBACK_RECORDS = [
  {
    id: 'demo-1',
    date: '2026-03-05',
    type: 'consulta',
    vet: 'Dra. Carolina Reyes',
    patient: 'Luna',
    breed: 'Golden Retriever',
    soap: {
      subjective: 'Propietario reporta inapetencia de 3 días, sin vómitos ni diarrea.',
      objective: 'T: 38.6°C | FC: 82bpm | FR: 20rpm | Peso: 28.2kg.',
      assessment: 'Gingivitis leve asociada a enfermedad periodontal grado I.',
      plan: '1. Limpieza dental programada\n2. Dieta blanda por 5 días\n3. Control en 7 días',
    },
    attachments: ['Hemograma', 'Foto oral'],
  },
  {
    id: 'demo-2',
    date: '2026-01-15',
    type: 'vacunacion',
    vet: 'Dr. Andrés Muñoz',
    patient: 'Luna',
    breed: 'Golden Retriever',
    soap: {
      subjective: 'Visita programada para refuerzo anual. Sin quejas del propietario.',
      objective: 'Examen general sin hallazgos anormales. Estado corporal 5/9.',
      assessment: 'Paciente sano. Apto para vacunación.',
      plan: '1. Refuerzo de vacuna aplicado\n2. Próximo control anual',
    },
    attachments: ['Certificado vacunación'],
  },
  {
    id: 'demo-3',
    date: '2025-09-12',
    type: 'cirugia',
    vet: 'Dr. Felipe Contreras',
    patient: 'Luna',
    breed: 'Golden Retriever',
    soap: {
      subjective: 'Programada esterilización electiva. Ayuno cumplido.',
      objective: 'Exámenes prequirúrgicos dentro de rango normal.',
      assessment: 'Paciente apto para cirugía electiva.',
      plan: '1. Protocolo anestésico estándar\n2. Analgesia multimodal\n3. Control postoperatorio',
    },
    attachments: ['Prequirúrgico', 'Foto incisión'],
  },
];

const RECORD_TYPES = {
  consulta: { icon: '🩺', color: 'var(--blue-600)', label: 'Consulta' },
  vacunacion: { icon: '💉', color: '#10b981', label: 'Vacunación' },
  vacuna: { icon: '💉', color: '#10b981', label: 'Vacunación' },
  cirugia: { icon: '🔪', color: '#8b5cf6', label: 'Cirugía' },
  urgencia: { icon: '🚨', color: '#ef4444', label: 'Urgencia' },
  emergencia: { icon: '🚨', color: '#ef4444', label: 'Urgencia' },
  control: { icon: '📋', color: '#f59e0b', label: 'Control' },
  peluqueria: { icon: '✂️', color: '#f97316', label: 'Peluquería' },
  guarderia: { icon: '🏠', color: '#6366f1', label: 'Guardería' },
};

const state = {
  activeFilter: 'all',
  selectedPetId: 'all',
  expandedRecord: null,
  records: [],
  pets: [],
  profile: null,
  mode: 'demo',
  canCreateSoap: false,
  isFichaPage: false,
};

function resetState() {
  state.activeFilter = 'all';
  state.selectedPetId = 'all';
  state.expandedRecord = null;
  state.records = [...FALLBACK_RECORDS];
  state.pets = buildPetList(state.records);
  state.profile = null;
  state.mode = 'demo';
  state.canCreateSoap = false;
  state.isFichaPage = window.location.pathname.includes('/ficha-clinica.html');
}

export function initHistorial() {
  const container = document.getElementById('historial-container');
  if (!container) return;

  resetState();
  container.innerHTML = `
    <div class="historial-layout">
      <aside class="historial-sidebar">
        <div id="historialPatientCard"></div>
        <div id="historialStats"></div>
        <div id="historialPetFilter"></div>
        <div class="historial-filters">
          <button class="historial-filter active" onclick="window._filterRecords('all', this)">Todos</button>
          <button class="historial-filter" onclick="window._filterRecords('consulta', this)">🩺 Consultas</button>
          <button class="historial-filter" onclick="window._filterRecords('vacunacion', this)">💉 Vacunas</button>
          <button class="historial-filter" onclick="window._filterRecords('cirugia', this)">🔪 Cirugías</button>
          <button class="historial-filter" onclick="window._filterRecords('urgencia', this)">🚨 Urgencias</button>
        </div>
      </aside>
      <div class="historial-main">
        <div id="soapComposer"></div>
        <div class="historial-records" id="historialRecords"></div>
      </div>
    </div>`;

  bindWindowEvents();
  renderSidebar();
  renderRecords();
  void hydrateFromDatabase();
}

function bindWindowEvents() {
  window._filterRecords = (type, triggerEl) => {
    state.activeFilter = type;
    document.querySelectorAll('.historial-filter').forEach((b) => b.classList.remove('active'));
    if (triggerEl) triggerEl.classList.add('active');
    renderRecords();
  };

  window._toggleRecord = (id) => {
    state.expandedRecord = state.expandedRecord === id ? null : id;
    renderRecords();
  };

  window._selectHistorialPet = (petId) => {
    state.selectedPetId = petId;
    renderSidebar();
    renderRecords();
  };

  window._saveSoapRecord = async () => {
    await saveSoapRecord();
  };

  window._buyTreatmentFromEncoded = (encoded) => {
    try {
      const medications = JSON.parse(decodeURIComponent(encoded));
      buyTreatment(medications);
    } catch {
      buyTreatment([]);
    }
  };

  window._buyTreatment = buyTreatment;
}

async function hydrateFromDatabase() {
  try {
    const { data: authData } = await supabase.auth.getSession();
    const session = authData?.session;
    if (!session) {
      renderSidebar();
      renderComposer();
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role, full_name')
      .eq('user_id', session.user.id)
      .single();

    state.profile = profile || null;
    state.canCreateSoap = Boolean(state.isFichaPage && profile && STAFF_ROLES.has(profile.role));

    const { data: recordsData, error: recordsError } = await supabase
      .from('medical_records')
      .select(`
        id,
        pet_id,
        vet_id,
        record_type,
        subjective,
        objective,
        assessment,
        plan,
        created_at,
        pets(name, breed, species),
        profiles!medical_records_vet_id_fkey(full_name),
        appointments(service_type),
        diagnostic_images(type, created_at)
      `)
      .order('created_at', { ascending: false })
      .limit(120);

    if (!recordsError) {
      state.records = (recordsData || []).map(mapMedicalRecordRow);
      state.mode = 'live';
    }

    if (state.canCreateSoap) {
      const { data: petsData } = await supabase
        .from('pets')
        .select('id, name, breed, species')
        .order('name');
      state.pets = buildPetListFromRows(petsData || []);
    } else {
      state.pets = buildPetList(state.records);
    }

    if (!state.records.length && state.mode === 'live') {
      state.selectedPetId = 'all';
    }

    renderSidebar();
    renderComposer();
    renderRecords();
  } catch {
    renderSidebar();
    renderComposer();
    renderRecords();
  }
}

function renderSidebar() {
  renderPatientCard();
  renderStats();
  renderPetFilter();
}

function renderPatientCard() {
  const cardEl = document.getElementById('historialPatientCard');
  if (!cardEl) return;

  const selected = state.selectedPetId === 'all'
    ? null
    : state.pets.find((p) => p.id === state.selectedPetId);

  const title = selected
    ? escapeHtml(selected.name)
    : state.mode === 'live'
      ? 'Historial Clínico'
      : 'Modo Demo';

  const subtitle = selected
    ? escapeHtml(`${selected.breed || selected.species || 'Mascota'} · Registros médicos`)
    : state.mode === 'live'
      ? 'Registros reales sincronizados con Supabase'
      : 'Sin sesión activa, mostrando datos referenciales';

  cardEl.innerHTML = `
    <div class="historial-patient-card">
      <span class="historial-patient-avatar">${selected ? '🐾' : '📁'}</span>
      <div>
        <div class="historial-patient-name">${title}</div>
        <div class="historial-patient-breed">${subtitle}</div>
      </div>
    </div>`;
}

function renderStats() {
  const statsEl = document.getElementById('historialStats');
  if (!statsEl) return;

  const records = getFilteredByPetRecords();
  const counts = {
    total: records.length,
    vacunacion: records.filter((r) => normalizeRecordType(r.type) === 'vacunacion').length,
    cirugia: records.filter((r) => normalizeRecordType(r.type) === 'cirugia').length,
  };

  statsEl.innerHTML = `
    <div class="historial-stats">
      <div class="historial-stat">
        <div class="historial-stat-num">${counts.total}</div>
        <div class="historial-stat-label">Registros</div>
      </div>
      <div class="historial-stat">
        <div class="historial-stat-num">${counts.vacunacion}</div>
        <div class="historial-stat-label">Vacunas</div>
      </div>
      <div class="historial-stat">
        <div class="historial-stat-num">${counts.cirugia}</div>
        <div class="historial-stat-label">Cirugías</div>
      </div>
    </div>`;
}

function renderPetFilter() {
  const petFilterEl = document.getElementById('historialPetFilter');
  if (!petFilterEl) return;

  if (!state.pets.length) {
    petFilterEl.innerHTML = '';
    return;
  }

  petFilterEl.innerHTML = `
    <div class="auth-field" style="margin:0">
      <label style="font-size:0.75rem;font-weight:700;color:var(--gray-500)">Paciente</label>
      <select onchange="window._selectHistorialPet(this.value)" style="width:100%;padding:0.55rem;border:1px solid var(--gray-200);border-radius:var(--radius-md)">
        <option value="all" ${state.selectedPetId === 'all' ? 'selected' : ''}>Todas las mascotas</option>
        ${state.pets.map((pet) => `
          <option value="${escapeHtml(pet.id)}" ${state.selectedPetId === pet.id ? 'selected' : ''}>
            ${escapeHtml(`${pet.name}${pet.species ? ` (${pet.species})` : ''}`)}
          </option>
        `).join('')}
      </select>
    </div>`;
}

function renderComposer(message = '') {
  const composerEl = document.getElementById('soapComposer');
  if (!composerEl) return;

  if (!state.isFichaPage) {
    composerEl.innerHTML = '';
    return;
  }

  if (!state.profile) {
    composerEl.innerHTML = `
      <div class="soap-compose-card">
        <div class="soap-compose-note">Inicia sesión para crear o gestionar fichas clínicas SOAP.</div>
      </div>`;
    return;
  }

  if (!state.canCreateSoap) {
    composerEl.innerHTML = `
      <div class="soap-compose-card">
        <div class="soap-compose-note">Tu rol actual no tiene permisos para crear fichas clínicas.</div>
      </div>`;
    return;
  }

  if (!state.pets.length) {
    composerEl.innerHTML = `
      <div class="soap-compose-card">
        <div class="soap-compose-note">No hay mascotas disponibles para registrar evolución clínica.</div>
      </div>`;
    return;
  }

  composerEl.innerHTML = `
    <div class="soap-compose-card">
      <div class="soap-compose-header">
        <h3>🩺 Nueva Evolución SOAP</h3>
        <span>${escapeHtml(state.profile.full_name || 'Profesional')}</span>
      </div>
      <div class="soap-compose-grid">
        <div class="auth-field">
          <label>Mascota</label>
          <select id="soapPetId" style="width:100%;padding:0.6rem;border:1px solid var(--gray-200);border-radius:var(--radius-md)">
            ${state.pets.map((pet) => `
              <option value="${escapeHtml(pet.id)}">${escapeHtml(`${pet.name} · ${pet.breed || pet.species || 'Sin raza'}`)}</option>
            `).join('')}
          </select>
        </div>
        <div class="auth-field">
          <label>Tipo de Registro</label>
          <select id="soapType" style="width:100%;padding:0.6rem;border:1px solid var(--gray-200);border-radius:var(--radius-md)">
            <option value="consulta">Consulta</option>
            <option value="vacunacion">Vacunación</option>
            <option value="cirugia">Cirugía</option>
            <option value="urgencia">Urgencia</option>
            <option value="control">Control</option>
          </select>
        </div>
      </div>
      <div class="auth-field">
        <label>Subjetivo (S)</label>
        <textarea id="soapSubjective" class="soap-input" rows="2" placeholder="Síntomas reportados por el tutor o antecedentes recientes..."></textarea>
      </div>
      <div class="auth-field">
        <label>Objetivo (O)</label>
        <textarea id="soapObjective" class="soap-input" rows="2" placeholder="Hallazgos clínicos, signos vitales, examen físico..."></textarea>
      </div>
      <div class="auth-field">
        <label>Evaluación (A)</label>
        <textarea id="soapAssessment" class="soap-input" rows="2" placeholder="Diagnóstico presuntivo/definitivo e interpretación clínica..."></textarea>
      </div>
      <div class="auth-field">
        <label>Plan (P)</label>
        <textarea id="soapPlan" class="soap-input" rows="3" placeholder="Tratamiento, exámenes, controles, fármacos y dosis..."></textarea>
      </div>
      <div class="soap-compose-actions">
        <button class="btn-primary" onclick="window._saveSoapRecord()" style="justify-content:center">💾 Guardar Ficha</button>
        <span class="soap-compose-msg">${escapeHtml(message)}</span>
      </div>
    </div>`;
}

function renderRecords() {
  const recordsEl = document.getElementById('historialRecords');
  if (!recordsEl) return;

  const records = getDisplayedRecords();
  if (!records.length) {
    recordsEl.innerHTML = '<p class="summary-empty">No hay registros clínicos para el filtro seleccionado.</p>';
    return;
  }

  recordsEl.innerHTML = records.map((record) => {
    const type = RECORD_TYPES[normalizeRecordType(record.type)] || RECORD_TYPES.consulta;
    const isExpanded = state.expandedRecord === record.id;
    const preview = escapeHtml(record.soap.subjective).slice(0, 120);
    return `
      <div class="record-card ${isExpanded ? 'expanded' : ''}" onclick="window._toggleRecord('${escapeHtml(String(record.id))}')">
        <div class="record-header">
          <div class="record-type-badge" style="background:${type.color}">${type.icon} ${type.label}</div>
          <div class="record-date">${formatDate(record.date)}</div>
        </div>
        <div class="record-vet">${escapeHtml(record.vet)} · ${escapeHtml(record.patient)}</div>
        ${isExpanded ? renderSOAP(record) : `<p class="record-preview">${preview}${preview.length >= 120 ? '...' : ''}</p>`}
      </div>`;
  }).join('');
}

function renderSOAP(record) {
  const medications = extractMedicationsFromPlan(record.soap.plan);
  const attachments = Array.isArray(record.attachments) ? record.attachments : [];
  const encodedMeds = encodeURIComponent(JSON.stringify(medications));

  return `
    <div class="soap-section">
      <div class="soap-block">
        <div class="soap-letter">S</div>
        <div class="soap-content">
          <div class="soap-title">Subjetivo</div>
          <p>${escapeHtml(record.soap.subjective)}</p>
        </div>
      </div>
      <div class="soap-block">
        <div class="soap-letter" style="background:var(--blue-500)">O</div>
        <div class="soap-content">
          <div class="soap-title">Objetivo</div>
          <p>${escapeHtml(record.soap.objective)}</p>
        </div>
      </div>
      <div class="soap-block">
        <div class="soap-letter" style="background:#f59e0b">A</div>
        <div class="soap-content">
          <div class="soap-title">Evaluación</div>
          <p>${escapeHtml(record.soap.assessment)}</p>
        </div>
      </div>
      <div class="soap-block">
        <div class="soap-letter" style="background:#10b981">P</div>
        <div class="soap-content">
          <div class="soap-title">Plan</div>
          <p>${escapeHtml(record.soap.plan).replace(/\n/g, '<br>')}</p>
        </div>
      </div>
      ${attachments.length ? `
        <div class="soap-attachments">
          <strong>📎 Adjuntos:</strong>
          ${attachments.map((item) => `<span class="attachment-chip">${escapeHtml(item)}</span>`).join('')}
        </div>` : ''}
      ${medications.length ? `
        <div class="soap-actions">
          <button class="soap-buy-btn" onclick="event.stopPropagation(); window._buyTreatmentFromEncoded('${encodedMeds}')">
            📅 Coordinar Tratamiento
          </button>
          <span class="soap-buy-hint">${medications.length} medicamento${medications.length > 1 ? 's' : ''} detectado${medications.length > 1 ? 's' : ''}</span>
        </div>` : ''}
    </div>`;
}

async function saveSoapRecord() {
  if (!state.canCreateSoap || !state.profile) return;

  const petId = document.getElementById('soapPetId')?.value?.trim();
  const type = normalizeRecordType(document.getElementById('soapType')?.value);
  const subjective = document.getElementById('soapSubjective')?.value?.trim();
  const objective = document.getElementById('soapObjective')?.value?.trim();
  const assessment = document.getElementById('soapAssessment')?.value?.trim();
  const plan = document.getElementById('soapPlan')?.value?.trim();

  if (!petId || !subjective || !objective || !assessment || !plan) {
    renderComposer('Completa todos los campos SOAP antes de guardar.');
    return;
  }

  const { data, error } = await supabase
    .from('medical_records')
    .insert({
      pet_id: petId,
      vet_id: state.profile.id,
      record_type: type,
      subjective,
      objective,
      assessment,
      plan,
    })
    .select(`
      id,
      pet_id,
      vet_id,
      record_type,
      subjective,
      objective,
      assessment,
      plan,
      created_at,
      pets(name, breed, species),
      profiles!medical_records_vet_id_fkey(full_name),
      appointments(service_type),
      diagnostic_images(type, created_at)
    `)
    .single();

  if (error || !data) {
    renderComposer(`No se pudo guardar la ficha: ${error?.message || 'Error desconocido'}`);
    return;
  }

  state.mode = 'live';
  state.records.unshift(mapMedicalRecordRow(data));
  state.expandedRecord = data.id;
  state.pets = buildPetList(state.records);
  state.selectedPetId = petId;

  renderSidebar();
  renderComposer('Ficha clínica guardada correctamente.');
  renderRecords();
}

function getDisplayedRecords() {
  let records = getFilteredByPetRecords();
  if (state.activeFilter !== 'all') {
    records = records.filter((record) => normalizeRecordType(record.type) === state.activeFilter);
  }
  return records;
}

function getFilteredByPetRecords() {
  if (state.selectedPetId === 'all') return state.records;
  return state.records.filter((record) => record.petId === state.selectedPetId);
}

function buildPetList(records) {
  const map = new Map();
  records.forEach((record) => {
    if (!record.petId || map.has(record.petId)) return;
    map.set(record.petId, {
      id: record.petId,
      name: record.patient,
      species: '',
      breed: record.breed,
    });
  });
  return [...map.values()];
}

function buildPetListFromRows(petsRows) {
  return petsRows.map((pet) => ({
    id: pet.id,
    name: pet.name || 'Mascota sin nombre',
    species: pet.species || '',
    breed: pet.breed || '',
  }));
}

function buyTreatment(medications) {
  const safeItems = Array.isArray(medications) ? medications : [];
  sessionStorage.setItem('sevet_prescription_items', JSON.stringify(safeItems));
  window.location.href = '/pages/agendar.html?from=prescription';
}

export function mapMedicalRecordRow(row) {
  const petName = row?.pets?.name || 'Mascota';
  const petBreed = row?.pets?.breed || row?.pets?.species || 'Sin raza';
  const type = normalizeRecordType(
    row?.record_type ||
    row?.appointments?.service_type ||
    inferRecordTypeFromText(`${row?.assessment || ''} ${row?.plan || ''}`)
  );

  const attachments = Array.isArray(row?.diagnostic_images)
    ? row.diagnostic_images.map(formatAttachmentLabel)
    : [];

  return {
    id: row?.id,
    petId: row?.pet_id || null,
    date: row?.created_at || new Date().toISOString(),
    type,
    vet: row?.profiles?.full_name || 'Equipo SEVET',
    patient: petName,
    breed: petBreed,
    soap: {
      subjective: row?.subjective || 'Sin información subjetiva.',
      objective: row?.objective || 'Sin hallazgos objetivos.',
      assessment: row?.assessment || 'Sin evaluación registrada.',
      plan: row?.plan || 'Sin plan terapéutico.',
    },
    attachments,
  };
}

function formatAttachmentLabel(image) {
  const typeLabels = {
    radiografia: 'Radiografía',
    laboratorio: 'Laboratorio',
    ecografia: 'Ecografía',
    otro: 'Adjunto clínico',
  };
  const label = typeLabels[image?.type] || 'Adjunto clínico';
  return image?.created_at ? `${label} · ${formatDate(image.created_at)}` : label;
}

function inferRecordTypeFromText(text) {
  const value = (text || '').toLowerCase();
  if (/vacun|inmuniz|dosis|refuerzo/.test(value)) return 'vacunacion';
  if (/cirug|quirurg|incisi|anestesia/.test(value)) return 'cirugia';
  if (/urgenc|emergenc|triage/.test(value)) return 'urgencia';
  if (/control|seguimiento/.test(value)) return 'control';
  return 'consulta';
}

export function normalizeRecordType(rawType) {
  const value = (rawType || '').toString().trim().toLowerCase();
  const aliases = {
    vacuna: 'vacunacion',
    vacunación: 'vacunacion',
    vacunacion: 'vacunacion',
    emergencia: 'urgencia',
    urgencia: 'urgencia',
    consulta: 'consulta',
    control: 'control',
    cirugia: 'cirugia',
    cirugía: 'cirugia',
    peluqueria: 'peluqueria',
    guarderia: 'guarderia',
  };
  return aliases[value] || 'consulta';
}

export function extractMedicationsFromPlan(planText) {
  const medicationRegex = /(clorhexidina|cefalexina|meloxicam|tramadol|ivermectina|amoxicilina|metronidazol|prednisolona|omeprazol|gabapentina|analgesia|antibiótico)/i;
  const lines = (planText || '')
    .split('\n')
    .map((line) => line.replace(/^\d+[\).\s-]*/, '').trim())
    .filter((line) => line && medicationRegex.test(line));
  return [...new Set(lines)];
}

function formatDate(dateLike) {
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
