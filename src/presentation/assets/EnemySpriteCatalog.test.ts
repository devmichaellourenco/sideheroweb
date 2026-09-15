import { describe, expect, it } from 'vitest';
import { ENEMY_ROSTER } from '../../domain/enemies/EnemyRosterCatalog';
import {
  ENEMY_SPRITE_ROSTER_COUNT,
  listEnemyDedicatedSpriteTypes,
  resolveEnemyDedicatedSpritePath,
} from './EnemySpriteCatalog';

describe('EnemySpriteCatalog', () => {
  it('mapeia todos os inimigos do roster para characters/{id}.png', () => {
    expect(ENEMY_SPRITE_ROSTER_COUNT).toBe(ENEMY_ROSTER.length);
    expect(listEnemyDedicatedSpriteTypes()).toHaveLength(ENEMY_ROSTER.length);

    for (const entry of ENEMY_ROSTER) {
      expect(resolveEnemyDedicatedSpritePath(entry.id)).toBe(`characters/${entry.id}.png`);
    }
  });

  it('retorna null para id desconhecido', () => {
    expect(resolveEnemyDedicatedSpritePath('unknown_enemy')).toBeNull();
  });

  it('usa id canônico em aliases antigos corrigidos', () => {
    expect(resolveEnemyDedicatedSpritePath('bandit_captain')).toBe('characters/bandit_captain.png');
    expect(resolveEnemyDedicatedSpritePath('goblin_raider')).toBe('characters/goblin_raider.png');
    expect(resolveEnemyDedicatedSpritePath('renegade_necromancer')).toBe(
      'characters/renegade_necromancer.png',
    );
    expect(resolveEnemyDedicatedSpritePath('skeleton_warrior')).toBe('characters/skeleton_warrior.png');
  });
});
