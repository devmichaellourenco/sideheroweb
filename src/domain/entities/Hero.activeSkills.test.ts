import { describe, expect, it } from 'vitest';
import { BASIC_ATTACK_SKILL_ID } from '../progression/combat/BasicAttackSkill';
import { MAX_ACTIVE_BATTLE_SKILLS } from '../progression/SkillBattleSlots';
import { Hero } from './Hero';

function heroWithSkills(equippedSkillIds: string[], skillRanks: Record<string, number> = {}): Hero {
  const base = Hero.createStarter('hero-1', 'knight', 'Test');
  const ranks = {
    [BASIC_ATTACK_SKILL_ID]: 1,
    power_attack: 1,
    thrust: 1,
    arcane_touch: 1,
    ...skillRanks,
  };

  return Hero.restore({
    ...base.toProps(),
    skillRanks: ranks,
    equippedSkillIds,
  });
}

describe('Hero.activateSkill', () => {
  it('herói inicial já vem com ataque básico ativo', () => {
    const hero = Hero.createStarter('hero-1', 'knight', 'Test');

    expect(hero.toProps().skillRanks.basic_attack).toBe(1);
    expect(hero.toProps().equippedSkillIds).toEqual(['basic_attack']);
  });

  it('permite atribuir skill a um slot específico', () => {
    let hero = heroWithSkills(['basic_attack']);

    hero = hero.assignSkillToSlot('power_attack', 1, 3);
    expect(hero.toProps().equippedSkillIds).toEqual(['basic_attack', 'power_attack']);
  });

  it('substitui skill existente no slot escolhido', () => {
    let hero = heroWithSkills(['basic_attack', 'power_attack']);

    hero = hero.assignSkillToSlot('thrust', 1, 3);
    expect(hero.toProps().equippedSkillIds).toEqual(['basic_attack', 'thrust']);
  });

  it('rejeita skill além do limite de slots desbloqueados', () => {
    let hero = heroWithSkills(['basic_attack']);

    expect(() => hero.activateSkill('power_attack', 1)).toThrow('Limite de 1 skills ativas na batalha');
  });

  it('rejeita a 4ª skill ativa', () => {
    const hero = heroWithSkills(['basic_attack', 'power_attack', 'thrust']);

    expect(() => hero.activateSkill('arcane_touch', 3)).toThrow(
      `Limite de ${MAX_ACTIVE_BATTLE_SKILLS} skills ativas na batalha`,
    );
  });

  it('não permite desativar ataque básico', () => {
    const hero = Hero.createStarter('hero-1', 'knight', 'Test');

    expect(() => hero.deactivateSkill('basic_attack')).toThrow('Ataque Básico não pode ser desativado');
  });
});
