import { describe, expect, it } from 'vitest';
import {
  SAVE_BACKUP_FILE_PREFIX,
  buildSaveBackupFileName,
  buildSaveBackupPayload,
  decryptSaveBackup,
  encryptSaveBackup,
  isSaveBackupPayload,
} from './SaveBackupCodec';

describe('SaveBackupCodec', () => {
  it('criptografa e descriptografa o payload', async () => {
    const payload = buildSaveBackupPayload({
      gameState: { gold: 42, stage: 3 },
      achievements: { unlocked: ['a'] },
      meta: { sigils: 1 },
      exportedAt: 1_700_000_000_000,
    });

    const file = await encryptSaveBackup(payload);
    expect(file.startsWith(SAVE_BACKUP_FILE_PREFIX)).toBe(true);
    expect(file.includes('"gold"')).toBe(false);

    const restored = await decryptSaveBackup(file);
    expect(restored).toEqual(payload);
  });

  it('rejeita arquivo adulterado', async () => {
    const payload = buildSaveBackupPayload({
      gameState: { gold: 1 },
      achievements: {},
      meta: {},
    });
    const file = await encryptSaveBackup(payload);
    const tampered = `${file.slice(0, -4)}XXXX`;

    await expect(decryptSaveBackup(tampered)).rejects.toThrow(/adulterado|inválido|corrompido/i);
  });

  it('valida payload e nome do arquivo', () => {
    expect(isSaveBackupPayload({ formatVersion: 1, exportedAt: 1 })).toBe(false);
    expect(
      isSaveBackupPayload({
        formatVersion: 1,
        exportedAt: 1,
        gameState: {},
        achievements: {},
        meta: {},
      }),
    ).toBe(true);
    expect(buildSaveBackupFileName(1_700_000_000_000)).toContain('.sidehero');
  });
});
