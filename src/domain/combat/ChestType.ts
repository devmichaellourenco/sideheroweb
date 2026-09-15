export type ChestType = 'monster' | 'boss' | 'act_boss';

export const CHEST_TYPE_LABELS: Record<ChestType, string> = {
  monster: 'Baú de Monstro',
  boss: 'Baú de Boss',
  act_boss: 'Baú de Chefe de Ato',
};

export const CHEST_TYPE_EMOJI: Record<ChestType, string> = {
  monster: '📦',
  boss: '🎁',
  act_boss: '💎',
};
