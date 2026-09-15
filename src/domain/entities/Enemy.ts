import { EnemyRole } from '../campaign/WaveDefinition';
import {
  deriveCombatAttack,
  deriveCombatDefense,
  deriveCombatMaxHealth,
} from '../combat/CombatantDerivedStats';
import { resolveEnemySpawnMaxHealth } from '../combat/EnemyCombatBalance';
import { combatantStatGrowth } from '../combat/CombatantIdentity';
import { getEnemyCombatIdentity } from '../enemies/EnemyCombatIdentityCatalog';
import { buildEnemyCombatSheet } from '../enemies/EnemyProgressionCatalog';
import { getPassiveDefinition } from '../passives/PassiveCatalog';
import { PassiveId } from '../passives/PassiveTypes';
import { Attributes, createAttributes } from '../progression/Attributes';
import { Stats, StatsProps } from '../value-objects/Stats';
import { EnemyType, enemyNameForStage, enemyTypeForStage } from './EnemyType';

export interface EnemyProps {
  id: string;
  name: string;
  enemyType: EnemyType;
  /** Tier de dificuldade da fase (loot/resists); no spawn canônico = level. */
  stage: number;
  /** Level de combate — mesma noção de progressão que heróis. */
  level: number;
  attributes: Attributes;
  baseAttack: number;
  baseDefense: number;
  baseMaxHealth: number;
  skillRanks: Record<string, number>;
  passiveIds: PassiveId[];
  /** Preferência de ASPD com STR (espelho classes físicas). */
  physicalMeleeAspd: boolean;
  stats: Stats;
  goldReward: number;
  xpReward: number;
  role?: EnemyRole;
}

function sumEnemyPassiveFlat(
  passiveIds: readonly PassiveId[],
  kind: 'attack_percent_flat' | 'defense_percent_flat' | 'max_health_percent_flat',
): number {
  let total = 0;
  for (const id of passiveIds) {
    for (const effect of getPassiveDefinition(id).effects) {
      if (effect.kind === kind) total += effect.percent;
    }
  }
  return total;
}

function sumEnemyPassiveMaxHealthPercent(
  passiveIds: readonly PassiveId[],
  level: number,
  defense: number,
): number {
  let total = sumEnemyPassiveFlat(passiveIds, 'max_health_percent_flat');
  for (const id of passiveIds) {
    for (const effect of getPassiveDefinition(id).effects) {
      if (effect.kind === 'max_health_percent_per_defense') {
        total += effect.percentPerPoint * defense;
      }
      if (effect.kind === 'max_health_percent_per_level') {
        total += effect.percentPerLevel * level;
      }
    }
  }
  return total;
}

export class Enemy {
  readonly id: string;
  readonly name: string;
  readonly enemyType: EnemyType;
  readonly stage: number;
  readonly level: number;
  readonly attributes: Attributes;
  readonly baseAttack: number;
  readonly baseDefense: number;
  readonly baseMaxHealth: number;
  readonly skillRanks: Record<string, number>;
  readonly passiveIds: readonly PassiveId[];
  readonly physicalMeleeAspd: boolean;
  readonly goldReward: number;
  readonly xpReward: number;
  readonly role: EnemyRole;
  private readonly currentHealthValue: number;

  private constructor(props: EnemyProps) {
    this.id = props.id;
    this.name = props.name;
    this.enemyType = props.enemyType;
    this.stage = props.stage;
    this.level = Math.max(1, props.level);
    this.attributes = { ...props.attributes };
    this.baseAttack = props.baseAttack;
    this.baseDefense = props.baseDefense;
    this.baseMaxHealth = props.baseMaxHealth;
    this.skillRanks = { ...props.skillRanks };
    this.passiveIds = [...props.passiveIds];
    this.physicalMeleeAspd = props.physicalMeleeAspd;
    this.goldReward = props.goldReward;
    this.xpReward = props.xpReward;
    this.role = props.role ?? 'trash';
    this.currentHealthValue = Math.min(props.stats.currentHealth, this.maxHealth);
  }

  get totalAttributes(): Attributes {
    return { ...this.attributes };
  }

  get attack(): number {
    const identity = getEnemyCombatIdentity(this.enemyType);
    return deriveCombatAttack({
      baseAttack: this.baseAttack,
      level: this.level,
      attributes: this.attributes,
      attackPerLevel: identity.attackPerLevel,
      defensePerLevel: identity.defensePerLevel,
      healthPerLevel: identity.healthPerLevel,
      attackPercent: sumEnemyPassiveFlat(this.passiveIds, 'attack_percent_flat'),
    });
  }

  get defense(): number {
    const identity = getEnemyCombatIdentity(this.enemyType);
    return deriveCombatDefense({
      baseDefense: this.baseDefense,
      level: this.level,
      attributes: this.attributes,
      attackPerLevel: identity.attackPerLevel,
      defensePerLevel: identity.defensePerLevel,
      healthPerLevel: identity.healthPerLevel,
      defensePercent: sumEnemyPassiveFlat(this.passiveIds, 'defense_percent_flat'),
    });
  }

  get maxHealth(): number {
    const identity = getEnemyCombatIdentity(this.enemyType);
    return resolveEnemySpawnMaxHealth(
      deriveCombatMaxHealth({
        baseMaxHealth: this.baseMaxHealth,
        level: this.level,
        attributes: this.attributes,
        attackPerLevel: identity.attackPerLevel,
        defensePerLevel: identity.defensePerLevel,
        healthPerLevel: identity.healthPerLevel,
        healthPercent: sumEnemyPassiveMaxHealthPercent(
          this.passiveIds,
          this.level,
          this.defense,
        ),
      }),
    );
  }

  /** Compat: Stats espelha getters derivados + HP atual. */
  get stats(): Stats {
    return Stats.create({
      attack: this.attack,
      defense: this.defense,
      maxHealth: this.maxHealth,
      currentHealth: Math.min(this.currentHealthValue, this.maxHealth),
    });
  }

  static restore(props: EnemyProps | LegacyEnemyProps): Enemy {
    return new Enemy(normalizeEnemyProps(props));
  }

  /** @deprecated Preferir spawn via WaveEnemyFactory / buildEnemyCombatSheet. */
  static forStage(stage: number): Enemy {
    const level = Math.max(1, stage);
    const sheet = buildEnemyCombatSheet({
      enemyType: enemyTypeForStage(stage),
      level,
      role: 'trash',
    });
    const maxHealth = resolveEnemySpawnMaxHealth(
      deriveCombatMaxHealth({
        baseMaxHealth: sheet.baseMaxHealth,
        level: sheet.level,
        attributes: sheet.attributes,
        ...combatantStatGrowth(getEnemyCombatIdentity(enemyTypeForStage(stage))),
      }),
    );

    return Enemy.restore({
      id: `enemy-${stage}-${Date.now()}`,
      name: enemyNameForStage(stage),
      enemyType: enemyTypeForStage(stage),
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
      goldReward: Math.floor(8 * (1 + (level - 1) * 0.15)),
      xpReward: Math.floor(2 * (1 + (level - 1) * 0.15)),
      role: 'trash',
    });
  }

  takeDamage(rawDamage: number): Enemy {
    const mitigated = Math.max(1, rawDamage - this.defense);
    return Enemy.restore({
      ...this.toProps(),
      stats: Stats.create({
        ...this.stats.toProps(),
        currentHealth: this.stats.currentHealth - mitigated,
      }),
    });
  }

  isAlive(): boolean {
    return this.stats.currentHealth > 0;
  }

  toProps(): EnemyProps {
    return {
      id: this.id,
      name: this.name,
      enemyType: this.enemyType,
      stage: this.stage,
      level: this.level,
      attributes: { ...this.attributes },
      baseAttack: this.baseAttack,
      baseDefense: this.baseDefense,
      baseMaxHealth: this.baseMaxHealth,
      skillRanks: { ...this.skillRanks },
      passiveIds: [...this.passiveIds],
      physicalMeleeAspd: this.physicalMeleeAspd,
      stats: this.stats,
      goldReward: this.goldReward,
      xpReward: this.xpReward,
      role: this.role,
    };
  }
}

/** Save legado: só stats flat + stage. */
type LegacyEnemyProps = {
  id: string;
  name: string;
  enemyType: EnemyType;
  stage: number;
  stats: Stats | StatsProps;
  goldReward: number;
  xpReward: number;
  role?: EnemyRole;
  level?: number;
  attributes?: Attributes;
  baseAttack?: number;
  baseDefense?: number;
  baseMaxHealth?: number;
  skillRanks?: Record<string, number>;
  passiveIds?: PassiveId[];
  physicalMeleeAspd?: boolean;
};

function normalizeEnemyProps(props: EnemyProps | LegacyEnemyProps): EnemyProps {
  const statsProps =
    props.stats instanceof Stats ? props.stats.toProps() : props.stats;
  const role = props.role ?? 'trash';
  const hasSheet =
    typeof props.level === 'number' &&
    props.attributes != null &&
    typeof props.baseAttack === 'number' &&
    typeof props.baseDefense === 'number' &&
    typeof props.baseMaxHealth === 'number';

  if (hasSheet) {
    const level = Math.max(1, props.level!);
    return {
      id: props.id,
      name: props.name,
      enemyType: props.enemyType,
      stage: props.stage,
      level,
      attributes: props.attributes ?? createAttributes(),
      baseAttack: props.baseAttack!,
      baseDefense: props.baseDefense!,
      baseMaxHealth: props.baseMaxHealth!,
      skillRanks: props.skillRanks ?? { basic_attack: 1 },
      passiveIds: props.passiveIds ?? [],
      physicalMeleeAspd: props.physicalMeleeAspd ?? true,
      stats: Stats.create(statsProps),
      goldReward: props.goldReward,
      xpReward: props.xpReward,
      role,
    };
  }

  const level = Math.max(1, props.level ?? props.stage ?? 1);
  const sheet = buildEnemyCombatSheet({
    enemyType: props.enemyType,
    level,
    role,
  });
  const maxHealth = resolveEnemySpawnMaxHealth(
    deriveCombatMaxHealth({
      baseMaxHealth: sheet.baseMaxHealth,
      level: sheet.level,
      attributes: sheet.attributes,
      ...combatantStatGrowth(getEnemyCombatIdentity(props.enemyType)),
    }),
  );
  const currentHealth = Math.min(statsProps.currentHealth, maxHealth);

  return {
    id: props.id,
    name: props.name,
    enemyType: props.enemyType,
    stage: props.stage,
    level: sheet.level,
    attributes: sheet.attributes,
    baseAttack: sheet.baseAttack,
    baseDefense: sheet.baseDefense,
    baseMaxHealth: sheet.baseMaxHealth,
    skillRanks: sheet.skillRanks,
    passiveIds: sheet.passiveIds,
    physicalMeleeAspd: sheet.physicalMeleeAspd,
    stats: Stats.create({
      attack: sheet.baseAttack,
      defense: sheet.baseDefense,
      maxHealth,
      currentHealth,
    }),
    goldReward: props.goldReward,
    xpReward: props.xpReward,
    role,
  };
}
