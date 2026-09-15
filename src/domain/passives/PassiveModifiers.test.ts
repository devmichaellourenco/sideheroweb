import { describe, expect, it } from 'vitest';
import { Hero } from '../entities/Hero';
import { CombatSkillDefinition } from '../progression/combat/CombatSkillDefinition';
import { SkillPowerCalculator } from '../progression/combat/SkillPowerCalculator';
import {
  heroPassiveAllySupportPercent,
  heroPassiveMaxHealthContributionLines,
  heroPassiveMaxHealthPercent,
  heroPassiveSkillPowerContributionLines,
  heroPassiveTreeDamagePercent,
  isAllySupportSkill,
  isTreeDamageSkill,
} from './PassiveModifiers';

const treeDamageSkill: CombatSkillDefinition = {
  skillId: 'thrust',
  kind: 'damage',
  damageComponents: [{ element: 'physical', delivery: 'melee', weight: 1 }],
  targetPool: 'enemies',
  targetScope: 'single',
  targetPriority: 'lowest_hp_percent',
  usePriority: 10,
  initialCooldown: 0,
  cooldownTurns: 1,
  basePower: 20,
  powerPerRank: 4,
  attributeFactor: 1,
};

const basicAttack: CombatSkillDefinition = {
  skillId: 'basic_attack',
  kind: 'damage',
  damageComponents: [{ element: 'physical', delivery: 'melee', weight: 1 }],
  targetPool: 'enemies',
  targetScope: 'single',
  targetPriority: 'lowest_hp_percent',
  usePriority: 0,
  initialCooldown: 0,
  cooldownTurns: 0,
  basePower: 10,
  powerPerRank: 0,
  attributeFactor: 0,
  usesAttackStat: true,
};

const healSkill: CombatSkillDefinition = {
  skillId: 'minor_heal',
  kind: 'heal_ally',
  targetPool: 'heroes',
  targetScope: 'single',
  targetPriority: 'lowest_hp_percent',
  usePriority: 20,
  initialCooldown: 0,
  cooldownTurns: 2,
  basePower: 15,
  powerPerRank: 3,
  attributeFactor: 1,
};

describe('PassiveModifiers', () => {
  it('Saúde de Titã aumenta max HP com defesa total', () => {
    const knight = Hero.createStarter('k1', 'knight', 'Galneon');
    const withoutConcept = knight.defense * 2;
    expect(heroPassiveMaxHealthPercent(knight)).toBeCloseTo(withoutConcept);
    expect(knight.maxHealth).toBeGreaterThan(knight.toProps().baseMaxHealth);
  });

  it('Afinidade Mágica só em skills da árvore', () => {
    const nix = Hero.createStarter('n1', 'sorcerer', 'Nix');
    expect(isTreeDamageSkill(treeDamageSkill)).toBe(true);
    expect(isTreeDamageSkill(basicAttack)).toBe(false);
    expect(heroPassiveTreeDamagePercent(nix, treeDamageSkill)).toBe(nix.level * 1);
    expect(heroPassiveTreeDamagePercent(nix, basicAttack)).toBe(0);
  });

  it('Elo com a Vida aplica em cura e buffs', () => {
    const elara = Hero.createStarter('e1', 'priest', 'Elara');
    const buff: CombatSkillDefinition = { ...healSkill, skillId: 'bless', kind: 'buff_attack' };
    expect(isAllySupportSkill(healSkill)).toBe(true);
    expect(isAllySupportSkill(buff)).toBe(true);
    expect(heroPassiveAllySupportPercent(elara, healSkill)).toBe(elara.totalAttributes.int);
    expect(heroPassiveAllySupportPercent(elara, treeDamageSkill)).toBe(0);
  });

  it('SkillPowerCalculator multiplica poder de skill da árvore', () => {
    const nix = Hero.createStarter('n1', 'sorcerer', 'Nix');
    const calc = new SkillPowerCalculator();
    const withPassive = calc.calculateForHero(treeDamageSkill, nix);
    expect(withPassive).toBeGreaterThan(0);
  });

  it('expõe linhas de contribuição para tooltips de vida e skill', () => {
    const knight = Hero.createStarter('k1', 'knight', 'Galneon');
    const nix = Hero.createStarter('n1', 'sorcerer', 'Nix');
    const elara = Hero.createStarter('e1', 'priest', 'Elara');

    const healthLines = heroPassiveMaxHealthContributionLines(knight);
    expect(healthLines.some((line) => line.includes('Saúde de Titã'))).toBe(true);
    expect(healthLines.some((line) => line.includes('DEF'))).toBe(true);

    const treeLines = heroPassiveSkillPowerContributionLines(nix, treeDamageSkill);
    expect(treeLines.some((line) => line.includes('Afinidade Mágica'))).toBe(true);
    expect(heroPassiveSkillPowerContributionLines(nix, basicAttack)).toEqual([]);

    const supportLines = heroPassiveSkillPowerContributionLines(elara, healSkill);
    expect(supportLines.some((line) => line.includes('Elo com a Vida'))).toBe(true);
  });
});
