import { parseUiThemeId, type UiThemeId } from './MedievalThemeTokens';

export const UI_THEME_ATTR = 'data-ui-theme';

/** Aplica o tema de UI no documento (chrome). Batalha isolada via CSS. */
export function applyUiTheme(theme: UiThemeId, root: HTMLElement = document.documentElement): void {
  root.setAttribute(UI_THEME_ATTR, theme);
}

export function readUiThemeFromDom(root: HTMLElement = document.documentElement): UiThemeId {
  return parseUiThemeId(root.getAttribute(UI_THEME_ATTR));
}
