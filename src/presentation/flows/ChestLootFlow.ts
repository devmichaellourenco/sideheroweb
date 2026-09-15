import { GameStateDto, GearDto } from '../../application/dto/GameStateDto';
import { IGameClient } from '../../application/ports/IGameClient';
import { LootFlowController } from '../controllers/LootFlowController';
import { getFeatureFlags } from '../helpers/FeatureFlagsHelper';
import { ModalView } from './ModalTypes';

export class ChestLootFlow {
  openingChests = false;
  autoOpenChestPending = false;

  constructor(
    private readonly client: IGameClient,
    readonly lootFlow: LootFlowController,
    private readonly getState: () => GameStateDto | null,
    private readonly isModalOpen: () => boolean,
    private readonly onFailed: (error?: string) => void,
    private readonly onStateRendered: (state: GameStateDto, options?: { skipChestToast?: boolean }) => void,
    private readonly onLootReceived: (gears: GearDto[]) => Promise<void>,
    private readonly pushModal: (view: ModalView) => void,
    private readonly closeModal: () => void,
    private readonly getModalStack: () => ModalView[],
    private readonly popModalStack: () => void,
    private readonly refreshModal: () => void,
    private readonly shouldAutoOpenChests: () => boolean,
  ) {}

  async openNextChest(): Promise<void> {
    const state = this.getState();
    if (!state || this.openingChests) return;

    const pending = state.chests.find((c) => !c.opened);
    if (!pending) return;

    this.openingChests = true;

    try {
      const response = await this.client.send({ type: 'OPEN_CHEST', chestId: pending.id });
      if (!response.ok) {
        this.onFailed(response.error);
        return;
      }

      this.onStateRendered(response.state, { skipChestToast: true });

      if (response.openedGear) {
        await this.onLootReceived([response.openedGear]);
      }
    } finally {
      this.openingChests = false;
    }
  }

  async openAllChests(): Promise<void> {
    const state = this.getState();
    if (!getFeatureFlags(state).openAllChests) return;
    if (!state || this.openingChests || state.pendingChestCount === 0) return;

    this.openingChests = true;

    try {
      const response = await this.client.send({ type: 'OPEN_ALL_CHESTS' });
      if (!response.ok) {
        this.onFailed(response.error);
        return;
      }

      const openedGears = response.openedGears ?? [];
      this.onStateRendered(response.state, { skipChestToast: true });

      if (openedGears.length > 0) {
        await this.onLootReceived(openedGears);
      }
    } finally {
      this.openingChests = false;
    }
  }

  scheduleAutoOpenChests(): void {
    // AUTO-ABRIR BAÚS DESATIVADO (2026-08): quebra o jogo em alguns fluxos.
    return;

    // --- original ---
    // if (this.autoOpenChestPending) return;
    //
    // const state = this.getState();
    // if (!this.shouldAutoOpenChests() || !getFeatureFlags(state).autoOpenChests) return;
    // if (!state || this.openingChests || (state.loadoutEditOpen && state.phaseRestartOnResume)) {
    //   return;
    // }
    // if (this.isModalOpen() || state.pendingChestCount === 0) return;
    //
    // this.autoOpenChestPending = true;
    // window.setTimeout(() => {
    //   this.autoOpenChestPending = false;
    //
    //   const current = this.getState();
    //   if (!this.shouldAutoOpenChests() || this.openingChests || this.isModalOpen()) return;
    //   if (
    //     !current ||
    //     current.pendingChestCount === 0 ||
    //     (current.loadoutEditOpen && current.phaseRestartOnResume)
    //   ) {
    //     return;
    //   }
    //
    //   if (
    //     current.pendingChestCount >= 2 &&
    //     getFeatureFlags(current).openAllChests &&
    //     getFeatureFlags(current).autoOpenAllChests
    //   ) {
    //     void this.openAllChests();
    //     return;
    //   }
    //
    //   void this.openNextChest();
    // }, 450);
  }

  enqueueLootModals(gearIds: string[]): void {
    const view = this.lootFlow.enqueue(gearIds);
    if (view) {
      this.pushModal(view);
    }
  }

  showNextLootModal(): void {
    const gearId = this.lootFlow.queue[0];
    if (!gearId) return;
    this.pushModal({ type: 'loot-reveal', gearId });
  }

  advanceLootQueue(): void {
    this.lootFlow.shift();

    if (this.lootFlow.hasQueued()) {
      this.showNextLootModal();
      return;
    }

    if (this.getModalStack().length === 0) {
      this.closeModal();
    }
  }

  closeLootModal(): void {
    const topView = this.getModalStack()[this.getModalStack().length - 1];
    if (topView?.type !== 'loot-reveal') return;

    this.popModalStack();

    if (this.lootFlow.hasQueued()) {
      this.advanceLootQueue();
      return;
    }

    if (this.getModalStack().length === 0) {
      this.closeModal();
      return;
    }

    this.refreshModal();
  }

  closeLootBatchModal(): void {
    const topView = this.getModalStack()[this.getModalStack().length - 1];
    if (topView?.type !== 'loot-batch') return;

    this.popModalStack();
    this.lootFlow.reset();
    this.closeModal();
  }
}
