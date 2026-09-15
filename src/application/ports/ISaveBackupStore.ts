/** Snapshot cru do KV store (localStorage) usado no backup criptografado. */
export interface SaveBackupSnapshot {
  gameState: unknown;
  achievements: unknown;
  meta: unknown;
}

export interface ISaveBackupStore {
  readSnapshot(): Promise<SaveBackupSnapshot>;
  writeSnapshot(snapshot: SaveBackupSnapshot): Promise<void>;
}
