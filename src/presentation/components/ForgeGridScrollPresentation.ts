export function captureForgeGridScroll(container: HTMLElement): number | null {
  const scroll = container.querySelector('.forge-grid-scroll');
  if (!scroll || !('scrollTop' in scroll) || typeof scroll.scrollTop !== 'number') {
    return null;
  }

  return scroll.scrollTop;
}

export function restoreForgeGridScroll(container: HTMLElement, scrollTop: number | null): void {
  if (scrollTop === null) return;

  const scroll = container.querySelector('.forge-grid-scroll');
  if (!scroll || !('scrollTop' in scroll) || typeof scroll.scrollTop !== 'number') {
    return;
  }

  scroll.scrollTop = scrollTop;
}
