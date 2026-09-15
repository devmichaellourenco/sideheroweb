import { describe, expect, it } from 'vitest';
import { GameStateDto } from '../../application/dto/GameStateDto';
import { buildPersistentWowBanners } from './WowBannerBuilder';
import { mapRewardMomentToWowBanner } from './WowMomentMapper';
import { REWARD_KIND_PRIORITY } from '../delight/RewardMomentCatalog';
import { RewardMomentDetector } from '../delight/RewardMomentDetector';

const noop = () => undefined;

const handlers = {
  onChestOpen: noop,
  onInventoryOpen: noop,
  onUpgradesOpen: noop,
  onHeroPointsOpen: noop,
  onAchievementsOpen: noop,
  onCampaignOpen: noop,
  onStashOpen: noop,
  onForgeOpen: noop,
};

function baseState(overrides: Partial<GameStateDto> = {}): GameStateDto {
  return {
    pendingChestCount: 0,
    purchasableUpgradeCount: 0,
    seasonCompleted: false,
    chestProgress: { current: 1, target: 3 },
    heroes: [],
    inventory: [],
    ...overrides,
  } as GameStateDto;
}

describe('WowBannerBuilder', () => {
  it('sempre retorna ao menos o banner de progresso do baú', () => {
    const banners = buildPersistentWowBanners(baseState(), handlers);
    expect(banners.length).toBeGreaterThan(0);
    expect(banners.some((banner) => banner.kind === 'chest-progress')).toBe(true);
    const progress = banners.find((banner) => banner.kind === 'chest-progress');
    expect(progress?.cta).toEqual({ label: 'Entendi', action: 'dismiss' });
  });

  it('prioriza baú pendente acima do fallback', () => {
    const banners = buildPersistentWowBanners(baseState({ pendingChestCount: 2 }), handlers);
    expect(banners[0].kind).toBe('chest');
  });

  it('banner de campanha concluída aponta conquistas, não novo jogo', () => {
    const banners = buildPersistentWowBanners(baseState({ seasonCompleted: true }), handlers);
    const season = banners.find((banner) => banner.kind === 'season-complete');
    expect(season?.title).toBe('Campanha concluída!');
    expect(season?.cta).toEqual({ label: 'Ver conquistas', action: 'achievements' });
    expect(season?.subtitle).not.toMatch(/selo|legado|temporada/i);
  });
});

describe('WowMomentMapper', () => {
  it('ignora fase concluída para não duplicar Clear na battle strip', () => {
    const banner = mapRewardMomentToWowBanner({
      id: 'x',
      kind: 'phase_cleared',
      tier: 'meso',
      priority: 50,
      title: 'Fase 1',
      tone: 'victory',
    });

    expect(banner).toBeNull();
  });

  it('mapeia relatório idle com CTA de dismiss', () => {
    const banner = mapRewardMomentToWowBanner({
      id: 'idle-1',
      kind: 'idle_report',
      tier: 'macro',
      priority: 65,
      title: 'Progresso Offline',
      tone: 'idle',
      detailLines: ['12 min fora', '+2 fases'],
      heroPortrait: {
        id: 'hero-1',
        heroClass: 'knight',
        name: 'Galneon',
        ascensionId: null,
      },
    });

    expect(banner?.kind).toBe('idle-report');
    expect(banner?.cta).toEqual({ label: 'Entendi', action: 'dismiss' });
    expect(banner?.detailLines).toHaveLength(2);
    expect(banner?.heroPortrait?.id).toBe('hero-1');
  });
});

describe('loot priority', () => {
  it('eleva prioridade de loot épico acima do raro', () => {
    const detector = new RewardMomentDetector();
    const rare = detector.buildLootMoment({
      id: 'a',
      name: 'Espada',
      rarity: 'rare',
      slot: 'weapon',
      stats: {},
    } as GameStateDto['inventory'][number]);
    const epic = detector.buildLootMoment({
      id: 'b',
      name: 'Armadura',
      rarity: 'epic',
      slot: 'armor',
      stats: {},
    } as GameStateDto['inventory'][number]);

    expect(rare?.priority).toBeLessThan(epic?.priority ?? 0);
    expect(epic?.priority).toBeGreaterThan(REWARD_KIND_PRIORITY.loot_received);
  });
});
