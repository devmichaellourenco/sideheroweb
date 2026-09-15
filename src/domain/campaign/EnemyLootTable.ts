import { ChestType } from '../combat/ChestType';
import { EnemyType } from '../entities/EnemyType';
import { EnemyRole } from './WaveDefinition';

export type LootDropKind = 'chest_monster' | 'chest_boss' | 'chest_act_boss' | 'gear';

export interface LootDropOption {
  kind: LootDropKind;
  weight: number;
}

export interface EnemyLootProfile {
  dropChancePercent: number;
  options: LootDropOption[];
}

export interface RollEnemyLootParams {
  mapIndex: number;
  enemyType: EnemyType;
  role: EnemyRole;
  isPhaseBoss: boolean;
  firstClearBoss: boolean;
  seasonFinale: boolean;
}

export interface LootDropResult {
  kind: LootDropKind;
  chestType: ChestType | null;
}

const ROLE_DROP_CHANCE: Record<EnemyRole, number> = {
  trash: 4,
  elite: 12,
  boss: 22,
};

const ENEMY_LOOT_OVERRIDES: Partial<Record<EnemyType, Partial<EnemyLootProfile>>> = {
  saci: {
    dropChancePercent: 100,
    options: [
      { kind: 'chest_boss', weight: 55 },
      { kind: 'gear', weight: 45 },
    ],
  },
  gonodor: {
    dropChancePercent: 100,
    options: [
      { kind: 'chest_boss', weight: 50 },
      { kind: 'gear', weight: 50 },
    ],
  },
  vorax: {
    dropChancePercent: 100,
    options: [
      { kind: 'chest_act_boss', weight: 65 },
      { kind: 'gear', weight: 35 },
    ],
  },
};

/** Overrides por mundo + monstro (chave `mapIndex:enemyType`). */
const WORLD_MONSTER_OVERRIDES: Record<string, Partial<EnemyLootProfile>> = {
  '1:giant_rat': { dropChancePercent: 3 },
  '1:cave_bat': { dropChancePercent: 3 },
  '1:gray_wolf': { dropChancePercent: 4 },
  '1:goblin_raider': { dropChancePercent: 5 },
  '1:hill_ogre': {
    options: [
      { kind: 'chest_boss', weight: 60 },
      { kind: 'gear', weight: 40 },
    ],
  },
};

function lootOptionsForRole(mapIndex: number, role: EnemyRole, seasonFinale: boolean): LootDropOption[] {
  if (role === 'boss') {
    if (seasonFinale) {
      return [
        { kind: 'chest_act_boss', weight: 70 },
        { kind: 'gear', weight: 30 },
      ];
    }
    return [
      { kind: 'chest_boss', weight: mapIndex >= 5 ? 55 : 65 },
      { kind: 'gear', weight: mapIndex >= 5 ? 45 : 35 },
    ];
  }

  if (role === 'elite') {
    return [
      { kind: 'chest_monster', weight: mapIndex >= 4 ? 60 : 75 },
      { kind: 'gear', weight: mapIndex >= 4 ? 40 : 25 },
    ];
  }

  return [
    { kind: 'chest_monster', weight: 88 },
    { kind: 'gear', weight: 12 },
  ];
}

function baseDropChance(mapIndex: number, role: EnemyRole, _isPhaseBoss: boolean, firstClearBoss: boolean): number {
  if (firstClearBoss) {
    return 100;
  }

  const worldBonus = Math.min(6, Math.floor(mapIndex / 2));
  return ROLE_DROP_CHANCE[role] + worldBonus;
}

export function resolveEnemyLootProfile(params: RollEnemyLootParams): EnemyLootProfile {
  const overrideKey = `${params.mapIndex}:${params.enemyType}`;
  const enemyOverride = ENEMY_LOOT_OVERRIDES[params.enemyType];
  const worldMonsterOverride = WORLD_MONSTER_OVERRIDES[overrideKey];

  const dropChancePercent =
    worldMonsterOverride?.dropChancePercent ??
    enemyOverride?.dropChancePercent ??
    baseDropChance(params.mapIndex, params.role, params.isPhaseBoss, params.firstClearBoss);

  const options =
    worldMonsterOverride?.options ??
    enemyOverride?.options ??
    lootOptionsForRole(params.mapIndex, params.role, params.seasonFinale);

  return { dropChancePercent, options };
}

function pickWeighted(options: LootDropOption[]): LootDropOption {
  const total = options.reduce((sum, option) => sum + option.weight, 0);
  let roll = Math.random() * total;
  for (const option of options) {
    roll -= option.weight;
    if (roll <= 0) {
      return option;
    }
  }
  return options[options.length - 1];
}

function toDropResult(option: LootDropOption): LootDropResult {
  switch (option.kind) {
    case 'chest_monster':
      return { kind: option.kind, chestType: 'monster' };
    case 'chest_boss':
      return { kind: option.kind, chestType: 'boss' };
    case 'chest_act_boss':
      return { kind: option.kind, chestType: 'act_boss' };
    default:
      return { kind: 'gear', chestType: null };
  }
}

export function rollEnemyLoot(params: RollEnemyLootParams): LootDropResult | null {
  const profile = resolveEnemyLootProfile(params);
  const shouldDrop = params.firstClearBoss || Math.random() * 100 < profile.dropChancePercent;
  if (!shouldDrop || profile.options.length === 0) {
    return null;
  }

  return toDropResult(pickWeighted(profile.options));
}
