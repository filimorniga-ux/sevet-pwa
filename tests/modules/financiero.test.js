import { beforeEach, describe, expect, it } from 'vitest';
import { initFinanciero } from '../../js/modules/financiero.js';

describe('initFinanciero', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renderiza KPIs y analíticas del panel financiero', () => {
    document.body.innerHTML = '<div id="financiero-container"></div>';

    initFinanciero();

    expect(document.querySelector('.fin-kpis')).not.toBeNull();
    expect(document.querySelectorAll('.fin-kpi')).toHaveLength(4);
    expect(document.body.textContent).toContain('Ingresos del mes');
    expect(document.querySelectorAll('.fin-tx').length).toBeGreaterThan(0);
  });

  it('no falla cuando el contenedor no existe', () => {
    expect(() => initFinanciero()).not.toThrow();
  });
});
