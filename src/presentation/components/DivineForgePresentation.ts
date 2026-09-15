import { FORGE_FUSE_REQUIRED_COUNT } from '../../domain/gear/GearRarityProgression';
import { calculateForgeSalvageGold } from '../../domain/forge/ForgeSalvageGoldCatalog';
import { GameStateDto, GearDto } from '../../application/dto/GameStateDto';
import {
  getGearFrameSprite,
  getGearRaritySprite,
  getGearSlotSprite,
  getGearSprite,
  getAssetUrl,
  ASSETS,
  imgTag,
} from '../assets/AssetCatalog';
import {
  renderGearBonusLines,
  GEAR_RARITY_LABELS,
  GEAR_SLOT_LABELS,
  GearSlotKey,
} from './GearPresentation';
import {
  GEAR_RARITY_ORDER,
  gearRaritySurfaceClass,
  normalizeGearRarity,
} from './GearRarityPresentation';
import { renderTooltipPreviewImage } from './TooltipPreviewPresentation';

export const DIVINE_FORGE_FUSE_COUNT = FORGE_FUSE_REQUIRED_COUNT;

export type DivineForgeTab = 'create' | 'salvage';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function getNextRarityLabel(rarity: string): string | null {
  const index = GEAR_RARITY_ORDER.indexOf(normalizeGearRarity(rarity));
  if (index < 0 || index >= GEAR_RARITY_ORDER.length - 1) {
    return null;
  }
  const next = GEAR_RARITY_ORDER[index + 1];
  return GEAR_RARITY_LABELS[next] ?? next;
}

export interface ForgeSelectionStatus {
  count: number;
  requiredCount: number;
  rarity: string | null;
  canFuse: boolean;
  nextRarityLabel: string | null;
  mixedRarity: boolean;
}

export function listForgeEligibleGear(state: GameStateDto): GearDto[] {
  return [...state.inventory, ...state.stash];
}

export function evaluateForgeSelection(selectedIds: Set<string>, gears: GearDto[]): ForgeSelectionStatus {
  const selected = gears.filter((gear) => selectedIds.has(gear.id));
  const count = selected.length;
  const rarities = new Set(selected.map((gear) => gear.rarity));
  const rarity = rarities.size === 1 ? selected[0]?.rarity ?? null : null;
  const mixedRarity = count > 0 && rarities.size > 1;
  const nextRarityLabel = rarity ? getNextRarityLabel(rarity) : null;
  const canFuse =
    count === DIVINE_FORGE_FUSE_COUNT &&
    rarity !== null &&
    nextRarityLabel !== null &&
    !mixedRarity;

  return {
    count,
    requiredCount: DIVINE_FORGE_FUSE_COUNT,
    rarity,
    canFuse,
    nextRarityLabel,
    mixedRarity,
  };
}

function renderForgeSlot(
  gear: GearDto,
  options: { selected: boolean; tab: DivineForgeTab; stage: number; inStash: boolean },
): string {
  const frameUrl = getGearFrameSprite(gear.rarity);
  const slotLabel = GEAR_SLOT_LABELS[gear.slot as GearSlotKey] ?? gear.slot;
  const rarityLabel = GEAR_RARITY_LABELS[gear.rarity] ?? gear.rarity;

  return `
    <button
      type="button"
      class="inventory-grid-slot forge-grid-slot ${gearRaritySurfaceClass(gear.rarity)}${options.selected ? ' forge-grid-slot--selected' : ''}${options.inStash ? ' forge-grid-slot--stash' : ''}"
      data-forge-gear-id="${escapeHtml(gear.id)}"
      aria-pressed="${options.selected ? 'true' : 'false'}"
      aria-label="${escapeHtml(gear.name)} · ${slotLabel} · ${rarityLabel}"
      style="--gear-frame: url('${frameUrl}')"
    >
      <span class="inventory-grid-slot-icon-wrap">
        ${imgTag(getGearSprite(gear), slotLabel, 'inventory-grid-slot-icon')}
        ${imgTag(getGearRaritySprite(gear.rarity), rarityLabel, 'inventory-grid-slot-rarity')}
      </span>
      <span class="inventory-gear-tooltip-content hidden">
        ${renderTooltipPreviewImage(getGearSprite(gear), gear.name)}
        <strong class="inventory-gear-tooltip-name">${escapeHtml(gear.name)}</strong>
        <span class="inventory-gear-tooltip-meta">${slotLabel} · ${rarityLabel} · Lv.${gear.requirements.minLevel}${options.inStash ? ' · Baú' : ''}</span>
        <span class="inventory-gear-tooltip-stats">${renderGearBonusLines(gear)}</span>
        ${
          options.tab === 'salvage'
            ? `<span class="forge-salvage-preview">+${calculateForgeSalvageGold(gear.rarity as GearDto['rarity'], options.stage)} ouro</span>`
            : ''
        }
      </span>
    </button>
  `;
}

export function renderForgeGrid(
  gears: GearDto[],
  options: {
    tab: DivineForgeTab;
    selectedIds: Set<string>;
    stage: number;
    stashGearIds?: Set<string>;
  },
): string {
  if (gears.length === 0) {
    return '<p class="empty-state modal-empty">Nenhum item no inventário ou no baú.</p>';
  }

  const stashGearIds = options.stashGearIds ?? new Set<string>();
  const sorted = [...gears].sort((left, right) => {
    const leftRank = GEAR_RARITY_ORDER.indexOf(normalizeGearRarity(left.rarity));
    const rightRank = GEAR_RARITY_ORDER.indexOf(normalizeGearRarity(right.rarity));
    if (rightRank !== leftRank) return rightRank - leftRank;
    return left.name.localeCompare(right.name, 'pt-BR');
  });

  return `
    <div class="inventory-grid forge-grid">
      ${sorted
        .map((gear) =>
          renderForgeSlot(gear, {
            selected: options.selectedIds.has(gear.id),
            tab: options.tab,
            stage: options.stage,
            inStash: stashGearIds.has(gear.id),
          }),
        )
        .join('')}
    </div>
  `;
}

export function renderForgeCapacityBar(
  totalItems: number,
  inventoryUsed: number,
  inventoryLimit: number,
  stashUsed: number,
  stashLimit: number,
): string {
  return `
    <div class="forge-capacity-bar" aria-label="Itens disponíveis na forja">
      <span class="forge-capacity-chip">Itens <strong>${totalItems}</strong></span>
      <span class="forge-capacity-chip">Inventário <strong>${inventoryUsed}/${inventoryLimit}</strong></span>
      <span class="forge-capacity-chip">Baú <strong>${stashUsed}/${stashLimit}</strong></span>
    </div>
  `;
}

function renderForgeClearSelectionButton(ariaLabel: string): string {
  return `
    <button
      type="button"
      class="forge-clear-btn"
      data-forge-clear-selection
      title="Limpar seleção"
      aria-label="${escapeHtml(ariaLabel)}"
    >
      ${imgTag(getAssetUrl(ASSETS.ui.clear), '', 'forge-clear-btn-icon')}
    </button>`;
}

export function renderCreateTabPanel(
  status: ForgeSelectionStatus,
): string {
  const statusCopy = status.mixedRarity
    ? 'Selecione itens da mesma raridade.'
    : status.rarity
      ? `Raridade: ${GEAR_RARITY_LABELS[status.rarity] ?? status.rarity}`
      : 'Selecione 9 itens da mesma raridade.';

  const resultCopy =
    status.canFuse && status.nextRarityLabel
      ? `Resultado: item aleatório ${status.nextRarityLabel}`
      : status.count === status.requiredCount && !status.canFuse
        ? 'Combinação inválida para fusão.'
        : '';

  const clearSelectionBtn =
    status.count > 0 ? renderForgeClearSelectionButton('Limpar seleção de todos os itens') : '';

  return `
    <div class="forge-dock">
      <div class="forge-dock-status${status.mixedRarity || (status.count === status.requiredCount && !status.canFuse) ? ' forge-dock-status--warn' : ''}">
        <span class="forge-dock-badge">${status.count}/${status.requiredCount}</span>
        <div class="forge-dock-copy">
          <p class="forge-dock-line">${statusCopy}</p>
          ${resultCopy ? `<p class="forge-dock-line forge-dock-line--highlight">${resultCopy}</p>` : ''}
        </div>
        ${clearSelectionBtn}
      </div>
      <div class="forge-dock-actions">
        <button
          type="button"
          class="forge-game-btn forge-game-btn--fuse"
          data-forge-fuse
          ${status.canFuse ? '' : 'disabled'}
        >
          Fundir itens
        </button>
      </div>
    </div>
  `;
}

export function renderSalvageTabPanel(
  selectedGear: GearDto | null,
  stage: number,
): string {
  const goldPreview = selectedGear
    ? calculateForgeSalvageGold(selectedGear.rarity as GearDto['rarity'], stage)
    : 0;

  const clearSelectionBtn = selectedGear
    ? renderForgeClearSelectionButton('Limpar seleção do item')
    : '';

  return `
    <div class="forge-dock">
      <div class="forge-dock-status${selectedGear ? ' forge-dock-status--ready' : ''}">
        <span class="forge-dock-badge">${selectedGear ? '+💰' : '—'}</span>
        <div class="forge-dock-copy">
          ${
            selectedGear
              ? `<p class="forge-dock-line">${escapeHtml(selectedGear.name)}</p>
                 <p class="forge-dock-line forge-dock-line--highlight">+${goldPreview} ouro</p>`
              : '<p class="forge-dock-line">Selecione um item para destruir.</p>'
          }
        </div>
        ${clearSelectionBtn}
      </div>
      <div class="forge-dock-actions">
        <button
          type="button"
          class="forge-game-btn forge-game-btn--salvage"
          data-forge-salvage
          ${selectedGear ? '' : 'disabled'}
        >
          Destruir por ouro${selectedGear ? ` (+${goldPreview})` : ''}
        </button>
      </div>
    </div>
  `;
}

export function renderForgeTabs(activeTab: DivineForgeTab): string {
  return `
    <div class="forge-tabs" role="tablist" aria-label="Modos da Forja Divina">
      <button
        type="button"
        class="forge-tab${activeTab === 'create' ? ' forge-tab--active' : ''}"
        data-forge-tab="create"
        role="tab"
        aria-selected="${activeTab === 'create' ? 'true' : 'false'}"
      >
        <span class="forge-tab-icon" aria-hidden="true">⚒</span>
        <span class="forge-tab-label">Fundir</span>
      </button>
      <button
        type="button"
        class="forge-tab${activeTab === 'salvage' ? ' forge-tab--active' : ''}"
        data-forge-tab="salvage"
        role="tab"
        aria-selected="${activeTab === 'salvage' ? 'true' : 'false'}"
      >
        <span class="forge-tab-icon" aria-hidden="true">💰</span>
        <span class="forge-tab-label">Destruir</span>
      </button>
    </div>
  `;
}
