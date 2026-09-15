// @vitest-environment happy-dom

import { describe, expect, it, vi } from 'vitest';
import { bindCampaignTooltip, bindCampaignTooltips, hideCampaignTooltip } from './CampaignTooltipBinder';

function buildAnchor(options: { theme?: string } = {}): HTMLElement {
  const anchor = document.createElement('button');
  anchor.type = 'button';
  anchor.setAttribute('data-campaign-tooltip', '');
  if (options.theme) {
    anchor.setAttribute('data-campaign-theme', options.theme);
  }

  const content = document.createElement('span');
  content.className = 'campaign-tooltip-content hidden';
  content.innerHTML = '<strong class="campaign-tooltip-title">Título</strong>';
  anchor.appendChild(content);

  vi.spyOn(anchor, 'getBoundingClientRect').mockReturnValue({
    x: 100,
    y: 100,
    width: 120,
    height: 32,
    top: 100,
    left: 100,
    right: 220,
    bottom: 132,
    toJSON: () => ({}),
  });

  return anchor;
}

describe('CampaignTooltipBinder', () => {
  it('cria portal e replica conteúdo no hover, preservando tema', () => {
    const container = document.createElement('div');
    const anchor = buildAnchor({ theme: 'stendra' });
    container.appendChild(anchor);
    document.body.appendChild(container);

    Object.defineProperty(window, 'innerWidth', { value: 600, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 400, configurable: true });

    bindCampaignTooltip(anchor);
    anchor.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));

    const portal = document.getElementById('campaign-tooltip-portal') as HTMLElement;
    expect(portal).toBeTruthy();
    expect(portal.getAttribute('role')).toBe('tooltip');
    expect(portal.className).toBe('campaign-tooltip-portal');
    expect(portal.getAttribute('data-campaign-theme')).toBe('stendra');
    expect(portal.innerHTML).toContain('campaign-tooltip-title');

    anchor.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    expect(portal.classList.contains('hidden')).toBe(true);

    container.remove();
    hideCampaignTooltip();
  });

  it('ativa em focus/blur e não faz double-bind', () => {
    const container = document.createElement('div');
    const anchor = buildAnchor();
    container.appendChild(anchor);
    document.body.appendChild(container);

    bindCampaignTooltip(anchor);
    bindCampaignTooltip(anchor);
    expect(anchor.dataset.campaignTooltipBound).toBe('true');

    anchor.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
    const portal = document.getElementById('campaign-tooltip-portal') as HTMLElement;
    expect(portal.classList.contains('hidden')).toBe(false);

    anchor.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
    expect(portal.classList.contains('hidden')).toBe(true);

    container.remove();
    hideCampaignTooltip();
  });

  it('bindCampaignTooltips encontra múltiplas âncoras', () => {
    const container = document.createElement('div');
    const first = buildAnchor({ theme: 'a' });
    const second = buildAnchor({ theme: 'b' });
    container.append(first, second);
    document.body.appendChild(container);

    bindCampaignTooltips(container);
    expect(first.dataset.campaignTooltipBound).toBe('true');
    expect(second.dataset.campaignTooltipBound).toBe('true');

    container.remove();
    hideCampaignTooltip();
  });
});

