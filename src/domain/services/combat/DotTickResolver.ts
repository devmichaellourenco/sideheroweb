import { DamageElement } from '../../combat/DamageElement';
import { scaledDotDamage } from '../../combat/DifficultyCombatScaling';
import { DamageComponent } from '../../combat/DamageComponent';
import { defensiveMitigationForEnemy, defensiveMitigationForHero } from '../../combat/HeroDefensiveStatsProvider';
import { MitigationTarget } from '../../combat/MitigationPipeline';
import { resistanceProfileFromHeroEquipment } from '../../combat/ResistanceProfileAggregator';
import { resolveEnemyInnateResists } from '../../enemies/EnemyInnateResists';
import { Enemy } from '../../entities/Enemy';
import { Hero } from '../../entities/Hero';
import {
  buildMitigationTarget,
  resolveEffectiveTargetDefense,
  resolveOutgoingDamage,
  ResolvedDamage,
} from './CombatDamageResolver';
import { CombatStatusEffectTracker } from './CombatStatusEffectTracker';
import { DotTickEntry } from './CombatStatusEffectTracker';
import { CombatProfile } from '../../combat/CombatProfile';

const DOT_ATTACKER_PROFILE: CombatProfile = {
  attackSpeed: 1,
  castSpeed: 1,
  cooldownReduction: 0,
  critChance: 0,
  critDamage: 1,
};

const DOT_COMPONENT = (element: DamageElement): DamageComponent[] => [
  { element, delivery: 'dot', weight: 1 },
];

export function resolveDotTickDamage(
  baseMagnitude: number,
  element: DamageElement | undefined,
  target: MitigationTarget,
  stageLevel: number,
): ResolvedDamage {
  const scaled = scaledDotDamage(baseMagnitude, stageLevel);
  const damageElement = element ?? 'air';

  return resolveOutgoingDamage(
    scaled,
    DOT_COMPONENT(damageElement),
    target,
    DOT_ATTACKER_PROFILE,
  );
}

export interface ResolvedDotTickBatch {
  totalDamage: number;
  dodgedAny: boolean;
  blockedAny: boolean;
  primaryElement?: DamageElement;
}

export function resolveDotTickBatch(
  dots: ReadonlyArray<{ magnitude: number; dotElement?: DamageElement }>,
  target: MitigationTarget,
  stageLevel: number,
): ResolvedDotTickBatch {
  let totalDamage = 0;
  let dodgedAny = false;
  let blockedAny = false;
  let primaryElement: DamageElement | undefined;

  for (const dot of dots) {
    const resolved = resolveDotTickDamage(dot.magnitude, dot.dotElement, target, stageLevel);
    if (resolved.dodged) {
      dodgedAny = true;
      continue;
    }
    if (resolved.blocked) {
      blockedAny = true;
    }
    if (resolved.amount > 0) {
      totalDamage += resolved.amount;
      primaryElement ??= dot.dotElement ?? 'air';
    }
  }

  return { totalDamage, dodgedAny, blockedAny, primaryElement };
}

export function buildDotMitigationTargetForHero(
  hero: Hero,
  heroKey: string,
  statusEffects: CombatStatusEffectTracker,
  stageLevel: number,
): MitigationTarget {
  const effectiveDefense = resolveEffectiveTargetDefense(hero.defense, heroKey, statusEffects);

  return buildMitigationTarget(
    effectiveDefense,
    stageLevel,
    resistanceProfileFromHeroEquipment(hero.toProps().equipment),
    defensiveMitigationForHero(hero),
  );
}

export function buildDotMitigationTargetForEnemy(
  enemy: Enemy,
  enemyKey: string,
  statusEffects: CombatStatusEffectTracker,
  mapId?: string | null,
): MitigationTarget {
  const effectiveDefense = resolveEffectiveTargetDefense(
    enemy.stats.defense,
    enemyKey,
    statusEffects,
  );

  return buildMitigationTarget(
    effectiveDefense,
    enemy.stage,
    resolveEnemyInnateResists(enemy.enemyType, enemy.stage, mapId),
    defensiveMitigationForEnemy(enemy),
  );
}

export function applyMitigatedDotTicks(
  dots: DotTickEntry[],
  target: MitigationTarget,
  stageLevel: number,
): ResolvedDotTickBatch {
  return resolveDotTickBatch(dots, target, stageLevel);
}
