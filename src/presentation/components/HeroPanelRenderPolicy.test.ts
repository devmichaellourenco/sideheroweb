import { describe, expect, it } from 'vitest';
import { GameStateDto } from '../../application/dto/GameStateDto';
import { shouldRenderHeroPanel } from './HeroPanelRenderPolicy';

function state(overrides: Partial<GameStateDto> = {}): GameStateDto {
  return {
    canEditParty: false,
    activePartyIds: ['h1'],
    heroes: [{ id: 'h1' } as GameStateDto['heroes'][0]],
    ...overrides,
  } as GameStateDto;
}

describe('shouldRenderHeroPanel', () => {
  it('pula re-render em combate quando só HP muda', () => {
    const previous = state({
      heroes: [{ id: 'h1', health: 80 } as GameStateDto['heroes'][0]],
    });
    const next = state({
      heroes: [{ id: 'h1', health: 40 } as GameStateDto['heroes'][0]],
    });

    expect(shouldRenderHeroPanel(previous, next)).toBe(false);
  });

  it('re-renderiza quando a party fica editável e o loadout muda', () => {
    const previous = state({
      canEditParty: false,
      heroes: [
        {
          id: 'h1',
          equipment: {},
        } as GameStateDto['heroes'][0],
      ],
    });
    const next = state({
      canEditParty: true,
      heroes: [
        {
          id: 'h1',
          equipment: { weapon: { id: 'g1' } },
        } as GameStateDto['heroes'][0],
      ],
    });

    expect(shouldRenderHeroPanel(previous, next)).toBe(true);
  });

  it('pula re-render fora de combate quando só o ouro muda', () => {
    const base = state({
      canEditParty: true,
      heroes: [
        {
          id: 'h1',
          level: 1,
          attack: 10,
          defense: 5,
          health: 100,
          maxHealth: 100,
          hasUnspentPoints: false,
          equipment: {},
        } as GameStateDto['heroes'][0],
      ],
    });
    const previous = { ...base, gold: 100 };
    const next = { ...base, gold: 200 };

    expect(shouldRenderHeroPanel(previous, next)).toBe(false);
  });

  it('re-renderiza fora de combate quando o equipamento muda', () => {
    const base = state({
      canEditParty: true,
      heroes: [
        {
          id: 'h1',
          level: 1,
          attack: 10,
          defense: 5,
          health: 100,
          maxHealth: 100,
          hasUnspentPoints: false,
          equipment: {},
        } as GameStateDto['heroes'][0],
      ],
    });
    const previous = base;
    const next = state({
      ...base,
      heroes: [
        {
          ...base.heroes[0],
          equipment: { weapon: { id: 'g1' } },
        } as GameStateDto['heroes'][0],
      ],
    });

    expect(shouldRenderHeroPanel(previous, next)).toBe(true);
  });

  it('re-renderiza em combate quando a composição da party muda', () => {
    const previous = state({ activePartyIds: ['h1'] });
    const next = state({ activePartyIds: ['h1', 'h2'] });

    expect(shouldRenderHeroPanel(previous, next)).toBe(true);
  });

  it('re-renderiza ao pausar para editar formação sem mudar loadout', () => {
    const previous = state({
      canEditParty: false,
      loadoutEditOpen: false,
      phaseRestartOnResume: false,
    });
    const next = state({
      canEditParty: true,
      loadoutEditOpen: true,
      phaseRestartOnResume: true,
    });

    expect(shouldRenderHeroPanel(previous, next)).toBe(true);
  });
});
