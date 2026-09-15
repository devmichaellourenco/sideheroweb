import { describe, expect, it } from 'vitest';
import { isCelebrationMoment } from './WowCelebrationPolicy';
import { mapRewardMomentToWowBanner } from './WowMomentMapper';

describe('WowCelebrationPolicy', () => {
  it('celebra momentos macro e meso relevantes', () => {
    expect(
      isCelebrationMoment({
        id: 'lvl-1',
        kind: 'level_up',
        tier: 'meso',
        priority: 35,
        title: 'Lv.5',
        tone: 'level',
      }),
    ).toBe(true);

    expect(
      isCelebrationMoment({
        id: 'idle-1',
        kind: 'idle_report',
        tier: 'macro',
        priority: 65,
        title: 'Progresso Offline',
        tone: 'idle',
      }),
    ).toBe(true);

    expect(
      isCelebrationMoment({
        id: 'milestone-1',
        kind: 'milestone_boss_defeated',
        tier: 'macro',
        priority: 99,
        title: 'Capítulo conquistado!',
        tone: 'victory',
      }),
    ).toBe(true);

    expect(
      isCelebrationMoment({
        id: 'named-1',
        kind: 'named_legendary_received',
        tier: 'macro',
        priority: 96,
        title: 'Ignus Ix',
        tone: 'loot',
      }),
    ).toBe(true);

    expect(
      isCelebrationMoment({
        id: 'ach-1',
        kind: 'achievement_unlocked',
        tier: 'macro',
        priority: 90,
        title: 'Hero - Out of the Side',
        tone: 'unlock',
      }),
    ).toBe(true);

    expect(
      isCelebrationMoment({
        id: 'ach-prog-1',
        kind: 'achievement_progress',
        tier: 'meso',
        priority: 72,
        title: 'Stub',
        tone: 'unlock',
      }),
    ).toBe(true);
  });

  it('ignora eventos rotineiros', () => {
    expect(
      isCelebrationMoment({
        id: 'shop-1',
        kind: 'shop_purchase',
        tier: 'meso',
        priority: 45,
        title: 'Espada',
        tone: 'loot',
      }),
    ).toBe(false);

    expect(
      isCelebrationMoment({
        id: 'chest-1',
        kind: 'chest_available',
        tier: 'meso',
        priority: 30,
        title: 'Baú',
        tone: 'chest',
      }),
    ).toBe(false);

    expect(
      isCelebrationMoment({
        id: 'tier-1',
        kind: 'tier_up',
        tier: 'meso',
        priority: 70,
        title: 'Tier 12',
        tone: 'victory',
      }),
    ).toBe(false);
  });
});

describe('WowStripPresentation', () => {
  it('mapeia loot épico com gear para destaque de raridade', () => {
    const mapped = mapRewardMomentToWowBanner({
      id: 'loot-1',
      kind: 'loot_received',
      tier: 'meso',
      priority: 80,
      title: 'Item épico!',
      tone: 'loot',
      gear: {
        id: 'g1',
        name: 'Armadura',
        rarity: 'epic',
        slot: 'armor',
      } as NonNullable<ReturnType<typeof mapRewardMomentToWowBanner>>['gear'],
    });

    expect(mapped?.kind).toBe('loot-received');
    expect(mapped?.gear?.rarity).toBe('epic');
    expect(mapped?.eyebrow).toBe('Novo Item');
    expect(mapped?.cta).toEqual({ label: 'Entendi', action: 'dismiss' });
  });

  it('mapeia marco de campanha e lendário nomeado para celebração central', () => {
    const milestone = mapRewardMomentToWowBanner({
      id: 'milestone-1',
      kind: 'milestone_boss_defeated',
      tier: 'macro',
      priority: 99,
      title: 'Capítulo conquistado!',
      subtitle: 'Guardião Elemental',
      tone: 'victory',
    });

    const named = mapRewardMomentToWowBanner({
      id: 'named-1',
      kind: 'named_legendary_received',
      tier: 'macro',
      priority: 96,
      title: 'Ignus Ix',
      tone: 'loot',
      gear: {
        id: 'g2',
        name: 'Ignus Ix',
        rarity: 'legendary',
        slot: 'accessory',
      } as NonNullable<ReturnType<typeof mapRewardMomentToWowBanner>>['gear'],
    });

    expect(milestone?.kind).toBe('milestone-victory');
    expect(milestone?.eyebrow).toBe('Marco da Campanha');
    expect(named?.kind).toBe('loot-received');
    expect(named?.gear?.rarity).toBe('legendary');
  });

  it('mapeia level-up com portrait do herói', () => {
    const mapped = mapRewardMomentToWowBanner({
      id: 'lvl-1',
      kind: 'level_up',
      tier: 'meso',
      priority: 35,
      title: 'Lv.5',
      tone: 'level',
      heroPortrait: {
        id: 'hero-1',
        heroClass: 'knight',
        name: 'Galneon',
        ascensionId: null,
      },
    });

    expect(mapped?.kind).toBe('level-up');
    expect(mapped?.heroPortrait?.name).toBe('Galneon');
    expect(mapped?.eyebrow).toBe('Level Up');
  });
});
