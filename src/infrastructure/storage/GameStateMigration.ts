import { createAttributes } from '../../domain/progression/Attributes';
import { BASIC_ATTACK_SKILL_ID } from '../../domain/progression/combat/BasicAttackSkill';
import { MAX_ACTIVE_BATTLE_SKILLS } from '../../domain/progression/SkillBattleSlots';
import { AscensionId, SkillId } from '../../domain/progression/SkillId';
import { normalizeAscensionId } from '../../domain/progression/normalizeAscensionId';
import { Experience } from '../../domain/value-objects/Experience';
import { Stats } from '../../domain/value-objects/Stats';
import { Gear, GearProps, GearSlot } from '../../domain/entities/Gear';
import { ActiveGearSlot } from '../../domain/gear/GearSlotCatalog';
import { DEFAULT_GEAR_TEMPLATE_BY_SLOT } from '../../domain/gear/GearTemplateCatalog';
import {
  createGearFromCatalogItem,
  getGearCatalogItem,
  resolveCatalogItemId,
} from '../../domain/gear/GearItemCatalog';
import { Hero, HeroProps } from '../../domain/entities/Hero';
import { Enemy, EnemyProps } from '../../domain/entities/Enemy';
import { EnemyRole } from '../../domain/campaign/WaveDefinition';
import { inferEnemyType, migrateLegacyEnemyType } from '../../domain/entities/EnemyType';
import { Chest } from '../../domain/entities/Chest';
import { CombatState } from '../../domain/entities/CombatState';
import { ActionTimerService } from '../../domain/services/combat/ActionTimerService';
import { normalizeActionTimerMap } from '../../domain/services/combat/ActionTimerTypes';
import { ChestType } from '../../domain/combat/ChestType';
import {
  CombatStatusEffect,
  StatusEffectMap,
} from '../../domain/services/combat/CombatStatusEffect';

type RawRecord = Record<string, unknown>;

/** IDs de catálogo/template pré-renomeação Caos → Ar. */
const LEGACY_CHAOS_GEAR_IDS: Record<string, string> = {
  chaos_mantle: 'air_mantle',
  chaos_pendant: 'air_pendant',
};

const LEGACY_CHAOS_GEAR_STAT_FIELDS = [
  ['chaosResistBonus', 'airResistBonus'],
  ['chaosResistFlat', 'airResistFlat'],
  ['chaosDamageBonus', 'airDamageBonus'],
  ['chaosDamageFlat', 'airDamageFlat'],
] as const;

const LEGACY_HERO_NAMES: Record<string, string> = {
  Arthos: 'Galneon',
  Lyra: 'Nix',
  Ragnar: 'Torius',
};

function migrateHeroName(name: string): string {
  return LEGACY_HERO_NAMES[name] ?? name;
}

function asRecord(value: unknown): RawRecord {
  return value !== null && typeof value === 'object' ? (value as RawRecord) : {};
}

function migrateEquipment(raw: unknown): HeroProps['equipment'] {
  const entries = Object.entries(asRecord(raw));
  return Object.fromEntries(
    entries.map(([slot, gear]) => [
      slot as GearSlot,
      gear && typeof gear === 'object' ? migrateGear(gear) : null,
    ]),
  );
}

function migrateAttributes(raw: unknown): HeroProps['allocatedAttributes'] {
  const attrs = asRecord(raw);
  return createAttributes(
    typeof attrs.str === 'number' ? attrs.str : 0,
    typeof attrs.dex === 'number' ? attrs.dex : 0,
    typeof attrs.int === 'number' ? attrs.int : 0,
  );
}

const LEGACY_KNIGHT_SKILL_MAP: Record<string, SkillId> = {
  guardian_strike: 'mil_gen_decree',
  guardian_resolve: 'mil_cap_order',
  reaver_cleave: 'mil_guer_cleave',
  reaver_fury: 'mar_gla_slash',
};

const LEGACY_SORCERER_SKILL_MAP: Record<string, SkillId> = {
  pyro_inferno: 'inn_fei_flame',
  pyro_ember: 'inn_fei_spark',
  arcane_surge: 'arc_mag_bolt',
  arcane_focus: 'arc_mag_weave',
};

function migrateAscensionId(raw: unknown): AscensionId | null {
  if (typeof raw !== 'string') return null;
  return normalizeAscensionId(raw as AscensionId);
}

const LEGACY_PRIEST_SKILL_MAP: Record<string, SkillId> = {
  oracle_mend: 'vid_clr_renew',
  oracle_sanctuary: 'vid_gua_aegis',
  inquisitor_judgment: 'sag_san_judgment',
  inquisitor_flame: 'sag_clr_light',
};

/** Skills que eram só passivas equipáveis — removidas; não ocupam mais slots. */
const REMOVED_PASSIVE_ONLY_SKILL_IDS = new Set([
  'evasion',
  'vitality',
  'iron_skin',
  'mana_shield',
  'ghost_step',
]);

function migrateSkillRanks(raw: unknown): Record<SkillId, number> {
  const ranks = asRecord(raw);
  const migrated = Object.fromEntries(
    Object.entries(ranks)
      .filter(([, value]) => typeof value === 'number' && value > 0)
      .map(([id, value]) => {
        const nextId =
          LEGACY_KNIGHT_SKILL_MAP[id] ??
          LEGACY_SORCERER_SKILL_MAP[id] ??
          LEGACY_PRIEST_SKILL_MAP[id] ??
          id;
        return [nextId, value as number];
      }),
  ) as Record<SkillId, number>;

  return migrated;
}

function stripRemovedPassiveOnlySkills(
  skillRanks: Record<SkillId, number>,
  equippedSkillIds: SkillId[],
): { skillRanks: Record<SkillId, number>; equippedSkillIds: SkillId[]; refundedPoints: number } {
  let refundedPoints = 0;
  const ranks: Record<SkillId, number> = {};
  for (const [id, rank] of Object.entries(skillRanks)) {
    if (REMOVED_PASSIVE_ONLY_SKILL_IDS.has(id)) {
      refundedPoints += Math.max(0, rank);
      continue;
    }
    ranks[id as SkillId] = rank;
  }

  return {
    skillRanks: ranks,
    equippedSkillIds: equippedSkillIds.filter((id) => !REMOVED_PASSIVE_ONLY_SKILL_IDS.has(id)),
    refundedPoints,
  };
}

function migrateEquippedSkillIds(raw: unknown): SkillId[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((id): id is SkillId => typeof id === 'string')
    .map(
      (id) =>
        LEGACY_KNIGHT_SKILL_MAP[id] ??
        LEGACY_SORCERER_SKILL_MAP[id] ??
        LEGACY_PRIEST_SKILL_MAP[id] ??
        id,
    )
    .filter((id) => !REMOVED_PASSIVE_ONLY_SKILL_IDS.has(id))
    .slice(0, MAX_ACTIVE_BATTLE_SKILLS);
}

function migrateStarterBattleSkill(
  skillRanks: Record<SkillId, number>,
  equippedSkillIds: SkillId[],
): { skillRanks: Record<SkillId, number>; equippedSkillIds: SkillId[] } {
  const ranks = { ...skillRanks };
  if ((ranks[BASIC_ATTACK_SKILL_ID] ?? 0) < 1) {
    ranks[BASIC_ATTACK_SKILL_ID] = 1;
  }

  const withoutBasic = equippedSkillIds.filter((id) => id !== BASIC_ATTACK_SKILL_ID);
  const equipped = [BASIC_ATTACK_SKILL_ID, ...withoutBasic].slice(0, MAX_ACTIVE_BATTLE_SKILLS);

  return { skillRanks: ranks, equippedSkillIds: equipped };
}

function migrateProgression(raw: RawRecord): Pick<
  HeroProps,
  | 'allocatedAttributes'
  | 'unspentImprovementPoints'
  | 'unspentAscensionPoints'
  | 'skillRanks'
  | 'equippedSkillIds'
  | 'ascensionId'
> {
  const starter = migrateStarterBattleSkill(
    migrateSkillRanks(raw.skillRanks),
    migrateEquippedSkillIds(raw.equippedSkillIds),
  );
  const stripped = stripRemovedPassiveOnlySkills(starter.skillRanks, starter.equippedSkillIds);

  const rawImprovement =
    typeof raw.unspentImprovementPoints === 'number' ? raw.unspentImprovementPoints : 0;
  const rawAscension =
    typeof raw.unspentAscensionPoints === 'number' ? raw.unspentAscensionPoints : 0;

  // Pool unificado: saldos antigos de evolução passam a Aprimoramento.
  return {
    allocatedAttributes: migrateAttributes(raw.allocatedAttributes),
    unspentImprovementPoints: rawImprovement + rawAscension + stripped.refundedPoints,
    unspentAscensionPoints: 0,
    skillRanks: stripped.skillRanks,
    equippedSkillIds: stripped.equippedSkillIds,
    ascensionId: migrateAscensionId(raw.ascensionId),
  };
}

function migrateExperience(raw: unknown): Experience {
  const exp = asRecord(raw);
  return Experience.restore(
    typeof exp.current === 'number' ? exp.current : 0,
    typeof exp.toNextLevel === 'number' ? exp.toNextLevel : 0,
    typeof exp.level === 'number' ? exp.level : 1,
  );
}

export function migrateHero(raw: unknown): Hero {
  const h = asRecord(raw);

  if (typeof h.id !== 'string' || typeof h.name !== 'string' || typeof h.heroClass !== 'string') {
    throw new Error('Herói inválido no storage');
  }

  const experience = migrateExperience(h.experience);
  const equipment = migrateEquipment(h.equipment);

  const progression = migrateProgression(h);

  const heroName = migrateHeroName(h.name);

  if (typeof h.baseAttack === 'number') {
    return Hero.restore({
      id: h.id,
      name: heroName,
      heroClass: h.heroClass as HeroProps['heroClass'],
      baseAttack: h.baseAttack,
      baseDefense: typeof h.baseDefense === 'number' ? h.baseDefense : 5,
      baseMaxHealth: typeof h.baseMaxHealth === 'number' ? h.baseMaxHealth : 100,
      currentHealth: typeof h.currentHealth === 'number' ? h.currentHealth : 100,
      experience,
      equipment,
      ...progression,
    });
  }

  const stats = asRecord(h.stats);
  return Hero.restore({
    id: h.id,
    name: heroName,
    heroClass: h.heroClass as HeroProps['heroClass'],
    baseAttack: typeof stats.attack === 'number' ? stats.attack : 10,
    baseDefense: typeof stats.defense === 'number' ? stats.defense : 5,
    baseMaxHealth: typeof stats.maxHealth === 'number' ? stats.maxHealth : 100,
    currentHealth:
      typeof stats.currentHealth === 'number'
        ? stats.currentHealth
        : typeof stats.maxHealth === 'number'
          ? stats.maxHealth
          : 100,
    experience,
    equipment,
    ...progression,
  });
}

function migrateEnemyRole(role: unknown): EnemyRole {
  if (role === 'boss' || role === 'elite' || role === 'trash') {
    return role;
  }

  return 'trash';
}

export function migrateEnemy(raw: unknown): Enemy | null {
  if (!raw || typeof raw !== 'object') return null;

  const e = raw as EnemyProps;
  const statsRaw = asRecord(e.stats);

  const stage = typeof e.stage === 'number' ? e.stage : 1;
  const name = typeof e.name === 'string' ? e.name : `Slime Lv.${stage}`;

  return Enemy.restore({
    id: e.id,
    name,
    enemyType:
      typeof e.enemyType === 'string'
        ? migrateLegacyEnemyType(e.enemyType)
        : inferEnemyType(name, stage),
    stage,
    stats: Stats.create({
      attack: typeof statsRaw.attack === 'number' ? statsRaw.attack : 10,
      defense: typeof statsRaw.defense === 'number' ? statsRaw.defense : 4,
      maxHealth: typeof statsRaw.maxHealth === 'number' ? statsRaw.maxHealth : 60,
      currentHealth:
        typeof statsRaw.currentHealth === 'number'
          ? statsRaw.currentHealth
          : typeof statsRaw.maxHealth === 'number'
            ? statsRaw.maxHealth
            : 60,
    }),
    goldReward: e.goldReward,
    xpReward: e.xpReward,
    role: migrateEnemyRole(e.role),
  });
}

export function migrateCombat(
  raw: unknown,
  heroes: Hero[],
  legacyEnemy: Enemy | null,
): CombatState | null {
  if (raw && typeof raw === 'object') {
    const combat = asRecord(raw);
    const enemiesRaw = Array.isArray(combat.enemies) ? combat.enemies : [];
    const enemies = enemiesRaw
      .map((enemy) => migrateEnemy(enemy))
      .filter((enemy): enemy is Enemy => enemy !== null);

    if (enemies.length > 0) {
      const actionTimerService = new ActionTimerService();
      const hasActionTimers =
        combat.actionTimers && typeof combat.actionTimers === 'object';

      return CombatState.restore({
        enemies: enemies.map((enemy) => enemy.toProps()),
        actionTimers: hasActionTimers
          ? normalizeActionTimerMap(combat.actionTimers)
          : actionTimerService.createInitial(heroes, enemies),
        combatTime: typeof combat.combatTime === 'number' ? combat.combatTime : 0,
        skillCooldowns:
          combat.skillCooldowns && typeof combat.skillCooldowns === 'object'
            ? (combat.skillCooldowns as CombatState['skillCooldowns'])
            : {},
        statusEffects: migrateStatusEffects(combat.statusEffects),
        encounterMeta:
          combat.encounterMeta && typeof combat.encounterMeta === 'object'
            ? (combat.encounterMeta as CombatState['encounterMeta'])
            : null,
        pendingSkillActions: [],
      });
    }
  }

  if (!legacyEnemy) return null;

  return CombatState.fromLegacyEnemy(legacyEnemy, heroes, new ActionTimerService());
}

/** Converte `dotElement: 'chaos'` legado para `'air'`. */
export function migrateStatusEffects(raw: unknown): StatusEffectMap {
  if (!raw || typeof raw !== 'object') {
    return {};
  }

  const result: StatusEffectMap = {};
  for (const [combatantKey, effects] of Object.entries(asRecord(raw))) {
    if (!Array.isArray(effects)) continue;
    result[combatantKey] = effects.map((effect) => migrateStatusEffect(effect));
  }
  return result;
}

function migrateStatusEffect(raw: unknown): CombatStatusEffect {
  const effect = { ...asRecord(raw) };
  if (effect.dotElement === 'chaos') {
    effect.dotElement = 'air';
  }
  return effect as unknown as CombatStatusEffect;
}

/**
 * Renomeia campos/IDs de gear do elemento Caos legado para Ar.
 * Não sobrescreve `air*` se já existir; remove chaves `chaos*` da saída.
 */
export function migrateLegacyChaosGearFields(raw: RawRecord): void {
  for (const [legacyKey, airKey] of LEGACY_CHAOS_GEAR_STAT_FIELDS) {
    if (raw[airKey] === undefined && typeof raw[legacyKey] === 'number') {
      raw[airKey] = raw[legacyKey];
    }
    delete raw[legacyKey];
  }

  if (typeof raw.catalogItemId === 'string') {
    const mapped = LEGACY_CHAOS_GEAR_IDS[raw.catalogItemId];
    if (mapped) {
      raw.catalogItemId = mapped;
    }
  }

  if (typeof raw.templateId === 'string') {
    const mapped = LEGACY_CHAOS_GEAR_IDS[raw.templateId];
    if (mapped) {
      raw.templateId = mapped;
    }
  }
}

export function migrateChest(raw: unknown): Chest {
  const c = asRecord(raw);
  const chestType =
    typeof c.chestType === 'string' ? (c.chestType as ChestType) : 'monster';

  return Chest.restore({
    id: typeof c.id === 'string' ? c.id : `chest-${Date.now()}`,
    stageEarned: typeof c.stageEarned === 'number' ? c.stageEarned : 1,
    chestType,
    opened: Boolean(c.opened),
    loot: c.loot && typeof c.loot === 'object' ? migrateGear(c.loot) : null,
    guaranteedLoot:
      c.guaranteedLoot && typeof c.guaranteedLoot === 'object'
        ? migrateGear(c.guaranteedLoot)
        : null,
  });
}

export function migrateGear(raw: unknown): Gear {
  const props = { ...(raw as GearProps & RawRecord) } as GearProps & RawRecord;
  migrateLegacyChaosGearFields(props);

  if (!props.templateId && props.catalogItemId) {
    props.templateId = getGearCatalogItem(props.catalogItemId)?.spriteId ?? props.catalogItemId;
  }

  if (!props.catalogItemId && typeof props.name === 'string' && props.slot) {
    const catalogId = resolveCatalogItemId(
      props.name,
      props.slot as ActiveGearSlot,
      props.templateId,
      props.rarity,
    );
    if (catalogId) {
      props.catalogItemId = catalogId;
    }
  }

  if (!props.templateId && typeof props.name === 'string' && props.slot) {
    if (props.catalogItemId) {
      props.templateId =
        getGearCatalogItem(props.catalogItemId)?.spriteId ??
        props.catalogItemId ??
        DEFAULT_GEAR_TEMPLATE_BY_SLOT[props.slot as ActiveGearSlot];
    } else {
      const catalogId = resolveCatalogItemId(
        props.name,
        props.slot as ActiveGearSlot,
        undefined,
        props.rarity,
      );
      props.templateId = catalogId
        ? getGearCatalogItem(catalogId)!.spriteId
        : DEFAULT_GEAR_TEMPLATE_BY_SLOT[props.slot as ActiveGearSlot];
    }
  }

  if (props.catalogItemId && getGearCatalogItem(props.catalogItemId)) {
    const instanceId = typeof props.id === 'string' ? props.id : undefined;
    return createGearFromCatalogItem(props.catalogItemId, instanceId);
  }

  return Gear.create(props);
}
