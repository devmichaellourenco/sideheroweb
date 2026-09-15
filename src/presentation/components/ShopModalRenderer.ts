import { GameStateDto, HeroDto } from '../../application/dto/GameStateDto';
import { ShopDto, ShopOfferDto } from '../../application/dto/ShopOfferDto';
import { ASSETS, getAssetUrl, getGearFrameSprite, getGearSprite, imgTag } from '../assets/AssetCatalog';
import { gearDragAttr } from '../gear/GearDragDropBinder';
import {
  listGearStatDeltas,
  renderGridCompareBadge,
  renderStatDeltaHtml,
} from './GearComparison';
import {
  renderGearBonusLines,
  GEAR_RARITY_LABELS,
  GEAR_SLOT_LABELS,
  GearSlotKey,
  getHeroEquipment,
} from './GearPresentation';
import { gearRaritySurfaceClass } from './GearRarityPresentation';
import {
  canHeroEquipGear,
  renderGearRequirementLines,
} from './GearRequirementPresentation';
import {
  bindEquipmentTooltips,
  bindShopOfferTooltips,
  hideEquipmentTooltip,
} from './EquipmentTooltipBinder';
import {
  renderInventoryHeroSelector,
  resolveDefaultInventoryHeroId,
} from './InventoryGridPresentation';
import { renderInventoryHeroLoadout } from './InventoryHeroLoadoutPresentation';
import { renderTooltipPreviewImage } from './TooltipPreviewPresentation';

export type ShopModalHandlers = {
  onBuyOffer: (offerId: string) => void;
  onRefreshShop: () => void;
};

export interface ShopModalViewModel {
  offers: ShopOfferDto[];
  activeShop?: ShopDto | null;
  refreshCost: number;
  canAffordRefresh: boolean;
  shopRefreshUnlocked: boolean;
  shopRefreshRemaining: number;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderShopOfferTooltip(offer: ShopOfferDto, hero: HeroDto): string {
  const { gear } = offer;
  const rarityLabel = GEAR_RARITY_LABELS[gear.rarity] ?? gear.rarity;
  const slotLabel = GEAR_SLOT_LABELS[gear.slot as GearSlotKey] ?? gear.slot;
  const equipped = getHeroEquipment(hero, gear.slot as GearSlotKey);
  const deltas = listGearStatDeltas(gear, equipped);
  const requirementLines = renderGearRequirementLines(hero, gear);

  return `
    <span class="shop-offer-tooltip" role="tooltip">
      ${renderTooltipPreviewImage(getGearSprite(gear), gear.name)}
      <strong class="shop-offer-tooltip-name">${escapeHtml(gear.name)}</strong>
      <span class="shop-offer-tooltip-meta">${escapeHtml(slotLabel)} · ${escapeHtml(rarityLabel)} · Lv.${gear.requirements.minLevel}</span>
      <span class="shop-offer-tooltip-equipped">${
        equipped
          ? `Vs. equipado: ${escapeHtml(equipped.name)}`
          : 'Slot vazio — bônus do item'
      }</span>
      <span class="shop-offer-tooltip-stats">${renderGearBonusLines(gear)}</span>
      ${requirementLines}
      <span class="shop-offer-tooltip-hero">Comparado com ${escapeHtml(hero.name)}</span>
      <span class="shop-offer-tooltip-delta">
        ${deltas.map((delta) => `<span>${renderStatDeltaHtml(delta)}</span>`).join('')}
      </span>
    </span>
  `;
}

function renderShopOfferTile(offer: ShopOfferDto, hero: HeroDto): string {
  const { gear } = offer;
  const frameUrl = getGearFrameSprite(gear.rarity);
  const disabledAttr = offer.canAfford ? '' : 'disabled';
  const affordClass = offer.canAfford ? '' : ' shop-offer-unaffordable';
  const goldIcon = imgTag(getAssetUrl(ASSETS.ui.gold), 'Ouro', 'shop-gold-icon');
  const equipped = getHeroEquipment(hero, gear.slot as GearSlotKey);
  const canEquip = canHeroEquipGear(hero, gear);
  const lockedClass = canEquip ? '' : ' shop-offer-tile--locked';
  const dragAttrs = offer.canAfford
    ? gearDragAttr({
        kind: 'shop',
        offerId: offer.id,
        slot: gear.slot as GearSlotKey,
      })
    : '';

  return `
    <article
      class="shop-offer-tile ${gearRaritySurfaceClass(gear.rarity)}${affordClass}${lockedClass}"
      data-shop-offer="${offer.id}"
      aria-label="${escapeHtml(gear.name)}"
      ${dragAttrs}
    >
      <div class="shop-offer-icon-wrap" style="--gear-frame: url('${frameUrl}')">
        ${imgTag(getGearSprite(gear), gear.name, 'shop-offer-icon')}
        ${renderGridCompareBadge(gear, equipped)}
      </div>
      <div class="shop-offer-actions">
        <button
          type="button"
          class="gear-equip-btn shop-buy-btn"
          data-shop-buy="${offer.id}"
          aria-label="Comprar ${escapeHtml(gear.name)} por ${offer.price} ouro"
          ${disabledAttr}
        >
          ${goldIcon} ${offer.price}
        </button>
      </div>
      ${renderShopOfferTooltip(offer, hero)}
    </article>
  `;
}

export class ShopModalRenderer {
  private selectedHeroId: string | null = null;

  private getSelectedHeroId(state: GameStateDto): string {
    if (
      this.selectedHeroId &&
      state.heroes.some((hero) => hero.id === this.selectedHeroId)
    ) {
      return this.selectedHeroId;
    }
    return resolveDefaultInventoryHeroId(state);
  }

  render(
    container: HTMLElement,
    state: GameStateDto,
    viewModel: ShopModalViewModel,
    handlers: ShopModalHandlers,
  ): void {
    hideEquipmentTooltip();

    const selectedHeroId = this.getSelectedHeroId(state);
    this.selectedHeroId = selectedHeroId;
    const selectedHero = state.heroes.find((hero) => hero.id === selectedHeroId);

    const goldIcon = imgTag(getAssetUrl(ASSETS.ui.gold), 'Ouro', 'shop-gold-icon');
    const refreshDisabled = viewModel.canAffordRefresh ? '' : 'disabled';

    const offerCards = selectedHero
      ? viewModel.offers.map((offer) => renderShopOfferTile(offer, selectedHero)).join('')
      : '';

    const refreshSection = viewModel.shopRefreshUnlocked
      ? `
        <button
          type="button"
          class="gear-equip-btn shop-refresh-btn"
          data-shop-refresh
          ${refreshDisabled}
        >
          Renovar ${goldIcon} ${viewModel.refreshCost}
          <span class="shop-refresh-remaining">(${viewModel.shopRefreshRemaining} restantes)</span>
        </button>
      `
      : `
        <p class="shop-refresh-locked">Renovar estoque: desbloqueie em <strong>Runas</strong></p>
      `;

    const heroSelector = renderInventoryHeroSelector(state, selectedHeroId, {
      label: 'Comparar com',
    });
    const heroLoadout = selectedHero
      ? renderInventoryHeroLoadout(selectedHero, {
          context: 'shop',
          dragDrop: true,
        })
      : '';

    const bodyScrollTop = container.scrollTop;
    container.innerHTML = `
      <div class="shop-panel">
        <h3 class="shop-name">${escapeHtml(viewModel.activeShop?.name ?? 'Loja indisponível')}</h3>
        ${heroSelector}
        ${heroLoadout}
        <div class="shop-toolbar">
          ${refreshSection}
        </div>
        <div class="shop-offers-grid">
          ${offerCards || '<p class="empty-state">Nenhuma oferta disponível.</p>'}
        </div>
      </div>
    `;
    container.scrollTop = bodyScrollTop;

    bindShopOfferTooltips(container);
    bindEquipmentTooltips(container);

    container.querySelectorAll('[data-inventory-hero]').forEach((button) => {
      button.addEventListener('click', () => {
        const heroId = button.getAttribute('data-inventory-hero');
        if (!heroId || heroId === this.selectedHeroId) return;
        this.selectedHeroId = heroId;
        this.render(container, state, viewModel, handlers);
      });
    });

    container.querySelectorAll('[data-shop-buy]').forEach((button) => {
      button.addEventListener('click', () => {
        const offerId = button.getAttribute('data-shop-buy');
        if (offerId && !(button as HTMLButtonElement).disabled) {
          handlers.onBuyOffer(offerId);
        }
      });
    });

    container.querySelector('[data-shop-refresh]')?.addEventListener('click', () => {
      const button = container.querySelector('[data-shop-refresh]') as HTMLButtonElement | null;
      if (button && !button.disabled) {
        handlers.onRefreshShop();
      }
    });
  }
}
