import { describe, expect, it } from 'vitest';
import {
  buildChapterTrack,
  computeTrackTipPosition,
  missionMatchesTrackFilters,
  type ChapterOption,
  type TrackMissionEntry,
} from './missionChapterTrack';

const CHAPTERS: ChapterOption[] = [
  { mainPhase: 1, min: 1, max: 1, label: 'Cap. 1' },
  { mainPhase: 10, min: 2, max: 10, label: 'Cap. 10' },
  { mainPhase: 20, min: 11, max: 20, label: 'Cap. 20' },
];

function entry(partial: Partial<TrackMissionEntry> & Pick<TrackMissionEntry, 'missionId' | 'kind' | 'phaseNumber'>): TrackMissionEntry {
  return {
    mapId: 'stendra',
    name: partial.missionId,
    phaseTemplateId: `1-${partial.phaseNumber}`,
    chapterMainPhase: partial.chapterMainPhase ?? (partial.phaseNumber <= 1 ? 1 : partial.phaseNumber <= 10 ? 10 : 20),
    chapterMin: 1,
    chapterMax: 10,
    stars: null,
    hasOverride: false,
    waveCount: 2,
    sharedMissionIds: [],
    ...partial,
  };
}

describe('buildChapterTrack', () => {
  it('coloca main e children side/normal sob o capítulo correto', () => {
    const missions = [
      entry({ missionId: 'main:1-1', kind: 'main', phaseNumber: 1, chapterMainPhase: 1 }),
      entry({ missionId: 'main:1-10', kind: 'main', phaseNumber: 10, chapterMainPhase: 10 }),
      entry({ missionId: 'side:a', kind: 'side', phaseNumber: 3, chapterMainPhase: 10 }),
      entry({ missionId: 'normal:1-5', kind: 'normal', phaseNumber: 5, chapterMainPhase: 10 }),
      entry({ missionId: 'normal:1-12', kind: 'normal', phaseNumber: 12, chapterMainPhase: 20 }),
    ];

    const track = buildChapterTrack(missions, 'stendra', CHAPTERS);
    expect(track.mapId).toBe('stendra');
    expect(track.columns).toHaveLength(3);

    expect(track.columns[0].main?.missionId).toBe('main:1-1');
    expect(track.columns[0].children).toHaveLength(0);

    expect(track.columns[1].main?.missionId).toBe('main:1-10');
    expect(track.columns[1].children.map((c) => c.missionId)).toEqual(['side:a', 'normal:1-5']);

    expect(track.columns[2].children.map((c) => c.missionId)).toEqual(['normal:1-12']);
  });

  it('ignora missões de outro mapa', () => {
    const missions = [
      entry({ missionId: 'main:1-1', kind: 'main', phaseNumber: 1, mapId: 'gruftall' }),
    ];
    const track = buildChapterTrack(missions, 'stendra', CHAPTERS);
    expect(track.columns[0].main).toBeNull();
  });
});

describe('missionMatchesTrackFilters', () => {
  it('filtra por kind e busca', () => {
    const mission = entry({ missionId: 'normal:1-5', kind: 'normal', phaseNumber: 5, name: 'Patrulha' });
    expect(missionMatchesTrackFilters(mission, { kind: 'side' })).toBe(false);
    expect(missionMatchesTrackFilters(mission, { kind: 'normal', q: 'patr' })).toBe(true);
  });
});

describe('computeTrackTipPosition', () => {
  it('clampa tip dentro da viewport', () => {
    const result = computeTrackTipPosition({
      anchor: { top: 20, left: 10, width: 40, height: 24 },
      tip: { top: 0, left: 0, width: 220, height: 140 },
      viewport: { top: 0, left: 0, width: 320, height: 280 },
      margin: 8,
    });
    expect(result.top).toBeGreaterThanOrEqual(8);
    expect(result.left).toBeGreaterThanOrEqual(8);
    expect(result.left + 220).toBeLessThanOrEqual(320 - 8);
  });
});
