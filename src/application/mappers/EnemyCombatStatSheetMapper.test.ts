import { describe, expect, it } from 'vitest';
import { buildEnemyCombatSheet } from '../../domain/enemies/EnemyProgressionCatalog';
import { deriveCombatMaxHealth } from '../../domain/combat/CombatantDerivedStats';
import { resolveEnemySpawnMaxHealth } from '../../domain/combat/EnemyCombatBalance';
import { Enemy } from '../../domain/entities/Enemy';
import { Stats } from '../../domain/value-objects/Stats';
import { mapEnemyCombatStatSheet } from './EnemyCombatStatSheetMapper';

function enemyFromType(enemyType: string, level: number): Enemy {
  const sheet = buildEnemyCombatSheet({ enemyType, level, role: 'trash' });
  const maxHealth = resolveEnemySpawnMaxHealth(
    deriveCombatMaxHealth({
      baseMaxHealth: sheet.baseMaxHealth,
      level: sheet.level,
      attributes: sheet.attributes,
      attackPerLevel: 4,
      defensePerLevel: 3,
      healthPerLevel: 15,
    }),
  );

  return Enemy.restore({
    id: 'e1',
    name: enemyType,
    enemyType: enemyType as Enemy['enemyType'],
    stage: level,
    level: sheet.level,
    attributes: sheet.attributes,
    baseAttack: sheet.baseAttack,
    baseDefense: sheet.baseDefense,
    baseMaxHealth: sheet.baseMaxHealth,
    skillRanks: sheet.skillRanks,
    passiveIds: sheet.passiveIds,
    physicalMeleeAspd: sheet.physicalMeleeAspd,
    stats: Stats.fromBase(sheet.baseAttack, sheet.baseDefense, maxHealth),
    goldReward: 1,
    xpReward: 1,
    role: 'trash',
  });
}

describe('mapEnemyCombatStatSheet', () => {
  it('expõe seções ofensiva/defesa/resistências', () => {
    const sheet = mapEnemyCombatStatSheet(enemyFromType('goblin_raider', 1));
    expect(sheet.map((s) => s.id)).toEqual(['offense', 'defense', 'resistances']);
    expect(sheet[0].lines.some((line) => line.id === 'ataque')).toBe(true);
    expect(sheet[1].lines.some((line) => line.id === 'max-health')).toBe(true);
  });

  it('valores batem com getters do Enemy', () => {
    const enemy = enemyFromType('goblin_raider', 3);
    const sheet = mapEnemyCombatStatSheet(enemy);
    const attack = sheet[0].lines.find((line) => line.id === 'ataque')!;
    const defense = sheet[1].lines.find((line) => line.id === 'defesa')!;
    const health = sheet[1].lines.find((line) => line.id === 'max-health')!;

    expect(attack.value).toBe(String(enemy.attack));
    expect(defense.value).toBe(String(enemy.defense));
    expect(health.value).toBe(String(enemy.maxHealth));
  });
});
