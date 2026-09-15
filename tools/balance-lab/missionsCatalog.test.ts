import { describe, expect, it, afterEach } from 'vitest';
import {
  applyCreateMission,
  applyDeleteMission,
  applyPatchMission,
  emptyMissionOverridesFile,
  applyLabMissionOverrides,
} from './missionsCatalog';

describe('missionsCatalog CRUD', () => {
  afterEach(() => {
    applyLabMissionOverrides(null);
  });

  it('cria side e normal custom', () => {
    const side = applyCreateMission(emptyMissionOverridesFile(), {
      kind: 'side',
      mapId: 'stendra',
      name: 'Side Nova',
      phaseTemplateId: '1-4',
      slug: 'unit_side_a',
      stars: 2,
    });
    expect(side.ok).toBe(true);
    if (!side.ok) return;
    expect(side.missionId).toBe('side:unit_side_a');

    const normal = applyCreateMission(emptyMissionOverridesFile(), {
      kind: 'normal',
      mapId: 'stendra',
      name: 'Normal Nova',
      phaseTemplateId: '1-7',
      slug: 'unit_norm_a',
      stars: 1,
    });
    expect(normal.ok).toBe(true);
    if (!normal.ok) return;
    expect(normal.missionId).toBe('normal:custom:unit_norm_a');
  });

  it('bloqueia delete/kind change de main com filhos', () => {
    const del = applyDeleteMission(emptyMissionOverridesFile(), 'main:1-10');
    expect(del.ok).toBe(false);
    if (del.ok) return;
    expect(del.status).toBe(409);

    const patch = applyPatchMission(emptyMissionOverridesFile(), 'main:1-10', {
      kind: 'side',
      slug: 'should_fail',
    });
    expect(patch.ok).toBe(false);
    if (patch.ok) return;
    expect(patch.status).toBe(409);
  });

  it('permite patch de nome em main com filhos', () => {
    const patch = applyPatchMission(emptyMissionOverridesFile(), 'main:1-10', {
      name: 'Marco Lab',
    });
    expect(patch.ok).toBe(true);
    if (!patch.ok) return;
    expect(patch.file.missions['main:1-10']?.name).toBe('Marco Lab');
  });
});
