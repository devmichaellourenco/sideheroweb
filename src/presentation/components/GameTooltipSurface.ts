/** Classe compartilhada da carta selada — ver `.game-tooltip` em panel.css. */
export const GAME_TOOLTIP_CLASS = 'game-tooltip';

export function gameTooltipClassName(...parts: Array<string | false | null | undefined>): string {
  return [GAME_TOOLTIP_CLASS, ...parts.filter((part): part is string => Boolean(part))].join(' ');
}
