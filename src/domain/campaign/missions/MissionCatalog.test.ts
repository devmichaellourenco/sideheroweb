import { describe, expect, it } from 'vitest';
import {
  getMissionById,
  listMainMissionsForMap,
  listNormalMissionsForMap,
  listSideMissionsForMap,
  SIDE_STENDRA_CACHE_CHARM_ID,
} from './MissionCatalog';
import { mainMissionId, normalMissionId } from './MissionId';
import { resolveMissionScene } from './MissionSceneCatalog';

describe('MissionCatalog (Fase 5)', () => {
  it('usa títulos temáticos nas principais e displayName no X-50', () => {
    const first = getMissionById(mainMissionId('1-1'));
    expect(first?.name).toContain('Primeiros Passos');
    expect(first?.name).toContain('Stendra');

    const finale = getMissionById(mainMissionId('1-50'));
    expect(finale?.name).toBe('Guardião Elemental');
  });

  it('normais têm estrelas 1–5, nomes e nenhuma recompensa de conclusão (XP/ouro vêm da fase)', () => {
    const normals = listNormalMissionsForMap('stendra');
    expect(normals).toHaveLength(50);
    expect(normals.every((m) => m.stars && m.stars >= 1 && m.stars <= 5)).toBe(true);
    expect(normals.every((m) => m.rewards === undefined)).toBe(true);

    const mid = getMissionById(normalMissionId('1-2'));
    expect(mid?.stars).toBe(1);
    expect(mid?.name).not.toMatch(/^Missão ·/);

    expect(getMissionById(normalMissionId('1-1'))?.kind).toBe('normal');
    expect(getMissionById(normalMissionId('1-5'))?.stars).toBe(1);
    expect(getMissionById(normalMissionId('1-9'))?.stars).toBe(2);
  });

  it('sides piloto cobrem os quatro mapas base', () => {
    expect(listSideMissionsForMap('stendra').length).toBeGreaterThanOrEqual(5);
    expect(listSideMissionsForMap('gruftall').length).toBeGreaterThanOrEqual(1);
    expect(listSideMissionsForMap('valdris').length).toBeGreaterThanOrEqual(1);
    expect(listSideMissionsForMap('morthaven').length).toBeGreaterThanOrEqual(1);

    const cache = getMissionById('side:stendra_hidden_cache');
    expect(cache?.rewards?.itemId).toBe(SIDE_STENDRA_CACHE_CHARM_ID);
    expect(resolveMissionScene(cache!.rewards!.sceneId!)?.title).toContain('esconderijo');
  });

  it('lista 6 principais por mapa base', () => {
    expect(listMainMissionsForMap('stendra')).toHaveLength(6);
  });
});
