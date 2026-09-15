import type { MissionKind } from '../../domain/campaign/missions/MissionKind';
import type { EnemyDto } from './GameStateDto';

export interface MissionRewardDto {
  itemId?: string;
  sceneId?: string;
}

export interface MissionPreviewDto {
  id: string;
  kind: MissionKind;
  name: string;
  mapId: string;
  phaseTemplateId: string;
  stars: number | null;
  waveCount: number;
  difficultyTier: number;
  /** Ouro esperado da fase (orçamento via kills). */
  expectedGold: number;
  /** XP pago na vitória (lump sum). */
  victoryXp: number;
  /** @deprecated Preferir featuredEnemies para tooltips com stats. */
  featuredEnemyTypes: string[];
  /** Inimigos em destaque com ficha de combate para preview/tooltip. */
  featuredEnemies: EnemyDto[];
  challengeLabel?: string;
  challengeHint?: string;
  rewards: MissionRewardDto | null;
  /** Nome legível do item exclusivo, se houver. */
  rewardItemName: string | null;
  /** Título legível da cena exclusiva, se houver. */
  rewardSceneTitle: string | null;
  selected: boolean;
}

export interface MissionBoardDto {
  mapId: string;
  main: MissionPreviewDto | null;
  sides: MissionPreviewDto[];
  normals: MissionPreviewDto[];
}
