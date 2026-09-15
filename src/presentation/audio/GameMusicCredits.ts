import { GameMusicTrackId } from './GameMusicCatalog';

/** Atribuição das trilhas em uso — fonte canônica para créditos no código. */
export type GameMusicCredit = {
  trackId: GameMusicTrackId;
  title: string;
  author: string;
  license: string;
  sourceUrl: string;
  localFile: string;
  sourceFilename?: string;
};

export const GAME_MUSIC_CREDITS: readonly GameMusicCredit[] = [
  {
    trackId: 'camp',
    title: 'Medieval: Minstrel Dance',
    author: 'RandomMind',
    license: 'CC0',
    sourceUrl: 'https://opengameart.org/content/medieval-minstrel-dance',
    localFile: 'public/audio/music/camp.wav',
    sourceFilename: 'Loop_Minstrel_Dance.wav',
  },
  {
    trackId: 'battle',
    title: 'Medieval: Battle',
    author: 'RandomMind',
    license: 'CC0',
    sourceUrl: 'https://opengameart.org/content/medieval-battle',
    localFile: 'public/audio/music/battle.wav',
    sourceFilename: 'battle.wav',
  },
] as const;

export function getGameMusicCredit(trackId: GameMusicTrackId): GameMusicCredit | undefined {
  return GAME_MUSIC_CREDITS.find((credit) => credit.trackId === trackId);
}

export function formatGameMusicCreditLine(credit: GameMusicCredit): string {
  return `${credit.title} by ${credit.author} (${credit.license}) — ${credit.sourceUrl}`;
}
