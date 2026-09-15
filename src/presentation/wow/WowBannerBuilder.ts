import { GameStateDto } from '../../application/dto/GameStateDto';
import { ASSETS, getAssetUrl } from '../assets/AssetCatalog';
import { buildPendingActions } from '../policies/PendingActionsPolicy';
import { WowBanner, WowBannerCta } from './types/WowBanner';

export interface WowPersistentHandlers {
  onChestOpen: () => void;
  onInventoryOpen: () => void;
  onUpgradesOpen: () => void;
  onHeroPointsOpen: () => void;
  onAchievementsOpen: () => void;
  onCampaignOpen: () => void;
  onStashOpen: () => void;
  onForgeOpen: () => void;
}

const PERSISTENT_PRIORITY: Record<string, number> = {
  'season-complete': 100,
  chest: 85,
  stash: 78,
  forge: 76,
  'inventory-full': 74,
  'hero-points': 70,
  'upgrade-tree': 65,
  'inventory-upgrade': 60,
  campaign: 55,
  'chest-progress': 15,
};

export function buildPersistentWowBanners(state: GameStateDto, handlers: WowPersistentHandlers): WowBanner[] {
  const banners: WowBanner[] = [];

  if (state.seasonCompleted) {
    banners.push({
      id: 'season-complete',
      kind: 'season-complete',
      persistence: 'persistent',
      priority: PERSISTENT_PRIORITY['season-complete'],
      tone: 'victory',
      eyebrow: 'Jornada',
      title: 'Campanha concluída!',
      subtitle: 'Você venceu Morthaven. Reviva fases ou veja suas conquistas.',
      iconUrl: getAssetUrl(ASSETS.ui.victoryFrame),
      cta: { label: 'Ver conquistas', action: 'achievements' },
      onCtaClick: handlers.onAchievementsOpen,
    });
  }

  for (const action of buildPendingActions(state)) {
    const banner = mapPendingAction(action.kind, action.label, handlers);
    if (banner) banners.push(banner);
  }

  if (banners.length === 0) {
    banners.push(buildChestProgressBanner(state));
  }

  return banners.sort((left, right) => right.priority - left.priority);
}

function mapPendingAction(
  kind: ReturnType<typeof buildPendingActions>[number]['kind'],
  label: string,
  handlers: WowPersistentHandlers,
): WowBanner | null {
  const ctaMap: Record<typeof kind, WowBannerCta> = {
    chest: { label: 'Abrir baú', action: 'chest' },
    'inventory-upgrade': { label: 'Ver inventário', action: 'inventory-upgrade' },
    'upgrade-tree': { label: 'Ver runas', action: 'upgrade-tree' },
    'hero-points': { label: 'Usar Aprimoramento', action: 'hero-points' },
    campaign: { label: 'Abrir campanha', action: 'campaign' },
    stash: { label: 'Abrir baú de itens', action: 'stash' },
    forge: { label: 'Abrir Forja', action: 'forge' },
    'inventory-full': { label: 'Ver inventário', action: 'inventory-full' },
  };

  const toneMap: Record<typeof kind, WowBanner['tone']> = {
    chest: 'chest',
    'inventory-upgrade': 'loot',
    'upgrade-tree': 'unlock',
    'hero-points': 'level',
    campaign: 'victory',
    stash: 'chest',
    forge: 'forge',
    'inventory-full': 'loot',
  };

  const iconMap: Record<typeof kind, string> = {
    chest: getAssetUrl(ASSETS.ui.chest),
    'inventory-upgrade': getAssetUrl(ASSETS.ui.inventory),
    'upgrade-tree': getAssetUrl(ASSETS.ui.rune),
    'hero-points': getAssetUrl(ASSETS.ui.improvement),
    campaign: getAssetUrl(ASSETS.ui.campaign),
    stash: getAssetUrl(ASSETS.ui.chestOpen),
    forge: getAssetUrl(ASSETS.ui.forge),
    'inventory-full': getAssetUrl(ASSETS.ui.inventory),
  };

  const onCtaClick =
    kind === 'campaign'
      ? handlers.onCampaignOpen
      : kind === 'chest'
        ? handlers.onChestOpen
        : kind === 'stash'
          ? handlers.onStashOpen
          : kind === 'forge'
            ? handlers.onForgeOpen
            : kind === 'upgrade-tree'
              ? handlers.onUpgradesOpen
              : kind === 'hero-points'
                ? handlers.onHeroPointsOpen
                : handlers.onInventoryOpen;

  return {
    id: `pending-${kind}`,
    kind,
    persistence: 'persistent',
    priority: PERSISTENT_PRIORITY[kind] ?? 50,
    tone: toneMap[kind],
    eyebrow: 'Pendência',
    title: label,
    subtitle: 'Toque para resolver agora',
    iconUrl: iconMap[kind],
    cta: ctaMap[kind],
    onCtaClick,
  };
}

function buildChestProgressBanner(state: GameStateDto): WowBanner {
  const progress = state.chestProgress;

  return {
    id: 'chest-progress',
    kind: 'chest-progress',
    persistence: 'persistent',
    priority: PERSISTENT_PRIORITY['chest-progress'],
    tone: 'neutral',
    eyebrow: 'Próxima recompensa',
    title: `${progress.current}/${progress.target} vitórias`,
    subtitle: 'Continue batalhando para ganhar um baú',
    iconUrl: getAssetUrl(ASSETS.ui.chest),
    progressRatio: progress.target > 0 ? progress.current / progress.target : 0,
    cta: { label: 'Entendi', action: 'dismiss' },
  };
}
