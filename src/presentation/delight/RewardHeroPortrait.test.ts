import { describe, expect, it } from 'vitest';
import { rewardHeroPortraitFromClass, rewardHeroPortraitFromDto } from './RewardHeroPortrait';

describe('RewardHeroPortrait', () => {
  it('mapeia herói desbloqueado para portrait', () => {
    expect(rewardHeroPortraitFromDto({
      id: 'hero-berserker',
      heroClass: 'berserker',
      name: 'Torius',
      ascensionId: null,
    })).toEqual({
      id: 'hero-berserker',
      heroClass: 'berserker',
      name: 'Torius',
      ascensionId: null,
    });
  });

  it('preserva ascensionId para sprite de evolução', () => {
    expect(rewardHeroPortraitFromDto({
      id: 'hero-1',
      heroClass: 'knight',
      name: 'Galneon',
      ascensionId: 'knight_military_guerreiro',
    })).toEqual({
      id: 'hero-1',
      heroClass: 'knight',
      name: 'Galneon',
      ascensionId: 'knight_military_guerreiro',
    });
  });

  it('resolve portrait por classe desbloqueável', () => {
    expect(rewardHeroPortraitFromClass('paladin')).toEqual({
      id: 'hero-paladin',
      heroClass: 'paladin',
      name: 'Valerius',
    });
    expect(rewardHeroPortraitFromClass('archer')).toEqual({
      id: 'hero-archer',
      heroClass: 'archer',
      name: 'Rain',
    });
  });
});
