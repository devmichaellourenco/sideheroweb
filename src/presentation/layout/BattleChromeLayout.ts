const PANEL_SHEET_TOP_VAR = '--panel-sheet-top';

export function formatPanelSheetTop(boundaryBottom: number): string {
  return `${Math.max(0, Math.ceil(boundaryBottom))}px`;
}

/** Sincroniza o topo dos sheets com a base da barra Pausar/Acampamento. */
export function syncBattleChromeLayout(boundaryEl: HTMLElement): void {
  document.documentElement.style.setProperty(
    PANEL_SHEET_TOP_VAR,
    formatPanelSheetTop(boundaryEl.getBoundingClientRect().bottom),
  );
}

/** Observa mudanças de layout e mantém `--panel-sheet-top` abaixo dos botões de combate. */
export function bindBattleChromeLayout(
  boundaryEl: HTMLElement,
  layoutRoot?: HTMLElement | null,
): () => void {
  const sync = () => syncBattleChromeLayout(boundaryEl);

  sync();

  const observer = new ResizeObserver(sync);
  observer.observe(boundaryEl);
  if (layoutRoot) {
    observer.observe(layoutRoot);
  }

  window.addEventListener('resize', sync);

  return () => {
    observer.disconnect();
    window.removeEventListener('resize', sync);
  };
}
