import { describe, expect, it } from 'vitest';
import {
  DEX_ATTACK_SPEED_SCALE,
  resolveActionIntervalSeconds,
  resolveAttributeAttackSpeed,
  STR_ATTACK_SPEED_SCALE,
} from './CombatSpeedScaling';
import { getHeroCombatIdentity } from './HeroCombatIdentityCatalog';

describe('CombatSpeedScaling — fator por combatente', () => {
  it('ASPD usa o fator da identidade do herói, não uma constante global', () => {
    const nix = getHeroCombatIdentity('sorcerer');
    expect(nix.attackSpeedFactor).toBe(0.29);
    expect(DEX_ATTACK_SPEED_SCALE).toBe(0.008);
    expect(STR_ATTACK_SPEED_SCALE).toBe(0.003);
  });

  it('TTA = 1 ÷ ASPD', () => {
    const factor = getHeroCombatIdentity('knight').attackSpeedFactor;
    const aspd = resolveAttributeAttackSpeed(0.29, { str: 8, dex: 6, int: 4 }, true, factor);
    expect(resolveActionIntervalSeconds(aspd)).toBeCloseTo(1 / aspd, 5);
  });
});
