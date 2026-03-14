import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../js/supabase.js', () => ({
  supabase: {
    auth: {
      getSession: async () => ({ data: { session: null } }),
    },
    from: () => ({
      select() { return this; },
      eq() { return this; },
      single: async () => ({ data: null, error: null }),
      order() { return this; },
      limit() { return this; },
      insert() { return this; },
    }),
  },
}));

import {
  extractMedicationsFromPlan,
  initHistorial,
  mapMedicalRecordRow,
  normalizeRecordType,
} from '../../js/modules/historial.js';

describe('historial module', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renderiza layout y fallback de registros', () => {
    document.body.innerHTML = '<div id="historial-container"></div>';

    initHistorial();

    expect(document.querySelector('.historial-layout')).not.toBeNull();
    expect(document.querySelectorAll('.record-card').length).toBeGreaterThan(0);
  });

  it('expande un registro y muestra bloques SOAP', () => {
    document.body.innerHTML = '<div id="historial-container"></div>';

    initHistorial();
    window._toggleRecord('demo-1');

    expect(document.body.textContent).toContain('Subjetivo');
    expect(document.body.textContent).toContain('Objetivo');
    expect(document.body.textContent).toContain('Evaluación');
    expect(document.body.textContent).toContain('Plan');
  });

  it('normaliza tipos de registro con alias', () => {
    expect(normalizeRecordType('Vacuna')).toBe('vacunacion');
    expect(normalizeRecordType('cirugía')).toBe('cirugia');
    expect(normalizeRecordType('emergencia')).toBe('urgencia');
    expect(normalizeRecordType('desconocido')).toBe('consulta');
  });

  it('extrae medicamentos detectados desde plan', () => {
    const meds = extractMedicationsFromPlan(
      '1. Clorhexidina oral gel 0.12%\n2. Control en 7 días\n3. Cefalexina 22mg/kg c/12h'
    );
    expect(meds).toHaveLength(2);
    expect(meds[0]).toContain('Clorhexidina');
    expect(meds[1]).toContain('Cefalexina');
  });

  it('mapea fila de medical_records a formato de vista', () => {
    const mapped = mapMedicalRecordRow({
      id: 'r1',
      pet_id: 'p1',
      record_type: 'vacuna',
      subjective: 'Sin apetito',
      objective: 'T 38.5',
      assessment: 'Leve deshidratación',
      plan: '1. Meloxicam 0.2mg/kg',
      created_at: '2026-03-14T10:00:00Z',
      pets: { name: 'Kira', breed: 'Mestiza', species: 'perro' },
      profiles: { full_name: 'Dra. Test' },
      diagnostic_images: [{ type: 'radiografia', created_at: '2026-03-14T10:00:00Z' }],
    });

    expect(mapped.patient).toBe('Kira');
    expect(mapped.vet).toBe('Dra. Test');
    expect(mapped.type).toBe('vacunacion');
    expect(mapped.attachments.length).toBe(1);
  });

  it('no falla cuando el contenedor no existe', () => {
    expect(() => initHistorial()).not.toThrow();
  });
});
