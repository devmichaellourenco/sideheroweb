import { getHeroCombatIdentity } from '../../src/domain/combat/HeroCombatIdentityCatalog';
import { getEnemyCombatIdentity } from '../../src/domain/enemies/EnemyCombatIdentityCatalog';
import {
  LabCombatantIdentity,
  LabCombatantInput,
  LabHeroClass,
  LabSide,
} from './types';

export type { LabCombatantIdentity };

export function catalogIdentityFor(input: {
  kind: LabSide;
  heroClass?: LabHeroClass;
  enemyType?: string;
}): LabCombatantIdentity {
  if (input.kind === 'hero') {
    return { ...getHeroCombatIdentity(input.heroClass ?? 'knight') };
  }
  return { ...getEnemyCombatIdentity(input.enemyType ?? 'goblin_raider') };
}

export function resolveLabIdentity(input: LabCombatantInput): LabCombatantIdentity {
  return {
    ...catalogIdentityFor(input),
    ...(input.identity ?? {}),
  };
}

/** JSON antigo do lab guardava estes knobs em `formulas` (globais). */
export function identityFromLegacyFormulas(
  formulas?: Record<string, unknown> | null,
): Partial<LabCombatantIdentity> | undefined {
  if (!formulas) return undefined;
  const overlay: Partial<LabCombatantIdentity> = {};
  const pick = (key: keyof LabCombatantIdentity, legacyKey: string): void => {
    const value = formulas[legacyKey];
    if (typeof value === 'number' && Number.isFinite(value)) {
      overlay[key] = value;
    }
  };
  pick('attackPerLevel', 'attackPerLevel');
  pick('defensePerLevel', 'defensePerLevel');
  pick('healthPerLevel', 'healthPerLevel');
  pick('attackSpeedFactor', 'baseAspdFactor');
  pick('basicAttackDamageRatio', 'basicAttackRatio');
  return Object.keys(overlay).length > 0 ? overlay : undefined;
}
