import { Hero } from '../entities/Hero';
import { CombatState } from '../entities/CombatState';
import { SOLER_PLEGIUS_TEMPLATE_ID } from '../gear/UniqueGearCatalog';
import {
  CombatStatusEffectKind,
  StatusApplication,
} from '../services/combat/CombatStatusEffect';
import { CombatStatusEffectTracker } from '../services/combat/CombatStatusEffectTracker';
import { UniqueEffectId } from './UniqueEffectCatalog';

const NEGATIVE_HERO_STATUS_KINDS: CombatStatusEffectKind[] = [
  'debuff_defense',
  'dot',
  'heal_block',
];

const SOLER_CLEANSE_EFFECT_ID: UniqueEffectId = 'soler_plegius_cleanse';

export function isNegativeHeroStatusKind(kind: CombatStatusEffectKind): boolean {
  return NEGATIVE_HERO_STATUS_KINDS.includes(kind);
}

function partyHasSolerPlegius(heroes: Hero[]): boolean {
  return heroes.some(
    (hero) => hero.toProps().equipment?.weapon?.templateId === SOLER_PLEGIUS_TEMPLATE_ID,
  );
}

export interface SolerCleanseInterceptResult {
  intercepted: boolean;
  tracker: CombatStatusEffectTracker;
  combat: CombatState;
  event?: string;
}

export function trySolerPlegiusCleanse(
  application: StatusApplication,
  heroes: Hero[],
  combat: CombatState,
  tracker: CombatStatusEffectTracker,
): SolerCleanseInterceptResult {
  const noop = { intercepted: false, tracker, combat };

  if (!application.combatantKey.startsWith('hero:')) {
    return noop;
  }

  if (!isNegativeHeroStatusKind(application.kind)) {
    return noop;
  }

  if (!partyHasSolerPlegius(heroes)) {
    return noop;
  }

  if (combat.hasSpentBattleUniqueEffect(SOLER_CLEANSE_EFFECT_ID)) {
    return noop;
  }

  const cleansedTracker = tracker.clearNegativeEffects(application.combatantKey);
  const heroId = application.combatantKey.replace('hero:', '');
  const allyLabel = heroes.find((hero) => hero.id === heroId)?.name ?? 'um aliado';

  return {
    intercepted: true,
    tracker: cleansedTracker,
    combat: combat.withSpentBattleUniqueEffect(SOLER_CLEANSE_EFFECT_ID),
    event: `Soler Plégius purificou ${allyLabel} (efeitos negativos removidos, 1× por batalha)`,
  };
}
