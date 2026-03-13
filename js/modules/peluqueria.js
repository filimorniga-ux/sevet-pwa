/* =========================================
   SEVET – Módulo Peluquería y Guardería
   Servicios de grooming y hospedaje
   ========================================= */

const GROOMING_SERVICES = [
  { id: 'bath-basic', name: 'Baño Básico', icon: '🛁', price: 15990, duration: '45 min', desc: 'Baño con shampoo hipoalergénico, secado y perfumado.' },
  { id: 'bath-premium', name: 'Baño Premium', icon: '✨', price: 24990, duration: '90 min', desc: 'Baño medicado, corte de uñas, limpieza de oídos y cepillado dental.' },
  { id: 'haircut', name: 'Corte y Estilizado', icon: '✂️', price: 29990, duration: '120 min', desc: 'Corte de pelo según raza, baño premium incluido, diseño personalizado.' },
  { id: 'spa', name: 'Spa Completo', icon: '💆', price: 39990, duration: '150 min', desc: 'Baño de ozono, mascarilla hidratante, aromaterapia y masaje relajante.' },
];

const DAYCARE_PACKAGES = [
  { id: 'day', name: 'Guardería Día', icon: '☀️', price: 18990, period: 'día', desc: 'Cuidado diurno (8:00–18:00). Paseos, juegos y alimentación incluida.' },
  { id: 'night', name: 'Hospedaje Nocturno', icon: '🌙', price: 24990, period: 'noche', desc: 'Hospedaje nocturno (18:00–8:00). Cama individual, monitoreo y cena.' },
  { id: 'weekend', name: 'Paquete Fin de Semana', icon: '📅', price: 54990, period: 'paquete', desc: 'Viernes a domingo. Incluye paseos, juegos, alimentación y reportes con fotos.' },
  { id: 'weekly', name: 'Plan Semanal', icon: '🏠', price: 149990, period: 'semana', desc: 'Cuidado integral 7 días. Reporte diario con fotos y videos. Veterinario 24/7.' },
];

export function initPeluqueria() {
  const container = document.getElementById('peluqueria-container');
  if (!container) return;

  container.innerHTML = `
    <div class="grooming-section">
      <h3 class="section-subtitle">✂️ Servicios de Peluquería</h3>
      <div class="service-cards-grid">
        ${GROOMING_SERVICES.map(s => renderServiceCard(s, 'grooming')).join('')}
      </div>
    </div>

    <div class="daycare-section">
      <h3 class="section-subtitle">🏠 Guardería y Hospedaje</h3>
      <div class="service-cards-grid">
        ${DAYCARE_PACKAGES.map(s => renderServiceCard(s, 'daycare')).join('')}
      </div>
    </div>

    <div class="grooming-features">
      <div class="feature-pill">🧴 Productos veterinarios</div>
      <div class="feature-pill">📷 Fotos de tu mascota</div>
      <div class="feature-pill">🩺 Vet de emergencia 24/7</div>
      <div class="feature-pill">🌡️ Control de temperatura</div>
      <div class="feature-pill">🥗 Comida premium incluida</div>
      <div class="feature-pill">🐾 Áreas separadas por tamaño</div>
    </div>
  `;
}

function renderServiceCard(service, type) {
  return `
    <div class="grooming-card">
      <div class="grooming-icon">${service.icon}</div>
      <h4 class="grooming-name">${service.name}</h4>
      <p class="grooming-desc">${service.desc}</p>
      <div class="grooming-meta">
        <span class="grooming-duration">${service.duration || service.period}</span>
      </div>
      <div class="grooming-price">$${service.price.toLocaleString('es-CL')}</div>
      <button class="btn-cta grooming-book" onclick="window.location.href='/pages/agendar.html'">
        Reservar →
      </button>
    </div>`;
}
