import { WowBanner } from './types/WowBanner';

export function wowBannerContentKey(banner: WowBanner): string {
  return [
    banner.id,
    banner.title,
    banner.subtitle ?? '',
    banner.eyebrow ?? '',
    banner.progressRatio ?? '',
    banner.detailLines?.join('\n') ?? '',
    banner.cta?.label ?? '',
    banner.tone,
  ].join('|');
}

export function buildWowStripSnapshot(banners: WowBanner[], activeIndex: number): string {
  const active = banners[activeIndex] ?? banners[0];

  return JSON.stringify({
    activeIndex,
    ids: banners.map((banner) => banner.id),
    activeKey: active ? wowBannerContentKey(active) : '',
  });
}
