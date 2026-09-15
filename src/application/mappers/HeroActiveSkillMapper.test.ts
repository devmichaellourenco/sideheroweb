import { describe, expect, it } from 'vitest';
import { Hero } from '../../domain/entities/Hero';
import { BASIC_ATTACK_SKILL_ID } from '../../domain/progression/combat/BasicAttackSkill';
import { mapHeroActiveSkills } from './HeroActiveSkillMapper';

describe('HeroActiveSkillMapper', () => {
  it('enriquece ataque básico com descrição e stats de combate', () => {
    const hero = Hero.createStarter('hero-1', 'knight', 'Galneon');
    const basicAttack = mapHeroActiveSkills(hero, 1)[0];

    expect(basicAttack?.id).toBe('basic_attack');
    expect(basicAttack?.name).toBe('Ataque Básico');
    expect(basicAttack?.description).toContain('ATK');
    expect(basicAttack?.battleStats.some((stat) => stat.label === 'Tipo')).toBe(true);
    expect(basicAttack?.battleStats.some((stat) => stat.label === 'Poder' && stat.value.includes('ATK'))).toBe(
      true,
    );
  });

  it('inclui poder estimado para skill mágica equipada', () => {
    const base = Hero.createStarter('hero-2', 'sorcerer', 'Mage');
    const hero = Hero.restore({
      ...base.toProps(),
      skillRanks: {
        [BASIC_ATTACK_SKILL_ID]: 1,
        fireball: 1,
      },
      equippedSkillIds: [BASIC_ATTACK_SKILL_ID, 'fireball'],
    });

    const fireball = mapHeroActiveSkills(hero, 3)[1];
    expect(fireball?.id).toBe('fireball');
    expect(fireball?.battleStats.some((stat) => stat.label === 'Poder' && stat.value.startsWith('~'))).toBe(
      true,
    );
    expect(fireball?.battleStats.some((stat) => stat.label === 'Recarga')).toBe(true);
  });
});
