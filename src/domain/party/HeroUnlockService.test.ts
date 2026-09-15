import { describe, expect, it } from 'vitest';
import { GameState } from '../entities/GameState';
import { HeroUnlockService } from './HeroUnlockService';

describe('HeroUnlockService', () => {
  it('new game começa só com Nix; unlock adiciona Galneon à reserva', () => {
    const initial = GameState.initial();
    expect(initial.roster).toHaveLength(1);
    expect(initial.roster[0]?.heroClass).toBe('sorcerer');
    expect(initial.activePartyIds).toEqual(['hero-2']);

    const next = HeroUnlockService.applyUnlock(initial, 'knight');
    expect(next.roster).toHaveLength(2);
    expect(next.roster.some((hero) => hero.heroClass === 'knight')).toBe(true);
    expect(next.roster.find((hero) => hero.heroClass === 'knight')?.name).toBe('Galneon');
    expect(next.activePartyIds).toEqual(['hero-2']);
    expect(next.benchHeroes()).toHaveLength(1);
  });

  it('não duplica herói já desbloqueado', () => {
    const once = HeroUnlockService.applyUnlock(GameState.initial(), 'paladin');
    const twice = HeroUnlockService.applyUnlock(once, 'paladin');
    expect(twice.roster.filter((hero) => hero.heroClass === 'paladin')).toHaveLength(1);
  });

  it('adiciona Rain com Arco de Kontempler no inventário', () => {
    const next = HeroUnlockService.applyUnlock(GameState.initial(), 'archer');
    expect(next.roster.find((hero) => hero.heroClass === 'archer')?.name).toBe('Rain');
    expect(next.inventory.some((gear) => gear.catalogItemId === 'rain_kontempler_bow')).toBe(true);
    expect(next.inventory.find((gear) => gear.catalogItemId === 'rain_kontempler_bow')?.requirements.heroId).toBe(
      'hero-archer',
    );
  });
});
