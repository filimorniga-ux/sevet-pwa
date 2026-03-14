import { describe, expect, it } from 'vitest';
import {
  buildServicePriceIndex,
  calculateStockAfterMovement,
  estimateAppointmentRevenue,
  normalizeServiceClassifier,
} from '../../js/modules/admin-utils.js';

describe('admin-utils', () => {
  it('normaliza clasificador de servicio', () => {
    expect(normalizeServiceClassifier('  Cirugia ')).toBe('cirugia');
    expect(normalizeServiceClassifier(null)).toBe('');
  });

  it('construye índice de precios por id y categoría', () => {
    const index = buildServicePriceIndex([
      { id: 's1', category: 'consulta', price: 15000 },
      { id: 's2', specialty: 'cirugia', price: 90000 },
    ]);

    expect(index.byId.get('s1')).toBe(15000);
    expect(index.byClassifier.get('consulta')).toBe(15000);
    expect(index.byClassifier.get('cirugia')).toBe(90000);
  });

  it('estima ingresos por citas usando id y fallback por tipo', () => {
    const index = buildServicePriceIndex([
      { id: 'svc-1', category: 'consulta', price: 15000 },
      { id: 'svc-2', category: 'control', price: 12000 },
    ]);

    const revenue = estimateAppointmentRevenue([
      { service_id: 'svc-1', service_type: 'consulta' },
      { service_type: 'control' },
      { service_type: 'desconocido' },
    ], index);

    expect(revenue).toBe(27000);
  });

  it('calcula stock tras entrada y salida', () => {
    expect(calculateStockAfterMovement(10, 'entrada', 4)).toBe(14);
    expect(calculateStockAfterMovement(10, 'salida', 4)).toBe(6);
    expect(calculateStockAfterMovement(2, 'salida', 10)).toBe(0);
  });
});
