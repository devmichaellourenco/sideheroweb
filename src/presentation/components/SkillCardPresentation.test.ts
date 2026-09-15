import { describe, expect, it } from 'vitest';
import { SkillNodeDto } from '../../application/dto/SkillNodeDto';
import { renderSkillCard } from './SkillCardPresentation';

function defaultRankSlots(currentRank: number, maxRank = 3): SkillNodeDto['rankSlots'] {
  return Array.from({ length: maxRank }, (_, index) => {
    const rank = index + 1;
    const filled = currentRank >= rank;
    const isNext = currentRank === rank - 1;
    return {
      rank,
      filled,
      isNext,
      canAllocate: isNext,
      previewTitle: filled ? `Level ${rank} ativo` : `Level ${rank}`,
      previewLines: filled ? ['Poder: 24'] : ['Poder: 24 → 48'],
    };
  });
}

function skillNode(overrides: Partial<SkillNodeDto> = {}): SkillNodeDto {
  const currentRank = overrides.currentRank ?? 1;
  const maxRank = overrides.maxRank ?? 3;
  return {
    id: 'fireball',
    name: 'Bola de Fogo',
    description: 'Lança uma esfera flamejante que queima inimigos.',
    branch: 'offense',
    branchLabel: 'Ofensivo',
    scope: 'class',
    scopeLabel: 'Classe',
    maxRank,
    currentRank,
    status: 'owned',
    isEquipped: true,
    canAllocateRank: true,
    canEquip: true,
    scaling: 'int',
    scalingLabel: 'INT',
    battleStats: [{ label: 'Poder', value: '24' }],
    requirements: [{ label: 'Lv.5', met: true }],
    rankSlots: defaultRankSlots(currentRank, maxRank),
    ...overrides,
  };
}

const cardOptions = {
  allocateAttr: 'data-skill-allocate',
  canAllocate: true,
};

describe('SkillCardPresentation', () => {
  it('renderiza linha com nome, ícone e círculos de level', () => {
    const html = renderSkillCard(skillNode(), cardOptions);

    expect(html).toContain('skill-row');
    expect(html).toContain('skill-row__name');
    expect(html).toContain('Bola de Fogo');
    expect(html).toContain('skill-row__icon');
    expect(html).toContain('skill-row__ranks');
    expect(html).toContain('skill-rank-dot');
    expect(html).toContain('skill-rank-dot--filled');
    expect(html).toContain('skill-rank-dot--next');
    expect(html).not.toContain('skill-card--tile');
    expect(html).not.toContain('skill-card-rank-up');
  });

  it('próximo círculo aloca level quando disponível', () => {
    const html = renderSkillCard(
      skillNode({ status: 'ready', currentRank: 0, isEquipped: false, canAllocateRank: true }),
      cardOptions,
    );

    expect(html).toContain('data-skill-allocate="fireball"');
    expect(html).toContain('skill-rank-dot--next');
    expect(html).not.toContain('skill-card-badge--ready');
  });

  it('não aplica destaque verde quando a skill não está equipada', () => {
    const html = renderSkillCard(skillNode({ isEquipped: false }), cardOptions);

    expect(html).not.toContain('skill-row--equipped-active');
  });

  it('mantém detalhes completos no tooltip do ícone', () => {
    const html = renderSkillCard(skillNode(), cardOptions);

    expect(html).toContain('hero-skill-chip-tooltip');
    expect(html).toContain('Lança uma esfera flamejante');
    expect(html).toContain('hero-skill-chip-tooltip-stat-label');
  });

  it('cada círculo inclui preview de progressão para hover', () => {
    const html = renderSkillCard(skillNode(), cardOptions);

    expect(html).toContain('skill-rank-dot-preview');
    expect(html).toContain('data-skill-rank-tooltip');
    expect(html).toContain('Poder: 24 → 48');
  });

  it('exibe cadeado no ícone quando a skill está bloqueada', () => {
    const html = renderSkillCard(
      skillNode({
        status: 'locked',
        currentRank: 0,
        canAllocateRank: false,
        canEquip: false,
        rankSlots: defaultRankSlots(0).map((slot) => ({
          ...slot,
          canAllocate: false,
          previewLines: ['Skill bloqueada — requisitos não atendidos.'],
        })),
      }),
      { ...cardOptions, canAllocate: false },
    );

    expect(html).toContain('skill-row__icon-wrap--locked');
    expect(html).toContain('skill-card-lock');
    expect(html).toContain('🔒');
  });

  it('círculos de skill sem pontos continuam hoveráveis (sem HTML disabled)', () => {
    const html = renderSkillCard(
      skillNode({
        status: 'locked',
        currentRank: 0,
        isEquipped: false,
        canAllocateRank: false,
        canEquip: false,
        rankSlots: defaultRankSlots(0).map((slot) => ({
          ...slot,
          canAllocate: false,
          previewTitle: `Level ${slot.rank}`,
          previewLines: [`Poder: → level ${slot.rank}`, 'Skill bloqueada — requisitos não atendidos.'],
        })),
      }),
      { ...cardOptions, canAllocate: false },
    );

    expect(html).toContain('data-skill-rank-tooltip');
    expect(html).toContain('skill-rank-dot-preview');
    expect(html).toContain('Poder: → level 1');
    expect(html).toContain('Poder: → level 3');
    expect(html).toContain('aria-disabled="true"');
    expect(html).not.toMatch(/skill-rank-dot[^>]*\sdisabled/);
    expect(html).not.toContain('data-skill-allocate=');
  });

  it('permite arrastar pelo ícone quando equipável', () => {
    const html = renderSkillCard(skillNode({ canEquip: true }), cardOptions);

    expect(html).toContain('data-skill-equip="fireball"');
    expect(html).toContain('draggable="true"');
  });
});
