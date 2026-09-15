import { describe, expect, it } from 'vitest';
import { Hero, HeroProps } from '../entities/Hero';
import { Gear } from '../entities/Gear';
import { Experience } from '../value-objects/Experience';
import { BASIC_ATTACK_SKILL_ID } from '../progression/combat/BasicAttackSkill';
import { ImprovementResetService } from './ImprovementResetService';

function knightHero(overrides: Partial<HeroProps> = {}): Hero {
  const base = Hero.createStarter('k1', 'knight', 'Galneon');
  const { experience: _ignored, ...rest } = overrides;
  return Hero.restore({
    ...base.toProps(),
    experience: Experience.restore(0, 0, 12),
    ...rest,
  });
}

describe('ImprovementResetService', () => {
  const service = new ImprovementResetService();

  it('refund atributo OK e aumenta unspent', () => {
    const hero = knightHero({
      allocatedAttributes: { str: 2, dex: 0, int: 0 },
      unspentImprovementPoints: 0,
    });

    const next = service.refundAttribute(hero, 'str');
    expect(next.toProps().allocatedAttributes.str).toBe(1);
    expect(next.toProps().unspentImprovementPoints).toBe(1);
  });

  it('bloqueia atributo abaixo do mínimo de ascensão', () => {
    const ascended = knightHero({
      allocatedAttributes: { str: 1, dex: 0, int: 0 },
      ascensionId: 'knight_military_guerreiro',
      skillRanks: { [BASIC_ATTACK_SKILL_ID]: 1, thrust: 1 },
    });
    // Guerreiro needs STR 12; base is 12; allocated 1 → total 13. Refund to 0 still meets.
    expect(() => service.refundAttribute(ascended, 'str')).not.toThrow();

    const tight = knightHero({
      allocatedAttributes: { str: 4, dex: 0, int: 0 },
      ascensionId: 'knight_military_capitao',
      skillRanks: { [BASIC_ATTACK_SKILL_ID]: 1, thrust: 1, mil_guer_rally: 1 },
    });
    // Capitao needs STR 16; base 12 + 4 = 16. Refunding 1 → 15 fails.
    expect(() => service.refundAttribute(tight, 'str')).toThrow(/ascensão|Capitão|não pode ser desfeita/i);
  });

  it('bloqueia atributo abaixo do mínimo de item equipado', () => {
    const gear = Gear.create({
      id: 'w1',
      name: 'Espada Pesada',
      templateId: 'sword',
      slot: 'weapon',
      rarity: 'rare',
      attackBonus: 5,
      defenseBonus: 0,
      healthBonus: 0,
      requirements: { minLevel: 1, str: 14 },
    });
    const hero = knightHero({
      allocatedAttributes: { str: 2, dex: 0, int: 0 },
      equipment: { weapon: gear, armor: null, accessory: null },
    });
    expect(() => service.refundAttribute(hero, 'str')).toThrow(/Espada Pesada|Desequipe/);
  });

  it('refund skill OK; bloqueia rank→0 equipada', () => {
    const ok = knightHero({
      skillRanks: { [BASIC_ATTACK_SKILL_ID]: 1, thrust: 2 },
      equippedSkillIds: [BASIC_ATTACK_SKILL_ID],
      unspentImprovementPoints: 0,
    });
    const next = service.refundSkillRank(ok, 'thrust');
    expect(next.toProps().skillRanks.thrust).toBe(1);
    expect(next.toProps().unspentImprovementPoints).toBe(1);

    const equipped = knightHero({
      skillRanks: { [BASIC_ATTACK_SKILL_ID]: 1, thrust: 1 },
      equippedSkillIds: [BASIC_ATTACK_SKILL_ID, 'thrust'],
    });
    expect(() => service.refundSkillRank(equipped, 'thrust')).toThrow(/Desequipe|slots de batalha/);
  });

  it('massa zera skills acima do piso da ascensão; preserva classe', () => {
    const hero = knightHero({
      allocatedAttributes: { str: 3, dex: 1, int: 0 },
      skillRanks: {
        [BASIC_ATTACK_SKILL_ID]: 1,
        thrust: 2,
        mil_guer_rally: 1,
      },
      equippedSkillIds: [BASIC_ATTACK_SKILL_ID, 'thrust'],
      ascensionId: 'knight_military_guerreiro',
      unspentImprovementPoints: 0,
      unspentAscensionPoints: 0,
    });

    const result = service.massRefund(hero);
    // Guerreiro exige thrust rank 1
    expect(result.hero.toProps().skillRanks.thrust).toBe(1);
    // mil_guer_rally não é piso do Guerreiro → zera e volta ao pool de Aprimoramento
    expect(result.hero.toProps().skillRanks.mil_guer_rally).toBeUndefined();
    expect(result.hero.toProps().unspentAscensionPoints).toBe(0);
    expect(result.ascensionPointsRefunded).toBe(0);
    expect(result.preview.ascensionSkillPoints).toBe(1);
    expect(result.hero.toProps().ascensionId).toBe('knight_military_guerreiro');
    expect(result.pointsRefunded).toBeGreaterThan(0);
    expect(result.hero.toProps().unspentImprovementPoints).toBe(result.pointsRefunded);
  });

  it('refund unitário de skill de evolução devolve Aprimoramento', () => {
    const hero = knightHero({
      ascensionId: 'knight_military_guerreiro',
      skillRanks: { [BASIC_ATTACK_SKILL_ID]: 1, thrust: 1, mil_guer_rally: 1 },
      equippedSkillIds: [BASIC_ATTACK_SKILL_ID],
      unspentImprovementPoints: 0,
      unspentAscensionPoints: 0,
    });
    const next = service.refundSkillRank(hero, 'mil_guer_rally');
    expect(next.toProps().skillRanks.mil_guer_rally).toBeUndefined();
    expect(next.toProps().unspentImprovementPoints).toBe(1);
    expect(next.toProps().unspentAscensionPoints).toBe(0);
    expect(next.toProps().ascensionId).toBe('knight_military_guerreiro');
  });

  it('bloqueia refund de skill exigida pela ascensão atual', () => {
    const hero = knightHero({
      ascensionId: 'knight_military_capitao',
      skillRanks: { [BASIC_ATTACK_SKILL_ID]: 1, thrust: 1, mil_guer_rally: 1 },
      equippedSkillIds: [BASIC_ATTACK_SKILL_ID],
    });
    expect(() => service.refundSkillRank(hero, 'mil_guer_rally')).toThrow(/Capitão|rank/);
  });

  it('massa reduz attrs até piso de ascensão e emite warning', () => {
    const hero = knightHero({
      allocatedAttributes: { str: 5, dex: 0, int: 0 },
      ascensionId: 'knight_military_capitao',
      skillRanks: { [BASIC_ATTACK_SKILL_ID]: 1, mil_guer_rally: 1 },
      unspentImprovementPoints: 0,
    });
    const result = service.massRefund(hero);
    expect(result.hero.toProps().allocatedAttributes.str).toBe(4);
    expect(result.hero.toProps().unspentImprovementPoints).toBe(1);
    expect(result.warnings.some((w) => /Capitão|ascensão/i.test(w))).toBe(true);
    expect(result.preview.attributeChanges).toEqual([{ key: 'str', from: 5, to: 4 }]);
  });

  it('previewMassRefund não altera o herói de entrada', () => {
    const hero = knightHero({
      allocatedAttributes: { str: 3, dex: 0, int: 0 },
      skillRanks: { [BASIC_ATTACK_SKILL_ID]: 1, thrust: 2 },
      unspentImprovementPoints: 0,
    });
    const before = hero.toProps();
    const preview = service.previewMassRefund(hero);
    expect(hero.toProps()).toEqual(before);
    expect(preview.pointsRefunded).toBe(5);
    expect(preview.skillsCleared).toBe(1);
    expect(preview.ascensionSkillPoints).toBe(0);
    expect(preview.nextHero.toProps().unspentImprovementPoints).toBe(5);
  });

  it('massa emite warning de item e pede desequipar', () => {
    const gear = Gear.create({
      id: 'w1',
      name: 'Elmo Rígido',
      templateId: 'helm',
      slot: 'armor',
      rarity: 'rare',
      attackBonus: 0,
      defenseBonus: 3,
      healthBonus: 0,
      requirements: { minLevel: 1, dex: 12 },
    });
    const hero = knightHero({
      allocatedAttributes: { str: 0, dex: 6, int: 0 },
      equipment: { weapon: null, armor: gear, accessory: null },
      unspentImprovementPoints: 0,
    });
    const result = service.massRefund(hero);
    expect(result.hero.toProps().allocatedAttributes.dex).toBe(4);
    expect(result.warnings.some((w) => /Elmo Rígido|Desequipe/i.test(w))).toBe(true);
  });

  it('bloqueia reduzir skill exigida por outra skill com rank', () => {
    const hero = Hero.createStarter('hero-s', 'sorcerer', 'Nix');
    const withRanks = Hero.restore({
      ...hero.toProps(),
      skillRanks: { [BASIC_ATTACK_SKILL_ID]: 1, arcane_bolt: 1, fireball: 1 },
      equippedSkillIds: [BASIC_ATTACK_SKILL_ID],
    });
    expect(() => service.refundSkillRank(withRanks, 'arcane_bolt')).toThrow(/Bola de Fogo|rank/);
  });
});
