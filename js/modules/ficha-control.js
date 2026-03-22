/* ================================================================
   FICHA DE CONTROL — Módulo JS
   Maneja vacunas, desparasitaciones y consultas de la ficha física
   ================================================================ */
import { supabase } from '../supabase.js';

// ── Utilidad ──
function escapeHtml(s) {
  if (s == null) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatDate(str) {
  if (!str) return '—';
  const d = new Date(str + 'T00:00:00');
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ── VACUNAS Y DESPARASITACIONES ────────────────────────────

export async function loadVaccinations(petId) {
  const { data, error } = await supabase
    .from('pet_vaccinations')
    .select('*, vet:vet_id(full_name)')
    .eq('pet_id', petId)
    .order('fecha', { ascending: false });
  if (error) { console.error('[ficha-control] loadVaccinations:', error); return []; }
  return data || [];
}

export async function addVaccination({ petId, vetId, fecha, descripcion, observaciones, tipo = 'vacuna' }) {
  const { data, error } = await supabase
    .from('pet_vaccinations')
    .insert({ pet_id: petId, vet_id: vetId, fecha, descripcion, observaciones, tipo })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteVaccination(id) {
  const { error } = await supabase.from('pet_vaccinations').delete().eq('id', id);
  if (error) throw error;
}

// ── CONSULTAS Y CONTROLES ──────────────────────────────────
export async function loadConsultations(petId) {
  const { data, error } = await supabase
    .from('medical_records')
    .select('id, created_at, subjective, assessment, plan, proximo_control, procedimiento, record_type')
    .eq('pet_id', petId)
    .in('record_type', ['consulta', 'control', 'vacuna'])
    .order('created_at', { ascending: false });
  if (error) { console.error('[ficha-control] loadConsultations:', error); return []; }
  return data || [];
}

// ── RENDER TABLA VACUNAS (para vista vet) ──────────────────
export function renderVaccinationTable(vaccinations, containerId, canEdit = true) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!vaccinations.length) {
    container.innerHTML = `<p style="text-align:center;color:var(--gray-400);padding:1.5rem">Sin registros de vacunas o desparasitaciones.</p>`;
    return;
  }

  const rows = vaccinations.map(v => `
    <tr>
      <td>${formatDate(v.fecha)}</td>
      <td><span class="fc-tipo-badge fc-tipo-${v.tipo}">${v.tipo === 'desparasitacion' ? '🧪 Desparasitación' : v.tipo === 'vacuna' ? '💉 Vacuna' : '🔬 Otro'}</span></td>
      <td>${escapeHtml(v.descripcion)}</td>
      <td style="color:var(--gray-500);font-size:0.85rem">${escapeHtml(v.observaciones || '—')}</td>
      ${canEdit ? `<td><button class="fc-del-btn" data-id="${v.id}" title="Eliminar">🗑️</button></td>` : ''}
    </tr>
  `).join('');

  container.innerHTML = `
    <table class="fc-table">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Tipo</th>
          <th>Descripción</th>
          <th>Observaciones</th>
          ${canEdit ? '<th></th>' : ''}
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  if (canEdit) {
    container.querySelectorAll('.fc-del-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('¿Eliminar este registro?')) return;
        try {
          await deleteVaccination(btn.dataset.id);
          btn.closest('tr').remove();
        } catch (err) {
          alert('Error al eliminar: ' + err.message);
        }
      });
    });
  }
}

// ── RENDER TABLA CONSULTAS (para vista vet) ────────────────
export function renderConsultationTable(records, containerId, canEdit = false) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!records.length) {
    container.innerHTML = `<p style="text-align:center;color:var(--gray-400);padding:1.5rem">Sin consultas o controles registrados.</p>`;
    return;
  }

  const rows = records.map(r => `
    <tr>
      <td>${formatDate(r.created_at?.slice(0, 10))}</td>
      <td>${escapeHtml(r.procedimiento || r.assessment || '—')}</td>
      <td>${r.proximo_control ? `<span class="fc-prox-cita">${formatDate(r.proximo_control)}</span>` : '—'}</td>
      <td style="color:var(--gray-500);font-size:0.85rem">${escapeHtml(r.subjective?.slice(0, 80) || r.plan?.slice(0, 80) || '—')}</td>
    </tr>
  `).join('');

  container.innerHTML = `
    <table class="fc-table">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Procedimiento</th>
          <th>Próx. Cita</th>
          <th>Motivo / Observaciones</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

// ── RENDER CARTILLA DUEÑO (solo lectura, visual) ───────────
export function renderCartillaSalud({ pet, consultations, vaccinations }, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const hoy = new Date();
  const proxConsulta = consultations.find(c => c.proximo_control && new Date(c.proximo_control) >= hoy);
  const vacunasRecientes = vaccinations.slice(0, 3);

  const proxConsultaHtml = proxConsulta
    ? `<div class="fc-cartilla-alert">📅 Próximo control: <strong>${formatDate(proxConsulta.proximo_control)}</strong></div>`
    : '';

  const vacunasHtml = vacunasRecientes.length
    ? vacunasRecientes.map(v => `
        <div class="fc-cartilla-row">
          <span>${v.tipo === 'vacuna' ? '💉' : '🧪'} ${escapeHtml(v.descripcion)}</span>
          <span class="fc-cartilla-fecha">${formatDate(v.fecha)}</span>
        </div>
      `).join('')
    : `<p style="color:var(--gray-400);font-size:0.9rem;text-align:center;padding:0.5rem">Sin vacunas registradas aún.</p>`;

  const consultasHtml = consultations.slice(0, 3).length
    ? consultations.slice(0, 3).map(r => `
        <div class="fc-cartilla-row">
          <span>🩺 ${escapeHtml(r.procedimiento || r.assessment || 'Consulta')}</span>
          <span class="fc-cartilla-fecha">${formatDate(r.created_at?.slice(0, 10))}</span>
        </div>
      `).join('')
    : `<p style="color:var(--gray-400);font-size:0.9rem;text-align:center;padding:0.5rem">Sin consultas registradas aún.</p>`;

  container.innerHTML = `
    <div class="fc-cartilla">
      <div class="fc-cartilla-header">
        <span class="fc-cartilla-emoji">${pet.species === 'gato' ? '🐱' : pet.species === 'perro' ? '🐶' : '🐾'}</span>
        <div>
          <h3 class="fc-cartilla-name">${escapeHtml(pet.name)}</h3>
          <p class="fc-cartilla-sub">${escapeHtml(pet.species || '')}${pet.breed ? ' · ' + escapeHtml(pet.breed) : ''}${pet.birth_date ? ' · Nac. ' + formatDate(pet.birth_date) : ''}</p>
        </div>
      </div>

      ${proxConsultaHtml}

      <div class="fc-cartilla-section">
        <h4 class="fc-cartilla-section-title">💉 Vacunas y Desparasitaciones</h4>
        ${vacunasHtml}
        ${vaccinations.length > 3 ? `<p class="fc-cartilla-more">+${vaccinations.length - 3} registros anteriores</p>` : ''}
      </div>

      <div class="fc-cartilla-section">
        <h4 class="fc-cartilla-section-title">🩺 Últimas Consultas</h4>
        ${consultasHtml}
        ${consultations.length > 3 ? `<p class="fc-cartilla-more">+${consultations.length - 3} consultas anteriores</p>` : ''}
      </div>
    </div>
  `;
}
