import { describe, expect, it } from 'vitest';
import { Gear } from '../../domain/entities/Gear';
import { Hero } from '../../domain/entities/Hero';
import { buildSkillBattleStats } from './SkillBattleStatsMapper';

describe('buildSkillBattleStats — throughput alinhado ao combate', () => {
  it('inclui DPS finito para ataque básico', () => {
    const hero = Hero.createStarter('h1', 'knight', 'Galneon');
    const stats = buildSkillBattleStats(hero, 'basic_attack', 'str');
    const dps = stats.find((entry) => entry.label === 'DPS estimado');

    expect(dps?.value).toMatch(/^~\d+(\.\d+)? \(ataque contínuo\)$/);
    expect(dps?.emphasize).toBe(true);
    expect(dps?.tooltipLines?.length).toBeGreaterThan(3);
    expect(stats.some((entry) => entry.label === 'APS efetiva')).toBe(true);
    expect(stats.every((entry) => (entry.tooltipLines?.length ?? 0) > 0)).toBe(true);
  });

  it('skills sem definição de combate não expõem stats de batalha', () => {
    const hero = Hero.createStarter('h4', 'knight', 'Galneon');
    const stats = buildSkillBattleStats(hero, 'unknown_passive', 'dex');
    expect(stats).toEqual([]);
  });

  it('inclui DPS finito para skill de dano e mostra recarga com CDR quando há gear', () => {
    const base = Hero.createStarter('h2', 'sorcerer', 'Nix');
    const wand = Gear.create({
      id: 'cdr-wand',
      name: 'Cajado CDR',
      templateId: 'staff',
      slot: 'weapon',
      rarity: 'rare',
      attackBonus: 0,
      defenseBonus: 0,
      healthBonus: 0,
      cooldownReductionBonus: 20,
      requirements: { minLevel: 1 },
    });
    const hero = Hero.restore({
      ...base.toProps(),
      equippedSkillIds: ['basic_attack', 'fireball'],
      skillRanks: { ...base.toProps().skillRanks, fireball: 2 },
      equipment: { weapon: wand, armor: null, accessory: null },
    });

    const stats = buildSkillBattleStats(hero, 'fireball', 'int');
    const dps = stats.find((entry) => entry.label === 'DPS estimado');
    const reload = stats.find((entry) => entry.label === 'Recarga');
    const poder = stats.find((entry) => entry.label === 'Poder');

    expect(dps?.value).toMatch(/^~\d+(\.\d+)? \(cast contínuo da skill\)$/);
    expect(reload?.value).toMatch(/CDR/);
    expect(reload?.tooltipLines?.some((line) => line.text.includes('turns ×'))).toBe(true);
    expect(reload?.tooltipLines?.some((line) => line.text.includes('Recarga efetiva'))).toBe(true);
    expect(poder?.tooltipLines?.some((line) => line.text.includes('Fórmula:'))).toBe(true);
    expect(poder?.tooltipLines?.some((line) => line.text.includes('Produto ='))).toBe(true);
    expect(poder?.tooltipLines?.some((line) => line.text.includes('powerPerRank'))).toBe(true);
    expect(poder?.tooltipLines?.some((line) => line.text.includes('Afinidade Mágica'))).toBe(true);
    expect(poder?.tooltipLines?.some((line) => line.text.includes('Após passivas:'))).toBe(true);
    expect(poder?.tooltipLines?.some((line) => line.text.includes('Poder final'))).toBe(true);
    expect(poder?.tooltipLines?.some((line) => line.text.includes('1.9'))).toBe(false);
    expect(stats.some((entry) => entry.label === 'Casts/s')).toBe(true);
    expect(stats.some((entry) => entry.label === 'Fator de crit')).toBe(true);
  });

  it('tooltip de Poder em frost_shard mostra fórmula multiplicativa', () => {
    const base = Hero.createStarter('h3', 'sorcerer', 'Nix');
    const hero = Hero.restore({
      ...base.toProps(),
      skillRanks: { ...base.toProps().skillRanks, frost_shard: 2 },
      equippedSkillIds: ['basic_attack', 'frost_shard'],
    });

    const poder = buildSkillBattleStats(hero, 'frost_shard', 'int').find(
      (entry) => entry.label === 'Poder',
    );
    const lines = poder?.tooltipLines?.map((line) => line.text).join('\n') ?? '';

    expect(poder?.value).toMatch(/^~\d+ \(escala INT\)$/);
    expect(lines).toContain('Fórmula: Base × (powerPerRank × nível)');
    expect(lines).toContain('Base = 1');
    expect(lines).toContain('Rank: 5 × nível 2 = 10');
    expect(lines).toContain('Produto =');
    expect(lines).toContain('Afinidade Mágica');
    expect(lines).toContain('Após passivas:');
    expect(lines).toContain('Poder final ≈');
    expect(lines).not.toContain('1.9');
  });
});
