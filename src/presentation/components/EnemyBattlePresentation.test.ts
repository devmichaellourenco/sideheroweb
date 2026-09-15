import { describe, expect, it } from 'vitest';
import { renderEnemyTooltipContent } from './EnemyBattlePresentation';

describe('EnemyBattlePresentation — tooltip compacto', () => {
  it('usa grade com ícones (sem títulos de seção) e label só no title', () => {
    const html = renderEnemyTooltipContent(
      {
        name: 'Goblin Saqueador',
        level: 1,
        attributes: { str: 5, dex: 5, int: 1 },
        health: 40,
        maxHealth: 40,
        attack: 8,
        defense: 3,
        attackSpeed: 1,
        castSpeed: 1,
        goldReward: 5,
        xpReward: 2,
        signatureSkills: [],
        combatResists: { fire: 0, cold: 0, lightning: 0, air: 0 },
        combatStatSheet: [
          {
            id: 'offense',
            title: 'Ofensiva',
            lines: [{ id: 'ataque', label: 'Ataque', value: '8', tooltipLines: [] }],
          },
          {
            id: 'defense',
            title: 'Defesa',
            lines: [
              { id: 'max-health', label: 'Vida máxima', value: '40', tooltipLines: [] },
              { id: 'defesa', label: 'Defesa', value: '3', tooltipLines: [] },
            ],
          },
        ],
      } as Parameters<typeof renderEnemyTooltipContent>[0],
      3,
    );

    expect(html).toContain('enemy-tooltip-grid');
    expect(html).toContain('enemy-tooltip-chip');
    expect(html).toContain('ui/stats/health.png');
    expect(html).toContain('ui/stats/attack.png');
    expect(html).toContain('ui/stats/str.png');
    expect(html).toContain('title="Vida máxima"');
    expect(html).toContain('>40<');
    expect(html).not.toContain('Ofensiva');
    expect(html).not.toContain('Vida máxima:');
    expect(html).not.toContain('Ataque:');
  });

  it('sem ficha usa fallback compacto de combate', () => {
    const html = renderEnemyTooltipContent(
      {
        name: 'Goblin',
        level: 1,
        attributes: { str: 8, dex: 8, int: 5 },
        health: 40,
        maxHealth: 40,
        attack: 10,
        defense: 4,
        attackSpeed: 0.5,
        castSpeed: 1,
        goldReward: 5,
        xpReward: 0,
        signatureSkills: [],
        combatResists: { fire: 0, cold: 0, lightning: 0, air: 0 },
        combatStatSheet: [],
      } as Parameters<typeof renderEnemyTooltipContent>[0],
      20,
    );

    expect(html).toContain('ui/stats/health.png');
    expect(html).toContain('40/40');
    expect(html).toContain('ui/stats/attack.png');
  });
});
