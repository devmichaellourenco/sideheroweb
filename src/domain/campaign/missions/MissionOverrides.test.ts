import { describe, expect, it, afterEach } from 'vitest';
import {
  listMissionCatalog,
  listSeedMissionCatalog,
  getMissionById,
} from './MissionCatalog';
import {
  customNormalMissionId,
  isCustomNormalMissionId,
  phaseIdFromNormalMissionId,
} from './MissionId';
import {
  mergeMissionCatalog,
  missionHasChapterChildren,
  normalizeMissionOverridesFile,
  setRuntimeMissionOverrides,
  allocateSideId,
  allocateCustomNormalId,
  emptyMissionOverridesFile,
} from './MissionOverrides';

describe('MissionId custom normal', () => {
  it('distingue normal:custom do grid normal:phase', () => {
    expect(isCustomNormalMissionId('normal:custom:extra_patrol')).toBe(true);
    expect(isCustomNormalMissionId('normal:1-5')).toBe(false);
    expect(phaseIdFromNormalMissionId('normal:custom:extra_patrol')).toBeNull();
    expect(phaseIdFromNormalMissionId('normal:1-5')).toBe('1-5');
    expect(customNormalMissionId('extra_patrol')).toBe('normal:custom:extra_patrol');
  });
});

describe('MissionOverrides merge', () => {
  afterEach(() => {
    setRuntimeMissionOverrides(null);
  });

  it('normaliza arquivo vazio', () => {
    const file = normalizeMissionOverridesFile({});
    expect(file.version).toBe(1);
    expect(file.missions).toEqual({});
    expect(file.deletedMissionIds).toEqual([]);
  });

  it('upsert e delete removem/substituem o seed', () => {
    const seed = listSeedMissionCatalog();
    const sideId = allocateSideId('lab_test_side');
    const file = normalizeMissionOverridesFile({
      missions: {
        [sideId]: {
          id: sideId,
          kind: 'side',
          mapId: 'stendra',
          name: 'Side Lab',
          phaseTemplateId: '1-3',
          stars: 2,
        },
        'normal:1-5': {
          id: 'normal:1-5',
          kind: 'normal',
          mapId: 'stendra',
          name: 'Normal renomeada',
          phaseTemplateId: '1-5',
          stars: 3,
        },
      },
      deletedMissionIds: ['normal:1-6'],
    });

    const merged = mergeMissionCatalog(seed, file);
    expect(merged.some((mission) => mission.id === sideId)).toBe(true);
    expect(merged.find((mission) => mission.id === 'normal:1-5')?.name).toBe('Normal renomeada');
    expect(merged.some((mission) => mission.id === 'normal:1-6')).toBe(false);
  });

  it('listMissionCatalog aplica runtime overrides', () => {
    const customId = allocateCustomNormalId('lab_custom_norm');
    setRuntimeMissionOverrides({
      version: 1,
      updatedAt: null,
      missions: {
        [customId]: {
          id: customId,
          kind: 'normal',
          mapId: 'stendra',
          name: 'Custom Lab',
          phaseTemplateId: '1-8',
          stars: 2,
        },
      },
      deletedMissionIds: [],
    });
    expect(getMissionById(customId)?.name).toBe('Custom Lab');
    expect(listMissionCatalog().some((mission) => mission.id === customId)).toBe(true);
  });

  it('main com sides/normais no capítulo tem filhos', () => {
    const catalog = listSeedMissionCatalog();
    const main = catalog.find((mission) => mission.id === 'main:1-10');
    expect(main).toBeTruthy();
    expect(missionHasChapterChildren(main!, catalog)).toBe(true);
  });

  it('emptyMissionOverridesFile é estável', () => {
    expect(emptyMissionOverridesFile()).toEqual({
      version: 1,
      updatedAt: null,
      missions: {},
      deletedMissionIds: [],
    });
  });
});
