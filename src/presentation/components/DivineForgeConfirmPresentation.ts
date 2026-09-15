import { GearDto } from '../../application/dto/GameStateDto';
import {
  getGearFrameSprite,
  getGearRaritySprite,
  getGearSlotSprite,
  getGearSprite,
  imgTag,
} from '../assets/AssetCatalog';
import {
  renderGearBonusLines,
  GEAR_RARITY_LABELS,
  GEAR_SLOT_LABELS,
  GearSlotKey,
} from './GearPresentation';
import { gearRaritySurfaceClass } from './GearRarityPresentation';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderGearConfirmCard(gear: GearDto, compact = false): string {
  const frameUrl = getGearFrameSprite(gear.rarity);
  const slotLabel = GEAR_SLOT_LABELS[gear.slot as GearSlotKey] ?? gear.slot;
  const rarityLabel = GEAR_RARITY_LABELS[gear.rarity] ?? gear.rarity;
  const cardClass = compact ? 'forge-confirm-gear forge-confirm-gear--compact' : 'forge-confirm-gear';

  return `
    <div class="${cardClass} ${gearRaritySurfaceClass(gear.rarity)}" style="--gear-frame: url('${frameUrl}')">
      <span class="forge-confirm-gear-icon-wrap">
        ${imgTag(getGearSprite(gear), slotLabel, 'forge-confirm-gear-icon')}
        ${imgTag(getGearRaritySprite(gear.rarity), rarityLabel, 'forge-confirm-gear-rarity')}
      </span>
      <div class="forge-confirm-gear-info">
        <strong class="forge-confirm-gear-name">${escapeHtml(gear.name)}</strong>
        <span class="forge-confirm-gear-meta">${slotLabel} · ${rarityLabel}</span>
        ${
          compact
            ? ''
            : `<span class="forge-confirm-gear-stats">${renderGearBonusLines(gear)}</span>`
        }
      </div>
    </div>
  `;
}

export function renderForgeSalvageConfirmContent(gear: GearDto, goldPreview: number): string {
  return `
    <div class="forge-confirm-body-inner">
      ${renderGearConfirmCard(gear)}
      <div class="forge-confirm-reward-card">
        <span class="forge-confirm-reward-label">Recompensa</span>
        <strong class="forge-confirm-reward-value">+${goldPreview} ouro</strong>
      </div>
      <p class="forge-confirm-warning">
        Este item será removido permanentemente. Esta ação não pode ser desfeita.
      </p>
    </div>
  `;
}

export function renderForgeFuseConfirmContent(
  gears: GearDto[],
  nextRarityLabel: string,
): string {
  return `
    <div class="forge-confirm-body-inner">
      <div class="forge-confirm-ritual" aria-hidden="true">
        <span class="forge-confirm-ritual__input">${gears.length} itens</span>
        <span class="forge-confirm-ritual__arrow">→</span>
        <span class="forge-confirm-ritual__output">1 ${escapeHtml(nextRarityLabel)}</span>
      </div>
      <p class="forge-confirm-intro">
        Fundir estes ${gears.length} itens em um item aleatório <strong>${escapeHtml(nextRarityLabel)}</strong>?
      </p>
      <div class="forge-confirm-grid">
        ${gears.map((gear) => renderGearConfirmCard(gear, true)).join('')}
      </div>
      <p class="forge-confirm-warning">
        Os ${gears.length} itens serão consumidos permanentemente. Esta ação não pode ser desfeita.
      </p>
    </div>
  `;
}
