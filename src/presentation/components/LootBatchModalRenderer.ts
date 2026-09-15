import { GameStateDto } from '../../application/dto/GameStateDto';
import { countRecommendedFromLoot, getGearUpgradeInfo, renderUpgradeBadge } from './GearComparison';
import { renderGearCard } from './GearPresentation';

export type LootBatchModalHandlers = {
  onEquipRecommended: () => void;
  onKeepAll: () => void;
};

export class LootBatchModalRenderer {
  render(
    container: HTMLElement,
    state: GameStateDto,
    gearIds: string[],
    handlers: LootBatchModalHandlers,
    options: { canOptimize?: boolean } = {},
  ): void {
    const items = gearIds
      .map((gearId) => state.inventory.find((entry) => entry.id === gearId))
      .filter((gear): gear is NonNullable<typeof gear> => Boolean(gear));

    if (items.length === 0) {
      container.innerHTML = '<p class="empty-state">Nenhum item recebido.</p>';
      return;
    }

    const recommendedCount = countRecommendedFromLoot(state, gearIds);
    const equipLabel =
      recommendedCount > 0
        ? `Equipar recomendados (${recommendedCount})`
        : 'Equipar recomendados';

    const batchActions =
      options.canOptimize === true
        ? `
      <div class="loot-reveal-actions">
        <button type="button" class="gear-equip-btn" data-loot-batch-equip ${recommendedCount === 0 ? 'disabled' : ''}>
          ${equipLabel}
        </button>
        <button type="button" class="gear-unequip-btn" data-loot-batch-keep>Guardar tudo</button>
      </div>
    `
        : `
      <div class="loot-reveal-actions">
        <button type="button" class="gear-unequip-btn" data-loot-batch-keep>Guardar tudo</button>
      </div>
    `;

    container.innerHTML = `
      <p class="loot-reveal-intro">Você recebeu ${items.length} itens dos baús!</p>
      <div class="loot-batch-list modal-gear-list">
        ${items
          .map((gear) => {
            const upgrade = getGearUpgradeInfo(state, gear);
            return renderGearCard(gear, {
              showAction: false,
              upgradeBadge: renderUpgradeBadge(upgrade.status, upgrade.gain),
            });
          })
          .join('')}
      </div>
      ${batchActions}
    `;

    void handlers;
  }
}
