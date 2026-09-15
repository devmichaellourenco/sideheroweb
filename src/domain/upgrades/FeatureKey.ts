export const FEATURE_KEYS = [
  'auto_battle',
  /** OFFLINE PROGRESS DESATIVADO (2026-07) — chave mantida para saves legados; upgrades fora do catálogo. */
  'background_tick',
  /** AUTO-ABRIR BAÚS DESATIVADO (2026-08) — chave mantida para saves legados; upgrades fora do catálogo. */
  'auto_open_chests',
  'open_all_chests',
  'optimize_loadout',
  'auto_equip_loot',
  'log_filter',
  'battle_stats',
  'shop_refresh',
  'battle_skill_slots',
  'hero_unlock_knight',
  'hero_unlock_priest',
  'hero_unlock_berserker',
  'hero_unlock_archer',
  'hero_unlock_paladin',
  'item_stash',
  'divine_forge',
  'improvement_reset',
] as const;

export type FeatureKey = (typeof FEATURE_KEYS)[number];

export type UpgradeLevels = Partial<Record<FeatureKey, number>>;

export function getFeatureLevel(levels: UpgradeLevels, feature: FeatureKey): number {
  return levels[feature] ?? 0;
}
