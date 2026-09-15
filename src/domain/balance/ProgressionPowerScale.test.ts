import { describe, expect, it } from 'vitest';
import { gearPrimaryStatBase } from './ProgressionPowerScale';

describe('ProgressionPowerScale', () => {
  it('escala stats de gear de forma agressiva no endgame', () => {
    expect(gearPrimaryStatBase(1)).toBeLessThan(gearPrimaryStatBase(12));
    expect(gearPrimaryStatBase(42)).toBeGreaterThan(gearPrimaryStatBase(12) * 8);
  });
});
