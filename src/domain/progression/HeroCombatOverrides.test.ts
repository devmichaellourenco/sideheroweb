import { afterEach, describe, expect, it } from 'vitest';
import { getHeroCombatIdentity } from '../combat/HeroCombatIdentityCatalog';
import { Hero } from '../entities/Hero';
import { getPassiveDefinition } from '../passives/PassiveCatalog';
import { getAscensionById, getCatalogAscensionById } from './ClassAscensionCatalog';
import { getHeroCombatSkill } from './combat/HeroCombatSkillCatalog';
import {
  applyAscensionOverride,
  applySkillCombatOverride,
  normalizeAscensionOverride,
  normalizeSkillCombatOverride,
  setRuntimeHeroCombatOverrides,
  emptyHeroCombatOverridesFile,
} from './HeroCombatOverrides';

describe('HeroCombatOverrides', () => {
  afterEach(() => {
    setRuntimeHeroCombatOverrides(null);
  });

  it('normalizeSkillCombatOverride ignora vazio e guarda knobs finitos', () => {
    expect(normalizeSkillCombatOverride({})).toBeNull();
    expect(normalizeSkillCombatOverride({ powerPerRank: 21 })).toEqual({
      powerPerRank: 21,
    });
  });

  it('normalizeAscensionOverride guarda pontos e requisitos', () => {
    expect(normalizeAscensionOverride({})).toBeNull();
    expect(
      normalizeAscensionOverride({
        pointsGranted: 5,
        requirements: [{ min: 10 }, {}, { minRank: 2 }],
      }),
    ).toEqual({
      pointsGranted: 5,
      requirements: [{ min: 10 }, {}, { minRank: 2 }],
    });
  });

  it('escala powerPerRank da skill via runtime do lab', () => {
    const baseline = getHeroCombatSkill('fireball')!.powerPerRank;
    setRuntimeHeroCombatOverrides({
      ...emptyHeroCombatOverridesFile(),
      skills: { fireball: { powerPerRank: baseline + 6 } },
    });
    expect(getHeroCombatSkill('fireball')?.powerPerRank).toBe(baseline + 6);
  });

  it('aplica identidade e passiva no lookup do domínio', () => {
    setRuntimeHeroCombatOverrides({
      ...emptyHeroCombatOverridesFile(),
      identities: { sorcerer: { attackSpeedFactor: 0.4 } },
      passives: { magic_affinity: { effects: [{ percentPerLevel: 2 }] } },
    });

    expect(getHeroCombatIdentity('sorcerer').attackSpeedFactor).toBe(0.4);
    const effect = getPassiveDefinition('magic_affinity').effects[0];
    expect(effect).toMatchObject({ percentPerLevel: 2 });
  });

  it('aplica ATK/DEF/HP base no createStarter e no getter de ataque', () => {
    setRuntimeHeroCombatOverrides({
      ...emptyHeroCombatOverridesFile(),
      baseStats: { sorcerer: { attack: 99 } },
    });

    const hero = Hero.createStarter('nix', 'sorcerer', 'Nix');
    expect(hero.baseAttack).toBe(99);
    expect(hero.attack).toBeGreaterThanOrEqual(99);
  });

  it('aplica evolução (pointsGranted + nível) no getAscensionById', () => {
    setRuntimeHeroCombatOverrides({
      ...emptyHeroCombatOverridesFile(),
      ascensions: {
        knight_military_guerreiro: {
          pointsGranted: 9,
          requirements: [{ min: 8 }],
        },
      },
    });

    const ascension = getAscensionById('knight_military_guerreiro');
    expect(ascension?.pointsGranted).toBe(9);
    expect(ascension?.requirements[0]).toMatchObject({ type: 'hero_level', min: 8 });
    expect(getCatalogAscensionById('knight_military_guerreiro')?.pointsGranted).not.toBe(9);
  });

  it('applySkillCombatOverride não muta o catálogo base', () => {
    const base = getHeroCombatSkill('thrust')!;
    const patched = applySkillCombatOverride(base, { powerPerRank: 99 });
    expect(patched.powerPerRank).toBe(99);
    expect(base.powerPerRank).not.toBe(99);
  });

  it('applyAscensionOverride não muta o catálogo base', () => {
    const base = getCatalogAscensionById('sorcerer_arcane_maga')!;
    const patched = applyAscensionOverride(base, { pointsGranted: 11 });
    expect(patched.pointsGranted).toBe(11);
    expect(base.pointsGranted).not.toBe(11);
  });
});
