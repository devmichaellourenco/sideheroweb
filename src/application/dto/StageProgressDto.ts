export type StageProgressMarkerKindDto = 'trash' | 'elite' | 'boss' | 'chest' | 'portal';
export type StageProgressMarkerStatusDto = 'cleared' | 'current' | 'locked';

export interface StageProgressMarkerDto {
  id: string;
  kind: StageProgressMarkerKindDto;
  label: string;
  status: StageProgressMarkerStatusDto;
  waveIndex: number;
  /** Posição 0..1 no trilho (lead-in no 1º; boss = 1). */
  trackRatio: number;
}

export interface StageProgressDto {
  phaseId: string;
  displayName: string;
  /** 0..1 — posição do fill até o marcador da wave atual. */
  fillRatio: number;
  markers: StageProgressMarkerDto[];
}
