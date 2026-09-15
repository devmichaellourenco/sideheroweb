import { describe, expect, it } from 'vitest';
import {
  formatActionTimeBarTooltip,
  formatActionTimeCountdown,
} from './ActionTimeBarPresentation';

describe('ActionTimeBarPresentation', () => {
  it('formata countdown e some quando pronto', () => {
    expect(formatActionTimeCountdown(0)).toBe('');
    expect(formatActionTimeCountdown(1.25)).toBe('1.3');
    expect(formatActionTimeCountdown(12)).toBe('12');
  });

  it('explica ASPD e TTA no tooltip', () => {
    const tip = formatActionTimeBarTooltip(0.5, 1.2, 2);
    expect(tip).toContain('ASPD 0.50/s');
    expect(tip).toContain('TTA = 1 ÷ 0.50 = 2.00s');
    expect(tip).toContain('Restante');
  });
});
