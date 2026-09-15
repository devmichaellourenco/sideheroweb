import { describe, expect, it } from 'vitest';
import { GameStateDto, GearDto } from '../../application/dto/GameStateDto';
import {
  getGearUpgradeInfoForHero,
  listGearStatDeltas,
  listPrimaryGearStatDeltas,
  renderGridCompareBadge,
  renderStatDeltaHtml,
  resolveGridCompareBadge,
} from './GearComparison';
import { EquippedGearDto } from './GearPresentation';

function baseGear(overrides: Partial<GearDto> = {}): GearDto {
  return {
    id: 'g1',
    name: 'Espada nova',
    templateId: 'tpl',
    slot: 'weapon',
    rarity: 'rare',
    attackBonus: 12,
    defenseBonus: 0,
    healthBonus: 5,
    attackSpeedBonus: 0,
    castSpeedBonus: 0,
    critChanceBonus: 0,
    critDamageBonus: 0,
    fireResistBonus: 0,
    coldResistBonus: 0,
    lightningResistBonus: 0,
    airResistBonus: 0,
    allElementalResistBonus: 0,
    fireDamageBonus: 0,
    fireResistPenetrationBonus: 0,
    coldDamageBonus: 0,
    lightningDamageBonus: 0,
    airDamageBonus: 0,
    allElementalDamageBonus: 0,
    fireDamageFlat: 0,
    coldDamageFlat: 0,
    lightningDamageFlat: 0,
    airDamageFlat: 0,
    fireResistFlat: 0,
    coldResistFlat: 0,
    lightningResistFlat: 0,
    airResistFlat: 0,
    attackPercentBonus: 0,
    defensePercentBonus: 0,
    healthPercentBonus: 0,
    physicalDamagePercentBonus: 0,
    cooldownReductionBonus: 0,
    dodgeChanceBonus: 0,
    blockChanceBonus: 0,
    damageReductionBonus: 0,
    requirements: { minLevel: 1 },
    ...overrides,
  };
}

describe('getGearUpgradeInfoForHero', () => {
  it('calcula upgrade relativo ao herói selecionado', () => {
    const state = {
      heroes: [
        {
          id: 'h1',
          name: 'Galneon',
          equipment: {
            weapon: {
              id: 'w1',
              name: 'Espada velha',
              slot: 'weapon',
              rarity: 'common',
              attackBonus: 5,
              defenseBonus: 0,
              healthBonus: 0,
            },
            armor: null,
            accessory: null,
          },
        },
      ],
      gearUpgradeHints: {},
      inventory: [],
    } as unknown as GameStateDto;

    const info = getGearUpgradeInfoForHero(state, baseGear(), 'h1');

    expect(info.status).toBe('upgrade');
    expect(info.gain).toBe(12);
    expect(info.recommendation?.heroName).toBe('Galneon');
  });
});

describe('listGearStatDeltas', () => {
  it('sem item equipado mostra só diferenças positivas/negativas do candidato', () => {
    const deltas = listGearStatDeltas(baseGear({ attackBonus: 10, defenseBonus: 2, healthBonus: 0 }), null);

    expect(deltas.map((d) => d.text)).toEqual(['ATK +10', 'DEF +2']);
    expect(deltas.every((d) => d.tone === 'better')).toBe(true);
  });

  it('com item equipado compara status a status com = / + / −', () => {
    const equipped: EquippedGearDto = {
      id: 'w1',
      name: 'Espada velha',
      templateId: 'old',
      slot: 'weapon',
      rarity: 'common',
      attackBonus: 5,
      defenseBonus: 3,
      healthBonus: 5,
    };

    const deltas = listGearStatDeltas(
      baseGear({ attackBonus: 12, defenseBonus: 1, healthBonus: 5, attackSpeedBonus: 2 }),
      equipped,
    );

    expect(deltas.find((d) => d.key === 'attack')?.text).toBe('ATK +7');
    expect(deltas.find((d) => d.key === 'defense')?.text).toBe('DEF −2');
    expect(deltas.find((d) => d.key === 'health')?.text).toBe('HP =');
    expect(deltas.find((d) => d.key === 'attackSpeed')?.text).toBe('ASPD +2');
    expect(renderStatDeltaHtml(deltas.find((d) => d.key === 'attack')!)).toContain('stat-better');
    expect(renderStatDeltaHtml(deltas.find((d) => d.key === 'defense')!)).toContain('stat-worse');
    expect(renderStatDeltaHtml(deltas.find((d) => d.key === 'health')!)).toContain('stat-equal');
  });

  it('lista primária do grid omite iguais', () => {
    const equipped: EquippedGearDto = {
      id: 'w1',
      name: 'Espada velha',
      templateId: 'old',
      slot: 'weapon',
      rarity: 'common',
      attackBonus: 5,
      defenseBonus: 0,
      healthBonus: 5,
    };

    const primary = listPrimaryGearStatDeltas(
      baseGear({ attackBonus: 12, defenseBonus: 0, healthBonus: 5 }),
      equipped,
    );

    expect(primary.map((d) => d.key)).toEqual(['attack']);
    expect(primary[0]?.text).toBe('ATK +7');
  });

  it('resolve badge da grid: ▲ / ▼ / ▲▼ / vazio', () => {
    const equipped: EquippedGearDto = {
      id: 'w1',
      name: 'Espada velha',
      templateId: 'old',
      slot: 'weapon',
      rarity: 'common',
      attackBonus: 5,
      defenseBonus: 3,
      healthBonus: 5,
    };

    expect(resolveGridCompareBadge(baseGear({ attackBonus: 12, defenseBonus: 4, healthBonus: 6 }), equipped)).toBe(
      'upgrade',
    );
    expect(resolveGridCompareBadge(baseGear({ attackBonus: 1, defenseBonus: 1, healthBonus: 1 }), equipped)).toBe(
      'downgrade',
    );
    expect(resolveGridCompareBadge(baseGear({ attackBonus: 12, defenseBonus: 1, healthBonus: 5 }), equipped)).toBe(
      'mixed',
    );
    expect(resolveGridCompareBadge(baseGear({ attackBonus: 5, defenseBonus: 3, healthBonus: 5 }), equipped)).toBe(
      'equal',
    );
    expect(renderGridCompareBadge(baseGear({ attackBonus: 5, defenseBonus: 3, healthBonus: 5 }), equipped)).toBe('');
    expect(renderGridCompareBadge(baseGear({ attackBonus: 12, defenseBonus: 1, healthBonus: 5 }), equipped)).toContain(
      '▲▼',
    );
  });
});
