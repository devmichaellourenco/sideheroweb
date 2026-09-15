import { describe, expect, it } from 'vitest';
import { WOW_BANNER_DISMISS_CTA, resolveWowBannerCta } from './WowBannerCtaPresentation';
import { WowBanner } from './types/WowBanner';
import { WowStripRenderer } from './WowStripRenderer';

function minimalBanner(overrides: Partial<WowBanner> = {}): WowBanner {
  return {
    id: 'banner-1',
    kind: 'loot-received',
    persistence: 'ephemeral',
    priority: 50,
    tone: 'loot',
    title: 'Item épico!',
    ...overrides,
  };
}

describe('WowBannerCtaPresentation', () => {
  it('usa Entendi como CTA padrão', () => {
    expect(resolveWowBannerCta(minimalBanner())).toEqual(WOW_BANNER_DISMISS_CTA);
  });

  it('preserva CTA explícito do banner', () => {
    const cta = { label: 'Abrir baú', action: 'chest' as const };
    expect(resolveWowBannerCta(minimalBanner({ cta }))).toEqual(cta);
  });
});

describe('WowStripRenderer', () => {
  it('renderiza Entendi no rodapé quando o banner não define CTA', () => {
    let html = '';
    const root = {
      set innerHTML(value: string) {
        html = value;
      },
      get innerHTML() {
        return html;
      },
    } as unknown as HTMLElement;

    const renderer = new WowStripRenderer();
    renderer.render(root, [minimalBanner()], 0, { variant: 'center' });

    expect(html).toContain('wow-banner-cta');
    expect(html).toContain('Entendi');
    expect(html).toContain('data-wow-action="dismiss"');
    expect(html).not.toContain('wow-banner-dismiss');
  });

  it('mantém CTA de ação e o X no modo center', () => {
    let html = '';
    const root = {
      set innerHTML(value: string) {
        html = value;
      },
      get innerHTML() {
        return html;
      },
    } as unknown as HTMLElement;

    const renderer = new WowStripRenderer();
    renderer.render(
      root,
      [
        minimalBanner({
          cta: { label: 'Abrir baú', action: 'chest' },
        }),
      ],
      0,
      { variant: 'center' },
    );

    expect(html).toContain('Abrir baú');
    expect(html).toContain('data-wow-action="chest"');
    expect(html).toContain('wow-banner-dismiss');
  });
});
