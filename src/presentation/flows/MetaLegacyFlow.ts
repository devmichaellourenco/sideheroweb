import { GameStateDto } from '../../application/dto/GameStateDto';
import { MetaNodeDto } from '../../application/dto/MetaDto';
import { IGameClient } from '../../application/ports/IGameClient';
import { ToastController } from '../components/ToastController';

export class MetaLegacyFlow {
  metaNodes: MetaNodeDto[] = [];

  constructor(
    private readonly client: IGameClient,
    private readonly toasts: ToastController,
    private readonly onStateUpdated: (state: GameStateDto) => void,
    private readonly refreshModal: () => void,
  ) {}

  async loadTree(): Promise<GameStateDto | null> {
    const response = await this.client.send({ type: 'GET_META_TREE' });
    if (!response.ok) {
      this.toasts.show(response.error ?? 'Falha ao carregar legado', 'idle');
      return null;
    }

    this.metaNodes = response.metaNodes ?? [];
    this.onStateUpdated(response.state);
    return response.state;
  }

  async purchaseUpgrade(upgradeId: string): Promise<void> {
    const response = await this.client.send({
      type: 'PURCHASE_META_UPGRADE',
      upgradeId,
    });

    if (!response.ok) {
      this.toasts.show(response.error ?? 'Falha ao comprar melhoria de legado', 'idle');
      return;
    }

    this.metaNodes = response.metaNodes ?? [];
    this.onStateUpdated(response.state);
    this.refreshModal();
    this.toasts.show('Melhoria de legado ativada!', 'victory');
  }
}
