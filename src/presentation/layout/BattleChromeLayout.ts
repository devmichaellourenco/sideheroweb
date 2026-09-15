const PANEL_SHEET_TOP_VAR = '--panel-sheet-top';
const STAGE_LEFT_VAR = '--systems-stage-left';
const STAGE_WIDTH_VAR = '--systems-stage-width';
const BELOW_BATTLE_TOP_VAR = '--systems-below-battle-top';

export function formatPanelSheetTop(boundaryTop: number): string {
  return `${Math.max(0, Math.ceil(boundaryTop))}px`;
}

/** Distância do topo do palco até abaixo da battle-stage (Log / Stats). */
export function formatBelowBattleTop(stageTop: number, battleBottom: number, gap = 8): string {
  return `${Math.max(0, Math.ceil(battleBottom - stageTop + gap))}px`;
}

/** Ancora o palco de sistemas e a base da battle-stage (Log / Stats). */
export function syncBattleChromeLayout(
  systemsStage: HTMLElement,
  battleStage?: HTMLElement | null,
): void {
  const rect = systemsStage.getBoundingClientRect();
  const style = document.documentElement.style;
  style.setProperty(PANEL_SHEET_TOP_VAR, formatPanelSheetTop(rect.top));
  style.setProperty(STAGE_LEFT_VAR, `${Math.max(0, Math.round(rect.left))}px`);
  style.setProperty(STAGE_WIDTH_VAR, `${Math.max(0, Math.round(rect.width))}px`);
  if (battleStage) {
    const battleBottom = battleStage.getBoundingClientRect().bottom;
    style.setProperty(BELOW_BATTLE_TOP_VAR, formatBelowBattleTop(rect.top, battleBottom));
  }
}

/** Observa palco e battle-stage e mantém as variáveis de layout alinhadas. */
export function bindBattleChromeLayout(
  systemsStage: HTMLElement,
  layoutRoot?: HTMLElement | null,
  battleStage?: HTMLElement | null,
): () => void {
  const sync = () => syncBattleChromeLayout(systemsStage, battleStage);

  sync();

  const observer = new ResizeObserver(sync);
  observer.observe(systemsStage);
  if (layoutRoot) {
    observer.observe(layoutRoot);
  }
  if (battleStage) {
    observer.observe(battleStage);
  }

  window.addEventListener('resize', sync);

  return () => {
    observer.disconnect();
    window.removeEventListener('resize', sync);
  };
}
