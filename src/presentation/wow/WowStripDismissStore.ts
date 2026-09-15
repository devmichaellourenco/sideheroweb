import { wowBannerContentKey } from './WowStripRenderPolicy';
import { WowBanner } from './types/WowBanner';

const STORAGE_KEY = 'sidehero_wow_dismissed';

function loadDismissed(): Record<string, string> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

function saveDismissed(map: Record<string, string>): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // sessionStorage indisponível
  }
}

export function isWowBannerDismissed(banner: WowBanner): boolean {
  const dismissed = loadDismissed();
  return dismissed[banner.id] === wowBannerContentKey(banner);
}

export function recordWowBannerDismiss(banner: WowBanner): void {
  const dismissed = loadDismissed();
  dismissed[banner.id] = wowBannerContentKey(banner);
  saveDismissed(dismissed);
}

export function filterUndismissedBanners(banners: WowBanner[]): WowBanner[] {
  return banners.filter((banner) => !isWowBannerDismissed(banner));
}
