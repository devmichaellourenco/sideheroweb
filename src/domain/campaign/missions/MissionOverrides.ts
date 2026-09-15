/**
 * Overrides de missões (Balance Lab) — merge sobre o seed do MissionCatalog.
 */
import { resolvePhase } from '../CampaignCatalog';
import { mapIdFromIndex, parsePhaseId, type MapId, type PhaseId } from '../CampaignIds';
import { CAMPAIGN_MAPS } from '../CampaignMaps';
import embeddedOverrides from '../data/mission-overrides.json';
import type { MissionDefinition, MissionRewardSpec } from './MissionDefinition';
import {
  customNormalMissionId,
  isCustomNormalMissionId,
  MAIN_QUEST_PHASE_NUMBERS,
  mainMissionId,
  MissionId,
  normalMissionId,
  parseMissionIdKind,
  phaseIdFromMainMissionId,
  sideMissionId,
} from './MissionId';
import type { MissionKind, MissionStars } from './MissionKind';

export interface MissionOverridesFile {
  readonly version: number;
  readonly updatedAt: string | null;
  readonly missions: Readonly<Record<string, MissionDefinition>>;
  readonly deletedMissionIds: readonly MissionId[];
}

const SLUG_PATTERN = /^[a-z0-9_]+$/;
const MAP_IDS = new Set(CAMPAIGN_MAPS.map((map) => map.id));

const embedded = normalizeMissionOverridesFile(embeddedOverrides);
let runtime: MissionOverridesFile | null = null;

function chapterMainPhaseLocal(phaseNumber: number): number {
  const mains = MAIN_QUEST_PHASE_NUMBERS as readonly number[];
  const n = Math.max(1, Math.min(50, Math.floor(phaseNumber)));
  if (n <= 1) return 1;
  return mains.find((main) => main >= n) ?? 50;
}

function activeOverrides(): MissionOverridesFile {
  return runtime ?? embedded;
}

export function setRuntimeMissionOverrides(file: MissionOverridesFile | null): void {
  runtime = file ? normalizeMissionOverridesFile(file) : null;
}

export function getEmbeddedMissionOverrides(): MissionOverridesFile {
  const file = embedded;
  return {
    version: file.version,
    updatedAt: file.updatedAt,
    missions: { ...file.missions },
    deletedMissionIds: [...file.deletedMissionIds],
  };
}

export function getActiveMissionOverrides(): MissionOverridesFile {
  const file = activeOverrides();
  return {
    version: file.version,
    updatedAt: file.updatedAt,
    missions: { ...file.missions },
    deletedMissionIds: [...file.deletedMissionIds],
  };
}

export function normalizeMissionSlug(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const slug = value.trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '');
  return SLUG_PATTERN.test(slug) ? slug : null;
}

export function allocateSideId(slug: string): MissionId {
  const normalized = normalizeMissionSlug(slug);
  if (!normalized) throw new Error('Slug inválido');
  return sideMissionId(normalized);
}

export function allocateCustomNormalId(slug: string): MissionId {
  const normalized = normalizeMissionSlug(slug);
  if (!normalized) throw new Error('Slug inválido');
  return customNormalMissionId(normalized);
}

function normalizeStars(value: unknown): MissionStars | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
  const n = Math.floor(value);
  if (n < 1 || n > 5) return undefined;
  return n as MissionStars;
}

function normalizeMapId(value: unknown): MapId | null {
  if (typeof value !== 'string') return null;
  return MAP_IDS.has(value as MapId) ? (value as MapId) : null;
}

function normalizePhaseTemplateId(value: unknown): PhaseId | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    parsePhaseId(value.trim());
  } catch {
    return null;
  }
  if (!resolvePhase(value.trim())) return null;
  return value.trim() as PhaseId;
}

function normalizeRewards(value: unknown): MissionRewardSpec | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const raw = value as Record<string, unknown>;
  const rewards: MissionRewardSpec = {};
  if (typeof raw.itemId === 'string' && raw.itemId.trim()) rewards.itemId = raw.itemId.trim();
  if (typeof raw.sceneId === 'string' && raw.sceneId.trim()) rewards.sceneId = raw.sceneId.trim();
  return Object.keys(rewards).length > 0 ? rewards : undefined;
}

function normalizeUnlockIds(value: unknown): MissionId[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const ids = [
    ...new Set(
      value.filter((id): id is string => typeof id === 'string' && id.trim().length > 0),
    ),
  ];
  return ids;
}

export function normalizeMissionDefinition(value: unknown): MissionDefinition | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  const id = typeof raw.id === 'string' ? raw.id.trim() : '';
  const kind = parseMissionIdKind(id);
  if (!id || !kind) return null;
  if (raw.kind !== undefined && raw.kind !== kind) return null;

  const mapId = normalizeMapId(raw.mapId);
  const phaseTemplateId = normalizePhaseTemplateId(raw.phaseTemplateId);
  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  if (!mapId || !phaseTemplateId || !name) return null;

  const phaseMapId = mapIdFromIndex(parsePhaseId(phaseTemplateId).mapIndex);
  if (phaseMapId !== mapId) return null;

  if (kind === 'main') {
    const expected = phaseIdFromMainMissionId(id);
    if (expected && expected !== phaseTemplateId) {
      // main id amarra o marco; allow override of template only if id phase matches template
      // actually plan allows editing phaseTemplateId on main - but id is main:1-10.
      // Keep id as-is; template can move within map (unusual but allowed for lab).
    }
  }
  if (kind === 'normal' && !isCustomNormalMissionId(id)) {
    const expectedPhase = id.slice('normal:'.length);
    // seed normals normally match; custom already handled
    if (expectedPhase.includes('-') && expectedPhase !== phaseTemplateId) {
      // allow re-pointing seed normal to another template in lab
    }
  }

  const stars = normalizeStars(raw.stars);
  const unlockAfterMissionIds = normalizeUnlockIds(raw.unlockAfterMissionIds);
  const rewards = normalizeRewards(raw.rewards);

  const definition: MissionDefinition = {
    id,
    kind,
    mapId,
    name,
    phaseTemplateId,
  };
  if (stars !== undefined) definition.stars = stars;
  if (unlockAfterMissionIds) definition.unlockAfterMissionIds = unlockAfterMissionIds;
  if (rewards) definition.rewards = rewards;
  return definition;
}

export function normalizeMissionOverridesFile(value: unknown): MissionOverridesFile {
  const raw =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const rawMissions =
    raw.missions && typeof raw.missions === 'object' && !Array.isArray(raw.missions)
      ? (raw.missions as Record<string, unknown>)
      : {};
  const missions: Record<string, MissionDefinition> = {};
  for (const [rawId, rawMission] of Object.entries(rawMissions)) {
    const withId =
      rawMission && typeof rawMission === 'object' && !Array.isArray(rawMission)
        ? { ...(rawMission as Record<string, unknown>), id: rawId }
        : null;
    const normalized = normalizeMissionDefinition(withId);
    if (!normalized) continue;
    missions[normalized.id] = normalized;
  }
  const deletedMissionIds = Array.isArray(raw.deletedMissionIds)
    ? [
        ...new Set(
          raw.deletedMissionIds.filter(
            (id): id is string => typeof id === 'string' && !!parseMissionIdKind(id),
          ),
        ),
      ]
    : [];
  return {
    version:
      typeof raw.version === 'number' && Number.isFinite(raw.version)
        ? Math.max(1, Math.floor(raw.version))
        : 1,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : null,
    missions,
    deletedMissionIds,
  };
}

/** Aplica deletes + upserts sobre o seed. */
export function mergeMissionCatalog(
  seed: readonly MissionDefinition[],
  file: MissionOverridesFile = activeOverrides(),
): MissionDefinition[] {
  const deleted = new Set(file.deletedMissionIds);
  const byId = new Map<string, MissionDefinition>();
  for (const mission of seed) {
    if (deleted.has(mission.id)) continue;
    byId.set(mission.id, mission);
  }
  for (const [id, definition] of Object.entries(file.missions)) {
    if (deleted.has(id)) continue;
    byId.set(id, definition);
  }
  return [...byId.values()];
}

export function isMissionFromOverride(
  missionId: MissionId,
  file: MissionOverridesFile = activeOverrides(),
): boolean {
  return Object.prototype.hasOwnProperty.call(file.missions, missionId);
}

export function isMissionDeleted(
  missionId: MissionId,
  file: MissionOverridesFile = activeOverrides(),
): boolean {
  return file.deletedMissionIds.includes(missionId);
}

export function missionChapterMainPhase(mission: MissionDefinition): number {
  return chapterMainPhaseLocal(parsePhaseId(mission.phaseTemplateId).phaseNumber);
}

/**
 * Filhos de uma main = outras missões do mesmo mapa no mesmo capítulo
 * (chapterMainPhase derivado do phaseTemplateId).
 */
export function missionHasChapterChildren(
  mainMission: MissionDefinition,
  catalog: readonly MissionDefinition[],
): boolean {
  if (mainMission.kind !== 'main') return false;
  const mainPhase = parsePhaseId(mainMission.phaseTemplateId).phaseNumber;
  return catalog.some(
    (mission) =>
      mission.id !== mainMission.id &&
      mission.mapId === mainMission.mapId &&
      missionChapterMainPhase(mission) === mainPhase,
  );
}

export function buildMissionIdForKind(kind: MissionKind, opts: {
  phaseTemplateId?: string;
  slug?: string;
}): MissionId {
  if (kind === 'main') {
    if (!opts.phaseTemplateId) throw new Error('Main exige phaseTemplateId');
    return mainMissionId(opts.phaseTemplateId as PhaseId);
  }
  if (kind === 'side') {
    if (!opts.slug) throw new Error('Side exige slug');
    return allocateSideId(opts.slug);
  }
  if (opts.slug) return allocateCustomNormalId(opts.slug);
  if (!opts.phaseTemplateId) throw new Error('Normal exige slug ou phaseTemplateId');
  return normalMissionId(opts.phaseTemplateId as PhaseId);
}

export function emptyMissionOverridesFile(): MissionOverridesFile {
  return {
    version: 1,
    updatedAt: null,
    missions: {},
    deletedMissionIds: [],
  };
}
