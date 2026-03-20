import { describe, expect, it } from 'vitest';
import {
  clampCarouselIndex,
  getBodyLockTop,
  getVisibleCardsForWidth,
} from '../../js/modules/mobile-ui-utils.js';

describe('mobile-ui-utils', () => {
  it('calcula correctamente las tarjetas visibles según ancho de viewport', () => {
    const mobileCards = getVisibleCardsForWidth(390);
    const tabletCards = getVisibleCardsForWidth(820);
    const desktopCards = getVisibleCardsForWidth(1280);

    expect(mobileCards).toBe(1);
    expect(tabletCards).toBe(2);
    expect(desktopCards).toBe(3);
  });

  it('calcula correctamente los breakpoints exactos del carrusel (768px y 1024px)', () => {
    // Tests explícitos para los breakpoints pedidos en Mobile UX Fix
    const edgeMobileCards = getVisibleCardsForWidth(768);
    const edgeTabletCards = getVisibleCardsForWidth(1024);

    expect(edgeMobileCards).toBe(1);
    expect(edgeTabletCards).toBe(2);
  });

  it('limita el índice del carrusel a un rango válido', () => {
    const minIndex = clampCarouselIndex(-5, 6, 2);
    const maxIndex = clampCarouselIndex(99, 6, 2);
    const inRangeIndex = clampCarouselIndex(2, 6, 2);

    expect(minIndex).toBe(0);
    expect(maxIndex).toBe(4);
    expect(inRangeIndex).toBe(2);
  });

  it('normaliza valores inválidos al calcular lock de scroll', () => {
    const topWithScroll = getBodyLockTop(320);
    const topNegative = getBodyLockTop(-15);
    const topInvalid = getBodyLockTop(Number.NaN);

    expect(topWithScroll).toBe('-320px');
    expect(topNegative).toBe('0px');
    expect(topInvalid).toBe('0px');
  });
});
