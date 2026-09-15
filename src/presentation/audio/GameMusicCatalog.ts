import { ASSETS, getAssetUrl } from '../assets/AssetCatalog';

export type GameMusicTrackId = 'camp' | 'battle';

/** Créditos das trilhas: ver `GameMusicCredits.ts` e `public/audio/music/CREDITS.md`. */
export { GAME_MUSIC_CREDITS, formatGameMusicCreditLine, getGameMusicCredit } from './GameMusicCredits';
export type { GameMusicCredit } from './GameMusicCredits';

export const GAME_MUSIC_TRACKS: Record<
  GameMusicTrackId,
  { label: string; assetPath: string }
> = {
  camp: {
    label: 'Acampamento',
    assetPath: ASSETS.audio.music.camp,
  },
  battle: {
    label: 'Batalha',
    assetPath: ASSETS.audio.music.battle,
  },
};

export function getGameMusicTrackUrl(trackId: GameMusicTrackId): string {
  return getAssetUrl(GAME_MUSIC_TRACKS[trackId].assetPath);
}
