export interface CampaignSceneAssets {
  /** Imagem única de fundo da battle strip (333×133 ou proporcional). */
  battleBackground?: string;
  battleLeft?: string;
  battleRight?: string;
  banner?: string;
  /** Horizonte/céu em largura total (atrás dos painéis L/R). */
  battleBackdrop?: string;
  /** Faixa central entre os painéis laterais. */
  battleCenter?: string;
  /** Textura de chão em tile horizontal (`repeat-x`). */
  floorTile?: string;
}

const CAMPAIGN_SCENES: Record<string, CampaignSceneAssets> = {
  stendra: {
    battleBackground: 'campaign/stendra/cenario_stendra.jpeg',
    banner: 'campaign/stendra/campaign_stendra_banner.png',
    // Painéis L/R + chão tiled (legado — reativar se voltar ao layout em camadas):
    // battleLeft: 'campaign/stendra/battle_stendra_left.png',
    // battleRight: 'campaign/stendra/battle_stendra_right.png',
    // floorTile: 'campaign/stendra/floor_stendra_tile.png',
  },
  gruftall: {
    battleBackground: 'campaign/grutfall/cenario_grutfall.png',
    /** Arte em `public/sprites/campaign/grutfall/` (basename do diretório de assets). */
    banner: 'campaign/grutfall/campaign_grutfall_banner.png',
  },
  valdris: {
    battleBackground: 'campaign/valdris/cenario_valdris.png',
    banner: 'campaign/valdris/campaign_valdris_banner.png',
  },
  morthaven: {
    battleBackground: 'campaign/morthaven/cenario_morthaven.png',
    banner: 'campaign/morthaven/campaign_morthaven_banner.png',
  },
};

/** Fundo de batalha por mapa + ato (Ato N = fases (N-1)*10+1 … N*10). */
const BATTLE_BACKGROUND_ACT_OVERRIDES: Record<string, string> = {
  'stendra:2': 'campaign/stendra/cenario_stendra_2.png',
  'stendra:3': 'campaign/stendra/cenario_stendra_3.png',
  'stendra:4': 'campaign/stendra/cenario_stendra_4.png',
  'stendra:5': 'campaign/stendra/cenario_stendra_5.png',
};

function battleBackgroundOverrideKey(mapId: string, actNumber: number): string {
  return `${mapId}:${actNumber}`;
}

export function getCampaignScene(
  mapId: string,
  actNumber?: number | null,
): CampaignSceneAssets | null {
  const base = CAMPAIGN_SCENES[mapId];
  if (!base) return null;

  if (actNumber == null) return base;

  const override = BATTLE_BACKGROUND_ACT_OVERRIDES[battleBackgroundOverrideKey(mapId, actNumber)];
  if (!override) return base;

  return { ...base, battleBackground: override };
}

/** Cena de batalha na strip (fundo único ou painéis L/R). */
export function hasCampaignScene(mapId: string): boolean {
  const scene = CAMPAIGN_SCENES[mapId];
  return Boolean(scene?.battleBackground || (scene?.battleLeft && scene?.battleRight));
}

export function hasCampaignBanner(mapId: string): boolean {
  return Boolean(CAMPAIGN_SCENES[mapId]?.banner);
}

/** Deriva o ato (1–5) a partir de um phaseId `mapIndex-phaseNumber`. */
export function actNumberFromPhaseId(phaseId: string | null | undefined): number | null {
  if (!phaseId) return null;
  const phaseNumber = Number(phaseId.split('-')[1]);
  if (!Number.isFinite(phaseNumber) || phaseNumber < 1) return null;
  return Math.min(5, Math.max(1, Math.ceil(phaseNumber / 10)));
}
