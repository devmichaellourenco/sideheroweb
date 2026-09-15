import { describe, expect, it } from 'vitest';
import { rollCriticalHit } from './CriticalHitRoll';

describe('rollCriticalHit', () => {
  it('não crita quando chance é zero', () => {
    expect(rollCriticalHit(0, 1.8, () => 0)).toEqual({ isCrit: false, multiplier: 1 });
  });

  it('crita quando roll 0–100 está abaixo da chance', () => {
    expect(rollCriticalHit(0.25, 1.6, () => 0.24)).toEqual({ isCrit: true, multiplier: 1.6 });
  });

  it('não crita quando roll está na ou acima da chance', () => {
    expect(rollCriticalHit(0.25, 1.6, () => 0.25)).toEqual({ isCrit: false, multiplier: 1 });
  });

  it('usa escala 0–100 equivalente à fração de chance', () => {
    expect(rollCriticalHit(0.5, 2, () => 0.49)).toEqual({ isCrit: true, multiplier: 2 });
    expect(rollCriticalHit(0.5, 2, () => 0.5)).toEqual({ isCrit: false, multiplier: 1 });
  });
});
