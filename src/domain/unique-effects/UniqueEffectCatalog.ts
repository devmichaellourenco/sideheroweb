export type UniqueEffectId = 'vorpal_lupnus_heal_block' | 'soler_plegius_cleanse';

export interface UniqueEffectDefinition {
  id: UniqueEffectId;
  displayName: string;
  description: string;
  statusLabel: string;
}

const UNIQUE_EFFECTS: Record<UniqueEffectId, UniqueEffectDefinition> = {
  vorpal_lupnus_heal_block: {
    id: 'vorpal_lupnus_heal_block',
    displayName: 'Vorpal Lupnus',
    description: 'Inimigos atingidos por esta arma não podem receber cura nesta batalha.',
    statusLabel: 'Cura bloqueada',
  },
  soler_plegius_cleanse: {
    id: 'soler_plegius_cleanse',
    displayName: 'Soler Plégius',
    description:
      'Uma vez por batalha, remove todos os efeitos negativos de um aliado ao receber um debuff.',
    statusLabel: 'Purificação',
  },
};

export const HEAL_BLOCK_BATTLE_TURNS = 999;

export function getUniqueEffect(id: UniqueEffectId): UniqueEffectDefinition {
  return UNIQUE_EFFECTS[id];
}

export function getUniqueEffectDescription(id: UniqueEffectId): string {
  return UNIQUE_EFFECTS[id].description;
}
