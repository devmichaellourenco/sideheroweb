import { describe, expect, it } from 'vitest';
import { resolveEquipmentTooltipPosition } from './EquipmentTooltipPosition';

describe('resolveEquipmentTooltipPosition', () => {
  const viewport = { viewportWidth: 400, viewportHeight: 600, margin: 8 };

  it('preferencia acima quando cabe', () => {
    const result = resolveEquipmentTooltipPosition({
      ...viewport,
      minTop: 8,
      anchor: { top: 300, bottom: 340, left: 100, width: 40 },
      portal: { width: 180, height: 120 },
    });

    expect(result.top).toBe(300 - 120 - 8);
  });

  it('flipa para baixo quando acima nao cabe no header e abaixo cabe', () => {
    const result = resolveEquipmentTooltipPosition({
      ...viewport,
      minTop: 80,
      anchor: { top: 100, bottom: 140, left: 100, width: 40 },
      portal: { width: 180, height: 120 },
    });

    expect(result.top).toBe(140 + 8);
  });

  it('mantem acima (clamp) quando abaixo cortaria o fundo da viewport', () => {
    // Janela pinada baixa: acima invade o header; abaixo estoura o fundo.
    const result = resolveEquipmentTooltipPosition({
      viewportWidth: 400,
      viewportHeight: 400,
      margin: 8,
      minTop: 60,
      anchor: { top: 280, bottom: 320, left: 100, width: 40 },
      portal: { width: 180, height: 220 },
    });

    expect(result.top).toBe(52);
    expect(result.top + 220).toBeLessThanOrEqual(400);
  });

  it('centraliza horizontalmente e clampa nas bordas', () => {
    const result = resolveEquipmentTooltipPosition({
      ...viewport,
      minTop: 8,
      anchor: { top: 300, bottom: 340, left: 10, width: 20 },
      portal: { width: 180, height: 80 },
    });

    expect(result.left).toBe(8);
  });
});
