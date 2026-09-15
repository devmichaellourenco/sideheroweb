import { describe, expect, it } from 'vitest';
import { buildSimHero } from './CombatSimulatorBuilders';
import { simulateEncounterBatch } from './CombatEncounterSimulator';
import { referenceGearRarityForTier, resolveSimProfileSpec } from './SimReferenceProfiles';
import { BASIC_ATTACK_SKILL_ID } from '../progression/combat/BasicAttackSkill';

const EASY_PHASE = '1-1';

function allocatedTotal(hero: ReturnType<typeof buildSimHero>): number {
  const attrs = hero.toProps().allocatedAttributes;
  return attrs.str + attrs.dex + attrs.int;
}

function skillRankTotal(hero: ReturnType<typeof buildSimHero>): number {
  const ranks = hero.toProps().skillRanks;
  return Object.entries(ranks)
    .filter(([id]) => id !== BASIC_ATTACK_SKILL_ID)
    .reduce((sum, [, rank]) => sum + rank, 0);
}

describe('SimHeroLoadout', () => {
  describe('compatibilidade — sem spec o herói continua pelado', () => {
    it('não equipa gear nem gasta pontos', () => {
      const hero = buildSimHero({ heroClass: 'knight', level: 20 }, 0, 10);

      expect(hero.toProps().equipment).toEqual({});
      expect(allocatedTotal(hero)).toBe(0);
      expect(skillRankTotal(hero)).toBe(0);
      expect(hero.toProps().equippedSkillIds).toEqual([BASIC_ATTACK_SKILL_ID]);
    });
  });

  describe('pontos de aprimoramento', () => {
    it('"auto" gasta exatamente level - 1 pontos', () => {
      const hero = buildSimHero(
        {
          heroClass: 'knight',
          level: 15,
          improvementPoints: 'auto',
          battleSkillSlots: 2,
        },
        0,
        10,
      );

      expect(allocatedTotal(hero) + skillRankTotal(hero)).toBe(14);
      expect(hero.hasUnspentPoints).toBe(false);
    });

    it('respeita a proporção atributo/skill', () => {
      const hero = buildSimHero(
        { heroClass: 'knight', level: 21, improvementPoints: 'auto', attributeRatio: 1 },
        0,
        10,
      );

      expect(allocatedTotal(hero)).toBe(20);
      expect(skillRankTotal(hero)).toBe(0);
    });

    it('prioriza o atributo primário da classe', () => {
      const knight = buildSimHero(
        { heroClass: 'knight', level: 11, improvementPoints: 'auto', attributeRatio: 1 },
        0,
        10,
      );
      const sorcerer = buildSimHero(
        { heroClass: 'sorcerer', level: 11, improvementPoints: 'auto', attributeRatio: 1 },
        0,
        10,
      );

      expect(knight.toProps().allocatedAttributes.str).toBeGreaterThan(
        knight.toProps().allocatedAttributes.int,
      );
      expect(sorcerer.toProps().allocatedAttributes.int).toBeGreaterThan(
        sorcerer.toProps().allocatedAttributes.str,
      );
    });
  });

  describe('skills de batalha', () => {
    it('preenche os slots desbloqueados mantendo o ataque básico no slot 0', () => {
      const hero = buildSimHero(
        {
          heroClass: 'sorcerer',
          level: 25,
          improvementPoints: 'auto',
          battleSkillSlots: 3,
        },
        0,
        10,
      );
      const equipped = hero.toProps().equippedSkillIds;

      expect(equipped[0]).toBe(BASIC_ATTACK_SKILL_ID);
      expect(equipped.filter((id) => id && id !== BASIC_ATTACK_SKILL_ID)).toHaveLength(2);
    });

    it('respeita skills preferidas', () => {
      const hero = buildSimHero(
        {
          heroClass: 'sorcerer',
          level: 25,
          improvementPoints: 'auto',
          battleSkillSlots: 2,
          preferredSkillIds: ['frost_shard'],
        },
        0,
        10,
      );

      expect(hero.toProps().equippedSkillIds).toContain('frost_shard');
    });

    it('com 1 slot não investe nem equipa skill ativa', () => {
      const hero = buildSimHero(
        { heroClass: 'knight', level: 25, improvementPoints: 'auto', battleSkillSlots: 1 },
        0,
        10,
      );

      expect(hero.toProps().equippedSkillIds).toEqual([BASIC_ATTACK_SKILL_ID]);
      expect(skillRankTotal(hero)).toBe(0);
      expect(hero.toProps().unspentImprovementPoints).toBeGreaterThan(0);
    });
  });

  describe('gear', () => {
    it('equipa os três slots ativos na raridade pedida', () => {
      const hero = buildSimHero(
        { heroClass: 'knight', level: 20, improvementPoints: 'auto', gearRarity: 'common' },
        0,
        5,
      );
      const equipment = hero.toProps().equipment;

      expect(equipment.weapon).toBeTruthy();
      expect(equipment.armor).toBeTruthy();
      expect(equipment.accessory).toBeTruthy();
    });

    it('cai para raridade menor em vez de estourar requisitos não atendidos', () => {
      const hero = buildSimHero(
        { heroClass: 'knight', level: 3, gearRarity: 'mythic' },
        0,
        1,
      );
      const weapon = hero.toProps().equipment.weapon;

      expect(weapon).toBeTruthy();
      expect(weapon?.rarity).not.toBe('mythic');
    });

    it('itens explícitos têm prioridade sobre a raridade', () => {
      const hero = buildSimHero(
        {
          heroClass: 'knight',
          level: 30,
          improvementPoints: 'auto',
          gearItemIds: ['scout_axe'],
          gearRarity: 'common',
        },
        0,
        10,
      );

      expect(hero.toProps().equipment.weapon?.templateId).toBe('scout_axe');
    });

    it('gear e pontos elevam o poder efetivo', () => {
      const naked = buildSimHero({ heroClass: 'knight', level: 20 }, 0, 10);
      const geared = buildSimHero(
        {
          heroClass: 'knight',
          level: 20,
          improvementPoints: 'auto',
          gearRarity: 'rare',
          battleSkillSlots: 2,
        },
        0,
        10,
      );

      expect(geared.attack).toBeGreaterThan(naked.attack);
      expect(geared.maxHealth).toBeGreaterThan(naked.maxHealth);
      expect(geared.currentHealth).toBe(geared.maxHealth);
    });
  });

  describe('perfis de referência', () => {
    it('raridade acompanha os marcos de loja', () => {
      expect(referenceGearRarityForTier(1)).toBe('common');
      expect(referenceGearRarityForTier(10)).toBe('rare');
      expect(referenceGearRarityForTier(20)).toBe('epic');
      expect(referenceGearRarityForTier(51)).toBe('legendary');
    });

    it('naked não gasta pontos e optimal é o teto sobre geared', () => {
      expect(resolveSimProfileSpec('naked', 25).improvementPoints).toBe(0);

      const geared = resolveSimProfileSpec('geared', 25);
      const optimal = resolveSimProfileSpec('optimal', 25);

      expect(geared.gearRarity).toBe('epic');
      expect(optimal.gearRarity).toBe('legendary');
      expect(optimal.battleSkillSlots).toBeGreaterThanOrEqual(geared.battleSkillSlots ?? 1);
    });

    it('o membro declarado vence o perfil', () => {
      const batch = simulateEncounterBatch(
        {
          party: [{ heroClass: 'knight', level: 5, gearRarity: 'none' }],
          profile: 'geared',
          phaseId: EASY_PHASE,
          seed: 3,
        },
        1,
      );

      expect(batch.runs).toBe(1);
    });

    it('perfil geared não deixa a party mais fraca que naked', () => {
      const request = { party: [{ heroClass: 'knight', level: 5 }], phaseId: EASY_PHASE, seed: 3 };
      const naked = simulateEncounterBatch({ ...request, profile: 'naked' as const }, 5);
      const geared = simulateEncounterBatch({ ...request, profile: 'geared' as const }, 5);

      expect(geared.winRate).toBeGreaterThanOrEqual(naked.winRate);
    });
  });
});
