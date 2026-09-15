import { GameStateDto } from '../../application/dto/GameStateDto';
import { bindEquipmentTooltips } from './EquipmentTooltipBinder';
import {
  bindInventoryGearTooltips,
  hideInventoryGearTooltip,
} from './InventoryGearTooltipBinder';
import { computeInventoryEquipFeedback } from './InventoryEquipFeedback';
import { renderInventoryGrid } from './InventoryGridPresentation';
import { renderInventoryHeroLoadout } from './InventoryHeroLoadoutPresentation';
import {
  getGearUpgradeInfoForHero,
  sortGearForHero,
} from './GearComparison';
import { GEAR_SLOT_LABELS, GearSlotKey } from './GearPresentation';
import { InventorySortMode } from './InventoryModalRenderer';
import { getHeroSprite, imgTag } from '../assets/AssetCatalog';
import {
  canHeroEquipGear,
  renderGearRequirementLines,
} from './GearRequirementPresentation';

export type EquipPickerMode =
  | { type: 'slot'; heroId: string; slot: GearSlotKey }
  | { type: 'gear'; gearId: string };

export type EquipPickerHandlers = {
  onSelectGear: (heroId: string, gearId: string) => void;
  onSelectHero: (heroId: string, gearId: string) => void;
  onUnequip: (heroId: string, slot: GearSlotKey) => void;
  onSortChange?: () => void;
  onUpgradesOnlyChange?: () => void;
};

export type EquipPickerRenderOptions = {
  /** Omitir loadout duplicado — usado no painel inline do inventário/drawer */
  compact?: boolean;
};

export class EquipPickerModalRenderer {
  private sortMode: InventorySortMode = 'gain';
  private upgradesOnly = false;
  private previousRenderState: GameStateDto | null = null;

  render(
    container: HTMLElement,
    state: GameStateDto,
    mode: EquipPickerMode,
    handlers: EquipPickerHandlers,
    options: EquipPickerRenderOptions = {},
  ): void {
    if (mode.type === 'slot') {
      this.renderSlotPicker(container, state, mode.heroId, mode.slot, handlers, options);
      return;
    }

    this.renderHeroPicker(container, state, mode.gearId, handlers);
  }

  private renderSlotPicker(
    container: HTMLElement,
    state: GameStateDto,
    heroId: string,
    slot: GearSlotKey,
    handlers: EquipPickerHandlers,
    options: EquipPickerRenderOptions = {},
  ): void {
    hideInventoryGearTooltip();

    const hero = state.heroes.find((entry) => entry.id === heroId);
    if (!hero) {
      container.innerHTML = '<p class="empty-state">Herói não encontrado.</p>';
      return;
    }

    const compatible = state.inventory.filter((gear) => gear.slot === slot);
    const filtered = this.upgradesOnly
      ? compatible.filter(
          (gear) => getGearUpgradeInfoForHero(state, gear, heroId).status === 'upgrade',
        )
      : compatible;
    const sorted = this.sortGear(state, filtered, heroId);
    const equipFeedback = computeInventoryEquipFeedback(
      this.previousRenderState,
      state,
      heroId,
    );
    const slotLabel = GEAR_SLOT_LABELS[slot];

    const sortButtons = `
      <div class="inventory-toolbar-row">
        <div class="modal-sort">
          <span class="modal-sort-label">Ordenar:</span>
          <button type="button" class="filter-btn ${this.sortMode === 'gain' ? 'active' : ''}" data-sort="gain">Ganho</button>
          <button type="button" class="filter-btn ${this.sortMode === 'rarity' ? 'active' : ''}" data-sort="rarity">Raridade</button>
          <button type="button" class="filter-btn ${this.sortMode === 'name' ? 'active' : ''}" data-sort="name">Nome</button>
        </div>
        <button
          type="button"
          class="filter-btn inventory-upgrades-toggle ${this.upgradesOnly ? 'active' : ''}"
          data-upgrades-only
          aria-pressed="${this.upgradesOnly ? 'true' : 'false'}"
        >
          Só upgrades
        </button>
      </div>
    `;

    const countLabel = `<p class="inventory-count">${filtered.length} ${slotLabel.toLowerCase()}${filtered.length === 1 ? '' : 's'} disponíve${filtered.length === 1 ? 'l' : 'is'}</p>`;

    const gridSection =
      sorted.length > 0
        ? renderInventoryGrid(state, sorted, heroId, {
            returnedGearIds: equipFeedback?.returnedGearIds,
            equipMode: 'pick',
            upgradeForHeroId: heroId,
          })
        : `<p class="empty-state modal-empty">Nenhum ${slotLabel.toLowerCase()} disponível no inventário.</p>`;

    const compact = options.compact === true;
    const loadoutSection = compact
      ? ''
      : renderInventoryHeroLoadout(hero, {
          feedback: equipFeedback,
          context: 'equip-picker',
          activeSlot: slot,
        });
    const panelClass = compact
      ? 'inventory-panel equip-picker-panel equip-picker-panel--compact'
      : 'inventory-panel equip-picker-panel';

    container.innerHTML = `
      <div class="${panelClass}">
        ${compact ? '' : `<p class="equip-picker-slot-label">Equipar ${slotLabel.toLowerCase()}</p>`}
        ${loadoutSection}
        ${sortButtons}
        ${countLabel}
        ${gridSection}
      </div>
    `;

    this.previousRenderState = state;
    this.bindSlotPicker(container, handlers);
    bindInventoryGearTooltips(container);
    bindEquipmentTooltips(container);
  }

  private sortGear(
    state: GameStateDto,
    gears: GameStateDto['inventory'],
    heroId: string,
  ): GameStateDto['inventory'] {
    if (this.sortMode === 'gain') {
      return sortGearForHero(state, gears, heroId);
    }

    if (this.sortMode === 'rarity') {
      const rarityRank: Record<string, number> = { epic: 3, rare: 2, common: 1 };
      return [...gears].sort((left, right) => {
        const leftRank = rarityRank[left.rarity] ?? 0;
        const rightRank = rarityRank[right.rarity] ?? 0;
        if (rightRank !== leftRank) return rightRank - leftRank;
        return left.name.localeCompare(right.name, 'pt-BR');
      });
    }

    return [...gears].sort((left, right) => left.name.localeCompare(right.name, 'pt-BR'));
  }

  private bindSlotPicker(container: HTMLElement, handlers: EquipPickerHandlers): void {
    container.querySelectorAll('[data-sort]').forEach((button) => {
      button.addEventListener('click', () => {
        const sort = button.getAttribute('data-sort') as InventorySortMode;
        this.sortMode = sort;
        handlers.onSortChange?.();
      });
    });

    container.querySelector('[data-upgrades-only]')?.addEventListener('click', () => {
      this.upgradesOnly = !this.upgradesOnly;
      handlers.onUpgradesOnlyChange?.();
    });

    void handlers.onSelectGear;
    void handlers.onUnequip;
  }

  private renderHeroPicker(
    container: HTMLElement,
    state: GameStateDto,
    gearId: string,
    handlers: EquipPickerHandlers,
  ): void {
    const gear = state.inventory.find((entry) => entry.id === gearId);

    if (!gear) {
      container.innerHTML = '<p class="empty-state">Item não encontrado no inventário.</p>';
      return;
    }

    container.innerHTML = `
      <p class="equip-picker-context">Em qual herói deseja equipar?</p>
      <div class="equip-hero-picker">
        ${state.heroes
          .map((hero) => {
            const canEquip = canHeroEquipGear(hero, gear);
            const requirements = renderGearRequirementLines(hero, gear);

            return `
              <button
                type="button"
                class="equip-hero-card${canEquip ? '' : ' equip-hero-card--locked'}"
                data-pick-hero="${hero.id}"
                data-pick-gear="${gearId}"
                ${canEquip ? '' : 'disabled'}
              >
                ${imgTag(getHeroSprite(hero), hero.name, 'equip-hero-card-icon')}
                <span class="equip-hero-card-name">${hero.name}</span>
                <span class="equip-hero-card-level">Lv.${hero.level}</span>
                ${requirements}
              </button>
            `;
          })
          .join('')}
      </div>
    `;

    void handlers;
  }
}
