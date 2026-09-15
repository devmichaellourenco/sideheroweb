import { GameStateDto } from '../../application/dto/GameStateDto';
import { IGameClient } from '../../application/ports/IGameClient';
import { GearMutationQueue } from '../controllers/GearMutationQueue';
import { GearSlotKey } from '../components/GearPresentation';
import { ToastController } from '../components/ToastController';
import { getFeatureFlags } from '../helpers/FeatureFlagsHelper';

export class GearEquipFlow {
  constructor(
    private readonly client: IGameClient,
    private readonly gearMutations: GearMutationQueue,
    private readonly toasts: ToastController,
    private readonly getState: () => GameStateDto | null,
    private readonly onGearMutated: (state: GameStateDto) => void,
    private readonly onFailed: (error?: string) => void,
  ) {}

  async equip(
    heroId: string,
    gearId: string,
    options: { fromInventory?: boolean } = {},
  ): Promise<void> {
    await this.gearMutations.run(async () => {
      const response = await this.client.send({ type: 'EQUIP_GEAR', heroId, gearId });
      if (!response.ok) {
        this.onFailed(response.error);
        return;
      }

      const gearName = this.getState()?.inventory.find((entry) => entry.id === gearId)?.name;
      this.onGearMutated(response.state);
      if (gearName && !options.fromInventory) {
        this.toasts.show(`${gearName} equipado!`, 'loot');
      }
    });
  }

  async unequip(
    heroId: string,
    slot: GearSlotKey,
    _options: { fromInventory?: boolean } = {},
  ): Promise<void> {
    await this.gearMutations.run(async () => {
      const response = await this.client.send({ type: 'UNEQUIP_GEAR', heroId, slot });
      if (!response.ok) {
        this.onFailed(response.error);
        return;
      }

      this.onGearMutated(response.state);
    });
  }

  async optimizeLoadout(
    gearIds?: string[],
    options: { fromLoot?: boolean; silent?: boolean; fromInventory?: boolean } = {},
  ): Promise<void> {
    const state = this.getState();
    if (!getFeatureFlags(state).optimizeLoadout) {
      this.toasts.show('Desbloqueie Otimizar equipe em Runas', 'info');
      return;
    }

    await this.gearMutations.run(async () => {
      const response = await this.client.send({
        type: 'EQUIP_BEST_LOADOUT',
        gearIds,
      });

      if (!response.ok) {
        this.onFailed(response.error);
        return;
      }

      const equippedCount = response.equippedCount ?? 0;
      this.onGearMutated(response.state);

      if (equippedCount > 0 && !options.silent && !options.fromInventory) {
        const label = equippedCount === 1 ? '1 item equipado' : `${equippedCount} itens equipados`;
        const message = options.fromLoot ? `Loot auto-equipado: ${label}` : `Equipe otimizada: ${label}`;
        this.toasts.show(message, options.fromLoot ? 'loot' : 'info');
      } else if (!options.fromLoot && !options.silent && !options.fromInventory) {
        this.toasts.show('Nenhum upgrade disponível no momento', 'info');
      }
    });
  }
}
