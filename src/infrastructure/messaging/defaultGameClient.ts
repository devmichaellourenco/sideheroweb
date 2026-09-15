import { IGameClient } from '../../application/ports/IGameClient';

let client: IGameClient | null = null;

export function getDefaultGameClient(): IGameClient {
  if (!client) {
    throw new Error('Game client not initialized');
  }
  return client;
}

export function setDefaultGameClient(next: IGameClient): void {
  client = next;
}
