import { describe, expect, it } from 'vitest';
import { renderCombatResistPips } from './ElementPipPresentation';
import { renderEnemyTooltipContent } from './EnemyBattlePresentation';
import { renderHeroTooltipContent } from './HeroBattlePresentation';

function minimalHero() {
  return {
    name: 'Aria',
    level: 5,
    health: 80,
    maxHealth: 100,
    attack: 20,
    defense: 8,
    attackSpeed: 1.2,
    castSpeed: 1.1,
    critChance: 0.1,
    critDamage: 1.5,
    experience: 40,
    experienceToNextLevel: 100,
    combatResists: { fire: 12, cold: 0, lightning: 0, air: 5 },
  } as Parameters<typeof renderHeroTooltipContent>[0];
}

function minimalEnemy() {
  return {
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
    combatResists: { fire: 0, cold: 15, lightning: 0, air: 0 },
    combatStatSheet: [],
  } as Parameters<typeof renderEnemyTooltipContent>[0];
}

describe('battle tooltip resists', () => {
  it('mostra chips elementais do herói com porcentagem', () => {
    const html = renderHeroTooltipContent(minimalHero());

    expect(html).toContain('element-stat--resist');
    expect(html).toContain('element-stat__pct">−12%<');
    expect(html).toContain('element-stat__pct">−5%<');
    expect(html).toContain('hero-tooltip-elements');
  });

  it('mostra chips elementais do inimigo com porcentagem', () => {
    const html = renderEnemyTooltipContent(minimalEnemy(), 20);

    expect(html).toContain('element-stat--resist');
    expect(html).toContain('element-stat__pct">−15%<');
    expect(html).toContain('enemy-tooltip-elements');
  });

  it('diferencia fraqueza com chip vermelho e sinal positivo', () => {
    const html = renderCombatResistPips({
      fire: 0,
      cold: -20,
      lightning: 0,
      air: 0,
    });

    expect(html).toContain('element-stat--weakness');
    expect(html).toContain('element-stat__pct">+20%<');
    expect(html).toContain('title="Vulnerável a Gelo (+20% dano)"');
  });
});
