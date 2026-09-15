import { GameUiClickSfxId } from './GameSfxCatalog';
import { IN_USE_UI_CLICK_SOURCES } from './GameAudioAttribution';

/** Atribuição dos SFX de UI — fonte canônica para créditos no código. */
export type GameSfxCredit = {
  sfxId: GameUiClickSfxId;
  title: string;
  author: string;
  license: string;
  sourceUrl: string;
  localFile: string;
  sourceFilename: string;
  /** CC0 — crédito opcional. */
  attributionRequired: boolean;
};

export const GAME_SFX_CREDITS: readonly GameSfxCredit[] = [
  {
    sfxId: 'menu',
    title: 'Click UI Menu SFX — select',
    author: 'qubodup',
    license: 'CC0',
    sourceUrl: 'https://opengameart.org/content/click-ui-menu-sfx-yesnoselect',
    localFile: 'public/audio/sfx/ui_click_menu.ogg',
    sourceFilename: IN_USE_UI_CLICK_SOURCES.menu.sourceFilename,
    attributionRequired: false,
  },
  {
    sfxId: 'confirm',
    title: 'Click UI Menu SFX — yes',
    author: 'qubodup',
    license: 'CC0',
    sourceUrl: 'https://opengameart.org/content/click-ui-menu-sfx-yesnoselect',
    localFile: 'public/audio/sfx/ui_click_confirm.ogg',
    sourceFilename: IN_USE_UI_CLICK_SOURCES.confirm.sourceFilename,
    attributionRequired: false,
  },
  {
    sfxId: 'back',
    title: 'Click UI Menu SFX — no',
    author: 'qubodup',
    license: 'CC0',
    sourceUrl: 'https://opengameart.org/content/click-ui-menu-sfx-yesnoselect',
    localFile: 'public/audio/sfx/ui_click_back.ogg',
    sourceFilename: IN_USE_UI_CLICK_SOURCES.back.sourceFilename,
    attributionRequired: false,
  },
] as const;

export function getGameSfxCredit(sfxId: GameUiClickSfxId): GameSfxCredit | undefined {
  return GAME_SFX_CREDITS.find((credit) => credit.sfxId === sfxId);
}

export function formatGameSfxCreditLine(credit: GameSfxCredit): string {
  return `${credit.title} by ${credit.author} (${credit.license}) — ${credit.sourceUrl}`;
}
