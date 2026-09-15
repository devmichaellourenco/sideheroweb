import { GameStateDto } from '../../application/dto/GameStateDto';
import { GearDto } from '../../application/dto/GameStateDto';
import { IGameClient } from '../../application/ports/IGameClient';
import { GearMutationQueue } from '../controllers/GearMutationQueue';
import { ToastController } from '../components/ToastController';
import { DestroyGearConfirmDialog } from '../components/DestroyGearConfirmDialog';

export class GearStorageFlow {
  constructor(
    private readonly client: IGameClient,
    private readonly gearMutations: GearMutationQueue,
    private readonly toasts: ToastController,
    private readonly destroyConfirmDialog: DestroyGearConfirmDialog,
    private readonly onStorageMutated: (state: GameStateDto) => void,
    private readonly onFailed: (error?: string) => void,
  ) {}

  async moveToStash(gearId: string): Promise<void> {
    await this.gearMutations.run(async () => {
      const response = await this.client.send({ type: 'MOVE_GEAR_TO_STASH', gearId });
      if (!response.ok) {
        this.onFailed(response.error);
        return;
      }
      this.onStorageMutated(response.state);
    });
  }

  async moveFromStash(gearId: string): Promise<void> {
    await this.gearMutations.run(async () => {
      const response = await this.client.send({ type: 'MOVE_GEAR_FROM_STASH', gearId });
      if (!response.ok) {
        this.onFailed(response.error);
        return;
      }
      this.onStorageMutated(response.state);
    });
  }

  async destroy(
    gearId: string,
    location: 'inventory' | 'stash',
    gear?: GearDto,
  ): Promise<void> {
    if (!gear) {
      this.onFailed('Item não encontrado');
      return;
    }

    const confirmed = await this.destroyConfirmDialog.open(gear);
    if (!confirmed) return;

    await this.gearMutations.run(async () => {
      const response = await this.client.send({ type: 'DESTROY_GEAR', gearId, location });
      if (!response.ok) {
        this.onFailed(response.error);
        return;
      }
      this.onStorageMutated(response.state);
    });
  }
}

export function bindGearStorageActions(
  root: Document | HTMLElement,
  flow: GearStorageFlow,
  getState: () => GameStateDto | null,
): void {
  root.addEventListener('click', (event) => {
    const target = (event.target as HTMLElement).closest(
      '[data-move-to-stash], [data-move-from-stash], [data-destroy-gear]',
    ) as HTMLElement | null;
    if (!target) return;

    const state = getState();
    if (!state) return;

    const toStashId = target.getAttribute('data-move-to-stash');
    if (toStashId) {
      void flow.moveToStash(toStashId);
      return;
    }

    const fromStashId = target.getAttribute('data-move-from-stash');
    if (fromStashId) {
      void flow.moveFromStash(fromStashId);
      return;
    }

    const destroyId = target.getAttribute('data-destroy-gear');
    const location = target.getAttribute('data-gear-location') as 'inventory' | 'stash' | null;
    if (destroyId && location) {
      const gear =
        location === 'inventory'
          ? state.inventory.find((entry) => entry.id === destroyId)
          : state.stash.find((entry) => entry.id === destroyId);
      void flow.destroy(destroyId, location, gear);
    }
  });
}
