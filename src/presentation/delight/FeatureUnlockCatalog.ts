import { FeatureFlagsDto } from '../../application/dto/FeatureFlagsDto';
import { FeatureKey } from '../../domain/upgrades/FeatureKey';
import { UpgradeDefinition } from '../../domain/upgrades/UpgradeDefinition';
import { ASSETS, getAssetUrl } from '../assets/AssetCatalog';

export interface FeatureUnlockMeta {
  title: string;
  subtitle: string;
  iconUrl: string;
}

type FeatureFlagKey = keyof FeatureFlagsDto;

const FEATURE_UNLOCK_META: Partial<Record<FeatureFlagKey, FeatureUnlockMeta>> = {
  divineForge: {
    title: 'Forja Divina',
    subtitle: 'Combine itens e eleve a raridade',
    iconUrl: getAssetUrl(ASSETS.ui.forge),
  },
  improvementReset: {
    title: 'Reset de Pontos',
    subtitle: 'Devolva pontos de aprimoramento',
    iconUrl: getAssetUrl(ASSETS.ui.improvement),
  },
  itemStash: {
    title: 'Baú de Itens',
    subtitle: 'Armazene equipamentos extras',
    iconUrl: getAssetUrl(ASSETS.ui.inventory),
  },
  openAllChests: {
    title: 'Abrir Todos',
    subtitle: 'Abra todos os baús de uma vez',
    iconUrl: getAssetUrl(ASSETS.ui.chestOpen),
  },
  // AUTO-ABRIR BAÚS DESATIVADO (2026-08)
  // autoOpenChests: {
  //   title: 'Auto-abrir Baús',
  //   subtitle: 'Baús abertos automaticamente',
  //   iconUrl: getAssetUrl(ASSETS.ui.chest),
  // },
  optimizeLoadout: {
    title: 'Otimizar Loadout',
    subtitle: 'Equipe o melhor gear automaticamente',
    iconUrl: getAssetUrl(ASSETS.ui.attack),
  },
  autoEquipLoot: {
    title: 'Auto-equipar Loot',
    subtitle: 'Novos itens equipados na hora',
    iconUrl: getAssetUrl(ASSETS.ui.inventory),
  },
  shopRefresh: {
    title: 'Renovar Loja',
    subtitle: 'Novas ofertas disponíveis',
    iconUrl: getAssetUrl(ASSETS.ui.shop),
  },
  // OFFLINE PROGRESS DESATIVADO (2026-07)
  // backgroundTick: {
  //   title: 'Progresso Offline',
  //   subtitle: 'O jogo avança com o painel fechado',
  //   iconUrl: getAssetUrl(ASSETS.ui.energy),
  // },
};

/** FeatureKey da runa → flag detectada em `detectNewlyUnlockedFeatures`. */
const UPGRADE_FEATURE_TO_FLAG: Partial<Record<FeatureKey, FeatureFlagKey>> = {
  divine_forge: 'divineForge',
  improvement_reset: 'improvementReset',
  item_stash: 'itemStash',
  open_all_chests: 'openAllChests',
  // AUTO-ABRIR BAÚS DESATIVADO (2026-08)
  // auto_open_chests: 'autoOpenChests',
  optimize_loadout: 'optimizeLoadout',
  auto_equip_loot: 'autoEquipLoot',
  shop_refresh: 'shopRefresh',
};

export function getFeatureUnlockMeta(flag: FeatureFlagKey): FeatureUnlockMeta | null {
  return FEATURE_UNLOCK_META[flag] ?? null;
}

export function detectNewlyUnlockedFeatures(
  previous: FeatureFlagsDto,
  next: FeatureFlagsDto,
): FeatureFlagKey[] {
  const unlocked: FeatureFlagKey[] = [];

  for (const key of Object.keys(FEATURE_UNLOCK_META) as FeatureFlagKey[]) {
    const wasEnabled = Boolean(previous[key]);
    const isEnabled = Boolean(next[key]);
    if (!wasEnabled && isEnabled) {
      unlocked.push(key);
    }
  }

  return unlocked;
}

/**
 * Compra de runa que já gera Wow via `detectStateChange` (herói novo ou
 * primeiro unlock de feature com meta dedicada) — evita 2 strips no mesmo evento.
 */
export function isUpgradePurchaseCoveredByStateChange(upgrade: UpgradeDefinition): boolean {
  if (upgrade.unlockHeroClass) return true;

  if (upgrade.level !== 1) return false;
  const flag = UPGRADE_FEATURE_TO_FLAG[upgrade.feature];
  if (!flag) return false;
  return getFeatureUnlockMeta(flag) !== null;
}
