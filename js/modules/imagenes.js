/* =========================================
   SEVET – Módulo 6: Visualizador de Imágenes Diagnósticas
   Radiografías, ecografías, laboratorio
   ========================================= */

const DEMO_IMAGES = [
  {
    id: 1, type: 'radiografia', date: '2026-03-01', patient: 'Luna',
    title: 'Radiografía Torácica - Lateral',
    region: 'Tórax', vet: 'Dra. Carolina Reyes',
    findings: 'Silueta cardíaca dentro de límites normales. Campos pulmonares sin opacidades. Tráquea de calibre normal. Sin evidencia de efusión pleural.',
    conclusion: 'Estudio torácico sin hallazgos patológicos significativos.',
    icon: '🩻'
  },
  {
    id: 2, type: 'ecografia', date: '2026-02-20', patient: 'Luna',
    title: 'Ecografía Abdominal',
    region: 'Abdomen', vet: 'Dr. Andrés Muñoz',
    findings: 'Hígado de ecogenicidad normal, sin lesiones focales. Vesícula biliar anecoica. Riñones simétricos, relación corteza/médula conservada. Vejiga distendida, pared fina.',
    conclusion: 'Ecografía abdominal sin alteraciones ecográficas significativas.',
    icon: '📡'
  },
  {
    id: 3, type: 'laboratorio', date: '2026-03-05', patient: 'Luna',
    title: 'Hemograma Completo',
    region: 'Sangre', vet: 'Dra. Carolina Reyes',
    findings: 'Eritrocitos: 7.2 M/μL (ref: 5.5-8.5) ✅\nHemoglobina: 16.8 g/dL (ref: 12-18) ✅\nHematocrito: 48% (ref: 37-55) ✅\nLeucocitos: 11.200/μL (ref: 6.000-17.000) ✅\nPlaquetas: 320.000/μL (ref: 175.000-500.000) ✅\nProteínas totales: 6.8 g/dL (ref: 5.5-7.5) ✅',
    conclusion: 'Todos los parámetros dentro de rangos de referencia. Paciente apto para procedimiento quirúrgico.',
    icon: '🔬'
  },
  {
    id: 4, type: 'radiografia', date: '2025-11-15', patient: 'Michi',
    title: 'Radiografía de Pelvis - VD',
    region: 'Pelvis', vet: 'Dr. Felipe Contreras',
    findings: 'Articulaciones coxofemorales simétricas. Ángulo de Norberg: 110° bilateral. No se observan signos de subluxación ni remodelación ósea.',
    conclusion: 'Evaluación de cadera normal. Sin signos de displasia coxofemoral.',
    icon: '🩻'
  },
];

const IMAGE_TYPES = [
  { id: 'all', label: 'Todos', icon: '📁' },
  { id: 'radiografia', label: 'Radiografías', icon: '🩻' },
  { id: 'ecografia', label: 'Ecografías', icon: '📡' },
  { id: 'laboratorio', label: 'Laboratorio', icon: '🔬' },
];

let activeImageFilter = 'all';
let selectedImage = null;

export function initImagenes() {
  const container = document.getElementById('imagenes-container');
  if (!container) return;

  container.innerHTML = `
    <div class="diag-filters" id="diagFilters"></div>
    <div class="diag-layout">
      <div class="diag-gallery" id="diagGallery"></div>
      <aside class="diag-detail-panel" id="diagDetail">
        <div class="diag-detail-placeholder">
          <span class="diag-detail-icon">🩻</span>
          <p>Selecciona un estudio para ver el informe completo</p>
        </div>
      </aside>
    </div>`;

  renderDiagFilters();
  renderDiagGallery();
}

function renderDiagFilters() {
  const el = document.getElementById('diagFilters');
  if (!el) return;
  el.innerHTML = IMAGE_TYPES.map(t => `
    <button class="diag-filter-btn ${t.id === activeImageFilter ? 'active' : ''}"
            onclick="window._filterImages('${t.id}')">
      ${t.icon} ${t.label}
    </button>
  `).join('');
}

window._filterImages = function(type) {
  activeImageFilter = type;
  selectedImage = null;
  renderDiagFilters();
  renderDiagGallery();
  document.getElementById('diagDetail').innerHTML = `
    <div class="diag-detail-placeholder">
      <span class="diag-detail-icon">🩻</span>
      <p>Selecciona un estudio para ver el informe completo</p>
    </div>`;
};

window._selectImage = function(id) {
  selectedImage = id;
  renderDiagGallery();

  const img = DEMO_IMAGES.find(i => i.id === id);
  if (!img) return;

  const detailEl = document.getElementById('diagDetail');
  if (detailEl) {
    detailEl.innerHTML = `
      <div class="diag-detail-content">
        <div class="diag-detail-header">
          <span class="diag-detail-type-icon">${img.icon}</span>
          <div>
            <h4 class="diag-detail-title">${img.title}</h4>
            <p class="diag-detail-meta">${img.patient} · ${img.region} · ${formatImageDate(img.date)}</p>
          </div>
        </div>
        <div class="diag-viewer">
          <div class="diag-viewer-placeholder">${img.icon}</div>
          <div class="diag-viewer-tools">
            <button class="diag-tool" title="Zoom In">🔍+</button>
            <button class="diag-tool" title="Zoom Out">🔍−</button>
            <button class="diag-tool" title="Rotar">🔄</button>
            <button class="diag-tool" title="Contraste">◐</button>
            <button class="diag-tool" title="Medir">📏</button>
          </div>
        </div>
        <div class="diag-report">
          <h5>📋 Hallazgos</h5>
          <p class="diag-findings">${img.findings.replace(/\n/g, '<br>')}</p>
          <h5>✅ Conclusión</h5>
          <p class="diag-conclusion">${img.conclusion}</p>
          <div class="diag-vet-info">
            <span>Informado por: <strong>${img.vet}</strong></span>
          </div>
        </div>
      </div>`;
  }
};

function renderDiagGallery() {
  const el = document.getElementById('diagGallery');
  if (!el) return;
  const filtered = activeImageFilter === 'all'
    ? DEMO_IMAGES
    : DEMO_IMAGES.filter(i => i.type === activeImageFilter);

  el.innerHTML = filtered.map(img => `
    <div class="diag-thumb ${selectedImage === img.id ? 'selected' : ''}"
         onclick="window._selectImage(${img.id})">
      <div class="diag-thumb-icon">${img.icon}</div>
      <div class="diag-thumb-info">
        <div class="diag-thumb-title">${img.title}</div>
        <div class="diag-thumb-meta">${img.patient} · ${formatImageDate(img.date)}</div>
      </div>
    </div>
  `).join('');
}

function formatImageDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
}
