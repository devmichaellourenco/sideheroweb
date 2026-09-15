import { AscensionOptionDto } from '../../application/dto/AscensionOptionDto';
import { HeroDto } from '../../application/dto/GameStateDto';
import { getHeroSprite, imgTag } from '../assets/AssetCatalog';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderAscendClassConfirmContent(
  hero: HeroDto,
  option: AscensionOptionDto,
  isUpgrade: boolean,
): string {
  const actionLabel = isUpgrade ? 'Evoluir agora' : 'Seguir este caminho';

  return `
    <div class="ascend-confirm-body-inner">
      <div class="ascend-confirm-preview">
        ${imgTag(
          getHeroSprite({ id: hero.id, heroClass: hero.heroClass, ascensionId: option.id }),
          option.name,
          'ascend-confirm-preview__sprite',
        )}
        <div class="ascend-confirm-preview__meta">
          <strong class="ascend-confirm-preview__name">${escapeHtml(option.name)}</strong>
          <span class="ascend-confirm-preview__points">+${option.pointsGranted} pts de aprimoramento</span>
        </div>
      </div>
      <p class="ascend-confirm-desc">${escapeHtml(option.description)}</p>
      <p class="ascend-confirm-warning">
        Esta escolha é <strong>permanente</strong>. ${escapeHtml(hero.name)} assumirá esta evolução e ganhará skills exclusivas do caminho.
      </p>
      <p class="ascend-confirm-action-hint">Confirmar para <strong>${escapeHtml(actionLabel.toLowerCase())}</strong>?</p>
    </div>
  `;
}
