/* =========================================
   SEVET – Módulo 4: Historial Médico Veterinario
   Ficha clínica SOAP completa
   ========================================= */

const DEMO_RECORDS = [
  {
    id: 1, date: '2026-03-05', type: 'consulta', vet: 'Dra. Carolina Reyes',
    patient: 'Luna', breed: 'Golden Retriever',
    soap: {
      subjective: 'Propietario reporta que Luna ha presentado inapetencia desde hace 3 días. Rechaza croquetas pero acepta alimento húmedo. Sin vómitos ni diarrea. Actividad normal.',
      objective: 'T: 38.6°C | FC: 82bpm | FR: 20rpm | Peso: 28.2kg. Mucosas rosadas, TRC 2s. Abdomen blando, sin dolor a la palpación. Linfonodos normales. Cavidad oral: sarro moderado en premolares superiores, encía levemente eritematosa.',
      assessment: 'Gingivitis leve asociada a enfermedad periodontal grado I. Inapetencia probablemente relacionada con molestia oral.',
      plan: '1. Limpieza dental programada para el 15/03\n2. Dieta blanda por 5 días\n3. Clorhexidina oral gel 0.12% 2x/día\n4. Control en 7 días\n5. Hemograma prequirúrgico antes de limpieza'
    },
    attachments: ['Hemograma', 'Foto oral']
  },
  {
    id: 2, date: '2026-01-15', type: 'vacunacion', vet: 'Dr. Andrés Muñoz',
    patient: 'Luna', breed: 'Golden Retriever',
    soap: {
      subjective: 'Visita programada para refuerzo anual de séxtuple. Sin quejas del propietario. Buena alimentación y ejercicio regular.',
      objective: 'T: 38.4°C | FC: 78bpm | FR: 18rpm | Peso: 28.0kg. Examen general sin hallazgos anormales. Estado corporal 5/9 (ideal).',
      assessment: 'Paciente sano. Apto para vacunación.',
      plan: '1. Vacuna Séxtuple (V8) aplicada - Lote: SX2026-0142\n2. Próximo refuerzo: enero 2027\n3. Desparasitación con ivermectina\n4. Continuar dieta actual'
    },
    attachments: ['Certificado vacunación']
  },
  {
    id: 3, date: '2025-09-12', type: 'cirugia', vet: 'Dr. Felipe Contreras',
    patient: 'Luna', breed: 'Golden Retriever',
    soap: {
      subjective: 'Programada esterilización electiva. Ayuno de 12 horas cumplido. Sin medicación actual.',
      objective: 'T: 38.3°C | FC: 80bpm. Prequirúrgico: hemograma, bioquímica y coagulograma dentro de rangos normales. ASA I.',
      assessment: 'Paciente apto para cirugía electiva. Sin contraindicaciones anestésicas.',
      plan: '1. Ovariohisterectomía por línea media\n2. Protocolo anestésico: Acepromacina + Propofol + Isoflurano\n3. Analgesia: Meloxicam 0.2mg/kg + Tramadol 3mg/kg\n4. Antibiótico: Cefalexina 22mg/kg c/12h x 7 días\n5. Collar isabelino 10 días\n6. Retiro de puntos día 10 post-quirúrgico'
    },
    attachments: ['Prequirúrgico', 'Protocolo anestésico', 'Foto incisión']
  },
];

const RECORD_TYPES = {
  consulta: { icon: '🩺', color: 'var(--blue-600)', label: 'Consulta' },
  vacunacion: { icon: '💉', color: '#10b981', label: 'Vacunación' },
  cirugia: { icon: '🔪', color: '#8b5cf6', label: 'Cirugía' },
  emergencia: { icon: '🚨', color: '#ef4444', label: 'Emergencia' },
  control: { icon: '📋', color: '#f59e0b', label: 'Control' },
};

let expandedRecord = null;

export function initHistorial() {
  const container = document.getElementById('historial-container');
  if (!container) return;

  container.innerHTML = `
    <div class="historial-layout">
      <aside class="historial-sidebar">
        <div class="historial-patient-card">
          <span class="historial-patient-avatar">🐕</span>
          <div>
            <div class="historial-patient-name">Luna</div>
            <div class="historial-patient-breed">Golden Retriever · 3 años · 28kg</div>
          </div>
        </div>
        <div class="historial-stats">
          <div class="historial-stat">
            <div class="historial-stat-num">${DEMO_RECORDS.length}</div>
            <div class="historial-stat-label">Consultas</div>
          </div>
          <div class="historial-stat">
            <div class="historial-stat-num">5</div>
            <div class="historial-stat-label">Vacunas</div>
          </div>
          <div class="historial-stat">
            <div class="historial-stat-num">1</div>
            <div class="historial-stat-label">Cirugías</div>
          </div>
        </div>
        <div class="historial-filters">
          <button class="historial-filter active" onclick="window._filterRecords('all', this)">Todos</button>
          <button class="historial-filter" onclick="window._filterRecords('consulta', this)">🩺 Consultas</button>
          <button class="historial-filter" onclick="window._filterRecords('vacunacion', this)">💉 Vacunas</button>
          <button class="historial-filter" onclick="window._filterRecords('cirugia', this)">🔪 Cirugías</button>
        </div>
      </aside>
      <div class="historial-records" id="historialRecords"></div>
    </div>`;

  renderRecords('all');
}

window._filterRecords = function(type, triggerEl) {
  document.querySelectorAll('.historial-filter').forEach(b => b.classList.remove('active'));
  if (triggerEl) triggerEl.classList.add('active');
  renderRecords(type);
};

window._toggleRecord = function(id) {
  expandedRecord = expandedRecord === id ? null : id;
  renderRecords();
};

function renderRecords(filter) {
  const el = document.getElementById('historialRecords');
  if (!el) return;
  const records = filter && filter !== 'all'
    ? DEMO_RECORDS.filter(r => r.type === filter)
    : DEMO_RECORDS;

  el.innerHTML = records.map(r => {
    const t = RECORD_TYPES[r.type] || RECORD_TYPES.consulta;
    const isExpanded = expandedRecord === r.id;
    return `
      <div class="record-card ${isExpanded ? 'expanded' : ''}" onclick="window._toggleRecord(${r.id})">
        <div class="record-header">
          <div class="record-type-badge" style="background: ${t.color}">${t.icon} ${t.label}</div>
          <div class="record-date">${formatDate(r.date)}</div>
        </div>
        <div class="record-vet">${r.vet}</div>
        ${isExpanded ? renderSOAP(r) : `<p class="record-preview">${r.soap.subjective.substring(0, 100)}...</p>`}
      </div>`;
  }).join('');
}

function renderSOAP(record) {
  // Extract medication names from plan text
  const planLines = record.soap.plan.split('\n');
  const medications = planLines
    .filter(l => /clorhexidina|cefalexina|meloxicam|tramadol|ivermectina|antibiótico|analgesia/i.test(l))
    .map(l => l.replace(/^\d+\.\s*/, '').trim());

  return `
    <div class="soap-section">
      <div class="soap-block">
        <div class="soap-letter">S</div>
        <div class="soap-content">
          <div class="soap-title">Subjetivo</div>
          <p>${record.soap.subjective}</p>
        </div>
      </div>
      <div class="soap-block">
        <div class="soap-letter" style="background:var(--blue-500)">O</div>
        <div class="soap-content">
          <div class="soap-title">Objetivo</div>
          <p>${record.soap.objective}</p>
        </div>
      </div>
      <div class="soap-block">
        <div class="soap-letter" style="background:#f59e0b">A</div>
        <div class="soap-content">
          <div class="soap-title">Evaluación</div>
          <p>${record.soap.assessment}</p>
        </div>
      </div>
      <div class="soap-block">
        <div class="soap-letter" style="background:#10b981">P</div>
        <div class="soap-content">
          <div class="soap-title">Plan</div>
          <p>${record.soap.plan.replace(/\n/g, '<br>')}</p>
        </div>
      </div>
      ${record.attachments.length ? `
        <div class="soap-attachments">
          <strong>📎 Adjuntos:</strong>
          ${record.attachments.map(a => `<span class="attachment-chip">${a}</span>`).join('')}
        </div>` : ''}
      ${medications.length > 0 ? `
        <div class="soap-actions">
          <button class="soap-buy-btn" onclick="window._buyTreatment(${JSON.stringify(medications).replace(/"/g, '&quot;')})">
            🛒 Comprar Tratamiento
          </button>
          <span class="soap-buy-hint">${medications.length} medicamento${medications.length > 1 ? 's' : ''} en el plan</span>
        </div>` : ''}
    </div>`;
}

window._buyTreatment = function(medications) {
  // Store in sessionStorage so tienda can pick them up
  sessionStorage.setItem('sevet_prescription_items', JSON.stringify(medications));
  window.location.href = '/pages/tienda.html?from=prescription';
};

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
}
