import { GameStateDto, GearDto } from '../../application/dto/GameStateDto';
import {
  bindInventoryGearTooltips,
  reanchorPinnedInventoryGearTooltip,
} from './InventoryGearTooltipBinder';
import {
  captureForgeGridScroll,
  restoreForgeGridScroll,
} from './ForgeGridScrollPresentation';
import {
  DivineForgeTab,
  evaluateForgeSelection,
  listForgeEligibleGear,
  renderCreateTabPanel,
  renderForgeCapacityBar,
  renderForgeGrid,
  renderForgeTabs,
  renderSalvageTabPanel,
} from './DivineForgePresentation';

export type DivineForgeModalHandlers = {
  onTabChange: (tab: DivineForgeTab) => void;
  onFuse: (gearIds: string[]) => void;
  onSalvage: (gearId: string) => void;
};

/**
 * Forja: seleção de itens atualiza classes + dock in-place (sem recriar a grade).
 * Re-render completo só em troca de aba ou mudança de inventário/baú.
 */
export class DivineForgeModalRenderer {
  private activeTab: DivineForgeTab = 'create';
  private selectedIds = new Set<string>();
  private salvageGearId: string | null = null;
  private lastState: GameStateDto | null = null;
  private handlers: DivineForgeModalHandlers | null = null;

  resetSelection(): void {
    this.selectedIds.clear();
    this.salvageGearId = null;
  }

  render(
    container: HTMLElement,
    state: GameStateDto,
    handlers: DivineForgeModalHandlers,
  ): void {
    this.lastState = state;
    this.handlers = handlers;

    if (!state.featureFlags.divineForge) {
      container.innerHTML = `
        <div class="forge-panel">
          <p class="empty-state modal-empty">
            Forja Divina bloqueada. Desbloqueie <strong>Forja Divina</strong> em Runas.
          </p>
        </div>
      `;
      return;
    }

    const forgeGear = listForgeEligibleGear(state);
    const stashGearIds = new Set(state.stash.map((gear) => gear.id));
    const selectionStatus = evaluateForgeSelection(this.selectedIds, forgeGear);
    const selectedSalvageGear = this.resolveSelectedSalvageGear(forgeGear);

    const tabPanel =
      this.activeTab === 'create'
        ? renderCreateTabPanel(selectionStatus)
        : renderSalvageTabPanel(selectedSalvageGear, state.stage);

    const scrollTop = captureForgeGridScroll(container);
    const bodyScrollTop = container.scrollTop;

    container.innerHTML = `
      <div class="forge-panel forge-panel--game inventory-panel">
        ${renderForgeTabs(this.activeTab)}
        ${renderForgeCapacityBar(
          forgeGear.length,
          state.storageCapacity.inventoryUsed,
          state.storageCapacity.inventoryLimit,
          state.storageCapacity.stashUsed,
          state.storageCapacity.stashLimit,
        )}
        <div class="forge-grid-scroll game-scroll">
          ${renderForgeGrid(forgeGear, {
            tab: this.activeTab,
            selectedIds:
              this.activeTab === 'create'
                ? this.selectedIds
                : new Set(selectedSalvageGear ? [selectedSalvageGear.id] : []),
            stage: state.stage,
            stashGearIds,
          })}
        </div>
        ${tabPanel}
      </div>
    `;

    this.bind(container);
    bindInventoryGearTooltips(container);
    restoreForgeGridScroll(container, scrollTop);
    container.scrollTop = bodyScrollTop;
    reanchorPinnedInventoryGearTooltip(container);
  }

  /** Atualiza seleção visual e dock sem recriar os slots da grade. */
  patchSelection(container: HTMLElement = document.getElementById('modal-body')!): void {
    if (!this.lastState || !container) return;

    const forgeGear = listForgeEligibleGear(this.lastState);
    const selectedIds = this.resolveSelectedIdSet();

    container.querySelectorAll<HTMLElement>('[data-forge-gear-id]').forEach((button) => {
      const gearId = button.getAttribute('data-forge-gear-id');
      const selected = gearId !== null && selectedIds.has(gearId);
      button.classList.toggle('forge-grid-slot--selected', selected);
      button.setAttribute('aria-pressed', selected ? 'true' : 'false');
    });

    const dock = container.querySelector('.forge-dock');
    if (!dock) return;

    const panelHtml =
      this.activeTab === 'create'
        ? renderCreateTabPanel(evaluateForgeSelection(this.selectedIds, forgeGear))
        : renderSalvageTabPanel(this.resolveSelectedSalvageGear(forgeGear), this.lastState.stage);

    const wrap = document.createElement('div');
    wrap.innerHTML = panelHtml.trim();
    const nextDock = wrap.firstElementChild;
    if (nextDock) {
      dock.replaceWith(nextDock);
    }
  }

  private resolveSelectedIdSet(): Set<string> {
    if (this.activeTab === 'create') return this.selectedIds;
    return new Set(this.salvageGearId ? [this.salvageGearId] : []);
  }

  private resolveSelectedSalvageGear(forgeGear: GearDto[]): GearDto | null {
    if (this.salvageGearId === null) return null;
    return forgeGear.find((gear) => gear.id === this.salvageGearId) ?? null;
  }

  private bind(container: HTMLElement): void {
    if (container.dataset.forgeBound === 'true') return;
    container.dataset.forgeBound = 'true';

    container.addEventListener('click', (event) => {
      const target = event.target as HTMLElement | null;
      if (!target || !this.handlers) return;

      const tabBtn = target.closest('[data-forge-tab]') as HTMLElement | null;
      if (tabBtn) {
        const tab = tabBtn.getAttribute('data-forge-tab') as DivineForgeTab | null;
        if (!tab || tab === this.activeTab) return;
        this.activeTab = tab;
        this.resetSelection();
        this.handlers.onTabChange(tab);
        return;
      }

      const gearBtn = target.closest('[data-forge-gear-id]') as HTMLElement | null;
      if (gearBtn) {
        const gearId = gearBtn.getAttribute('data-forge-gear-id');
        if (!gearId) return;

        if (this.activeTab === 'create') {
          if (this.selectedIds.has(gearId)) {
            this.selectedIds.delete(gearId);
          } else if (this.selectedIds.size < 9) {
            this.selectedIds.add(gearId);
          }
        } else {
          this.salvageGearId = this.salvageGearId === gearId ? null : gearId;
        }

        this.patchSelection(container);
        return;
      }

      if (target.closest('[data-forge-fuse]')) {
        this.handlers.onFuse([...this.selectedIds]);
        return;
      }

      if (target.closest('[data-forge-salvage]')) {
        if (!this.salvageGearId) return;
        this.handlers.onSalvage(this.salvageGearId);
        return;
      }

      if (target.closest('[data-forge-clear-selection]')) {
        this.resetSelection();
        this.patchSelection(container);
      }
    });
  }

  clearAfterFuse(): void {
    this.selectedIds.clear();
  }

  clearAfterSalvage(): void {
    this.salvageGearId = null;
  }
}
