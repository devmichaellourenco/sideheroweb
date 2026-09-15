import { describe, expect, it } from 'vitest';
import { deriveCombatMaxHealth } from '../combat/CombatantDerivedStats';
import { resolveEnemySpawnMaxHealth } from '../combat/EnemyCombatBalance';
import { buildEnemyCombatSheet } from '../enemies/EnemyProgressionCatalog';
import { resolveEnemySpawnLevel, spawnEnemiesForWave } from './WaveEnemyFactory';

describe('resolveEnemySpawnLevel', () => {
  it('usa difficultyTier quando o slot não define level', () => {
    expect(resolveEnemySpawnLevel({ enemyType: 'goblin_raider', role: 'trash', count: 1 }, 12)).toBe(
      12,
    );
  });

  it('respeita override de level no slot', () => {
    expect(
      resolveEnemySpawnLevel(
        { enemyType: 'goblin_raider', role: 'trash', count: 1, level: 40 },
        12,
      ),
    ).toBe(40);
  });
});

describe('spawnEnemiesForWave', () => {
  it('deriva HP pelo sheet de progressão (level + attrs), sem knobs legados', () => {
    const [enemy] = spawnEnemiesForWave(
      { id: 'w0', slots: [{ enemyType: 'goblin_raider', role: 'trash', count: 1 }] },
      {
        phaseId: '1-1',
        waveIndex: 0,
        difficultyTier: 1,
        isBossWave: false,
      },
    );

    const sheet = buildEnemyCombatSheet({
      enemyType: 'goblin_raider',
      level: 1,
      role: 'trash',
    });
    const expected = resolveEnemySpawnMaxHealth(
      deriveCombatMaxHealth({
        baseMaxHealth: sheet.baseMaxHealth,
        level: sheet.level,
        attributes: sheet.attributes,
        attackPerLevel: 4,
        defensePerLevel: 3,
        healthPerLevel: 15,
      }),
    );

    expect(enemy.level).toBe(1);
    expect(enemy.stats.maxHealth).toBe(expected);
    expect(enemy.stats.maxHealth).toBe(106);
  });

  it('mesmo template em phases diferentes sobe poder pelo level', () => {
    const [early] = spawnEnemiesForWave(
      { id: 'w0', slots: [{ enemyType: 'goblin_raider', role: 'trash', count: 1 }] },
      {
        phaseId: '1-1',
        waveIndex: 0,
        difficultyTier: 1,
        isBossWave: false,
      },
    );
    const [late] = spawnEnemiesForWave(
      { id: 'w0', slots: [{ enemyType: 'goblin_raider', role: 'trash', count: 1 }] },
      {
        phaseId: '1-10',
        waveIndex: 0,
        difficultyTier: 25,
        isBossWave: false,
      },
    );

    expect(late.level).toBe(25);
    expect(late.attack).toBeGreaterThan(early.attack);
    expect(late.maxHealth).toBeGreaterThan(early.maxHealth);
  });

  it('slot.level sobrescreve difficultyTier', () => {
    const [enemy] = spawnEnemiesForWave(
      { id: 'w0', slots: [{ enemyType: 'goblin_raider', role: 'trash', count: 1, level: 8 }] },
      {
        phaseId: '1-1',
        waveIndex: 0,
        difficultyTier: 1,
        isBossWave: false,
      },
    );

    expect(enemy.level).toBe(8);
    expect(enemy.name).toContain('Lv.8');
  });
});
