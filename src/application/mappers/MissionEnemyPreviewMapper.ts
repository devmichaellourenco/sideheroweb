import { PhaseDefinition } from '../../domain/campaign/PhaseDefinition';
import { createEnemyFromSlot } from '../../domain/campaign/WaveEnemyFactory';
import { EnemySlot } from '../../domain/campaign/WaveDefinition';
import { CombatProfileProvider } from '../../domain/combat/CombatProfileProvider';
import { resolveEnemyInnateResists } from '../../domain/enemies/EnemyInnateResists';
import { Enemy } from '../../domain/entities/Enemy';
import { listEnemyCombatSkillsByType } from '../../domain/progression/combat/EnemyCombatSkillCatalog';
import { getEnemySkillDisplay } from '../../domain/progression/combat/EnemySkillDisplayCatalog';
import { EnemyDto } from '../dto/GameStateDto';
import { mapCombatResistSummary } from './CombatResistMapper';
import { mapEnemyCombatStatSheet } from './EnemyCombatStatSheetMapper';

const combatProfiles = new CombatProfileProvider();

/** Até 3 inimigos em destaque (boss/elite primeiro), sem duplicar tipo. */
export function extractFeaturedEnemySlots(definition: PhaseDefinition): EnemySlot[] {
  const featured: EnemySlot[] = [];
  const seen = new Set<string>();

  for (const wave of definition.waves) {
    for (const slot of wave.slots) {
      if (seen.has(slot.enemyType)) continue;
      seen.add(slot.enemyType);
      if (slot.role === 'boss' || slot.role === 'elite') {
        featured.unshift(slot);
      } else {
        featured.push(slot);
      }
    }
  }

  return featured.slice(0, 3);
}

export function mapEnemyPreviewDto(
  enemy: Enemy,
  options: { mapId?: string } = {},
): EnemyDto {
  const combatProfile = combatProfiles.forEnemy(enemy, enemy.role === 'boss');
  const stage = enemy.stage;

  return {
    id: enemy.id,
    name: enemy.name,
    enemyType: enemy.enemyType,
    role: enemy.role,
    level: enemy.level,
    attributes: { ...enemy.totalAttributes },
    health: enemy.stats.currentHealth,
    maxHealth: enemy.stats.maxHealth,
    attack: enemy.stats.attack,
    defense: enemy.stats.defense,
    attackSpeed: combatProfile.attackSpeed,
    castSpeed: combatProfile.castSpeed,
    goldReward: enemy.goldReward,
    xpReward: enemy.xpReward,
    signatureSkills: listEnemyCombatSkillsByType(enemy.enemyType)
      .filter((skill) => skill.skillId !== 'basic_attack')
      .map((skill) => getEnemySkillDisplay(skill.skillId))
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
      .map((entry) => ({ name: entry.name, description: entry.description })),
    combatIntent: null,
    combatSkills: [],
    actionTimeRatio: 0,
    actionTimeRemaining: 0,
    actionTimeTotal: 1,
    statusEffects: [],
    combatResists: mapCombatResistSummary(
      resolveEnemyInnateResists(enemy.enemyType, stage, options.mapId),
    ),
    passiveIds: [...enemy.passiveIds],
    combatStatSheet: mapEnemyCombatStatSheet(enemy),
  };
}

export function mapFeaturedEnemyPreviews(
  definition: PhaseDefinition,
  options: { mapId?: string } = {},
): EnemyDto[] {
  return extractFeaturedEnemySlots(definition).map((slot, index) => {
    const enemy = createEnemyFromSlot(slot, {
      phaseId: definition.id,
      waveIndex: 0,
      difficultyTier: definition.difficultyTier,
      isBossWave: slot.role === 'boss',
      statMultiplier: definition.statMultiplier,
      slotIndex: index,
      goldMultiplier: 1,
    });
    return mapEnemyPreviewDto(enemy, options);
  });
}
