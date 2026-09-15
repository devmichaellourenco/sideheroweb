import { GameStateDto, GearDto, HeroDto } from '../../application/dto/GameStateDto';
import { AchievementUpdateDto } from '../../application/dto/AchievementDto';
import {
  isCelebrationNamedGear,
  isChapterMilestonePhaseId,
  resolveMilestoneVictoryPresentation,
} from '../../application/mappers/MilestoneRewardPresentation';
import { getUpgradeById } from '../../domain/upgrades/UpgradeCatalog';
import { ASSETS, getAssetUrl } from '../assets/AssetCatalog';
import { PanelSnapshot } from '../components/PanelStateSnapshot';
import {
  detectNewlyUnlockedFeatures,
  getFeatureUnlockMeta,
  isUpgradePurchaseCoveredByStateChange,
} from './FeatureUnlockCatalog';
import { buildIdleProgress } from '../components/IdleProgressSummary';
import {
  LOOT_CELEBRATION_RARITIES,
  LOOT_RARITY_DISPLAY_MS,
  LOOT_RARITY_PRIORITY_BOOST,
  lootRarityLabel,
  REWARD_AUTO_DISMISS_MS,
  REWARD_KIND_PRIORITY,
  REWARD_KIND_TIER,
} from './RewardMomentCatalog';
import { rewardHeroPortraitFromClass, rewardHeroPortraitFromDto } from './RewardHeroPortrait';
import { RewardMoment } from './types/RewardMoment';

let momentCounter = 0;

function nextMomentId(prefix: string): string {
  momentCounter += 1;
  return `${prefix}-${momentCounter}-${Date.now()}`;
}

/** Atos têm 10 fases (1–10, 11–20, …). */
function actNumberFromPhaseId(phaseId: string): number | null {
  const match = /^(\d+)-(\d+)$/.exec(phaseId);
  if (!match) return null;
  const phaseNumber = Number(match[2]);
  if (phaseNumber < 1) return null;
  return Math.ceil(phaseNumber / 10);
}

function isActCheckpointPhaseId(phaseId: string): boolean {
  const match = /^(\d+)-(\d+)$/.exec(phaseId);
  if (!match) return false;
  const phaseNumber = Number(match[2]);
  return phaseNumber > 0 && phaseNumber % 10 === 0 && phaseNumber < 50;
}

function buildMoment(
  kind: RewardMoment['kind'],
  partial: Omit<RewardMoment, 'id' | 'kind' | 'tier' | 'priority'> & { priority?: number },
): RewardMoment {
  return {
    id: nextMomentId(kind),
    kind,
    tier: REWARD_KIND_TIER[kind],
    priority: partial.priority ?? REWARD_KIND_PRIORITY[kind],
    autoDismissMs: partial.autoDismissMs ?? REWARD_AUTO_DISMISS_MS[kind],
    ...partial,
  };
}

export interface StateChangeHandlers {
  onChestAvailable?: () => void;
}

export interface StateChangeDetectOptions {
  skipVictoryRewards?: boolean;
}

export class RewardMomentDetector {
  detect(
    previous: GameStateDto | null,
    next: GameStateDto,
    handlers: StateChangeHandlers = {},
    options: StateChangeDetectOptions = {},
  ): RewardMoment[] {
    if (!previous) return [];

    const moments: RewardMoment[] = [];
    const skipVictoryRewards = options.skipVictoryRewards === true;

    if (!skipVictoryRewards && next.pendingChestCount > previous.pendingChestCount) {
      const count = next.pendingChestCount - previous.pendingChestCount;
      const newestChest = next.chests.filter((chest) => !chest.opened).at(-1);
      const title =
        count === 1 && newestChest ? newestChest.chestLabel : count === 1 ? 'Baú disponível!' : `${count} baús!`;

      moments.push(
        buildMoment('chest_available', {
          title,
          subtitle: 'Uma recompensa espera por você',
          tone: 'chest',
          iconUrl: getAssetUrl(ASSETS.ui.chest),
          cta: handlers.onChestAvailable
            ? { label: 'Abrir agora', onClick: handlers.onChestAvailable }
            : undefined,
        }),
      );
    }

    if (!skipVictoryRewards && next.stage > previous.stage) {
      moments.push(
        buildMoment('tier_up', {
          title: `Tier ${next.stage}`,
          subtitle: 'Boss derrotado — inimigos evoluíram',
          tone: 'victory',
          iconUrl: getAssetUrl(ASSETS.ui.stage),
        }),
      );
    }

    const clearedNow = next.campaignProgress.clearedPhaseIds.filter(
      (phaseId) => !previous.campaignProgress.clearedPhaseIds.includes(phaseId),
    );

    if (!skipVictoryRewards && !previous.seasonCompleted && next.seasonCompleted) {
      moments.push(
        buildMoment('season_complete', {
          title: 'Jornada concluída!',
          subtitle: 'Você venceu o Duque de Morthaven — fim da campanha',
          tone: 'victory',
          iconUrl: getAssetUrl(ASSETS.ui.victoryFrame),
          detailLines: [
            'Stendra · Gruftall · Valdris · Morthaven',
            'Abra o mapa no acampamento e escolha missões normais para farmar ouro e XP.',
          ],
        }),
      );
    } else if (!skipVictoryRewards && clearedNow.length > 0) {
      const phase = clearedNow[clearedNow.length - 1];
      if (isChapterMilestonePhaseId(phase)) {
        moments.push(this.buildMilestoneBossMoment(phase));
      } else {
        moments.push(this.buildPhaseClearedMoment(phase));
      }
    }

    if (!skipVictoryRewards) {
      for (const gear of this.detectNewNamedLegendaryGear(previous, next)) {
        moments.push(this.buildNamedLegendaryMoment(gear));
      }
    }

    if (!skipVictoryRewards) {
      const leveledHeroes = next.heroes.filter((hero) => {
        const oldHero = previous.heroes.find((entry) => entry.id === hero.id);
        return Boolean(oldHero && hero.level > oldHero.level);
      });

      if (leveledHeroes.length === 1) {
        const hero = leveledHeroes[0];
        moments.push(
          buildMoment('level_up', {
            title: `Lv.${hero.level}`,
            subtitle: `${hero.name} ficou mais forte`,
            tone: 'level',
            heroPortrait: rewardHeroPortraitFromDto(hero),
          }),
        );
      } else if (leveledHeroes.length > 1) {
        const portraits = leveledHeroes.map(rewardHeroPortraitFromDto);
        moments.push(
          buildMoment('level_up', {
            title: `${leveledHeroes.length} heróis subiram!`,
            subtitle: 'A party evoluiu na batalha',
            tone: 'level',
            heroPortrait: portraits[0],
            heroPortraits: portraits,
            detailLines: leveledHeroes.map((hero) => `${hero.name} → Lv.${hero.level}`),
          }),
        );
      }
    }

    for (const flag of detectNewlyUnlockedFeatures(previous.featureFlags, next.featureFlags)) {
      const meta = getFeatureUnlockMeta(flag);
      if (!meta) continue;

      moments.push(
        buildMoment('feature_unlock', {
          title: meta.title,
          subtitle: meta.subtitle,
          tone: 'unlock',
          iconUrl: meta.iconUrl,
        }),
      );
    }

    const newHeroes = next.heroes.filter(
      (hero) => !previous.heroes.some((entry) => entry.id === hero.id),
    );
    for (const hero of newHeroes) {
      moments.push(
        buildMoment('feature_unlock', {
          title: `${hero.name} entrou na reserva!`,
          subtitle: 'Novo herói disponível na formação',
          tone: 'unlock',
          heroPortrait: rewardHeroPortraitFromDto(hero),
          priority: REWARD_KIND_PRIORITY.feature_unlock,
        }),
      );
    }

    return moments;
  }

  buildLootMoment(gear: GearDto): RewardMoment | null {
    if (isCelebrationNamedGear(gear)) {
      return this.buildNamedLegendaryMoment(gear);
    }

    if (!LOOT_CELEBRATION_RARITIES.has(gear.rarity)) return null;

    const rarityBoost = LOOT_RARITY_PRIORITY_BOOST[gear.rarity] ?? 0;

    return buildMoment('loot_received', {
      title: gear.name,
      subtitle: `${lootRarityLabel(gear.rarity)} recebido`,
      tone: 'loot',
      gear,
      detailLines: [lootRarityLabel(gear.rarity)],
      priority: REWARD_KIND_PRIORITY.loot_received + rarityBoost,
      autoDismissMs: LOOT_RARITY_DISPLAY_MS[gear.rarity] ?? REWARD_AUTO_DISMISS_MS.loot_received,
    });
  }

  buildShopPurchaseMoment(gear: GearDto): RewardMoment {
    return buildMoment('shop_purchase', {
      title: gear.name,
      subtitle: 'Compra concluída na loja',
      tone: 'loot',
      gear,
    });
  }

  buildForgeCreatedMoment(gear: GearDto): RewardMoment {
    return buildMoment('forge_created', {
      title: gear.name,
      subtitle: 'Forja concluída com sucesso',
      tone: 'forge',
      gear,
    });
  }

  buildAscensionMoment(
    hero: Pick<HeroDto, 'id' | 'name' | 'heroClass' | 'ascensionId'>,
  ): RewardMoment {
    return buildMoment('upgrade_purchased', {
      title: 'Ascensão!',
      subtitle: `${hero.name} alcançou uma nova classe`,
      tone: 'unlock',
      heroPortrait: rewardHeroPortraitFromDto(hero),
      priority: REWARD_KIND_PRIORITY.feature_unlock,
    });
  }

  buildAchievementMoments(updates: readonly AchievementUpdateDto[]): RewardMoment[] {
    return updates.map((update) => this.buildAchievementMoment(update));
  }

  buildAchievementMoment(update: AchievementUpdateDto): RewardMoment {
    const progressLabel = `${update.currentProgress}/${update.target}`;
    if (update.justCompleted) {
      return buildMoment('achievement_unlocked', {
        title: update.title,
        subtitle: 'Achievement desbloqueado!',
        detailLines: [update.description, progressLabel],
        tone: 'unlock',
        iconUrl: getAssetUrl(ASSETS.ui.achievement),
      });
    }

    return buildMoment('achievement_progress', {
      title: update.title,
      subtitle: `Progresso: ${progressLabel}`,
      detailLines: [update.description],
      tone: 'unlock',
      iconUrl: getAssetUrl(ASSETS.ui.achievement),
    });
  }

  buildBatchLootMoment(gears: GearDto[]): RewardMoment {
    const rareGears = gears.filter((gear) => LOOT_CELEBRATION_RARITIES.has(gear.rarity));
    const headline = gears.length === 1 ? gears[0].name : `${gears.length} itens dos baús!`;
    const featured = rareGears[0] ?? gears[0];

    return buildMoment('loot_received', {
      title: headline,
      subtitle: rareGears.length > 0 ? `${rareGears.length} item(ns) raro(s) ou melhor` : 'Loot adicionado ao inventário',
      tone: 'loot',
      gear: featured,
      detailLines: gears.slice(0, 5).map((gear) => gear.name),
      autoDismissMs: 3800,
    });
  }

  buildNamedLegendaryMoment(gear: GearDto): RewardMoment {
    const detailLines = [
      'Lendário nomeado — conquista rara da campanha',
      gear.uniqueEffectDescription ? `✦ ${gear.uniqueEffectDescription}` : null,
    ].filter((line): line is string => Boolean(line));

    return buildMoment('named_legendary_received', {
      title: gear.name,
      subtitle: 'Um troféu lendário entrou no seu inventário',
      tone: 'loot',
      gear,
      detailLines,
      priority: REWARD_KIND_PRIORITY.named_legendary_received,
      autoDismissMs: REWARD_AUTO_DISMISS_MS.named_legendary_received,
    });
  }

  buildMilestoneBossMoment(phaseId: string): RewardMoment {
    const presentation = resolveMilestoneVictoryPresentation(phaseId, `Fase ${phaseId}`);
    const title = presentation.isMajorMilestone
      ? 'Capítulo conquistado!'
      : 'Chefe do marco derrotado!';

    return buildMoment('milestone_boss_defeated', {
      title,
      subtitle: presentation.chapterTitle,
      tone: 'victory',
      iconUrl: getAssetUrl(ASSETS.ui.victoryFrame),
      detailLines: [
        presentation.bossSubtitle,
        `Fase ${phaseId} — um marco exigente da campanha`,
      ],
      priority: REWARD_KIND_PRIORITY.milestone_boss_defeated,
      autoDismissMs: REWARD_AUTO_DISMISS_MS.milestone_boss_defeated,
    });
  }

  buildPhaseClearedMoment(phaseId: string): RewardMoment {
    const actNumber = actNumberFromPhaseId(phaseId);
    const isActCheckpoint = isActCheckpointPhaseId(phaseId);
    const subtitle =
      actNumber !== null
        ? isActCheckpoint
          ? `Ato ${actNumber} concluído — abra a Campanha`
          : `Ato ${actNumber} · continue pela trilha`
        : 'Campanha avançando';

    return buildMoment('phase_cleared', {
      title: `Fase ${phaseId} limpa!`,
      subtitle,
      tone: 'victory',
      iconUrl: getAssetUrl(ASSETS.ui.campaign),
      detailLines: isActCheckpoint
        ? ['Marco do ato — revise formação e siga para a próxima fase.']
        : undefined,
    });
  }

  private detectNewNamedLegendaryGear(previous: GameStateDto, next: GameStateDto): GearDto[] {
    const previousIds = new Set(previous.inventory.map((gear) => gear.id));
    return next.inventory.filter(
      (gear) => !previousIds.has(gear.id) && isCelebrationNamedGear(gear),
    );
  }

  buildUpgradePurchasedMoment(upgradeId: string): RewardMoment | null {
    const upgrade = getUpgradeById(upgradeId);
    if (!upgrade) return null;

    // Herói novo / 1º unlock de feature já saem de detectStateChange — um Wow só.
    if (isUpgradePurchaseCoveredByStateChange(upgrade)) return null;

    const heroPortrait = upgrade.unlockHeroClass
      ? rewardHeroPortraitFromClass(upgrade.unlockHeroClass)
      : null;

    return buildMoment('upgrade_purchased', {
      title: upgrade.name,
      subtitle: upgrade.description,
      tone: 'unlock',
      heroPortrait: heroPortrait ?? undefined,
      iconUrl: heroPortrait ? undefined : this.upgradeIconFor(upgrade.feature),
    });
  }

  buildIdleReport(snapshot: PanelSnapshot, state: GameStateDto): RewardMoment | null {
    const progress = buildIdleProgress(snapshot, state);
    if (!progress) return null;

    const portraitHeroes =
      progress.leveledHeroes.length > 0
        ? progress.leveledHeroes
        : (state.activeParty?.length ? state.activeParty : state.heroes);
    const portraits = portraitHeroes.slice(0, 3).map(rewardHeroPortraitFromDto);

    return buildMoment('idle_report', {
      title: 'Progresso Offline',
      subtitle: 'Sua party continuou avançando',
      tone: 'idle',
      heroPortrait: portraits[0],
      heroPortraits: portraits.length > 1 ? portraits : undefined,
      detailLines: progress.detailLines,
      priority: REWARD_KIND_PRIORITY.idle_report,
      autoDismissMs: REWARD_AUTO_DISMISS_MS.idle_report,
    });
  }

  private upgradeIconFor(feature: string): string {
    if (feature === 'divine_forge') return getAssetUrl(ASSETS.ui.forge);
    if (feature === 'item_stash') return getAssetUrl(ASSETS.ui.inventory);
    if (feature.includes('hero_unlock')) return getAssetUrl(ASSETS.ui.attack);
    if (feature === 'auto_battle') return getAssetUrl(ASSETS.ui.attack);
    if (feature === 'background_tick') return getAssetUrl(ASSETS.ui.energy);
    if (feature.includes('chest')) return getAssetUrl(ASSETS.ui.chest);
    return getAssetUrl(ASSETS.ui.rune);
  }
}
