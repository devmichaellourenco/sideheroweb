import { WowBanner, WowBannerCta } from './types/WowBanner';

export const WOW_BANNER_DISMISS_CTA: WowBannerCta = {
  label: 'Entendi',
  action: 'dismiss',
};

export function resolveWowBannerCta(banner: WowBanner): WowBannerCta {
  return banner.cta ?? WOW_BANNER_DISMISS_CTA;
}
