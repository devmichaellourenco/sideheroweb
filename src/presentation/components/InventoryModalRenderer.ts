import { GameStateDto } from '../../application/dto/GameStateDto';
import { ASSETS, getAssetUrl, imgTag } from '../assets/AssetCatalog';
import {
  countUpgradeItems,
  getGearUpgradeInfoForActiveParty,
  getGearUpgradeInfoForHero,
  sortGearForHero,
} from './GearComparison';
import { GEAR_SLOT_LABELS, GearSlotKey } from './GearPresentation';
import { compareGearRarityRank } from './GearRarityPresentation';
import { bindEquipmentTooltips } from './EquipmentTooltipBinder';
import {
  bindInventoryGearTooltips,
  reanchorPinnedInventoryGearTooltip,
} from './InventoryGearTooltipBinder';
import { computeInventoryEquipFeedback } from './InventoryEquipFeedback';
import {
  renderInventoryGrid,
  renderInventoryHeroSelector,
  resolveDefaultInventoryHeroId,
} from './InventoryGridPresentation';
import { renderInventoryHeroLoadout } from './InventoryHeroLoadoutPresentation';
import { renderInventoryDestroySlot } from './InventoryDestroySlotPresentation';
import { renderInventoryStashSlot } from './InventoryStashSlotPresentation';

export type InventorySortMode = 'gain' | 'name' | 'rarity';

export type InventoryModalHandlers = {
  onEquipGear: (gearId: string, heroId: string) => void;
  onUnequipGear: (heroId: string, slot: GearSlotKey) => void;
  onSlotClick: (heroId: string, slot: GearSlotKey) => void;
  onSortChange: (mode: InventorySortMode) => void;
  onHeroChange: (heroId: string) => void;
  onUpgradesOnlyChange: (enabled: boolean) => void;
  onOptimizeLoadout: () => void;
  onOpenStash: () => void;
};

export class InventoryModalRenderer {
  private sortMode: InventorySortMode = 'gain';
  private selectedHeroId: string | null = null;
  private upgradesOnly = false;
  private previousRenderState: GameStateDto | null = null;
  private heroChangePulse = false;

  getSelectedHeroId(state: GameStateDto): string {
    if (
      this.selectedHeroId &&
      state.heroes.some((hero) => hero.id === this.selectedHeroId)
    ) {
      return this.selectedHeroId;
    }

    return resolveDefaultInventoryHeroId(state);
  }

  renderEmbedded(
    container: HTMLElement,
    state: GameStateDto,
    heroId: string,
    handlers: InventoryModalHandlers,
    options: {
      showOptimize?: boolean;
      inlineActiveSlot?: { heroId: string; slot: GearSlotKey } | null;
      canEditGear?: boolean;
    } = {},
  ): void {
    this.selectedHeroId = heroId;
    this.renderPanel(container, state, heroId, handlers, { ...options, embedded: true });
  }

  render(
    container: HTMLElement,
    state: GameStateDto,
    handlers: InventoryModalHandlers,
    options: {
      showOptimize?: boolean;
      inlineActiveSlot?: { heroId: string; slot: GearSlotKey } | null;
      canEditGear?: boolean;
    } = {},
  ): void {
    const selectedHeroId = this.getSelectedHeroId(state);
    this.selectedHeroId = selectedHeroId;
    this.renderPanel(container, state, selectedHeroId, handlers, options);
  }

  private renderPanel(
    container: HTMLElement,
    state: GameStateDto,
    selectedHeroId: string,
    handlers: InventoryModalHandlers,
    options: {
      showOptimize?: boolean;
      inlineActiveSlot?: { heroId: string; slot: GearSlotKey } | null;
      canEditGear?: boolean;
      embedded?: boolean;
    } = {},
  ): void {
    const embedded = options.embedded === true;
    const inlineActive = options.inlineActiveSlot;
    const slotPicking =
      Boolean(inlineActive) && inlineActive!.heroId === selectedHeroId;
    const activeSlot = slotPicking ? inlineActive!.slot : null;

    const inventoryIcon = getAssetUrl(ASSETS.ui.inventory);
    const filteredBySlot = activeSlot
      ? state.inventory.filter((gear) => gear.slot === activeSlot)
      : state.inventory;

    const filtered = this.upgradesOnly
      ? filteredBySlot.filter((gear) =>
          activeSlot
            ? getGearUpgradeInfoForHero(state, gear, selectedHeroId).status === 'upgrade'
            : getGearUpgradeInfoForActiveParty(state, gear).status === 'upgrade',
        )
      : filteredBySlot;

    const sorted = this.sortInventory(state, filtered, selectedHeroId);
    const upgradeCount = countUpgradeItems(state);
    const selectedHero = state.heroes.find((hero) => hero.id === selectedHeroId);
    const equipFeedback = computeInventoryEquipFeedback(
      this.previousRenderState,
      state,
      selectedHeroId,
    );
    const canEditGear = options.canEditGear !== false;
    const loadoutContext = slotPicking ? ('equip-picker' as const) : ('inventory' as const);
    const heroLoadout =
      !embedded && selectedHero
        ? renderInventoryHeroLoadout(selectedHero, {
            feedback: equipFeedback,
            heroPulse: this.heroChangePulse,
            context: loadoutContext,
            activeSlot: activeSlot ?? undefined,
            dragDrop: canEditGear,
          })
        : '';
    const inlineEquipHost = embedded
      ? ''
      : '<div class="inline-equip-host hidden" data-inline-equip-host aria-live="polite"></div>';

    const optimizeLabel =
      upgradeCount > 0 ? `Otimizar equipe (↑${upgradeCount})` : 'Otimizar equipe';
    const optimizeIcon = imgTag(getAssetUrl(ASSETS.ui.attack), 'Otimizar', 'inventory-optimize-icon');
    // OTIMIZAR EQUIPE DESATIVADO (2026-08): botão oculto (não exibe estado "bloqueado").
    const optimizeButton =
      options.showOptimize === true
        ? `
      <button
        type="button"
        class="inventory-optimize-btn"
        data-optimize-loadout
        title="${optimizeLabel}"
        aria-label="${optimizeLabel}"
        ${upgradeCount === 0 ? 'disabled' : ''}
      >
        ${optimizeIcon}
        ${upgradeCount > 0 ? `<span class="inventory-optimize-badge">${upgradeCount}</span>` : ''}
      </button>
    `
        : '';
    const dockSlots = slotPicking
      ? ''
      : `
          ${renderInventoryStashSlot({
            unlocked: state.storageCapacity.stashUnlocked,
            canStash:
              state.storageCapacity.stashUnlocked &&
              state.storageCapacity.stashUsed < state.storageCapacity.stashLimit,
            used: state.storageCapacity.stashUsed,
            limit: state.storageCapacity.stashLimit,
          })}
          ${optimizeButton ? `<div class="inventory-footer-center">${optimizeButton}</div>` : ''}
          ${renderInventoryDestroySlot()}
        `;

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
        ${
          state.storageCapacity.stashUnlocked
            ? `<button type="button" class="filter-btn" data-open-stash>Baú (${state.storageCapacity.stashUsed}/${state.storageCapacity.stashLimit})</button>`
            : ''
        }
      </div>
    `;

    const heroSelector = embedded ? '' : renderInventoryHeroSelector(state, selectedHeroId);
    const slotLabel = activeSlot ? GEAR_SLOT_LABELS[activeSlot] : null;
    const countLabel = activeSlot
      ? `<p class="inventory-count">${filtered.length} ${slotLabel!.toLowerCase()}${filtered.length === 1 ? '' : 's'} disponíve${filtered.length === 1 ? 'l' : 'is'}</p>`
      : `<p class="inventory-count">${state.storageCapacity.inventoryUsed} / ${state.storageCapacity.inventoryLimit} itens · ${filtered.length} visíveis</p>`;
    const slotContextHeader = activeSlot
      ? `<p class="inventory-slot-context">Escolha ${slotLabel!.toLowerCase()}</p>`
      : '';
    const panelClass = [
      'inventory-panel',
      embedded ? 'inventory-panel--embedded' : '',
      slotPicking ? 'inventory-panel--slot-active' : '',
    ]
      .filter(Boolean)
      .join(' ');

    if (state.inventory.length === 0) {
      const bodyScrollTop = container.scrollTop;
      container.innerHTML = `
        <div class="${panelClass}">
          ${heroSelector}
          ${heroLoadout}
          ${inlineEquipHost}
          ${sortButtons}
          <p class="empty-state modal-empty">
            ${imgTag(inventoryIcon, 'Inventário', 'stat-icon')}
            Nenhum item ainda. Derrote inimigos e abra baús!
          </p>
          <footer class="inventory-footer">${dockSlots || `<div class="inventory-footer-center">${optimizeButton}</div>`}</footer>
        </div>
      `;
      container.scrollTop = bodyScrollTop;
      this.previousRenderState = state;
      this.heroChangePulse = false;
      this.bind(container, handlers, embedded);
      bindEquipmentTooltips(container);
      reanchorPinnedInventoryGearTooltip(container);
      return;
    }

    const mainGridSection =
      sorted.length > 0
        ? renderInventoryGrid(state, sorted, selectedHeroId, {
            returnedGearIds: equipFeedback?.returnedGearIds,
            equipMode: slotPicking ? 'pick' : 'inventory',
            upgradeForHeroId: slotPicking ? selectedHeroId : undefined,
          })
        : activeSlot
          ? `<p class="empty-state modal-empty">Nenhum ${slotLabel!.toLowerCase()} disponível no inventário.</p>`
          : '';

    const bodyScrollTop = container.scrollTop;
    container.innerHTML = `
      <div class="${panelClass}">
        ${heroSelector}
        ${heroLoadout}
        ${inlineEquipHost}
        ${slotContextHeader}
        ${sortButtons}
        ${countLabel}
        ${mainGridSection}
        <footer class="inventory-footer">${dockSlots || `<div class="inventory-footer-center">${optimizeButton}</div>`}</footer>
      </div>
    `;
    container.scrollTop = bodyScrollTop;

    this.previousRenderState = state;
    this.heroChangePulse = false;
    this.bind(container, handlers, embedded);
    bindInventoryGearTooltips(container);
    bindEquipmentTooltips(container);
    reanchorPinnedInventoryGearTooltip(container);
  }

  private sortInventory(
    state: GameStateDto,
    gears: GameStateDto['inventory'],
    heroId: string,
  ): GameStateDto['inventory'] {
    if (this.sortMode === 'gain') {
      return sortGearForHero(state, gears, heroId);
    }

    if (this.sortMode === 'rarity') {
      return [...gears].sort((left, right) => {
        const byRarity = compareGearRarityRank(left.rarity, right.rarity);
        if (byRarity !== 0) return byRarity;
        return left.name.localeCompare(right.name, 'pt-BR');
      });
    }

    return [...gears].sort((left, right) => left.name.localeCompare(right.name, 'pt-BR'));
  }

  private bind(container: HTMLElement, handlers: InventoryModalHandlers, embedded = false): void {
    container.querySelectorAll('[data-sort]').forEach((button) => {
      button.addEventListener('click', () => {
        const sort = button.getAttribute('data-sort') as InventorySortMode;
        this.sortMode = sort;
        handlers.onSortChange(sort);
      });
    });

    if (!embedded) {
      container.querySelectorAll('[data-inventory-hero]').forEach((button) => {
        button.addEventListener('click', () => {
          const heroId = button.getAttribute('data-inventory-hero');
          if (!heroId) return;
          if (heroId !== this.selectedHeroId) {
            this.heroChangePulse = true;
          }
          this.selectedHeroId = heroId;
          handlers.onHeroChange(heroId);
        });
      });
    }

    container.querySelector('[data-upgrades-only]')?.addEventListener('click', () => {
      this.upgradesOnly = !this.upgradesOnly;
      handlers.onUpgradesOnlyChange(this.upgradesOnly);
    });

    container.querySelector('[data-open-stash]')?.addEventListener('click', () => {
      handlers.onOpenStash();
    });

    container.querySelectorAll('[data-inventory-unequip-hero]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        const heroId = button.getAttribute('data-inventory-unequip-hero');
        const slot = button.getAttribute('data-inventory-unequip-slot') as GearSlotKey | null;
        if (!heroId || !slot) return;
        handlers.onUnequipGear(heroId, slot);
      });
    });

    container.querySelectorAll('.inventory-loadout-slot[data-hero][data-slot]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        const heroId = button.getAttribute('data-hero');
        const slot = button.getAttribute('data-slot') as GearSlotKey | null;
        if (!heroId || !slot) return;
        handlers.onSlotClick(heroId, slot);
      });
    });
  }

  resetFilter(): void {
    this.sortMode = 'gain';
    this.selectedHeroId = null;
    this.upgradesOnly = false;
    this.previousRenderState = null;
    this.heroChangePulse = false;
  }
}
