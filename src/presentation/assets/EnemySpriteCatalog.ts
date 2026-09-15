import { ENEMY_ROSTER } from '../../domain/enemies/EnemyRosterCatalog';

/**
 * Sprites dedicados por id do roster.
 * Valor = basename do PNG em public/sprites/enemies/{id}.png
 */
const ENEMY_SPRITE_FILES: Record<string, string> = Object.fromEntries(
  ENEMY_ROSTER.map((entry) => [entry.id, entry.id]),
);

export function resolveEnemyDedicatedSpritePath(enemyType: string): string | null {
  const file = ENEMY_SPRITE_FILES[enemyType];
  if (!file) return null;
  return `characters/${file}.png`;
}

export function listEnemyDedicatedSpriteTypes(): string[] {
  return Object.keys(ENEMY_SPRITE_FILES);
}

export const ENEMY_SPRITE_ROSTER_COUNT = ENEMY_ROSTER.length;
