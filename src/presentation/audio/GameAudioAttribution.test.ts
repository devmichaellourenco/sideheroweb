import { describe, expect, it } from 'vitest';
import {
  formatAudioAttributionBlock,
  getInUseOpenGameArtAudioEntries,
  REQUIRED_AUDIO_ATTRIBUTION_LINES,
} from './GameAudioAttribution';

describe('GameAudioAttribution', () => {
  it('lista linhas obrigatorias do export OGA', () => {
    expect(REQUIRED_AUDIO_ATTRIBUTION_LINES).toContain(
      'Some of the sounds in this project were created by David McKee (ViRiX) soundcloud.com/virix',
    );
    expect(REQUIRED_AUDIO_ATTRIBUTION_LINES).toContain(
      "Item Handling by Iwan 'qubodup' Gabovitch http://opengameart.org/users/qubodup",
    );
  });

  it('marca pack de cliques de UI como em uso', () => {
    const inUse = getInUseOpenGameArtAudioEntries();
    expect(inUse.some((entry) => entry.id === 'click-ui-menu-sfx')).toBe(true);
  });

  it('formatAudioAttributionBlock inclui musica e sfx em uso', () => {
    const block = formatAudioAttributionBlock();
    expect(block).toContain('Medieval: Minstrel Dance');
    expect(block).toContain('click-ui-menu-sfx-yesnoselect');
    expect(block).toContain('ViRiX');
  });
});
