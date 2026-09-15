import { describe, expect, it } from 'vitest';
import { SIDE_HERO_DONATION_URL } from './DonationConfig';
import { renderDonationCardContent } from './DonationCardPresentation';

describe('DonationCardPresentation', () => {
  it('explica que o jogo é gratuito e inclui link Stripe', () => {
    const html = renderDonationCardContent();

    expect(html).toContain('100% gratuito');
    expect(html).toContain(SIDE_HERO_DONATION_URL);
    expect(html).toContain('data-donation-open');
    expect(html).toContain('Fazer uma doação');
    expect(html).toContain('rel="noopener noreferrer"');
  });
});
