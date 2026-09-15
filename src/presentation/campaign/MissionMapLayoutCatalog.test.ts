import { describe, expect, it } from 'vitest';
import {
  clampMissionPinPoint,
  MISSION_PIN_SAFE_MARGIN,
  placeMissionsOnLayout,
  STENDRA_MISSION_MAP_LAYOUT,
} from './MissionMapLayoutCatalog';

describe('MissionMapLayoutCatalog', () => {
  it('clampMissionPinPoint respeita margens seguras', () => {
    expect(clampMissionPinPoint({ x: 2, y: 5 }, 'normal')).toEqual({
      x: MISSION_PIN_SAFE_MARGIN.xMin,
      y: MISSION_PIN_SAFE_MARGIN.yMin,
    });
    expect(clampMissionPinPoint({ x: 99, y: 99 }, 'normal')).toEqual({
      x: MISSION_PIN_SAFE_MARGIN.xMax,
      y: MISSION_PIN_SAFE_MARGIN.yMax,
    });
  });

  it('placeMissionsOnLayout mantém todos os pins dentro da margem', () => {
    const placed = placeMissionsOnLayout({
      layout: STENDRA_MISSION_MAP_LAYOUT,
      mainId: 'main:1-1',
      sideIds: ['side:a', 'side:b'],
      normalIds: ['normal:1-2', 'normal:1-3', 'normal:1-4'],
    });

    for (const marker of placed) {
      expect(marker.point.x).toBeGreaterThanOrEqual(MISSION_PIN_SAFE_MARGIN.xMin);
      expect(marker.point.x).toBeLessThanOrEqual(MISSION_PIN_SAFE_MARGIN.xMax);
      expect(marker.point.y).toBeGreaterThanOrEqual(MISSION_PIN_SAFE_MARGIN.yMin);
      expect(marker.point.y).toBeLessThanOrEqual(MISSION_PIN_SAFE_MARGIN.yMax);
    }
  });
});
