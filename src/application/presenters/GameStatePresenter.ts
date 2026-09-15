import { GameState } from '../../domain/entities/GameState';
import { Enemy } from '../../domain/entities/Enemy';
import { Chest } from '../../domain/entities/Chest';
import { UpgradeService } from '../../domain/upgrades/UpgradeService';
import { mapChestProgress } from '../mappers/ChestProgressMapper';
import { mapFeatureFlags } from '../mappers/FeatureFlagsMapper';
import { mapBattleSessionStats } from '../mappers/BattleSessionStatsMapper';
import { mapHeroToDto as mapHeroBaseToDto } from '../mappers/HeroDtoMapper';
import { Hero } from '../../domain/entities/Hero';
import { mapGearToDto } from '../mappers/GearDtoMapper';
import { buildInventoryUpgradeHints } from '../mappers/GearUpgradePreviewMapper';
import { LoadoutOptimizer } from '../../domain/services/LoadoutOptimizer';
import { getCampaignInfo, resolvePhase } from '../../domain/campaign/CampaignCatalog';
import { parsePhaseId } from '../../domain/campaign/CampaignIds';
import { mapDefinitionByIndex } from '../../domain/campaign/CampaignMaps';
import { ChestDto, EnemyDto, GameStateDto } from '../dto/GameStateDto';
import { mapStageProgress } from '../mappers/StageProgressMapper';
import { markerTrackRatio } from '../../domain/campaign/StageProgress';
import { getShopRefreshLimit } from '../../domain/upgrades/ShopRefreshRules';
import { activeShopRefreshUses } from '../services/ShopStateResolver';
import { PartyEditPolicy } from '../../domain/party/PartyEditPolicy';
import { CHEST_TYPE_LABELS } from '../../domain/combat/ChestType';
import { listEnemyCombatSkillsByType } from '../../domain/progression/combat/EnemyCombatSkillCatalog';
import { getEnemySkillDisplay } from '../../domain/progression/combat/EnemySkillDisplayCatalog';
import {
  mapEnemyCombatIntent,
  mapHeroCombatIntent,
} from '../mappers/CombatSkillIntentMapper';
import { mapEnemyCombatSkills, mapHeroCombatSkills } from '../mappers/CombatSkillBarMapper';
import { mapCombatantActionTime } from '../mappers/ActionTimePresentationMapper';
import { CombatProfileProvider } from '../../domain/combat/CombatProfileProvider';
import { mapHeroSkillCooldowns } from '../mappers/HeroSkillCooldownMapper';
import { mapCombatantStatusEffects } from '../mappers/CombatStatusEffectMapper';
import { mapCombatResistSummary } from '../mappers/CombatResistMapper';
import { resistanceProfileFromHeroEquipment } from '../../domain/combat/ResistanceProfileAggregator';
import { resolveEnemyInnateResists } from '../../domain/enemies/EnemyInnateResists';
import { StorageCapacityPolicy } from '../../domain/storage/StorageCapacityPolicy';
import { mapCombatHintLine } from '../../domain/campaign/MapCombatIdentityCatalog';
import { mapEnemyCombatStatSheet } from '../mappers/EnemyCombatStatSheetMapper';

export class GameStatePresenter {
  constructor(
    private readonly upgradeService: UpgradeService,
    private readonly loadoutOptimizer = new LoadoutOptimizer(),
  ) {}

  present(state: GameState): GameStateDto {
    const upgradeLevels = { ...state.upgradeLevels };
    const combat = state.combat;
    const combatEnemies = combat?.enemies ?? [];
    const skillCooldowns = combat?.skillCooldowns;
    const statusEffects = combat?.statusEffects;
    const actionTimers = combat?.actionTimers;
    const activeParty = state.activeHeroes();
    const activeActor = combat?.peekNextActor(state.activeHeroes(), combat.enemies) ?? null;
    const combatBarContext = {
      activeTurn: activeActor,
    };
    const enemies = combatEnemies.map((enemy) =>
      mapEnemyToDto(enemy, activeParty, combatEnemies, skillCooldowns, statusEffects, combatBarContext, actionTimers),
    );
    const campaignLabels = mapCampaignLabels(state);
    const phaseRun = mapPhaseRunDto(state);

    const rosterHeroes = state.roster.map((hero) =>
      mapHeroToDtoWithCombatIntent(
        hero,
        activeParty,
        combatEnemies,
        skillCooldowns,
        statusEffects,
        state.upgradeLevels,
        combatBarContext,
        actionTimers,
        campaignLabels.mapId,
      ),
    );

    return {
      heroes: rosterHeroes,
      activeParty: activeParty.map((hero) =>
        mapHeroToDtoWithCombatIntent(
          hero,
          activeParty,
          combatEnemies,
          skillCooldowns,
          statusEffects,
          state.upgradeLevels,
          combatBarContext,
          actionTimers,
          campaignLabels.mapId,
        ),
      ),
      benchHeroes: state.benchHeroes().map((hero) =>
        mapHeroToDtoWithCombatIntent(
          hero,
          activeParty,
          combatEnemies,
          skillCooldowns,
          statusEffects,
          state.upgradeLevels,
          combatBarContext,
          actionTimers,
          campaignLabels.mapId,
        ),
      ),
      activePartyIds: [...state.activePartyIds],
      canEditParty: PartyEditPolicy.canEdit(state),
      loadoutEditOpen: state.loadoutEditOpen,
      phaseRestartOnResume: state.phaseRestartOnResume,
      battlePaused: state.battlePaused,
      battleSessionStats: mapBattleSessionStats(state.battleSessionStats, state.roster),
      enemies,
      enemy: enemies[0] ?? null,
      activeTurn: activeActor ? { side: activeActor.side, id: activeActor.id } : null,
      combatRound: state.combat?.round ?? 1,
      campaignName: campaignLabels.campaignName,
      mapId: campaignLabels.mapId,
      mapName: campaignLabels.mapName,
      mapCombatHint: mapCombatHintLine(campaignLabels.mapId),
      phaseChallengeHint: campaignLabels.phaseChallengeHint,
      phaseLabel: campaignLabels.phaseLabel,
      phaseRun,
      combatIntermission: state.combatIntermission
        ? {
            variant: state.combatIntermission.variant,
            clearedPhaseId: state.combatIntermission.clearedPhaseId,
            clearedPhaseName: state.combatIntermission.clearedPhaseName,
            nextPhaseId: state.combatIntermission.nextPhaseId,
            nextPhaseName: state.combatIntermission.nextPhaseName,
          }
        : null,
      campaignProgress: {
        selectedPhaseId: state.campaignProgress.selectedPhaseId,
        unlockedPhaseIds: [...state.campaignProgress.unlockedPhaseIds],
        clearedPhaseIds: [...state.campaignProgress.clearedPhaseIds],
        highestTierReached: state.campaignProgress.highestTierReached,
        seasonCompleted: state.campaignProgress.seasonCompleted,
        viewedActSceneIds: [...state.campaignProgress.viewedActSceneIds],
        pendingMissionSceneIds: [
          ...state.campaignProgress.missionProgress.pendingNarrativeSceneIds,
        ],
      },
      seasonCompleted: state.campaignProgress.seasonCompleted,
      stage: state.stage,
      difficultyTier: state.currentDifficultyTier(),
      gold: state.gold.value(),
      chests: state.chests.map(mapChestToDto),
      inventory: state.inventory.map(mapGearToDto),
      stash: state.stash.map(mapGearToDto),
      storageCapacity: {
        inventoryLimit: StorageCapacityPolicy.inventoryLimit(),
        inventoryUsed: state.inventory.length,
        stashLimit: StorageCapacityPolicy.stashLimit(state.upgradeLevels),
        stashUsed: state.stash.length,
        stashUnlocked: StorageCapacityPolicy.isStashUnlocked(state.upgradeLevels),
      },
      battleLog: state.battleLog,
      totalBattlesWon: state.totalBattlesWon,
      pendingChestCount: state.pendingChests().length,
      upgradeLevels,
      shopRefreshUses: activeShopRefreshUses(state),
      shopRefreshLimit: getShopRefreshLimit(state.upgradeLevels),
      purchasableUpgradeCount: this.upgradeService.countAvailable(state),
      featureFlags: mapFeatureFlags(state.upgradeLevels),
      chestProgress: mapChestProgress(state.totalBattlesWon),
      gearUpgradeHints: buildInventoryUpgradeHints(state),
      activePartyUpgradeCount: this.loadoutOptimizer.countActivePartyUpgrades(state),
    };
  }
}

function mapHeroToDtoWithCombatIntent(
  hero: Hero,
  party: Hero[],
  enemies: Enemy[],
  skillCooldowns: Parameters<typeof mapHeroCombatIntent>[3],
  combatStatusEffects: Parameters<typeof mapCombatantStatusEffects>[2],
  upgradeLevels: Parameters<typeof mapHeroBaseToDto>[1],
  combatBarContext: {
    activeTurn: { side: 'hero' | 'enemy'; id: string } | null;
  },
  actionTimers: Parameters<typeof mapCombatantActionTime>[2],
  mapId?: string,
) {
  const isActiveTurn =
    combatBarContext.activeTurn?.side === 'hero' &&
    combatBarContext.activeTurn.id === hero.id;
  const actionTime = mapCombatantActionTime('hero', hero.id, actionTimers);

  return {
    ...mapHeroBaseToDto(hero, upgradeLevels, mapId),
    combatIntent: mapHeroCombatIntent(hero, party, enemies, skillCooldowns, combatStatusEffects),
    combatSkills: mapHeroCombatSkills(hero, party, enemies, skillCooldowns, combatStatusEffects, {
      isActiveTurn,
    }),
    combatSkillCooldowns: mapHeroSkillCooldowns(hero, skillCooldowns),
    ...actionTime,
    statusEffects: mapCombatantStatusEffects('hero', hero.id, combatStatusEffects),
    combatResists: mapCombatResistSummary(
      resistanceProfileFromHeroEquipment(hero.toProps().equipment),
    ),
  };
}

function mapEnemyToDto(
  enemy: Enemy,
  party: Parameters<typeof mapEnemyCombatIntent>[1],
  enemies: Parameters<typeof mapEnemyCombatIntent>[2],
  skillCooldowns: Parameters<typeof mapEnemyCombatIntent>[3],
  combatStatusEffects: Parameters<typeof mapCombatantStatusEffects>[2],
  combatBarContext: {
    activeTurn: { side: 'hero' | 'enemy'; id: string } | null;
  },
  actionTimers: Parameters<typeof mapCombatantActionTime>[2],
): EnemyDto {
  const isActiveTurn =
    combatBarContext.activeTurn?.side === 'enemy' &&
    combatBarContext.activeTurn.id === enemy.id;
  const actionTime = mapCombatantActionTime('enemy', enemy.id, actionTimers);
  const combatProfile = new CombatProfileProvider().forEnemy(enemy, enemy.role === 'boss');

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
    combatIntent: mapEnemyCombatIntent(enemy, party, enemies, skillCooldowns),
    combatSkills: mapEnemyCombatSkills(enemy, party, enemies, skillCooldowns, {
      isActiveTurn,
    }),
    ...actionTime,
    statusEffects: mapCombatantStatusEffects('enemy', enemy.id, combatStatusEffects),
    combatResists: mapCombatResistSummary(
      resolveEnemyInnateResists(enemy.enemyType, enemy.stage),
    ),
    passiveIds: [...enemy.passiveIds],
    combatStatSheet: mapEnemyCombatStatSheet(enemy),
  };
}

function mapCampaignLabels(state: GameState): {
  campaignName: string;
  mapId: string;
  mapName: string;
  phaseLabel: string;
  phaseChallengeHint: string;
} {
  const campaign = getCampaignInfo();
  const phaseId =
    state.combat?.encounterMeta?.phaseId ??
    state.phaseRun?.phaseId ??
    state.campaignProgress.selectedPhaseId;
  const phase = resolvePhase(phaseId);
  const { mapIndex } = parsePhaseId(phaseId);
  const map = mapDefinitionByIndex(mapIndex) ?? campaign.maps[0];

  return {
    campaignName: campaign.name,
    mapId: map?.id ?? 'stendra',
    mapName: map?.name ?? 'Stendra',
    phaseLabel: phase?.displayName ?? phaseId,
    phaseChallengeHint: phase?.challengeHint ?? '',
  };
}

function mapPhaseRunDto(state: GameState): GameStateDto['phaseRun'] {
  if (!state.phaseRun) return null;

  const phaseId = state.phaseRun.phaseId;
  const phase = resolvePhase(phaseId);
  const meta = state.combatIntermission ? null : state.combat?.encounterMeta;
  const waveIndex = meta?.waveIndex ?? state.phaseRun.waveIndex;
  const waveCount = meta?.waveCount ?? phase?.waves.length ?? 1;
  const displayName = phase?.displayName ?? phaseId;

  const stageProgress = phase
    ? mapStageProgress(phase, waveIndex)
    : {
        phaseId,
        displayName,
        fillRatio: markerTrackRatio(waveIndex, waveCount),
        markers: Array.from({ length: waveCount }, (_, index) => ({
          id: `${phaseId}:w${index}`,
          kind: (index === waveCount - 1 ? 'boss' : 'trash') as 'boss' | 'trash',
          label: index === waveCount - 1 ? 'Boss' : `W${index + 1}`,
          status:
            index < waveIndex
              ? ('cleared' as const)
              : index === waveIndex
                ? ('current' as const)
                : ('locked' as const),
          waveIndex: index,
          trackRatio: markerTrackRatio(index, waveCount),
        })),
      };

  return {
    phaseId,
    displayName,
    waveIndex,
    waveCount,
    isBossWave: meta?.isBossWave ?? waveIndex === waveCount - 1,
    stageProgress,
  };
}

function mapChestToDto(chest: Chest): ChestDto {
  return {
    id: chest.id,
    stageEarned: chest.stageEarned,
    chestType: chest.chestType,
    chestLabel: CHEST_TYPE_LABELS[chest.chestType],
    opened: chest.opened,
  };
}
