/**
 * View model da trilha de capítulos (aba Missões do Balance Lab).
 */

export type TrackMissionKind = 'main' | 'side' | 'normal';

export interface TrackMissionEntry {
  missionId: string;
  kind: TrackMissionKind;
  mapId: string;
  name: string;
  phaseTemplateId: string;
  phaseNumber: number;
  chapterMainPhase: number;
  chapterMin: number;
  chapterMax: number;
  stars: number | null;
  hasOverride: boolean;
  waveCount: number;
  sharedMissionIds: string[];
}

export interface ChapterOption {
  mainPhase: number;
  min: number;
  max: number;
  label: string;
}

export interface ChapterTrackColumn {
  mainPhase: number;
  band: { min: number; max: number };
  main: TrackMissionEntry | null;
  children: TrackMissionEntry[];
}

export interface ChapterTrack {
  mapId: string;
  columns: ChapterTrackColumn[];
}

const KIND_ORDER: Record<TrackMissionKind, number> = {
  main: 0,
  side: 1,
  normal: 2,
};

function compareChildren(a: TrackMissionEntry, b: TrackMissionEntry): number {
  if (a.phaseNumber !== b.phaseNumber) return a.phaseNumber - b.phaseNumber;
  return KIND_ORDER[a.kind] - KIND_ORDER[b.kind];
}

/** Agrupa missões do mapa em colunas por marco de capítulo. */
export function buildChapterTrack(
  missions: readonly TrackMissionEntry[],
  mapId: string,
  chapters: readonly ChapterOption[],
): ChapterTrack {
  const onMap = missions.filter((mission) => mission.mapId === mapId);

  const columns = chapters.map((chapter) => {
    const main =
      onMap.find(
        (mission) => mission.kind === 'main' && mission.phaseNumber === chapter.mainPhase,
      ) ?? null;

    const children = onMap
      .filter(
        (mission) =>
          mission.kind !== 'main' && mission.chapterMainPhase === chapter.mainPhase,
      )
      .slice()
      .sort(compareChildren);

    return {
      mainPhase: chapter.mainPhase,
      band: { min: chapter.min, max: chapter.max },
      main,
      children,
    };
  });

  return { mapId, columns };
}

export type TrackTipBox = {
  top: number;
  left: number;
  width: number;
  height: number;
};

/** Preferência acima; flip abaixo; clamp nas bordas da viewport. */
export function computeTrackTipPosition(input: {
  anchor: TrackTipBox;
  tip: TrackTipBox;
  viewport: TrackTipBox;
  margin: number;
}): { left: number; top: number; placement: 'above' | 'below' } {
  const { anchor, tip, viewport, margin } = input;
  const maxLeft = viewport.left + viewport.width - tip.width - margin;
  const left = Math.max(
    viewport.left + margin,
    Math.min(anchor.left + anchor.width / 2 - tip.width / 2, maxLeft),
  );

  const aboveTop = anchor.top - tip.height - margin;
  const belowTop = anchor.top + anchor.height + margin;
  const aboveFits = aboveTop >= viewport.top + margin;
  const belowFits = belowTop + tip.height <= viewport.top + viewport.height - margin;

  let placement: 'above' | 'below' = 'above';
  let top = aboveTop;

  if (!aboveFits && belowFits) {
    placement = 'below';
    top = belowTop;
  } else if (!aboveFits && !belowFits) {
    const spaceAbove = anchor.top - (viewport.top + margin);
    const spaceBelow = viewport.top + viewport.height - margin - (anchor.top + anchor.height);
    if (spaceBelow > spaceAbove) {
      placement = 'below';
      top = belowTop;
    }
  }

  const maxTop = viewport.top + viewport.height - tip.height - margin;
  top = Math.max(viewport.top + margin, Math.min(top, Math.max(viewport.top + margin, maxTop)));

  return { left, top, placement };
}

export function missionMatchesTrackFilters(
  mission: TrackMissionEntry,
  filters: { kind?: string; q?: string },
): boolean {
  if (filters.kind && mission.kind !== filters.kind) return false;
  const query = filters.q?.trim().toLowerCase() ?? '';
  if (!query) return true;
  return (
    mission.missionId.toLowerCase().includes(query) ||
    mission.name.toLowerCase().includes(query) ||
    mission.phaseTemplateId.toLowerCase().includes(query)
  );
}
