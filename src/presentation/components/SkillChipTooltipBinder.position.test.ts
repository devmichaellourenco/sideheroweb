import { describe, expect, it } from 'vitest';
import { computeSkillTooltipPosition } from './SkillChipTooltipBinder';

describe('computeSkillTooltipPosition', () => {
  it('prefere acima quando há espaço', () => {
    const result = computeSkillTooltipPosition({
      anchor: { top: 200, left: 100, width: 40, height: 40 },
      portal: { top: 0, left: 0, width: 200, height: 120 },
      viewport: { top: 0, left: 0, width: 400, height: 600 },
      margin: 8,
    });
    expect(result.placement).toBe('above');
    expect(result.top).toBe(200 - 120 - 8);
  });

  it('flipa para baixo quando não cabe acima e clampa nas bordas', () => {
    const result = computeSkillTooltipPosition({
      anchor: { top: 20, left: 10, width: 40, height: 40 },
      portal: { top: 0, left: 0, width: 200, height: 160 },
      viewport: { top: 0, left: 0, width: 360, height: 400 },
      margin: 8,
    });
    expect(result.placement).toBe('below');
    expect(result.top).toBeGreaterThanOrEqual(8);
    expect(result.left).toBeGreaterThanOrEqual(8);
    expect(result.left + 200).toBeLessThanOrEqual(360 - 8);
  });

  it('mantém o tooltip dentro da viewport mesmo em janela baixa (pin)', () => {
    const result = computeSkillTooltipPosition({
      anchor: { top: 180, left: 80, width: 40, height: 40 },
      portal: { top: 0, left: 0, width: 220, height: 200 },
      viewport: { top: 0, left: 0, width: 320, height: 280 },
      margin: 8,
    });
    expect(result.top).toBeGreaterThanOrEqual(8);
    expect(result.top + 200).toBeLessThanOrEqual(280 - 8);
  });
});
