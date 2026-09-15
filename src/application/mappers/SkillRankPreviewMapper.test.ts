import { describe, expect, it } from 'vitest';
import { Hero } from '../../domain/entities/Hero';
import { buildSkillRankSlots } from './SkillRankPreviewMapper';

describe('SkillRankPreviewMapper', () => {
  it('marca círculos preenchidos e próximo level alocável', () => {
    const hero = Hero.createStarter('h1', 'sorcerer', 'Nix');
    const slots = buildSkillRankSlots({
      hero,
      skillId: 'fireball',
      scaling: 'int',
      maxRank: 3,
      currentRank: 1,
      status: 'owned',
      canAllocateRank: true,
      canSpendPoint: true,
    });

    expect(slots).toHaveLength(3);
    expect(slots[0].filled).toBe(true);
    expect(slots[1].isNext).toBe(true);
    expect(slots[1].canAllocate).toBe(true);
    expect(slots[2].filled).toBe(false);
    expect(slots[2].isNext).toBe(false);
  });

  it('preview do próximo level descreve ganho de poder', () => {
    const hero = Hero.createStarter('h1', 'sorcerer', 'Nix');
    const slots = buildSkillRankSlots({
      hero,
      skillId: 'fireball',
      scaling: 'int',
      maxRank: 3,
      currentRank: 1,
      status: 'owned',
      canAllocateRank: true,
      canSpendPoint: true,
    });

    const next = slots[1];
    expect(next.previewTitle).toBe('Level 2');
    expect(next.previewLines.some((line) => line.includes('Poder:'))).toBe(true);
  });

  it('levels futuros também detalham o ganho incremental daquele ponto', () => {
    const hero = Hero.createStarter('h1', 'sorcerer', 'Nix');
    const slots = buildSkillRankSlots({
      hero,
      skillId: 'fireball',
      scaling: 'int',
      maxRank: 3,
      currentRank: 1,
      status: 'owned',
      canAllocateRank: true,
      canSpendPoint: true,
    });

    const future = slots[2];
    expect(future.previewTitle).toBe('Level 3');
    expect(future.previewLines.some((line) => line.includes('Poder:'))).toBe(true);
    expect(future.previewLines.some((line) => line.includes('Requer level 2'))).toBe(true);
    expect(future.previewLines).not.toContain('Aplique o level 2 antes.');
  });

  it('skill bloqueada ainda mostra o ganho de cada level + aviso de requisito', () => {
    const hero = Hero.createStarter('h1', 'sorcerer', 'Nix');
    const slots = buildSkillRankSlots({
      hero,
      skillId: 'fireball',
      scaling: 'int',
      maxRank: 3,
      currentRank: 0,
      status: 'locked',
      canAllocateRank: false,
      canSpendPoint: false,
    });

    expect(slots[0].previewLines.some((line) => line.includes('Desbloqueia'))).toBe(true);
    expect(slots[0].previewLines.some((line) => line.includes('bloqueada'))).toBe(true);
    expect(slots[2].previewLines.some((line) => line.includes('Poder:') || line.includes('Level 3'))).toBe(
      true,
    );
  });
});
