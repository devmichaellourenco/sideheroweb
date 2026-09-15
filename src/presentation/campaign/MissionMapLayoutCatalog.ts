/**
 * Layout do mapa de missões em % do stage (independente da arte).
 * A imagem futura deve respeitar `aspectRatio` e estes landmarks.
 */

export interface MapPercentPoint {
  /** 0–100, eixo horizontal. */
  x: number;
  /** 0–100, eixo vertical. */
  y: number;
}

export interface MissionMapLayout {
  mapId: string;
  /** Largura / altura do stage (ex.: 1.55 ≈ 31:20). */
  aspectRatio: number;
  /** Path relativo em panel/assets — null = só grade (sem fundo). */
  backgroundAssetPath: string | null;
  mainSlot: MapPercentPoint;
  sideSlots: MapPercentPoint[];
  /** Pool de pontos para pins de missões normais. */
  normalPinSlots: MapPercentPoint[];
}

/**
 * Margens seguras para o pin completo (âncora = ponta inferior via translate(-50%, -100%)).
 * yMin mais alto evita corte no topo; x evita corte nas laterais.
 */
export const MISSION_PIN_SAFE_MARGIN = {
  xMin: 14,
  xMax: 86,
  yMin: 22,
  yMax: 88,
} as const;

export function clampMissionPinPoint(
  point: MapPercentPoint,
  kind: 'main' | 'side' | 'normal' = 'normal',
): MapPercentPoint {
  const yMin =
    kind === 'main'
      ? MISSION_PIN_SAFE_MARGIN.yMin + 4
      : kind === 'side'
        ? MISSION_PIN_SAFE_MARGIN.yMin + 2
        : MISSION_PIN_SAFE_MARGIN.yMin;
  return {
    x: Math.min(
      MISSION_PIN_SAFE_MARGIN.xMax,
      Math.max(MISSION_PIN_SAFE_MARGIN.xMin, point.x),
    ),
    y: Math.min(MISSION_PIN_SAFE_MARGIN.yMax, Math.max(yMin, point.y)),
  };
}

/** Stendra v1 — landmarks dentro da margem segura do pin. */
export const STENDRA_MISSION_MAP_LAYOUT: MissionMapLayout = {
  mapId: 'stendra',
  aspectRatio: 1.55,
  backgroundAssetPath: 'campaign/stendra/map_1.png',
  mainSlot: { x: 52, y: 48 },
  sideSlots: [
    { x: 26, y: 36 },
    { x: 74, y: 38 },
    { x: 28, y: 68 },
    { x: 70, y: 72 },
  ],
  normalPinSlots: [
    { x: 18, y: 28 },
    { x: 38, y: 26 },
    { x: 62, y: 28 },
    { x: 80, y: 30 },
    { x: 16, y: 44 },
    { x: 36, y: 42 },
    { x: 68, y: 48 },
    { x: 82, y: 46 },
    { x: 20, y: 58 },
    { x: 44, y: 58 },
    { x: 58, y: 64 },
    { x: 78, y: 60 },
    { x: 18, y: 76 },
    { x: 48, y: 78 },
    { x: 72, y: 82 },
    { x: 84, y: 76 },
  ],
};

const LAYOUTS: Record<string, MissionMapLayout> = {
  stendra: STENDRA_MISSION_MAP_LAYOUT,
};

export function resolveMissionMapLayout(mapId: string): MissionMapLayout | null {
  return LAYOUTS[mapId] ?? null;
}

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleInPlace<T>(items: T[], rng: () => number): void {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = items[i]!;
    items[i] = items[j]!;
    items[j] = tmp;
  }
}

export interface PlacedMissionMarker {
  missionId: string;
  kind: 'main' | 'side' | 'normal';
  point: MapPercentPoint;
}

/**
 * Posiciona main/side em slots fixos e normais em pins do pool (sem colisão).
 * Determinístico por conjunto de ids na oferta. Pontos sempre clampados na margem segura.
 */
export function placeMissionsOnLayout(params: {
  layout: MissionMapLayout;
  mainId: string | null;
  sideIds: readonly string[];
  normalIds: readonly string[];
}): PlacedMissionMarker[] {
  const placed: PlacedMissionMarker[] = [];

  if (params.mainId) {
    placed.push({
      missionId: params.mainId,
      kind: 'main',
      point: clampMissionPinPoint(params.layout.mainSlot, 'main'),
    });
  }

  params.sideIds.forEach((id, index) => {
    const slot = params.layout.sideSlots[index];
    if (!slot) return;
    placed.push({
      missionId: id,
      kind: 'side',
      point: clampMissionPinPoint(slot, 'side'),
    });
  });

  const pinPool = [...params.layout.normalPinSlots];
  const seed = hashString(
    `${params.layout.mapId}|${[...params.normalIds].sort().join(',')}`,
  );
  shuffleInPlace(pinPool, mulberry32(seed));

  params.normalIds.forEach((id, index) => {
    const point = pinPool[index];
    if (!point) return;
    placed.push({
      missionId: id,
      kind: 'normal',
      point: clampMissionPinPoint(point, 'normal'),
    });
  });

  return placed;
}
