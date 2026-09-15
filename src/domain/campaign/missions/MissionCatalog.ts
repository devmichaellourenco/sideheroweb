import { resolvePhase } from '../CampaignCatalog';
import { buildPhaseId, MapId, PhaseId } from '../CampaignIds';
import { CAMPAIGN_MAPS } from '../CampaignMaps';
import {
  BASE_GAME_MAX_MAP_INDEX,
  CampaignReleaseProfile,
  CAMPAIGN_RELEASE_PROFILE,
  isMapReleased,
} from '../CampaignReleaseScope';
import { MissionDefinition } from './MissionDefinition';
import {
  MAIN_QUEST_PHASE_NUMBERS,
  mainMissionId,
  MissionId,
  normalMissionId,
  sideMissionId,
} from './MissionId';
import { MissionStars } from './MissionKind';
import { mergeMissionCatalog } from './MissionOverrides';

/** Títulos temáticos dos marcos (X-50 usa displayName da fase). */
const MAIN_QUEST_TITLES: Record<number, string> = {
  1: 'Primeiros Passos',
  10: 'Linha de Defesa',
  20: 'Prova do Segundo Ato',
  30: 'Pressão Crescente',
  40: 'Antes do Assalto',
  50: 'Guardião do Mapa',
};

const NORMAL_NAME_POOL: Record<MissionStars, readonly string[]> = {
  1: ['Patrulha leve', 'Caça miúda', 'Ronda da aldeia', 'Trilha segura'],
  2: ['Emboscada curta', 'Posto avançado', 'Caça de elite menor', 'Rota sombreada'],
  3: ['Assalto médio', 'Covil inquieto', 'Linha hostil', 'Cerco rápido'],
  4: ['Incursão pesada', 'Guarnição inimiga', 'Passe perigoso', 'Ninho de elite'],
  5: ['Assalto brutal', 'Covil do terror', 'Última linha', 'Prova de fogo'],
};

function chapterBoundsForPhase(phaseNumber: number): { start: number; end: number } {
  const mains = MAIN_QUEST_PHASE_NUMBERS as readonly number[];
  const n = Math.max(1, Math.min(50, Math.floor(phaseNumber)));
  if (n <= 1) return { start: 1, end: 1 };
  const end = mains.find((main) => main >= n) ?? 50;
  const prev = [...mains].filter((m) => m < end).pop() ?? 1;
  return { start: prev + 1, end };
}

/**
 * Estrelas sobem com o ato; dentro do capítulo, fases perto do próximo marco
 * ficam um pouco mais exigentes (grind/build) sem saltar de impossível.
 */
function starsForNormalPhase(phaseNumber: number): MissionStars {
  let base: MissionStars = 1;
  if (phaseNumber <= 12) base = 1;
  else if (phaseNumber <= 22) base = 2;
  else if (phaseNumber <= 32) base = 3;
  else if (phaseNumber <= 42) base = 4;
  else base = 5;

  const { start, end } = chapterBoundsForPhase(phaseNumber);
  const span = Math.max(1, end - start);
  const progress = (phaseNumber - start) / span;
  if (progress >= 0.75 && base < 5) {
    return (base + 1) as MissionStars;
  }
  return base;
}

function normalMissionName(mapName: string, phaseNumber: number, stars: MissionStars): string {
  const pool = NORMAL_NAME_POOL[stars];
  const label = pool[phaseNumber % pool.length]!;
  return `${label} · ${mapName}`;
}

function mainMissionName(mapName: string, phaseId: PhaseId, phaseNumber: number): string {
  if (phaseNumber === 50) {
    const phase = resolvePhase(phaseId);
    if (phase?.displayName) return phase.displayName;
  }
  const title = MAIN_QUEST_TITLES[phaseNumber] ?? `Marco ${phaseId}`;
  return `${title} · ${mapName}`;
}

function buildMainMissions(mapIndex: number, mapId: MapId, mapName: string): MissionDefinition[] {
  return MAIN_QUEST_PHASE_NUMBERS.map((phaseNumber) => {
    const phaseId = buildPhaseId(mapIndex, phaseNumber);
    return {
      id: mainMissionId(phaseId),
      kind: 'main' as const,
      mapId,
      name: mainMissionName(mapName, phaseId, phaseNumber),
      phaseTemplateId: phaseId,
      stars: phaseNumber === 50 ? 5 : phaseNumber >= 40 ? 4 : phaseNumber >= 20 ? 3 : 2,
    };
  });
}

function buildNormalMissions(mapIndex: number, mapId: MapId, mapName: string): MissionDefinition[] {
  const missions: MissionDefinition[] = [];
  // Templates 1–50 (inclui marcos): farmáveis e repetíveis no sorteio; main/side são únicas.
  for (let phaseNumber = 1; phaseNumber <= 50; phaseNumber += 1) {
    const phaseId = buildPhaseId(mapIndex, phaseNumber);
    const stars = starsForNormalPhase(phaseNumber);
    missions.push({
      id: normalMissionId(phaseId),
      kind: 'normal',
      mapId,
      name: normalMissionName(mapName, phaseNumber, stars),
      phaseTemplateId: phaseId,
      stars,
    });
  }
  return missions;
}

/**
 * Sides piloto — vinculadas ao capítulo da main (template na faixa do marco).
 * Tutorial 1-1: sem sides de farm; capítulo 1-10 (fases 2–10): sides iniciais + cadeia após 1-1.
 */
function buildPilotSideMissions(): MissionDefinition[] {
  const stendraWatch = sideMissionId('stendra_village_watch');
  const stendraPatrol = sideMissionId('stendra_wayward_patrol');
  const stendraSkirmish = sideMissionId('stendra_border_skirmish');
  const stendraAsh = sideMissionId('stendra_ash_trail');
  const stendraCache = sideMissionId('stendra_hidden_cache');
  const gruftallScout = sideMissionId('gruftall_ash_scout');
  const valdrisWhisper = sideMissionId('valdris_whisper');
  const morthavenRun = sideMissionId('morthaven_seal_run');

  return [
    {
      id: stendraWatch,
      kind: 'side',
      mapId: 'stendra',
      name: 'Vigília da Aldeia',
      phaseTemplateId: '1-2',
      stars: 1,
      unlockAfterMissionIds: [],
    },
    {
      id: stendraPatrol,
      kind: 'side',
      mapId: 'stendra',
      name: 'Patrulha Desgarrada',
      phaseTemplateId: '1-3',
      stars: 1,
      unlockAfterMissionIds: [],
    },
    {
      id: stendraSkirmish,
      kind: 'side',
      mapId: 'stendra',
      name: 'Escaramuça na Fronteira',
      phaseTemplateId: '1-4',
      stars: 2,
      unlockAfterMissionIds: [],
    },
    {
      id: stendraAsh,
      kind: 'side',
      mapId: 'stendra',
      name: 'Trilha de Cinzas',
      phaseTemplateId: '1-6',
      stars: 2,
      unlockAfterMissionIds: [mainMissionId('1-1')],
      rewards: { sceneId: 'side:stendra_ash_trail' },
    },
    {
      id: stendraCache,
      kind: 'side',
      mapId: 'stendra',
      name: 'Esconderijo Oculto',
      phaseTemplateId: '1-8',
      stars: 3,
      unlockAfterMissionIds: [stendraAsh],
      rewards: {
        itemId: 'side_stendra_cache_charm',
        sceneId: 'side:stendra_hidden_cache',
      },
    },
    {
      id: gruftallScout,
      kind: 'side',
      mapId: 'gruftall',
      name: 'Batedor nas Cinzas',
      phaseTemplateId: '2-6',
      stars: 2,
      unlockAfterMissionIds: [mainMissionId('2-1')],
      rewards: { sceneId: 'side:gruftall_ash_scout' },
    },
    {
      id: valdrisWhisper,
      kind: 'side',
      mapId: 'valdris',
      name: 'Sussurro nas Ruínas',
      phaseTemplateId: '3-3',
      stars: 2,
      unlockAfterMissionIds: [],
      rewards: { sceneId: 'side:valdris_whisper' },
    },
    {
      id: morthavenRun,
      kind: 'side',
      mapId: 'morthaven',
      name: 'Corrida ao Selo',
      phaseTemplateId: '4-6',
      stars: 3,
      unlockAfterMissionIds: [mainMissionId('4-1')],
      rewards: { sceneId: 'side:morthaven_seal_run' },
    },
  ];
}

function buildCatalogForMaps(maxMapIndex: number): MissionDefinition[] {
  const missions: MissionDefinition[] = [];
  for (const map of CAMPAIGN_MAPS) {
    if (map.mapIndex > maxMapIndex) continue;
    missions.push(...buildMainMissions(map.mapIndex, map.id, map.name));
    missions.push(...buildNormalMissions(map.mapIndex, map.id, map.name));
  }
  missions.push(...buildPilotSideMissions().filter((mission) => {
    const map = CAMPAIGN_MAPS.find((entry) => entry.id === mission.mapId);
    return Boolean(map && map.mapIndex <= maxMapIndex);
  }));
  return missions;
}

const CATALOG_BASE = buildCatalogForMaps(BASE_GAME_MAX_MAP_INDEX);
const CATALOG_FULL = buildCatalogForMaps(10);

const BY_ID_SEED_BASE = new Map(CATALOG_BASE.map((m) => [m.id, m]));
const BY_ID_SEED_FULL = new Map(CATALOG_FULL.map((m) => [m.id, m]));

export function listSeedMissionCatalog(
  profile: CampaignReleaseProfile = CAMPAIGN_RELEASE_PROFILE,
): readonly MissionDefinition[] {
  return profile === 'full' ? CATALOG_FULL : CATALOG_BASE;
}

export function getSeedMissionById(
  missionId: MissionId,
  profile: CampaignReleaseProfile = CAMPAIGN_RELEASE_PROFILE,
): MissionDefinition | undefined {
  return (profile === 'full' ? BY_ID_SEED_FULL : BY_ID_SEED_BASE).get(missionId);
}

export function isSeedMissionId(
  missionId: MissionId,
  profile: CampaignReleaseProfile = CAMPAIGN_RELEASE_PROFILE,
): boolean {
  return getSeedMissionById(missionId, profile) !== undefined;
}

export function listMissionCatalog(
  profile: CampaignReleaseProfile = CAMPAIGN_RELEASE_PROFILE,
): readonly MissionDefinition[] {
  return mergeMissionCatalog(listSeedMissionCatalog(profile));
}

export function getMissionById(
  missionId: MissionId,
  profile: CampaignReleaseProfile = CAMPAIGN_RELEASE_PROFILE,
): MissionDefinition | undefined {
  return listMissionCatalog(profile).find((mission) => mission.id === missionId);
}

export function listMainMissionsForMap(
  mapId: MapId,
  profile: CampaignReleaseProfile = CAMPAIGN_RELEASE_PROFILE,
): MissionDefinition[] {
  return listMissionCatalog(profile).filter((m) => m.kind === 'main' && m.mapId === mapId);
}

export function listNormalMissionsForMap(
  mapId: MapId,
  stars?: MissionStars,
  profile: CampaignReleaseProfile = CAMPAIGN_RELEASE_PROFILE,
): MissionDefinition[] {
  return listMissionCatalog(profile).filter(
    (m) =>
      m.kind === 'normal' &&
      m.mapId === mapId &&
      (stars === undefined || m.stars === stars),
  );
}

export function listSideMissionsForMap(
  mapId: MapId,
  profile: CampaignReleaseProfile = CAMPAIGN_RELEASE_PROFILE,
): MissionDefinition[] {
  return listMissionCatalog(profile).filter((m) => m.kind === 'side' && m.mapId === mapId);
}

export function isMissionReleased(
  mission: MissionDefinition,
  profile: CampaignReleaseProfile = CAMPAIGN_RELEASE_PROFILE,
): boolean {
  const map = CAMPAIGN_MAPS.find((entry) => entry.id === mission.mapId);
  if (!map) return false;
  return isMapReleased(map.mapIndex, profile);
}

export function phaseTemplateForMission(
  missionId: MissionId,
  profile: CampaignReleaseProfile = CAMPAIGN_RELEASE_PROFILE,
): PhaseId | null {
  return getMissionById(missionId, profile)?.phaseTemplateId ?? null;
}

/** Id do item exclusivo piloto (Stendra — Esconderijo). */
export const SIDE_STENDRA_CACHE_CHARM_ID = 'side_stendra_cache_charm';
