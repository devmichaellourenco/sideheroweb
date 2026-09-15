import { GameStateDto } from '../../application/dto/GameStateDto';
import { findBestHeroForGear, renderComparisonBlock } from './GearComparison';
import { renderGearCard } from './GearPresentation';
import { canHeroEquipGear } from './GearRequirementPresentation';

export type LootModalHandlers = {
  onEquipBest: (heroId: string, gearId: string) => void;
  onKeepInInventory: () => void;
};

export class LootModalRenderer {
  render(
    container: HTMLElement,
    state: GameStateDto,
    gearId: string,
    handlers: LootModalHandlers,
  ): void {
    const gear = state.inventory.find((entry) => entry.id === gearId);
    if (!gear) {
      container.innerHTML = '<p class="empty-state">Item não encontrado.</p>';
      return;
    }

    const recommendation = findBestHeroForGear(state, gear);
    const hero = recommendation
      ? state.heroes.find((entry) => entry.id === recommendation.heroId)
      : null;
    const canEquip = Boolean(hero && canHeroEquipGear(hero, gear));

    const comparisonSection =
      hero && recommendation
        ? renderComparisonBlock(gear, hero, recommendation.equipped)
        : '';

    const equipLabel = recommendation
      ? `Equipar em ${recommendation.heroName}`
      : 'Equipar';

    const equipDataAttrs = recommendation && canEquip
      ? `data-loot-equip-hero="${recommendation.heroId}" data-loot-equip-gear="${gear.id}"`
      : '';

    container.innerHTML = `
      <p class="loot-reveal-intro">Você recebeu um novo item do baú!</p>
      <div class="loot-reveal-item">
        ${renderGearCard(gear, { showAction: false, hero: hero ?? undefined })}
      </div>
      ${comparisonSection}
      <div class="loot-reveal-actions">
        ${
          recommendation && canEquip
            ? `<button type="button" class="gear-equip-btn" ${equipDataAttrs}>${equipLabel}</button>`
            : ''
        }
        <button type="button" class="gear-unequip-btn" data-loot-keep>Guardar no inventário</button>
      </div>
    `;

    void handlers;
  }
}
