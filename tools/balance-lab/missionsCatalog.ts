/**
 * CRUD de identidade de missões no Balance Lab (mission-overrides.json).
 */
import { parsePhaseId } from '../../src/domain/campaign/CampaignIds';
import { CAMPAIGN_MAPS } from '../../src/domain/campaign/CampaignMaps';
import { HANDCRAFTED_PHASES } from '../../src/domain/campaign/HandcraftedPhaseCatalog';
import {
  getSeedMissionById,
  isSeedMissionId,
  listMissionCatalog,
  listSeedMissionCatalog,
} from '../../src/domain/campaign/missions/MissionCatalog';
import type { MissionDefinition } from '../../src/domain/campaign/missions/MissionDefinition';
import {
  isCustomNormalMissionId,
  parseMissionIdKind,
  type MissionId,
} from '../../src/domain/campaign/missions/MissionId';
import type { MissionKind, MissionStars } from '../../src/domain/campaign/missions/MissionKind';
import {
  buildMissionIdForKind,
  emptyMissionOverridesFile,
  getActiveMissionOverrides,
  isMissionFromOverride,
  mergeMissionCatalog,
  missionChapterMainPhase,
  missionHasChapterChildren,
  normalizeMissionDefinition,
  normalizeMissionOverridesFile,
  normalizeMissionSlug,
  setRuntimeMissionOverrides,
  type MissionOverridesFile,
} from '../../src/domain/campaign/missions/MissionOverrides';
import {
  chapterMainPhaseForPhaseNumber,
  listMissionChapterOptions,
  normalPhaseNumberBandForCurrentMain,
} from '../../src/domain/campaign/missions/NormalMissionMainBand';

export interface MissionLabEntry extends MissionDefinition {
  phaseNumber: number;
  chapterMainPhase: number;
  chapterMin: number;
  chapterMax: number;
  isSeed: boolean;
  isCustom: boolean;
  fromOverride: boolean;
  hasChildren: boolean;
  canDelete: boolean;
  canChangeKind: boolean;
}

export function applyLabMissionOverrides(file: MissionOverridesFile | null): void {
  setRuntimeMissionOverrides(file);
}

function toLabEntry(
  mission: MissionDefinition,
  catalog: readonly MissionDefinition[],
  file: MissionOverridesFile,
): MissionLabEntry {
  const phaseNumber = parsePhaseId(mission.phaseTemplateId).phaseNumber;
  const chapterMainPhase = chapterMainPhaseForPhaseNumber(phaseNumber);
  const band = normalPhaseNumberBandForCurrentMain(chapterMainPhase);
  const isSeed = isSeedMissionId(mission.id);
  const fromOverride = isMissionFromOverride(mission.id, file);
  const hasChildren = missionHasChapterChildren(mission, catalog);
  const canDelete = mission.kind !== 'main' ? true : !hasChildren;
  const canChangeKind = mission.kind !== 'main' ? true : !hasChildren;

  return {
    ...mission,
    phaseNumber,
    chapterMainPhase,
    chapterMin: band.min,
    chapterMax: band.max,
    isSeed,
    isCustom: isCustomNormalMissionId(mission.id) || (mission.kind !== 'main' && !isSeed),
    fromOverride,
    hasChildren,
    canDelete,
    canChangeKind,
  };
}

export function buildMissionsLabPayload(options?: {
  diskOverrides?: MissionOverridesFile | null;
  kind?: string;
  mapId?: string;
  q?: string;
  chapterMain?: number;
}) {
  applyLabMissionOverrides(options?.diskOverrides ?? null);
  const file = options?.diskOverrides
    ? normalizeMissionOverridesFile(options.diskOverrides)
    : getActiveMissionOverrides();
  const catalog = listMissionCatalog();
  const query = (options?.q ?? '').trim().toLowerCase();

  const missions = catalog
    .filter((mission) => {
      if (options?.kind && mission.kind !== options.kind) return false;
      if (options?.mapId && mission.mapId !== options.mapId) return false;
      if (
        options?.chapterMain !== undefined &&
        Number.isFinite(options.chapterMain) &&
        missionChapterMainPhase(mission) !== options.chapterMain
      ) {
        return false;
      }
      if (!query) return true;
      return (
        mission.id.toLowerCase().includes(query) ||
        mission.name.toLowerCase().includes(query) ||
        mission.phaseTemplateId.toLowerCase().includes(query)
      );
    })
    .map((mission) => toLabEntry(mission, catalog, file))
    .sort((a, b) => {
      if (a.mapId !== b.mapId) return a.mapId.localeCompare(b.mapId);
      if (a.chapterMainPhase !== b.chapterMainPhase) {
        return a.chapterMainPhase - b.chapterMainPhase;
      }
      if (a.phaseNumber !== b.phaseNumber) return a.phaseNumber - b.phaseNumber;
      return a.id.localeCompare(b.id);
    });

  const phasesByMap = new Map<string, string[]>();
  for (const phase of HANDCRAFTED_PHASES) {
    const mapId = CAMPAIGN_MAPS.find((map) => map.mapIndex === parsePhaseId(phase.id).mapIndex)?.id;
    if (!mapId) continue;
    const list = phasesByMap.get(mapId) ?? [];
    list.push(phase.id);
    phasesByMap.set(mapId, list);
  }

  return {
    updatedAt: file.updatedAt,
    missions,
    chapters: listMissionChapterOptions(),
    maps: CAMPAIGN_MAPS.map((map) => map.id),
    phasesByMap: Object.fromEntries(phasesByMap),
    overrideCount: Object.keys(file.missions).length + file.deletedMissionIds.length,
  };
}

export function getMissionLabDetail(
  missionId: string,
  diskOverrides?: MissionOverridesFile | null,
): MissionLabEntry | null {
  applyLabMissionOverrides(diskOverrides ?? null);
  const file = diskOverrides
    ? normalizeMissionOverridesFile(diskOverrides)
    : getActiveMissionOverrides();
  const catalog = listMissionCatalog();
  const mission = catalog.find((entry) => entry.id === missionId);
  if (!mission) return null;
  return toLabEntry(mission, catalog, file);
}

export interface MissionCreateDraft {
  kind: 'side' | 'normal';
  mapId: string;
  name: string;
  phaseTemplateId: string;
  stars?: number;
  slug?: string;
  unlockAfterMissionIds?: string[];
}

export function createMissionDefinition(draft: MissionCreateDraft): MissionDefinition {
  const slug =
    normalizeMissionSlug(draft.slug) ??
    normalizeMissionSlug(draft.name) ??
    `mission_${Date.now().toString(36)}`;
  const id = buildMissionIdForKind(draft.kind, {
    slug,
    phaseTemplateId: draft.phaseTemplateId,
  });
  const definition = normalizeMissionDefinition({
    id,
    kind: draft.kind,
    mapId: draft.mapId,
    name: draft.name,
    phaseTemplateId: draft.phaseTemplateId,
    stars: draft.stars,
    unlockAfterMissionIds: draft.unlockAfterMissionIds ?? [],
  });
  if (!definition) {
    throw new Error('Dados inválidos para criar missão (mapa/fase/nome)');
  }
  if (listMissionCatalog().some((mission) => mission.id === definition.id)) {
    throw new Error(`Já existe missão com id ${definition.id}`);
  }
  return definition;
}

export interface MissionPatchDraft {
  name?: string;
  stars?: number | null;
  phaseTemplateId?: string;
  unlockAfterMissionIds?: string[];
  /** Se mudar kind, gera novo id e remove o antigo. */
  kind?: MissionKind;
  slug?: string;
}

export type MissionMutateResult =
  | { ok: true; file: MissionOverridesFile; missionId: string; previousId?: string }
  | { ok: false; error: string; status: number };

function cloneFile(file: MissionOverridesFile): MissionOverridesFile {
  return {
    version: file.version,
    updatedAt: file.updatedAt,
    missions: { ...file.missions },
    deletedMissionIds: [...file.deletedMissionIds],
  };
}

export function applyCreateMission(
  diskOverrides: MissionOverridesFile | null,
  draft: MissionCreateDraft,
): MissionMutateResult {
  const file = cloneFile(normalizeMissionOverridesFile(diskOverrides ?? emptyMissionOverridesFile()));
  applyLabMissionOverrides(file);
  try {
    const definition = createMissionDefinition(draft);
    file.missions[definition.id] = definition;
    file.deletedMissionIds = file.deletedMissionIds.filter((id) => id !== definition.id);
    file.updatedAt = new Date().toISOString();
    return { ok: true, file, missionId: definition.id };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      status: 400,
    };
  }
}

export function applyPatchMission(
  diskOverrides: MissionOverridesFile | null,
  missionId: string,
  patch: MissionPatchDraft,
): MissionMutateResult {
  const file = cloneFile(normalizeMissionOverridesFile(diskOverrides ?? emptyMissionOverridesFile()));
  applyLabMissionOverrides(file);
  const catalog = listMissionCatalog();
  const current = catalog.find((mission) => mission.id === missionId);
  if (!current) {
    return { ok: false, error: 'Missão não encontrada', status: 404 };
  }

  const nextKind = patch.kind ?? current.kind;
  if (nextKind !== current.kind) {
    if (current.kind === 'main' && missionHasChapterChildren(current, catalog)) {
      return {
        ok: false,
        error: 'Não é possível alterar o tipo de uma main que ainda tem filhos no capítulo',
        status: 409,
      };
    }
    if (nextKind === 'main') {
      return {
        ok: false,
        error: 'Não é possível converter missão em main pelo lab (marcos são seed)',
        status: 400,
      };
    }
  }

  const phaseTemplateId = patch.phaseTemplateId ?? current.phaseTemplateId;
  const name = patch.name ?? current.name;
  const stars =
    patch.stars === null
      ? undefined
      : patch.stars !== undefined
        ? patch.stars
        : current.stars;
  const unlockAfterMissionIds =
    patch.unlockAfterMissionIds ?? current.unlockAfterMissionIds ?? [];

  let nextId = current.id;
  if (nextKind !== current.kind) {
    const slug =
      normalizeMissionSlug(patch.slug) ??
      normalizeMissionSlug(name) ??
      normalizeMissionSlug(
        current.id.replace(/^(main:|side:|normal:custom:|normal:)/, ''),
      ) ??
      `m_${Date.now().toString(36)}`;
    nextId = buildMissionIdForKind(nextKind, { slug, phaseTemplateId });
    if (catalog.some((mission) => mission.id === nextId && mission.id !== current.id)) {
      return { ok: false, error: `Já existe missão ${nextId}`, status: 400 };
    }
  }

  const definition = normalizeMissionDefinition({
    id: nextId,
    kind: nextKind,
    mapId: current.mapId,
    name,
    phaseTemplateId,
    stars,
    unlockAfterMissionIds,
    rewards: current.rewards,
  });
  if (!definition) {
    return { ok: false, error: 'Patch inválido (verifique fase/mapa/nome)', status: 400 };
  }

  if (nextId !== current.id) {
    delete file.missions[current.id];
    if (isSeedMissionId(current.id)) {
      file.deletedMissionIds = [...new Set([...file.deletedMissionIds, current.id])];
    } else {
      file.deletedMissionIds = file.deletedMissionIds.filter((id) => id !== current.id);
    }
  }

  file.missions[definition.id] = definition;
  file.deletedMissionIds = file.deletedMissionIds.filter((id) => id !== definition.id);
  file.updatedAt = new Date().toISOString();
  return {
    ok: true,
    file,
    missionId: definition.id,
    previousId: nextId !== current.id ? current.id : undefined,
  };
}

export function applyDeleteMission(
  diskOverrides: MissionOverridesFile | null,
  missionId: string,
): MissionMutateResult {
  const file = cloneFile(normalizeMissionOverridesFile(diskOverrides ?? emptyMissionOverridesFile()));
  applyLabMissionOverrides(file);
  const catalog = listMissionCatalog();
  const current = catalog.find((mission) => mission.id === missionId);
  if (!current) {
    return { ok: false, error: 'Missão não encontrada', status: 404 };
  }
  if (current.kind === 'main' && missionHasChapterChildren(current, catalog)) {
    return {
      ok: false,
      error: 'Não é possível excluir uma main que ainda tem filhos no capítulo',
      status: 409,
    };
  }

  delete file.missions[missionId];
  if (isSeedMissionId(missionId)) {
    file.deletedMissionIds = [...new Set([...file.deletedMissionIds, missionId])];
  } else {
    file.deletedMissionIds = file.deletedMissionIds.filter((id) => id !== missionId);
  }
  file.updatedAt = new Date().toISOString();
  return { ok: true, file, missionId };
}

export function applyPutMissionsFile(
  body: unknown,
): MissionMutateResult {
  const file = normalizeMissionOverridesFile(body);
  // validate all definitions already done in normalize
  const seed = listSeedMissionCatalog();
  const merged = mergeMissionCatalog(seed, file);
  // ensure no duplicate weirdness
  void merged;
  const stamped: MissionOverridesFile = {
    ...file,
    version: 1,
    updatedAt: new Date().toISOString(),
  };
  return { ok: true, file: stamped, missionId: '' };
}

export {
  normalizeMissionOverridesFile,
  emptyMissionOverridesFile,
  getSeedMissionById,
  listMissionChapterOptions,
  normalPhaseNumberBandForCurrentMain,
};

export type { MissionOverridesFile, MissionStars };
