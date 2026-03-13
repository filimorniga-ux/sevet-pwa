/* =========================================
   SEVET – Módulo Mi Mascota
   Portal del dueño: perfiles, salud, vacunas
   ========================================= */

import { supabase } from '../supabase.js';

// ── Datos de demo (mientras no hay auth) ──
const DEMO_PETS = [
  {
    id: 1, name: 'Luna', species: '🐕', breed: 'Golden Retriever', age: '3 años',
    weight: '28 kg', microchip: 'CHL-2023-0487-A', status: 'saludable',
    avatar: '🐕', color: '#f59e0b',
    vaccines: [
      { name: 'Séxtuple', date: '2026-01-15', next: '2027-01-15', status: 'vigente' },
      { name: 'Antirrábica', date: '2025-11-20', next: '2026-11-20', status: 'vigente' },
      { name: 'KC (Tos de Perreras)', date: '2025-06-10', next: '2026-06-10', status: 'próxima' },
    ],
    timeline: [
      { date: '2026-03-05', type: 'consulta', title: 'Control General', desc: 'Sin observaciones. Peso estable.' },
      { date: '2026-01-15', type: 'vacuna', title: 'Séxtuple (Refuerzo)', desc: 'Vacuna aplicada sin reacciones.' },
      { date: '2025-11-20', type: 'vacuna', title: 'Antirrábica Anual', desc: 'Dosis anual completada.' },
      { date: '2025-09-12', type: 'cirugia', title: 'Esterilización', desc: 'Procedimiento exitoso. Recuperación de 10 días.' },
      { date: '2025-06-10', type: 'vacuna', title: 'KC (Tos de Perreras)', desc: 'Protección contra Bordetella.' },
    ],
    vitals: { heartRate: 80, temp: 38.5, weight: 28 },
  },
  {
    id: 2, name: 'Michi', species: '🐈', breed: 'Siamés', age: '2 años',
    weight: '4.2 kg', microchip: 'CHL-2024-0123-B', status: 'control',
    avatar: '🐈', color: '#8b5cf6',
    vaccines: [
      { name: 'Triple Felina', date: '2026-02-01', next: '2027-02-01', status: 'vigente' },
      { name: 'Antirrábica', date: '2025-12-10', next: '2026-12-10', status: 'vigente' },
      { name: 'Leucemia Felina', date: '2025-08-15', next: '2026-08-15', status: 'próxima' },
    ],
    timeline: [
      { date: '2026-02-20', type: 'consulta', title: 'Chequeo Dental', desc: 'Limpieza dental recomendada en 6 meses.' },
      { date: '2026-02-01', type: 'vacuna', title: 'Triple Felina', desc: 'Refuerzo anual aplicado.' },
      { date: '2025-12-10', type: 'vacuna', title: 'Antirrábica', desc: 'Dosis anual.' },
    ],
    vitals: { heartRate: 140, temp: 38.9, weight: 4.2 },
  },
];

let selectedPetId = DEMO_PETS[0].id;

// ── Inicializar módulo ──
export function initMiMascota() {
  const container = document.getElementById('mascotas-container');
  if (!container) return;
  renderPetSelector();
  renderPetDashboard();
}

// ── Selector de mascotas ──
function renderPetSelector() {
  const selector = document.getElementById('petSelector');
  if (!selector) return;
  let html = '';
  DEMO_PETS.forEach(pet => {
    html += `
      <div class="pet-tab ${pet.id === selectedPetId ? 'active' : ''}" 
           onclick="window._selectPet(${pet.id})">
        <span class="pet-tab-avatar">${pet.avatar}</span>
        <div class="pet-tab-info">
          <span class="pet-tab-name">${pet.name}</span>
          <span class="pet-tab-breed">${pet.breed}</span>
        </div>
        <span class="pet-tab-status status-${pet.status}">${pet.status}</span>
      </div>`;
  });
  html += `
    <div class="pet-tab pet-tab-add" onclick="alert('Funcionalidad próximamente!')">
      <span class="pet-tab-avatar" style="font-size:1.5rem">＋</span>
      <div class="pet-tab-info">
        <span class="pet-tab-name">Agregar Mascota</span>
        <span class="pet-tab-breed">Registrar nueva</span>
      </div>
    </div>`;
  selector.innerHTML = html;
}

window._selectPet = function(id) {
  selectedPetId = id;
  renderPetSelector();
  renderPetDashboard();
};

// ── Dashboard de la mascota ──
function renderPetDashboard() {
  const container = document.getElementById('mascotas-container');
  if (!container) return;
  const pet = DEMO_PETS.find(p => p.id === selectedPetId);
  if (!pet) return;

  container.innerHTML = `
    <!-- Tarjeta Principal -->
    <div class="pet-profile-card">
      <div class="pet-profile-header">
        <div class="pet-avatar-large" style="background: linear-gradient(135deg, ${pet.color}, ${pet.color}88)">
          ${pet.avatar}
        </div>
        <div class="pet-profile-info">
          <h2 class="pet-profile-name">${pet.name}</h2>
          <p class="pet-profile-detail">${pet.species} ${pet.breed} · ${pet.age} · ${pet.weight}</p>
          <div class="pet-profile-tags">
            <span class="pet-tag">🏷️ ${pet.microchip}</span>
            <span class="pet-tag status-${pet.status}">● ${pet.status.toUpperCase()}</span>
          </div>
        </div>
      </div>
      
      <!-- Signos Vitales -->
      <div class="vitals-row">
        <div class="vital-card">
          <div class="vital-icon">❤️</div>
          <div class="vital-value">${pet.vitals.heartRate} <small>bpm</small></div>
          <div class="vital-label">Frec. Cardíaca</div>
        </div>
        <div class="vital-card">
          <div class="vital-icon">🌡️</div>
          <div class="vital-value">${pet.vitals.temp}° <small>C</small></div>
          <div class="vital-label">Temperatura</div>
        </div>
        <div class="vital-card">
          <div class="vital-icon">⚖️</div>
          <div class="vital-value">${pet.vitals.weight} <small>kg</small></div>
          <div class="vital-label">Peso</div>
        </div>
      </div>
    </div>

    <!-- Grid: Vacunas + Timeline -->
    <div class="pet-grid">
      <!-- Panel Vacunas -->
      <div class="pet-panel">
        <h3 class="panel-title">💉 Plan de Vacunación</h3>
        <div class="vaccine-list">
          ${pet.vaccines.map(v => `
            <div class="vaccine-item">
              <div class="vaccine-status vaccine-${v.status}"></div>
              <div class="vaccine-info">
                <div class="vaccine-name">${v.name}</div>
                <div class="vaccine-date">Aplicada: ${formatDate(v.date)}</div>
              </div>
              <div class="vaccine-next">
                <div class="vaccine-next-label">Próxima</div>
                <div class="vaccine-next-date">${formatDate(v.next)}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Timeline -->
      <div class="pet-panel">
        <h3 class="panel-title">📄 Historial Clínico</h3>
        <div class="pet-timeline">
          ${pet.timeline.map(ev => `
            <div class="timeline-item">
              <div class="timeline-dot dot-${ev.type}"></div>
              <div class="timeline-content">
                <div class="timeline-header">
                  <span class="timeline-title">${ev.title}</span>
                  <span class="timeline-date">${formatDate(ev.date)}</span>
                </div>
                <p class="timeline-desc">${ev.desc}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
}
