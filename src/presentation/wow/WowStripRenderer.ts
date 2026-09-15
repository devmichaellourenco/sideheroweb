import { getGearSprite, getHeroSprite, imgTag } from '../assets/AssetCatalog';
import { RewardHeroPortrait } from '../delight/RewardHeroPortrait';
import { resolveWowBannerCta } from './WowBannerCtaPresentation';
import { WowBanner, WowBannerCta } from './types/WowBanner';

export type WowBannerVariant = 'center' | 'compact';

export interface WowStripRenderOptions {
  animate?: boolean;
  variant?: WowBannerVariant;
}

export class WowStripRenderer {
  render(
    root: HTMLElement,
    banners: WowBanner[],
    activeIndex: number,
    options: WowStripRenderOptions = {},
  ): void {
    const banner = banners[activeIndex] ?? banners[0];
    if (!banner) {
      root.innerHTML = '';
      return;
    }

    const variant = options.variant ?? 'compact';
    const enterClass = options.animate ? ' wow-banner--enter' : '';
    const rarityClass = banner.gear ? ` wow-banner--loot-${banner.gear.rarity}` : '';
    const kindClass =
      banner.kind === 'milestone-victory' ? ' wow-banner--milestone-victory' : '';
    const cta = resolveWowBannerCta(banner);
    const dismissMarkup = this.buildDismissMarkup(variant, cta);

    const dots =
      banners.length > 1
        ? `<div class="wow-strip-dots" role="tablist" aria-label="Celebrações">
            ${banners
              .map(
                (_, index) => `
                  <button
                    type="button"
                    class="wow-strip-dot${index === activeIndex ? ' wow-strip-dot--active' : ''}"
                    data-wow-dot="${index}"
                    aria-label="Celebração ${index + 1}"
                    aria-selected="${index === activeIndex}"
                  ></button>
                `,
              )
              .join('')}
          </div>`
        : '';

    const progressMarkup =
      typeof banner.progressRatio === 'number'
        ? `<div class="wow-banner-progress" aria-hidden="true"><span style="width: ${Math.round(banner.progressRatio * 100)}%"></span></div>`
        : '';

    const detailsMarkup = banner.detailLines?.length
      ? `<ul class="wow-banner-details">${banner.detailLines.map((line) => `<li>${line}</li>`).join('')}</ul>`
      : '';

    const ctaMarkup = `<button type="button" class="wow-banner-cta" data-wow-action="${cta.action}">${cta.label}</button>`;

    root.innerHTML = `
      <div class="wow-strip-bg" aria-hidden="true"></div>
      <article class="wow-banner wow-banner--${banner.tone} wow-banner--${variant}${rarityClass}${kindClass}${enterClass}" data-wow-banner-id="${banner.id}">
        ${dismissMarkup}
        <div class="wow-banner-glow" aria-hidden="true"></div>
        <div class="wow-banner-visual">${this.buildVisualMarkup(banner, variant)}</div>
        <div class="wow-banner-copy">
          ${banner.eyebrow ? `<p class="wow-banner-eyebrow">${banner.eyebrow}</p>` : ''}
          <h3 class="wow-banner-title">${banner.title}</h3>
          ${banner.subtitle ? `<p class="wow-banner-subtitle">${banner.subtitle}</p>` : ''}
          ${detailsMarkup}
          ${progressMarkup}
        </div>
        ${ctaMarkup}
      </article>
      ${dots}
    `;
  }

  private buildDismissMarkup(variant: WowBannerVariant, cta: WowBannerCta): string {
    if (cta.action === 'dismiss') {
      return '';
    }

    if (variant === 'center') {
      return `<button type="button" class="wow-banner-dismiss" data-wow-dismiss aria-label="Fechar celebração">×</button>`;
    }

    return '';
  }

  private buildVisualMarkup(banner: WowBanner, variant: WowBannerVariant): string {
    const visualClass =
      variant === 'center' ? 'wow-banner-visual--center' : 'wow-banner-visual--compact';

    if (banner.gear) {
      const sprite = getGearSprite(banner.gear);
      return `<div class="wow-banner-gear-frame wow-banner-gear-frame--${banner.gear.rarity} ${visualClass}">${imgTag(sprite, banner.gear.name, 'wow-banner-gear-sprite')}</div>`;
    }

    const heroPortraits =
      banner.heroPortraits && banner.heroPortraits.length > 0
        ? banner.heroPortraits
        : banner.heroPortrait
          ? [banner.heroPortrait]
          : [];

    if (heroPortraits.length > 0) {
      return this.buildHeroPortraitsMarkup(heroPortraits, visualClass, variant);
    }

    if (banner.heroEmoji) {
      return `<span class="wow-banner-emoji wow-banner-emoji--${variant}">${banner.heroEmoji}</span>`;
    }

    if (banner.iconUrl) {
      return imgTag(banner.iconUrl, '', `wow-banner-icon wow-banner-icon--${variant}`);
    }

    return '<span class="wow-banner-spark wow-banner-spark--center" aria-hidden="true">✦</span>';
  }

  private buildHeroPortraitsMarkup(
    portraits: RewardHeroPortrait[],
    visualClass: string,
    variant: WowBannerVariant,
  ): string {
    if (portraits.length === 1) {
      const hero = portraits[0];
      return imgTag(getHeroSprite(hero), hero.name, `wow-banner-hero-portrait ${visualClass}`);
    }

    const stack = portraits.slice(0, 3);
    return `<div class="wow-banner-hero-stack wow-banner-hero-stack--${variant} ${visualClass}" aria-hidden="true">${stack
      .map((hero, index) =>
        imgTag(
          getHeroSprite(hero),
          hero.name,
          `wow-banner-hero-portrait wow-banner-hero-stack__item wow-banner-hero-stack__item--${index}`,
        ),
      )
      .join('')}</div>`;
  }
}
