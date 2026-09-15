import { MapId, PhaseId } from '../CampaignIds';
import { MissionId } from './MissionId';
import { MissionKind, MissionStars } from './MissionKind';

/**
 * Recompensas declarativas de conclusão. Ouro/XP saem exclusivamente do orçamento
 * da fase (`targetXp`/`targetGold`), então aqui só entram item exclusivo e cena.
 */
export interface MissionRewardSpec {
  /** Id de gear template ou item único. */
  itemId?: string;
  /** Id de cena narrativa (`story-scenes` / catálogo). */
  sceneId?: string;
}

export interface MissionDefinition {
  id: MissionId;
  kind: MissionKind;
  mapId: MapId;
  /** Nome exibido (pt-BR). */
  name: string;
  /** Fase handcrafted que fornece waves/inimigos. */
  phaseTemplateId: PhaseId;
  /** Estrelas — obrigatório para normal; opcional em main/side. */
  stars?: MissionStars;
  rewards?: MissionRewardSpec;
  /**
   * Missões que precisam estar concluídas para esta aparecer no board
   * (todas — AND). Vazio = disponível quando o kind permitir (ex. próxima main).
   */
  unlockAfterMissionIds?: MissionId[];
}
