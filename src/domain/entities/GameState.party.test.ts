import { describe, expect, it } from 'vitest';
import { Hero } from './Hero';
import { GameState } from './GameState';

describe('GameState party', () => {
  it('inicializa roster só com Nix na party ativa', () => {
    const state = GameState.initial();
    expect(state.roster).toHaveLength(1);
    expect(state.roster[0]?.heroClass).toBe('sorcerer');
    expect(state.activePartyIds).toEqual(['hero-2']);
    expect(state.activeHeroes()).toHaveLength(1);
    expect(state.benchHeroes()).toHaveLength(0);
  });

  it('activeHeroes respeita ordem de activePartyIds', () => {
    const galneon = Hero.createStarter('hero-1', 'knight', 'Galneon');
    const state = GameState.initial()
      .withRoster([...GameState.initial().roster, galneon])
      .withActivePartyIds(['hero-1', 'hero-2']);
    expect(state.activeHeroes().map((hero) => hero.id)).toEqual(['hero-1', 'hero-2']);
    expect(state.benchHeroes()).toHaveLength(0);
  });

  it('withRosterHeroes mescla updates sem remover reserva', () => {
    const galneon = Hero.createStarter('hero-1', 'knight', 'Galneon');
    const state = GameState.initial()
      .withRoster([...GameState.initial().roster, galneon])
      .withActivePartyIds(['hero-2']);
    const wounded = Hero.restore({
      ...state.roster[0].toProps(),
      currentHealth: 1,
    });

    const next = state.withRosterHeroes([wounded]);
    expect(next.roster).toHaveLength(2);
    expect(next.roster.find((h) => h.id === 'hero-2')?.currentHealth).toBe(1);
    expect(next.activePartyIds).toEqual(['hero-2']);
  });

  it('heroes getter permanece alias do roster', () => {
    const state = GameState.initial();
    expect(state.heroes).toBe(state.roster);
  });

  it('restore normaliza saves legados sem activePartyIds', () => {
    const nix = Hero.createStarter('hero-2', 'sorcerer', 'Nix');
    const galneon = Hero.createStarter('hero-1', 'knight', 'Galneon');
    const elara = Hero.createStarter('hero-3', 'priest', 'Elara');
    const legacy = GameState.restore({
      heroes: [galneon, nix, elara],
      combat: null,
      campaignProgress: GameState.initial().campaignProgress.toProps(),
      phaseRun: null,
      stage: 1,
      gold: 0,
      chests: [],
      inventory: [],
      battleLog: [],
      totalBattlesWon: 0,
      lastTickAt: Date.now(),
      shopRefreshSeed: 0,
      upgradeLevels: {},
      shopRefreshUses: 0,
    });

    expect(legacy.activePartyIds).toEqual(['hero-1', 'hero-2', 'hero-3']);
    expect(legacy.activeHeroes()).toHaveLength(3);
  });
});
