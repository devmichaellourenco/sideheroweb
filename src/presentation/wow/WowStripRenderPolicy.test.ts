import { describe, expect, it } from 'vitest';
import { buildWowStripSnapshot } from './WowStripRenderPolicy';
import { WowBanner } from './types/WowBanner';

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

describe('buildWowStripSnapshot', () => {
  it('mantém snapshot estável quando nada mudou', () => {
    const banners = [banner()];
    const first = buildWowStripSnapshot(banners, 0);
    const second = buildWowStripSnapshot(banners, 0);
    expect(first).toBe(second);
  });

  it('muda snapshot quando progresso do baú avança', () => {
    const before = buildWowStripSnapshot([banner({ progressRatio: 1 / 3, title: '1/3 vitórias' })], 0);
    const after = buildWowStripSnapshot([banner({ progressRatio: 2 / 3, title: '2/3 vitórias' })], 0);
    expect(before).not.toBe(after);
  });

  it('muda snapshot quando o carrossel troca de slide', () => {
    const banners = [banner({ id: 'a' }), banner({ id: 'b', title: 'Baú pronto' })];
    expect(buildWowStripSnapshot(banners, 0)).not.toBe(buildWowStripSnapshot(banners, 1));
  });
});
