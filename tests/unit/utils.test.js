import { describe, it, expect } from 'vitest';

describe('utils formatting', () => {
  it('Formato de fecha', () => {
    const d = new Date('2026-03-15T10:00:00');
    // Basic date formatter mock
    const formatDate = (date) => date.toISOString().split('T')[0];
    expect(formatDate(d)).toBe('2026-03-15');
  });

  it('Formato de moneda CLP', () => {
    const formatCLP = (num) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(num);
    // Might contain narrow no-break space or non-breaking space depending on Node version
    expect(formatCLP(15000).replace(/\s/g, '').replace(/[\u00A0\u202F]/g, '')).toContain('15.000');
  });
});
