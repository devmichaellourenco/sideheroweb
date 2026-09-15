import { describe, expect, it } from 'vitest';
import {
  applyMapResistBias,
  MAP_RESIST_BIAS_MAX,
  MAP_RESIST_BIAS_MIN,
  mapCombatHintLine,
  resolveMapCombatIdentity,
} from './MapCombatIdentityCatalog';
import { ZERO_RESISTANCES } from '../combat/ResistanceProfile';
import { resolveEnemyTags } from '../enemies/EnemyThemeTags';

describe('MapCombatIdentityCatalog', () => {
  it('define identidade dos 4 mapas base', () => {
    expect(resolveMapCombatIdentity('stendra').enemyTagsPreferred).toContain('goblin');
    expect(resolveMapCombatIdentity('gruftall').primaryElements).toContain('cold');
    expect(resolveMapCombatIdentity('valdris').enemyTagsPreferred).toContain('undead');
    expect(resolveMapCombatIdentity('morthaven').primaryElements).toEqual(
      expect.arrayContaining(['lightning', 'fire']),
    );
  });

  it('mantém bias soft dentro de −15/+20', () => {
    for (const mapId of ['stendra', 'gruftall', 'valdris', 'morthaven'] as const) {
      const bias = resolveMapCombatIdentity(mapId).mapResistBias;
      for (const value of Object.values(bias)) {
        expect(value).toBeGreaterThanOrEqual(MAP_RESIST_BIAS_MIN);
        expect(value).toBeLessThanOrEqual(MAP_RESIST_BIAS_MAX);
      }
    }
  });

  it('DLC / mapas sem tema usam fallback neutro', () => {
    const voidThrone = resolveMapCombatIdentity('void_throne');
    expect(voidThrone.enemyTagsPreferred).toEqual([]);
    expect(voidThrone.mapResistBias).toEqual({});
    expect(mapCombatHintLine('void_throne')).toBe('');
  });

  it('aplica bias de mapa sobre resists base', () => {
    const applied = applyMapResistBias(ZERO_RESISTANCES, 'gruftall');
    expect(applied.fire).toBe(20);
    expect(applied.cold).toBe(-15);
  });

  it('expõe linha de pista para UI', () => {
    expect(mapCombatHintLine('valdris')).toContain('Mortos');
    expect(mapCombatHintLine('valdris')).toContain('Fogo');
  });
});

describe('EnemyThemeTags', () => {
  it('infere tags de goblins e undead', () => {
    expect(resolveEnemyTags('goblin_raider')).toContain('goblin');
    expect(resolveEnemyTags('skeleton_warrior')).toContain('undead');
    expect(resolveEnemyTags('minor_fire_elemental')).toContain('fire');
  });
});
