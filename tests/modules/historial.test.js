import { beforeEach, describe, expect, it } from 'vitest';
import { initHistorial } from '../../js/modules/historial.js';

describe('initHistorial', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renderiza la ficha clínica y sus registros', () => {
    document.body.innerHTML = '<div id="historial-container"></div>';

    initHistorial();

    expect(document.querySelector('.historial-layout')).not.toBeNull();
    expect(document.querySelectorAll('.record-card')).toHaveLength(3);
    expect(document.body.textContent).toContain('Consultas');
  });

  it('expande un registro y muestra secciones SOAP', () => {
    document.body.innerHTML = '<div id="historial-container"></div>';

    initHistorial();
    window._toggleRecord(1);

    expect(document.body.textContent).toContain('Subjetivo');
    expect(document.body.textContent).toContain('Objetivo');
    expect(document.body.textContent).toContain('Evaluación');
    expect(document.body.textContent).toContain('Plan');
  });

  it('no falla cuando el contenedor no existe', () => {
    expect(() => initHistorial()).not.toThrow();
  });
});
