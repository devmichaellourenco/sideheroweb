import { describe, expect, it, beforeEach } from 'vitest';
import { WowBanner } from './types/WowBanner';
import {
  filterUndismissedBanners,
  isWowBannerDismissed,
  recordWowBannerDismiss,
} from './WowStripDismissStore';

function banner(overrides: Partial<WowBanner> = {}): WowBanner {
  return {
    id: 'chest-progress',
    kind: 'chest-progress',
    persistence: 'persistent',
    priority: 15,
    tone: 'neutral',
    title: '1/3 vitórias',
    progressRatio: 1 / 3,
    ...overrides,
  };
}

describe('WowStripDismissStore', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('oculta banner dispensado até o conteúdo mudar', () => {
    const first = banner();
    recordWowBannerDismiss(first);
    expect(isWowBannerDismissed(first)).toBe(true);
    expect(filterUndismissedBanners([first])).toHaveLength(0);

    const updated = banner({ title: '2/3 vitórias', progressRatio: 2 / 3 });
    expect(isWowBannerDismissed(updated)).toBe(false);
    expect(filterUndismissedBanners([updated])).toHaveLength(1);
  });
});
