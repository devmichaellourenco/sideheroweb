import { describe, expect, it } from 'vitest';
import {
  GAME_MUSIC_CREDITS,
  formatGameMusicCreditLine,
  getGameMusicCredit,
} from './GameMusicCredits';

describe('GameMusicCredits', () => {
  it('registra camp e battle com links do OpenGameArt', () => {
    expect(GAME_MUSIC_CREDITS).toHaveLength(2);

    const camp = getGameMusicCredit('camp');
    expect(camp?.sourceUrl).toBe('https://opengameart.org/content/medieval-minstrel-dance');
    expect(camp?.author).toBe('RandomMind');

    const battle = getGameMusicCredit('battle');
    expect(battle?.sourceUrl).toBe('https://opengameart.org/content/medieval-battle');
    expect(battle?.author).toBe('RandomMind');
  });

  it('formata linha de credito legivel', () => {
    const camp = getGameMusicCredit('camp');
    expect(camp).toBeDefined();
    expect(formatGameMusicCreditLine(camp!)).toContain('Medieval: Minstrel Dance');
    expect(formatGameMusicCreditLine(camp!)).toContain('opengameart.org/content/medieval-minstrel-dance');
  });
});
