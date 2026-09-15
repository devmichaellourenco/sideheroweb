import { GameStateDto, GearDto } from '../../application/dto/GameStateDto';
import { IGameClient } from '../../application/ports/IGameClient';
import { GearMutationQueue } from '../controllers/GearMutationQueue';
import { ToastController } from '../components/ToastController';
import { DivineForgeConfirmDialog } from '../components/DivineForgeConfirmDialog';
import { RewardCelebrationPort } from '../delight/RewardCelebrationPort';

export class DivineForgeFlow {
  constructor(
    private readonly client: IGameClient,
    private readonly gearMutations: GearMutationQueue,
    private readonly confirmDialog: DivineForgeConfirmDialog,
    private readonly toasts: ToastController,
    private readonly rewards: RewardCelebrationPort,
    private readonly onMutated: (state: GameStateDto) => void,
    private readonly onFailed: (error?: string) => void,
  ) {}

  async fuse(gearIds: string[], gears: GearDto[], nextRarityLabel: string): Promise<void> {
    const confirmed = await this.confirmDialog.open({
      kind: 'fuse',
      gears,
      nextRarityLabel,
    });
    if (!confirmed) return;

    await this.gearMutations.run(async () => {
      const response = await this.client.send({ type: 'FORGE_FUSE_GEAR', gearIds });
      if (!response.ok) {
        this.onFailed(response.error);
        return;
      }
      this.onMutated(response.state);
      if (response.forgedGear) {
        this.rewards.celebrateForgeCreated(response.forgedGear);
      }
    });
  }

  async salvage(gear: GearDto, goldPreview: number): Promise<void> {
    const confirmed = await this.confirmDialog.open({
      kind: 'salvage',
      gear,
      goldPreview,
    });
    if (!confirmed) return;

    await this.gearMutations.run(async () => {
      const response = await this.client.send({ type: 'FORGE_SALVAGE_GEAR', gearId: gear.id });
      if (!response.ok) {
        this.onFailed(response.error);
        return;
      }
      this.onMutated(response.state);
      const gold = response.salvageGold ?? goldPreview;
      this.toasts.show(`+${gold} ouro`, 'info');
    });
  }
}
