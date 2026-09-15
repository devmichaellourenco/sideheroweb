import { ISaveBackupStore } from '../ports/ISaveBackupStore';
import {
  buildSaveBackupFileName,
  buildSaveBackupPayload,
  encryptSaveBackup,
} from '../save-backup/SaveBackupCodec';

export class ExportSaveBackupUseCase {
  constructor(private readonly backupStore: ISaveBackupStore) {}

  async execute(): Promise<{ backupFile: string; fileName: string }> {
    const snapshot = await this.backupStore.readSnapshot();
    if (snapshot.gameState == null) {
      throw new Error('Nenhum save encontrado para exportar');
    }

    const payload = buildSaveBackupPayload({
      gameState: snapshot.gameState,
      achievements: snapshot.achievements ?? {},
      meta: snapshot.meta ?? {},
    });

    const backupFile = await encryptSaveBackup(payload);
    return {
      backupFile,
      fileName: buildSaveBackupFileName(payload.exportedAt),
    };
  }
}
