/* =========================================
   SEVET – Módulo 3: Telemedicina
   Consultas remotas y monitoreo en tiempo real
   ========================================= */

const DOCTORS = [
  { id: 1, name: 'Dra. Carolina Reyes', specialty: 'Medicina General', avatar: '👩‍⚕️', rating: 4.9, available: true, nextSlot: '14:30' },
  { id: 2, name: 'Dr. Andrés Muñoz', specialty: 'Cardiología', avatar: '👨‍⚕️', rating: 4.8, available: true, nextSlot: '15:00' },
  { id: 3, name: 'Dra. Valentina Lagos', specialty: 'Dermatología', avatar: '👩‍⚕️', rating: 4.7, available: false, nextSlot: 'Mañana 09:00' },
  { id: 4, name: 'Dr. Felipe Contreras', specialty: 'Cirugía', avatar: '👨‍⚕️', rating: 4.9, available: true, nextSlot: '16:00' },
  { id: 5, name: 'Dra. Isidora Vega', specialty: 'Neurología', avatar: '👩‍⚕️', rating: 4.6, available: false, nextSlot: 'Mañana 10:30' },
];

const TELEMED_FEATURES = [
  { icon: '📹', title: 'Videollamada HD', desc: 'Conexión segura con cifrado end-to-end' },
  { icon: '📎', title: 'Compartir Archivos', desc: 'Envía fotos, radiografías y resultados' },
  { icon: '💊', title: 'Receta Digital', desc: 'Prescripción electrónica con firma digital' },
  { icon: '📋', title: 'Historial Integrado', desc: 'El veterinario ve la ficha clínica en tiempo real' },
  { icon: '🔔', title: 'Recordatorios', desc: 'Alertas para seguimiento post-consulta' },
  { icon: '🌡️', title: 'IoT Conectado', desc: 'Datos de dispositivos wearable en pantalla' },
];

let selectedDoctor = null;

export function initTelemedicina() {
  const container = document.getElementById('telemedicina-container');
  if (!container) return;

  container.innerHTML = `
    <div class="telemed-grid">
      <div class="telemed-doctors">
        <h3 class="panel-title">🩺 Veterinarios Disponibles</h3>
        <div class="doctor-list" id="doctorList">
          ${DOCTORS.map(d => renderDoctorCard(d)).join('')}
        </div>
      </div>
      <div class="telemed-right">
        <div class="telemed-preview" id="telemedPreview">
          <div class="telemed-preview-placeholder">
            <span class="telemed-preview-icon">📹</span>
            <h4>Consulta de Telemedicina</h4>
            <p>Selecciona un veterinario para iniciar una consulta remota segura.</p>
          </div>
        </div>
        <div class="telemed-features-grid">
          ${TELEMED_FEATURES.map(f => `
            <div class="telemed-feature">
              <span class="telemed-feat-icon">${f.icon}</span>
              <div>
                <strong>${f.title}</strong>
                <p>${f.desc}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <div class="telemed-monitor">
      <h3 class="panel-title">📊 Monitoreo en Tiempo Real</h3>
      <div class="monitor-cards">
        <div class="monitor-card">
          <div class="monitor-icon">❤️</div>
          <div class="monitor-value" id="monitorHR">78</div>
          <div class="monitor-label">BPM</div>
          <div class="monitor-status ok">Normal</div>
        </div>
        <div class="monitor-card">
          <div class="monitor-icon">🌡️</div>
          <div class="monitor-value" id="monitorTemp">38.5</div>
          <div class="monitor-label">°C</div>
          <div class="monitor-status ok">Normal</div>
        </div>
        <div class="monitor-card">
          <div class="monitor-icon">🫀</div>
          <div class="monitor-value" id="monitorSpO2">98</div>
          <div class="monitor-label">SpO₂%</div>
          <div class="monitor-status ok">Óptimo</div>
        </div>
        <div class="monitor-card">
          <div class="monitor-icon">⚡</div>
          <div class="monitor-value" id="monitorResp">22</div>
          <div class="monitor-label">resp/min</div>
          <div class="monitor-status ok">Normal</div>
        </div>
      </div>
    </div>`;

  startMonitorSimulation();
}

function renderDoctorCard(doc) {
  return `
    <div class="doctor-card ${!doc.available ? 'unavailable' : ''} ${selectedDoctor === doc.id ? 'selected' : ''}"
         onclick="window._selectDoctor(${doc.id})">
      <span class="doctor-avatar">${doc.avatar}</span>
      <div class="doctor-info">
        <div class="doctor-name">${doc.name}</div>
        <div class="doctor-spec">${doc.specialty}</div>
        <div class="doctor-meta">
          <span class="doctor-rating">★ ${doc.rating}</span>
          <span class="doctor-slot ${doc.available ? 'available' : 'busy'}">${doc.available ? `Próximo: ${doc.nextSlot}` : doc.nextSlot}</span>
        </div>
      </div>
      <div class="doctor-status-dot ${doc.available ? 'online' : 'offline'}"></div>
    </div>`;
}

window._selectDoctor = function(id) {
  const doc = DOCTORS.find(d => d.id === id);
  if (!doc) return;
  selectedDoctor = id;

  document.getElementById('doctorList').innerHTML = DOCTORS.map(d => renderDoctorCard(d)).join('');

  const preview = document.getElementById('telemedPreview');
  if (preview) {
    preview.innerHTML = `
      <div class="telemed-call-ready">
        <span class="call-avatar">${doc.avatar}</span>
        <h4>${doc.name}</h4>
        <p class="call-spec">${doc.specialty} · ★ ${doc.rating}</p>
        <p class="call-time">Próxima disponibilidad: <strong>${doc.nextSlot}</strong></p>
        <button class="btn-cta call-start-btn" ${!doc.available ? 'disabled' : ''}>
          ${doc.available ? '📹 Iniciar Videollamada' : '⏰ Agendar Consulta'}
        </button>
        ${!doc.available ? '<p class="call-note">Veterinario no disponible ahora. Puedes agendar para su próximo horario.</p>' : ''}
      </div>`;
  }
};

function startMonitorSimulation() {
  setInterval(() => {
    const hrEl = document.getElementById('monitorHR');
    const tempEl = document.getElementById('monitorTemp');
    const spo2El = document.getElementById('monitorSpO2');
    const respEl = document.getElementById('monitorResp');
    if (hrEl) hrEl.textContent = 75 + Math.floor(Math.random() * 10);
    if (tempEl) tempEl.textContent = (38.2 + Math.random() * 0.8).toFixed(1);
    if (spo2El) spo2El.textContent = 96 + Math.floor(Math.random() * 4);
    if (respEl) respEl.textContent = 18 + Math.floor(Math.random() * 8);
  }, 2000);
}
