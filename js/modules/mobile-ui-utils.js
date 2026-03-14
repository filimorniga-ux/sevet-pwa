export function getVisibleCardsForWidth(viewportWidth) {
  const width = Number.isFinite(viewportWidth) ? viewportWidth : 0;
  if (width <= 768) return 1;
  if (width <= 1024) return 2;
  return 3;
}

export function clampCarouselIndex(index, totalCards, visibleCards) {
  const rawIndex = Number.isFinite(index) ? index : 0;
  const safeTotal = Number.isFinite(totalCards) ? Math.max(0, totalCards) : 0;
  const safeVisible = Number.isFinite(visibleCards) ? Math.max(1, visibleCards) : 1;
  const maxIndex = Math.max(0, safeTotal - safeVisible);
  return Math.max(0, Math.min(Math.trunc(rawIndex), maxIndex));
}

export function getBodyLockTop(scrollY) {
  const safeScroll = Number.isFinite(scrollY) ? Math.max(0, scrollY) : 0;
  if (safeScroll === 0) return '0px';
  return `-${safeScroll}px`;
}
