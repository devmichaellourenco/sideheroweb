import { describe, expect, it } from 'vitest';
import { GAME_SFX_CREDITS, getGameSfxCredit } from './GameSfxCredits';

describe('GameSfxCredits', () => {
  it('registra os tres cliques de UI com paths locais', () => {
    expect(GAME_SFX_CREDITS).toHaveLength(3);

    expect(getGameSfxCredit('menu')?.localFile).toBe('public/audio/sfx/ui_click_menu.ogg');
    expect(getGameSfxCredit('confirm')?.sourceFilename).toBe('yes.wav');
    expect(getGameSfxCredit('back')?.author).toBe('qubodup');
    expect(getGameSfxCredit('back')?.attributionRequired).toBe(false);
  });
});
