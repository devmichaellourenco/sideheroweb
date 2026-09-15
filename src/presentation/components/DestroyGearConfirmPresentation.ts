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

export function renderDestroyGearConfirmContent(gear: GearDto): string {
  const frameUrl = getGearFrameSprite(gear.rarity);
  const slotLabel = GEAR_SLOT_LABELS[gear.slot as GearSlotKey] ?? gear.slot;
  const rarityLabel = GEAR_RARITY_LABELS[gear.rarity] ?? gear.rarity;

  return `
    <div class="destroy-confirm-gear ${gearRaritySurfaceClass(gear.rarity)}" style="--gear-frame: url('${frameUrl}')">
      <span class="destroy-confirm-gear-icon-wrap">
        ${imgTag(getGearSprite(gear), slotLabel, 'destroy-confirm-gear-icon')}
        ${imgTag(getGearRaritySprite(gear.rarity), rarityLabel, 'destroy-confirm-gear-rarity')}
      </span>
      <div class="destroy-confirm-gear-info">
        <strong class="destroy-confirm-gear-name">${escapeHtml(gear.name)}</strong>
        <span class="destroy-confirm-gear-meta">${slotLabel} · ${rarityLabel}</span>
        <span class="destroy-confirm-gear-stats">${renderGearBonusLines(gear)}</span>
      </div>
    </div>
    <p class="destroy-confirm-warning">
      Este item será removido permanentemente. Esta ação não pode ser desfeita.
    </p>
  `;
}
