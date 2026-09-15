import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ShopFlow } from './ShopFlow';
import type { GameStateDto } from '../../application/dto/GameStateDto';
import type { IGameClient } from '../../application/ports/IGameClient';
import type { ToastController } from '../components/ToastController';
import type { RewardCelebrationPort } from '../delight/RewardCelebrationPort';

function stateDto(gold: number): GameStateDto {
  return { gold, shopRefreshUses: 0, shopRefreshLimit: 2 } as unknown as GameStateDto;
}

describe('ShopFlow', () => {
  const send = vi.fn();
  const client = { send } as unknown as IGameClient;
  let flow: ShopFlow;

  beforeEach(() => {
    send.mockReset();
    flow = new ShopFlow(
      client,
      { show: vi.fn() } as unknown as ToastController,
      {
        celebrateShopPurchase: vi.fn(),
        celebrateUpgradePurchased: vi.fn(),
      } as unknown as RewardCelebrationPort,
      () => undefined,
      () => undefined,
      () => undefined,
    );
  });

  it('mantém o restante de renovações da loja ativa após comprar', async () => {
    flow.state.activeShop = {
      id: 'camp-quartermaster',
      name: 'Intendente',
      stockSeed: 1,
      difficultyTier: 1,
    };
    flow.state.offers = [
      { id: 'offer-1', price: 40, gear: {}, canAfford: true },
      { id: 'offer-2', price: 90, gear: {}, canAfford: true },
    ] as unknown as ShopFlow['state']['offers'];
    flow.state.refreshCost = 15;
    flow.state.shopRefreshRemaining = 1;
    flow.state.canAffordRefresh = true;
    send.mockResolvedValue({ ok: true, state: stateDto(50) });

    await flow.buyOffer('offer-1');

    expect(flow.state.shopRefreshRemaining).toBe(1);
    expect(flow.state.offers.map((offer) => offer.id)).toEqual(['offer-2']);
    expect(flow.state.offers[0].canAfford).toBe(false);
    expect(flow.state.canAffordRefresh).toBe(true);
  });

  it('sem cota restante a renovação fica indisponível mesmo com ouro', async () => {
    flow.state.activeShop = {
      id: 'camp-quartermaster',
      name: 'Intendente',
      stockSeed: 3,
      difficultyTier: 1,
    };
    flow.state.offers = [
      { id: 'offer-1', price: 10, gear: {}, canAfford: true },
    ] as unknown as ShopFlow['state']['offers'];
    flow.state.refreshCost = 15;
    flow.state.shopRefreshRemaining = 0;
    send.mockResolvedValue({ ok: true, state: stateDto(500) });

    await flow.buyOffer('offer-1');

    expect(flow.state.shopRefreshRemaining).toBe(0);
    expect(flow.state.canAffordRefresh).toBe(false);
  });
});
