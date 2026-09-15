import { SIDE_HERO_DONATION_URL } from './DonationConfig';

export function renderDonationCardContent(): string {
  return `
    <p class="donation-card__lead">
      O <strong>Side Hero</strong> é <strong>100% gratuito</strong> — sem paywall, sem moeda premium e sem truques.
    </p>
    <p class="donation-card__copy">
      Se o jogo te diverte e você quiser ajudar o desenvolvimento, uma doação voluntária mantém novas fases,
      balanceamento e melhorias chegando.
    </p>
    <p class="donation-card__note">Doar é opcional. Obrigado por jogar!</p>
    <a
      class="donation-card__cta"
      href="${SIDE_HERO_DONATION_URL}"
      target="_blank"
      rel="noopener noreferrer"
      data-donation-open
    >
      Fazer uma doação
    </a>
  `;
}
