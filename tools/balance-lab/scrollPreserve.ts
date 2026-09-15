/**
 * Mantém a posição de scroll ao recriar o HTML de um painel do Balance Lab.
 */

/**
 * Executa `render` (que troca o innerHTML do host) preservando o scroll dos
 * containers em `selectors` e da própria página.
 */
export function withPreservedScroll(
  host: HTMLElement,
  selectors: readonly string[],
  render: () => void,
): void {
  const positions = selectors.map((selector) => ({
    selector,
    top: host.querySelector<HTMLElement>(selector)?.scrollTop ?? 0,
    left: host.querySelector<HTMLElement>(selector)?.scrollLeft ?? 0,
  }));
  const pageY = window.scrollY;
  const pageX = window.scrollX;

  render();

  const restore = (): void => {
    for (const { selector, top, left } of positions) {
      const el = host.querySelector<HTMLElement>(selector);
      if (!el) continue;
      if (top > 0) el.scrollTop = top;
      if (left > 0) el.scrollLeft = left;
    }
    if (pageY > 0 || pageX > 0) window.scrollTo(pageX, pageY);
  };

  restore();
  // Reaplica após o layout final (sprites/fontes podem mudar a altura).
  requestAnimationFrame(restore);
}
