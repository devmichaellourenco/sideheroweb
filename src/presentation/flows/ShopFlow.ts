import { GameStateDto } from '../../application/dto/GameStateDto';
import { ShopDto, ShopOfferDto } from '../../application/dto/ShopOfferDto';
import { IGameClient } from '../../application/ports/IGameClient';
import { UpgradeNodeDto } from '../../application/dto/UpgradeNodeDto';
import { ToastController } from '../components/ToastController';
import { RewardCelebrationPort } from '../delight/RewardCelebrationPort';

export interface ShopFlowState {
  offers: ShopOfferDto[];
  activeShop: ShopDto | null;
  refreshCost: number;
  canAffordRefresh: boolean;
  shopRefreshUnlocked: boolean;
  shopRefreshRemaining: number;
  upgradeNodes: UpgradeNodeDto[];
}

export class ShopFlow {
  readonly state: ShopFlowState = {
    offers: [],
    activeShop: null,
    refreshCost: 0,
    canAffordRefresh: false,
    shopRefreshUnlocked: false,
    shopRefreshRemaining: 0,
    upgradeNodes: [],
  };

  constructor(
    private readonly client: IGameClient,
    private readonly toasts: ToastController,
    private readonly rewards: RewardCelebrationPort,
    private readonly onStateUpdated: (state: GameStateDto) => void,
    private readonly refreshModal: () => void,
    private readonly enforceUpgradeGates: () => void,
  ) {}

  async loadShop(): Promise<GameStateDto | null> {
    const response = await this.client.send({ type: 'GET_SHOP_OFFERS' });
    if (!response.ok) return null;

    this.applyShopPayload(response);
    return response.state;
  }

  async loadUpgrades(): Promise<GameStateDto | null> {
    const response = await this.client.send({ type: 'GET_UPGRADE_TREE' });
    if (!response.ok) return null;

    this.state.upgradeNodes = response.upgradeNodes ?? [];
    return response.state;
  }

  async purchaseUpgrade(upgradeId: string): Promise<void> {
    const response = await this.client.send({ type: 'PURCHASE_UPGRADE', upgradeId });
    if (!response.ok) {
      this.toasts.show(response.error ?? 'Falha na compra', 'info');
      return;
    }

    this.state.upgradeNodes = response.upgradeNodes ?? [];
    this.onStateUpdated(response.state);
    this.enforceUpgradeGates();
    this.rewards.celebrateUpgradePurchased(upgradeId);
    this.refreshModal();
  }

  async refreshShop(): Promise<void> {
    const shopId = this.state.activeShop?.id;
    if (!shopId) return;
    const response = await this.client.send({ type: 'REFRESH_SHOP', shopId });
    if (!response.ok) {
      this.toasts.show(response.error ?? 'Falha ao renovar loja', 'info');
      return;
    }

    this.applyShopPayload(response);
    this.onStateUpdated(response.state);
    this.toasts.show('Loja renovada', 'info');
    this.refreshModal();
  }

  async buyOffer(offerId: string): Promise<void> {
    const shopId = this.state.activeShop?.id;
    if (!shopId) return;
    const response = await this.client.send({ type: 'BUY_SHOP_OFFER', shopId, offerId });
    if (!response.ok) {
      this.toasts.show(response.error ?? 'Falha na compra', 'info');
      return;
    }

    this.applyPurchasedOffer(offerId, response.state.gold);
    this.onStateUpdated(response.state);

    if (response.purchasedGear) {
      this.rewards.celebrateShopPurchase(response.purchasedGear);
    }

    this.refreshModal();
  }

  async buyAndEquipOffer(offerId: string, heroId: string): Promise<void> {
    const shopId = this.state.activeShop?.id;
    if (!shopId) return;
    const response = await this.client.send({
      type: 'BUY_AND_EQUIP_SHOP_OFFER',
      shopId,
      offerId,
      heroId,
    });
    if (!response.ok) {
      this.toasts.show(response.error ?? 'Não foi possível comprar e equipar', 'info');
      return;
    }

    this.applyPurchasedOffer(offerId, response.state.gold);
    this.onStateUpdated(response.state);

    if (response.purchasedGear) {
      this.rewards.celebrateShopPurchase(response.purchasedGear);
    }

    this.toasts.show('Item comprado e equipado', 'info');
    this.refreshModal();
  }

  async ensureFreshOffers(state: GameStateDto): Promise<void> {
    if (
      !this.state.activeShop ||
      this.state.activeShop.difficultyTier === state.difficultyTier
    ) return;

    await this.loadShop();
    this.refreshModal();
  }

  /** Compra não consome cota de renovação: só o ouro disponível muda. */
  private applyPurchasedOffer(offerId: string, gold: number): void {
    this.state.offers = this.state.offers
      .filter((offer) => offer.id !== offerId)
      .map((offer) => ({
        ...offer,
        canAfford: gold >= offer.price,
      }));
    this.state.canAffordRefresh =
      this.state.shopRefreshRemaining > 0 && gold >= this.state.refreshCost;
  }

  private applyShopPayload(response: {
    shopOffers?: ShopOfferDto[];
    activeShop?: ShopDto | null;
    shopRefreshCost?: number;
    canAffordShopRefresh?: boolean;
    shopRefreshUnlocked?: boolean;
    shopRefreshRemaining?: number;
  }): void {
    if (response.shopOffers) {
      this.state.offers = response.shopOffers;
    }
    if (response.activeShop !== undefined) {
      this.state.activeShop = response.activeShop;
    }
    if (typeof response.shopRefreshCost === 'number') {
      this.state.refreshCost = response.shopRefreshCost;
    }
    if (typeof response.canAffordShopRefresh === 'boolean') {
      this.state.canAffordRefresh = response.canAffordShopRefresh;
    }
    if (typeof response.shopRefreshUnlocked === 'boolean') {
      this.state.shopRefreshUnlocked = response.shopRefreshUnlocked;
    }
    if (typeof response.shopRefreshRemaining === 'number') {
      this.state.shopRefreshRemaining = response.shopRefreshRemaining;
    }
  }
}
