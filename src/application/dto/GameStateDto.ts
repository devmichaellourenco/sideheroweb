import { PhaseRunDto } from './CampaignDto';
import { AttributesDto } from './AttributesDto';
import { ChestProgressDto } from '../mappers/ChestProgressMapper';
import { FeatureFlagsDto } from './FeatureFlagsDto';
import { MetaSummaryDto } from './MetaDto';
import { GearUpgradeHintDto } from './GearUpgradeHintDto';
import { HeroCombatStatSectionDto } from './HeroCombatStatSheetDto';

export interface GearRequirementsDto {
  minLevel: number;
  str?: number;
  dex?: number;
  int?: number;
  heroId?: string;
}

export interface HeroActiveSkillStatTooltipLineDto {
  text: string;
  /** Chave de ícone UI (`attack`, `rune`, `improvement`, …). */
  icon?: string;
}

export interface HeroActiveSkillStatDto {
  label: string;
  value: string;
  /** Passo a passo do cálculo; hover na Status mostra a fórmula. */
  tooltipLines?: HeroActiveSkillStatTooltipLineDto[];
  /** Destaque visual (ex.: DPS estimado). */
  emphasize?: boolean;
}

export interface HeroActiveSkillDto {
  id: string;
  name: string;
  branch: 'offense' | 'defense' | 'utility';
  branchLabel: string;
  description: string;
  currentRank: number;
  maxRank: number;
  scope: 'universal' | 'class';
  scopeLabel: string;
  scalingLabel: string;
  battleStats: HeroActiveSkillStatDto[];
}

export interface CombatResistSummaryDto {
  fire: number;
  cold: number;
  lightning: number;
  air: number;
}

export interface ActivePassiveDto {
  id: string;
  name: string;
  description: string;
  sourceLabel: string;
  /** Valor efetivo atual (ex.: "+24% vida (2%×DEF 12)"). */
  effectiveSummary: string;
}

export interface HeroDto {
  id: string;
  name: string;
  heroClass: string;
  emoji: string;
  level: number;
  experience: number;
  experienceToNextLevel: number;
  attack: number;
  defense: number;
  attackSpeed: number;
  castSpeed: number;
  critChance: number;
  critDamage: number;
  health: number;
  maxHealth: number;
  baseAttributes: AttributesDto;
  allocatedAttributes: AttributesDto;
  totalAttributes: AttributesDto;
  unspentImprovementPoints: number;
  unspentAscensionPoints: number;
  skillRanks: Record<string, number>;
  equippedSkillIds: string[];
  activeSkills: (HeroActiveSkillDto | null)[];
  maxActiveSkills: number;
  unlockedActiveSkillSlots: number;
  ascensionId: string | null;
  hasUnspentPoints: boolean;
  /** Passivas sempre ativas (classe, ascensão, gear). */
  activePassives: ActivePassiveDto[];
  equipment: Record<
    string,
    {
      id: string;
      name: string;
      templateId: string;
      slot: string;
      rarity: string;
      attackBonus: number;
      defenseBonus: number;
      healthBonus: number;
      attackSpeedBonus: number;
      castSpeedBonus: number;
      critChanceBonus: number;
      critDamageBonus: number;
      fireResistBonus: number;
      coldResistBonus: number;
      lightningResistBonus: number;
      airResistBonus: number;
      allElementalResistBonus: number;
      fireDamageBonus: number;
      fireResistPenetrationBonus: number;
      coldDamageBonus: number;
      lightningDamageBonus: number;
      airDamageBonus: number;
      allElementalDamageBonus: number;
      fireDamageFlat: number;
      coldDamageFlat: number;
      lightningDamageFlat: number;
      airDamageFlat: number;
      fireResistFlat: number;
      coldResistFlat: number;
      lightningResistFlat: number;
      airResistFlat: number;
      attackPercentBonus: number;
      defensePercentBonus: number;
      healthPercentBonus: number;
      physicalDamagePercentBonus: number;
      cooldownReductionBonus: number;
      dodgeChanceBonus?: number;
      blockChanceBonus?: number;
      damageReductionBonus?: number;
      uniqueEffectDescription?: string | null;
      requirements: GearRequirementsDto;
    } | null
  >;
  combatIntent: CombatSkillIntentDto | null;
  combatSkills: CombatBattleSkillDto[];
  combatSkillCooldowns: HeroSkillCooldownDto[];
  actionTimeRatio: number;
  actionTimeRemaining: number;
  actionTimeTotal: number;
  statusEffects: CombatStatusEffectDto[];
  combatResists: CombatResistSummaryDto;
  combatStatSheet: HeroCombatStatSectionDto[];
}

export interface HeroSkillCooldownDto {
  skillId: string;
  secondsRemaining: number;
  cooldownTotal: number;
  ready: boolean;
  cooldownLabel: string;
  cooldownRatio: number;
}

export interface CombatStatusEffectDto {
  kind: 'buff_attack' | 'debuff_defense' | 'dot' | 'heal_block';
  tooltip: string;
  turnsRemaining: number;
  polarity: 'buff' | 'debuff';
  iconPath: string;
}

export interface CombatBattleSkillDto {
  skillId: string;
  skillName: string;
  secondsRemaining: number;
  cooldownTotal: number;
  ready: boolean;
  highlight: 'none' | 'next' | 'queued';
  cooldownLabel: string;
  cooldownRatio: number;
  damageElement?: string | null;
  elementLabel?: string | null;
}

export interface CombatSkillIntentDto {
  nextSkillName: string;
  nextSkillId: string;
  status: 'ready' | 'cooldown';
  secondsRemaining: number;
  chargingSkills: Array<{ skillId: string; skillName: string; secondsRemaining: number }>;
}

export interface EnemySignatureSkillDto {
  name: string;
  description: string;
}

export interface EnemyDto {
  id: string;
  name: string;
  enemyType: string;
  role: 'trash' | 'elite' | 'boss';
  level: number;
  attributes: AttributesDto;
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
  attackSpeed: number;
  castSpeed: number;
  goldReward: number;
  xpReward: number;
  signatureSkills: EnemySignatureSkillDto[];
  combatIntent: CombatSkillIntentDto | null;
  combatSkills: CombatBattleSkillDto[];
  actionTimeRatio: number;
  actionTimeRemaining: number;
  actionTimeTotal: number;
  statusEffects: CombatStatusEffectDto[];
  combatResists: CombatResistSummaryDto;
  passiveIds: string[];
  /** Ficha de combate (espelho do herói, sem gear) — tooltip/comparador. */
  combatStatSheet: HeroCombatStatSectionDto[];
}

export interface GearDto {
  id: string;
  name: string;
  templateId: string;
  slot: string;
  rarity: string;
  attackBonus: number;
  defenseBonus: number;
  healthBonus: number;
  attackSpeedBonus: number;
  castSpeedBonus: number;
  critChanceBonus: number;
  critDamageBonus: number;
  fireResistBonus: number;
  coldResistBonus: number;
  lightningResistBonus: number;
  airResistBonus: number;
  allElementalResistBonus: number;
  fireDamageBonus: number;
  fireResistPenetrationBonus: number;
  coldDamageBonus: number;
  lightningDamageBonus: number;
  airDamageBonus: number;
  allElementalDamageBonus: number;
  fireDamageFlat: number;
  coldDamageFlat: number;
  lightningDamageFlat: number;
  airDamageFlat: number;
  fireResistFlat: number;
  coldResistFlat: number;
  lightningResistFlat: number;
  airResistFlat: number;
  attackPercentBonus: number;
  defensePercentBonus: number;
  healthPercentBonus: number;
  physicalDamagePercentBonus: number;
  cooldownReductionBonus: number;
  dodgeChanceBonus: number;
  blockChanceBonus: number;
  damageReductionBonus: number;
  requirements: GearRequirementsDto;
  isUniqueLegendary?: boolean;
  isNamedLegendary?: boolean;
  uniqueEffectDescription?: string | null;
}

export interface ChestDto {
  id: string;
  stageEarned: number;
  chestType: string;
  chestLabel: string;
  opened: boolean;
}

export interface ActiveTurnDto {
  side: 'hero' | 'enemy';
  id: string;
}

export interface CampaignProgressDto {
  selectedPhaseId: string;
  unlockedPhaseIds: string[];
  clearedPhaseIds: string[];
  highestTierReached: number;
  seasonCompleted: boolean;
  viewedActSceneIds: string[];
  /** Cenas de missão (side) aguardando leitura. */
  pendingMissionSceneIds?: string[];
}

export interface CombatIntermissionDto {
  variant: 'wave-clear' | 'boss-approach' | 'phase-clear' | 'defeat';
  clearedPhaseId: string;
  clearedPhaseName: string;
  nextPhaseId: string | null;
  nextPhaseName: string | null;
}

export interface BattleSessionStatsDto {
  damageDealt: number;
  healingDone: number;
  damageTaken: number;
  damageMitigated: number;
  critCount: number;
  damageByElement: {
    physical: number;
    fire: number;
    cold: number;
    lightning: number;
    air: number;
  };
  damageTakenByElement: BattleSessionStatsDto['damageByElement'];
  damageMitigatedByElement: BattleSessionStatsDto['damageByElement'];
  heroes: Array<{
    heroId: string;
    name: string;
    damageDealt: number;
    healingDone: number;
    damageTaken: number;
    damageMitigated: number;
    critCount: number;
    basicAttackUses: number;
    skillUses: number;
    damageByElement: BattleSessionStatsDto['damageByElement'];
    damageTakenByElement: BattleSessionStatsDto['damageByElement'];
    damageMitigatedByElement: BattleSessionStatsDto['damageByElement'];
  }>;
  skills: Array<{
    heroId: string;
    heroName: string;
    skillId: string;
    skillName: string;
    uses: number;
    damageDealt: number;
    healingDone: number;
    cooldownLabel: string;
    cooldownTooltip: string;
  }>;
}

export interface StorageCapacityDto {
  inventoryLimit: number;
  inventoryUsed: number;
  stashLimit: number;
  stashUsed: number;
  stashUnlocked: boolean;
}

export interface GameStateDto {
  heroes: HeroDto[];
  activeParty: HeroDto[];
  activePartyIds: string[];
  benchHeroes: HeroDto[];
  canEditParty: boolean;
  loadoutEditOpen: boolean;
  phaseRestartOnResume: boolean;
  battlePaused: boolean;
  battleSessionStats: BattleSessionStatsDto;
  enemies: EnemyDto[];
  enemy: EnemyDto | null;
  activeTurn: ActiveTurnDto | null;
  combatRound: number;
  campaignName: string;
  mapId: string;
  mapName: string;
  /** Pista leve de ameaça/build favorável do mapa atual. */
  mapCombatHint: string;
  /** Micro-desafio da fase atual (BAL-011), se houver. */
  phaseChallengeHint: string;
  phaseLabel: string;
  phaseRun: PhaseRunDto | null;
  combatIntermission: CombatIntermissionDto | null;
  campaignProgress: CampaignProgressDto;
  stage: number;
  difficultyTier: number;
  gold: number;
  chests: ChestDto[];
  inventory: GearDto[];
  stash: GearDto[];
  storageCapacity: StorageCapacityDto;
  battleLog: { message: string; timestamp: number }[];
  totalBattlesWon: number;
  pendingChestCount: number;
  upgradeLevels: Record<string, number>;
  shopRefreshUses: number;
  shopRefreshLimit: number;
  purchasableUpgradeCount: number;
  featureFlags: FeatureFlagsDto;
  chestProgress: ChestProgressDto;
  gearUpgradeHints: Record<string, GearUpgradeHintDto>;
  activePartyUpgradeCount: number;
  seasonCompleted: boolean;
  meta?: MetaSummaryDto;
}
