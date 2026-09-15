import { describe, expect, it } from 'vitest';
import { EnemyDto } from '../../application/dto/GameStateDto';
import { renderBattleActorCard } from './BattleActorCardPresentation';
import { renderEnemyBattleCard } from './EnemyBattlePresentation';

describe('renderBattleActorCard', () => {
  it('renderiza card de herói com hitbox interativo e barra de vida', () => {
    const html = renderBattleActorCard({
      side: 'hero',
      id: 'h1',
      name: 'Arthos',
      isActiveTurn: true,
      spriteInnerHtml: '<span class="hero-sprite-img"></span>',
      tooltipHtml: '<span>tooltip</span>',
      healthLabel: '80/100',
      healthCurrent: '80',
      healthPercent: 80,
      actionTimeRatio: 1,
      actionTimeRemaining: 0,
      actionTimeTotal: 1.8,
      attackSpeed: 0.55,
      statusEffects: [],
      combatSkills: [],
    });

    expect(html).toContain('hero-battle-card--active-turn');
    expect(html).toContain('data-hero-battle-open="h1"');
    expect(html).toContain('data-action-time-bar');
    expect(html).toContain('strip-actor-bars');
    expect(html).toContain('strip-action-time-label');
  });

  it('renderiza card de inimigo com classe de boss quando indicado', () => {
    const html = renderBattleActorCard({
      side: 'enemy',
      id: 'e1',
      name: 'Goblin',
      isActiveTurn: false,
      isBoss: true,
      spriteInnerHtml: '<span class="enemy-sprite-img"></span>',
      tooltipHtml: '<span>tooltip</span>',
      healthLabel: '50/50',
      healthCurrent: '50',
      healthPercent: 100,
      actionTimeRatio: 1,
      actionTimeRemaining: 0,
      actionTimeTotal: 2,
      attackSpeed: 0.5,
      statusEffects: [],
      combatSkills: [],
    });

    expect(html).toContain('enemy-battle-card--boss');
    expect(html).toContain('data-enemy-id="e1"');
    expect(html).toContain('health-bar enemy strip-bar');
  });

  it('aumenta somente inimigos com papel de boss', () => {
    const enemy = {
      id: 'e1',
      name: 'Duque de Morthaven',
      enemyType: 'morthaven_duke',
      role: 'boss',
      health: 100,
      maxHealth: 100,
      attack: 10,
      defense: 10,
      attackSpeed: 0.48,
      castSpeed: 1,
      goldReward: 10,
      xpReward: 10,
      level: 200,
      attributes: { str: 20, dex: 12, int: 10 },
      signatureSkills: [],
      combatIntent: null,
      combatSkills: [],
      actionTimeRatio: 0,
      actionTimeRemaining: 1,
      actionTimeTotal: 1,
      statusEffects: [],
      combatResists: { fire: 0, cold: 0, lightning: 0, air: 0 },
      passiveIds: [],
      combatStatSheet: [],
    } satisfies EnemyDto;

    const bossHtml = renderEnemyBattleCard(enemy, 200, '<span></span>');
    const eliteHtml = renderEnemyBattleCard(
      { ...enemy, id: 'e2', role: 'elite' },
      200,
      '<span></span>',
    );

    expect(bossHtml).toContain('enemy-battle-card--boss');
    expect(eliteHtml).not.toContain('enemy-battle-card--boss');
  });
});
