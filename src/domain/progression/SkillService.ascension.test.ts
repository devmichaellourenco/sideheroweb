import { describe, expect, it } from 'vitest';
import { Hero } from '../entities/Hero';
import { SkillService } from './SkillService';

describe('SkillService — ascensão', () => {
  const service = new SkillService();

  it('expõe sub-árvore apenas após evoluir', () => {
    const knight = Hero.createStarter('k1', 'knight', 'Galneon');
    expect(service.buildAscensionTree(knight, 1)).toHaveLength(0);

    const ascended = Hero.restore({
      ...knight.toProps(),
      ascensionId: 'knight_military_guerreiro',
      unspentImprovementPoints: 2,
    });

    const tree = service.buildAscensionTree(ascended, 1);
    expect(tree.length).toBeGreaterThanOrEqual(3);
    expect(tree.map((node) => node.definition.id)).toContain('mil_guer_cleave');
  });

  it('acumula skills de tiers anteriores no mesmo caminho', () => {
    const general = Hero.restore({
      ...Hero.createStarter('k1', 'knight', 'Galneon').toProps(),
      ascensionId: 'knight_military_general',
      unspentImprovementPoints: 0,
    });

    const ids = service.buildAscensionTree(general, 1).map((node) => node.definition.id);
    expect(ids).toContain('mil_guer_cleave');
    expect(ids).toContain('mil_gen_decree');
  });

  it('aloca Aprimoramento em skill da sub-árvore de evolução', () => {
    const ascended = Hero.restore({
      ...Hero.createStarter('k1', 'knight', 'Galneon').toProps(),
      ascensionId: 'knight_martial_gladiador',
      unspentImprovementPoints: 1,
      unspentAscensionPoints: 0,
    });

    expect(service.canAllocateAscension(ascended, 'mar_gla_slash', 2)).toBe(true);

    const updated = service.allocateAscension(ascended, 'mar_gla_slash', 2);
    expect(updated.toProps().skillRanks.mar_gla_slash).toBe(1);
    expect(updated.toProps().unspentImprovementPoints).toBe(0);
    expect(updated.toProps().unspentAscensionPoints).toBe(0);
  });

  it('permite skills de evolução até rank 3 com Aprimoramento', () => {
    let hero = Hero.restore({
      ...Hero.createStarter('k1', 'knight', 'Galneon').toProps(),
      ascensionId: 'knight_martial_gladiador',
      unspentImprovementPoints: 3,
    });

    hero = service.allocateAscension(hero, 'mar_gla_slash', 2);
    hero = service.allocateAscension(hero, 'mar_gla_slash', 2);
    hero = service.allocateAscension(hero, 'mar_gla_slash', 2);

    expect(hero.toProps().skillRanks.mar_gla_slash).toBe(3);
    expect(service.canAllocateAscension(hero, 'mar_gla_slash', 2)).toBe(false);
  });

  it('bloqueia skill de evolução sem slot extra desbloqueado', () => {
    const ascended = Hero.restore({
      ...Hero.createStarter('k1', 'knight', 'Galneon').toProps(),
      ascensionId: 'knight_martial_gladiador',
      unspentImprovementPoints: 1,
    });

    expect(service.canAllocateAscension(ascended, 'mar_gla_slash', 1)).toBe(false);
    expect(() => service.allocateAscension(ascended, 'mar_gla_slash', 1)).toThrow(
      'Não é possível investir nesta skill de ascensão',
    );
  });

  it('acumula skills de tiers anteriores no caminho inato da Nix', () => {
    const filha = Hero.restore({
      ...Hero.createStarter('s1', 'sorcerer', 'Nix').toProps(),
      ascensionId: 'sorcerer_innate_filha_eter',
      unspentImprovementPoints: 0,
    });

    const ids = service.buildAscensionTree(filha, 1).map((node) => node.definition.id);
    expect(ids).toContain('inn_fei_spark');
    expect(ids).toContain('inn_fil_ether');
  });

  it('acumula skills de tiers anteriores no caminho sagrado da Elara', () => {
    const santa = Hero.restore({
      ...Hero.createStarter('p1', 'priest', 'Elara').toProps(),
      ascensionId: 'priest_sacred_santa',
      unspentImprovementPoints: 0,
    });

    const ids = service.buildAscensionTree(santa, 1).map((node) => node.definition.id);
    expect(ids).toContain('sag_clr_light');
    expect(ids).toContain('sag_san_judgment');
  });
});
