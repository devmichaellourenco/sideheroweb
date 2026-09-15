import { CombatStatusEffectDto } from '../../application/dto/GameStateDto';
import { getAssetUrl, imgTag } from '../assets/AssetCatalog';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function statusIconAsset(effect: CombatStatusEffectDto): string {
  return getAssetUrl(effect.iconPath);
}

export function renderCombatStatusEffects(effects: CombatStatusEffectDto[]): string {
  if (effects.length === 0) return '';

  const badges = effects
    .map((effect) => {
      const polarityClass =
        effect.polarity === 'buff'
          ? 'combat-status-badge--buff'
          : 'combat-status-badge--debuff';
      const iconUrl = statusIconAsset(effect);
      const iconAlt = effect.polarity === 'buff' ? 'Buff' : 'Debuff';
      const turnsLabel = effect.kind === 'heal_block' ? '∞' : String(effect.turnsRemaining);

      return `
        <span
          class="combat-status-badge ${polarityClass}"
          title="${escapeHtml(effect.tooltip)}"
          tabindex="0"
          role="img"
          aria-label="${escapeHtml(effect.tooltip)}"
        >
          ${imgTag(iconUrl, iconAlt, 'combat-status-badge-icon')}
          <span class="combat-status-badge-turns" aria-hidden="true">${turnsLabel}</span>
        </span>
      `;
    })
    .join('');

  return `<div class="combat-status-badges">${badges}</div>`;
}
