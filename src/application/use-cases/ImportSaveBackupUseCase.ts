import { IGameStateRepository } from '../../domain/repositories/IGameStateRepository';
import { IMetaProgressRepository } from '../../domain/repositories/IMetaProgressRepository';
import { MetaService } from '../../domain/meta/MetaService';
import { ISaveBackupStore } from '../ports/ISaveBackupStore';
import { GameStatePresenter } from '../presenters/GameStatePresenter';
import { mapMetaSummary } from '../mappers/MetaMapper';
import { GameStateDto } from '../dto/GameStateDto';
import { decryptSaveBackup } from '../save-backup/SaveBackupCodec';

export class ImportSaveBackupUseCase {
  constructor(
    private readonly backupStore: ISaveBackupStore,
    private readonly gameRepository: IGameStateRepository,
    private readonly metaRepository: IMetaProgressRepository,
    private readonly metaService: MetaService,
    private readonly presenter: GameStatePresenter,
  ) {}

  async execute(backupFile: string): Promise<GameStateDto> {
    const payload = await decryptSaveBackup(backupFile);
    if (payload.gameState == null || typeof payload.gameState !== 'object') {
      throw new Error('Backup sem estado de jogo');
    }

    await this.backupStore.writeSnapshot({
      gameState: payload.gameState,
      achievements: payload.achievements ?? {},
      meta: payload.meta ?? {},
    });

    // Recarrega via repositórios para aplicar migrações e validar o save.
    const state = await this.gameRepository.load();
    await this.gameRepository.save(state);
    const meta = await this.metaRepository.load();

    return {
      ...this.presenter.present(state),
      meta: mapMetaSummary(meta, this.metaService),
    };
  }
}
