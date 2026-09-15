import { GameStateDto } from '../../application/dto/GameStateDto';
import {
  bindInventoryGearTooltips,
  reanchorPinnedInventoryGearTooltip,
} from './InventoryGearTooltipBinder';
import { GEAR_SLOTS, GEAR_SLOT_LABELS, GearSlotKey } from './GearPresentation';
import { compareGearRarityRank } from './GearRarityPresentation';
import { renderStashGrid } from './StorageGridPresentation';
import { renderInventoryDestroySlot } from './InventoryDestroySlotPresentation';
import { renderStashInventorySlot } from './StashInventorySlotPresentation';
import { InventorySortMode } from './InventoryModalRenderer';

export type StashModalHandlers = {
  onFilterChange: (slot: GearSlotKey | 'all') => void;
  onSortChange: (mode: InventorySortMode) => void;
  onOpenInventory: () => void;
};

export class StashModalRenderer {
  private activeFilter: GearSlotKey | 'all' = 'all';
  private sortMode: InventorySortMode = 'rarity';

  render(container: HTMLElement, state: GameStateDto, handlers: StashModalHandlers): void {
    if (!state.storageCapacity.stashUnlocked) {
      container.innerHTML = `
        <div class="inventory-panel stash-panel">
          <p class="empty-state modal-empty">
            Baú de itens bloqueado. Desbloqueie <strong>Baú de itens I</strong> em Runas.
          </p>
        </div>
      `;
      return;
    }

    const filtered =
      this.activeFilter === 'all'
        ? state.stash
        : state.stash.filter((gear) => gear.slot === this.activeFilter);
    const sorted = this.sortGear(filtered);
    const canWithdraw = state.storageCapacity.inventoryUsed < state.storageCapacity.inventoryLimit;

    const filterButtons = `
      <div class="modal-filters inventory-filters">
        <button type="button" class="filter-btn ${this.activeFilter === 'all' ? 'active' : ''}" data-filter="all">Todos</button>
        ${GEAR_SLOTS.map(
          (slot) => `
            <button type="button" class="filter-btn ${this.activeFilter === slot ? 'active' : ''}" data-filter="${slot}">
              ${GEAR_SLOT_LABELS[slot]}
            </button>
          `,
        ).join('')}
      </div>
    `;

    const sortButtons = `
      <div class="inventory-toolbar-row">
        <div class="modal-sort">
          <span class="modal-sort-label">Ordenar:</span>
          <button type="button" class="filter-btn ${this.sortMode === 'rarity' ? 'active' : ''}" data-sort="rarity">Raridade</button>
          <button type="button" class="filter-btn ${this.sortMode === 'name' ? 'active' : ''}" data-sort="name">Nome</button>
        </div>
        <button type="button" class="filter-btn" data-open-inventory>Inventário</button>
      </div>
    `;

    const countLabel = `<p class="inventory-count">${sorted.length} / ${state.storageCapacity.stashLimit} itens no baú</p>`;
    const bodyScrollTop = container.scrollTop;

    container.innerHTML = `
      <div class="inventory-panel stash-panel">
        <p class="stash-panel-intro">Itens guardados fora do inventário. Não pertencem a um herói específico.</p>
        ${filterButtons}
        ${sortButtons}
        ${countLabel}
        ${renderStashGrid(sorted, { canWithdraw })}
        <footer class="inventory-footer stash-footer">
          ${renderStashInventorySlot({
            canWithdraw,
            used: state.storageCapacity.inventoryUsed,
            limit: state.storageCapacity.inventoryLimit,
          })}
          <div class="inventory-footer-center">
            <p class="stash-capacity-hint">Arraste um item para enviar ao inventário ou destruir</p>
          </div>
          ${renderInventoryDestroySlot()}
        </footer>
      </div>
    `;
    container.scrollTop = bodyScrollTop;

    this.bind(container, handlers);
    bindInventoryGearTooltips(container);
    reanchorPinnedInventoryGearTooltip(container);
  }

  private sortGear(gears: GameStateDto['stash']): GameStateDto['stash'] {
    if (this.sortMode === 'rarity') {
      return [...gears].sort((left, right) => {
        const byRarity = compareGearRarityRank(left.rarity, right.rarity);
        if (byRarity !== 0) return byRarity;
        return left.name.localeCompare(right.name, 'pt-BR');
      });
    }

    return [...gears].sort((left, right) => left.name.localeCompare(right.name, 'pt-BR'));
  }

  private bind(container: HTMLElement, handlers: StashModalHandlers): void {
    container.querySelectorAll('[data-filter]').forEach((button) => {
      button.addEventListener('click', () => {
        const filter = button.getAttribute('data-filter') as GearSlotKey | 'all';
        this.activeFilter = filter;
        handlers.onFilterChange(filter);
      });
    });

    container.querySelectorAll('[data-sort]').forEach((button) => {
      button.addEventListener('click', () => {
        const sort = button.getAttribute('data-sort') as InventorySortMode;
        if (sort === 'gain') return;
        this.sortMode = sort;
        handlers.onSortChange(sort);
      });
    });

    container.querySelector('[data-open-inventory]')?.addEventListener('click', () => {
      handlers.onOpenInventory();
    });
  }

  resetFilter(): void {
    this.activeFilter = 'all';
    this.sortMode = 'rarity';
  }
}
