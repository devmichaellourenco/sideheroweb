import { describe, expect, it } from 'vitest';
import { DivineForgePolicy } from '../forge/DivineForgePolicy';
import { UpgradeLevels } from '../upgrades/FeatureKey';

describe('DivineForgePolicy', () => {
  it('forja bloqueada sem melhoria divine_forge', () => {
    const levels: UpgradeLevels = { divine_forge: 0 };
    expect(DivineForgePolicy.isUnlocked(levels)).toBe(false);
  });

  it('forja desbloqueada com divine_forge nível 1+', () => {
    expect(DivineForgePolicy.isUnlocked({ divine_forge: 1 })).toBe(true);
    expect(DivineForgePolicy.isUnlocked({ divine_forge: 2 })).toBe(true);
  });

  it('forja bloqueada quando chave ausente', () => {
    expect(DivineForgePolicy.isUnlocked({})).toBe(false);
  });
});
