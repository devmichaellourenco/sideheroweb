import { GameStateDto } from '../../application/dto/GameStateDto';
import { ASSETS, getAssetUrl } from '../assets/AssetCatalog';
import {
  countClearedPhasesForMap,
  getCampaignMapTheme,
  getMapFlavorText,
  phaseCountForMap,
} from '../components/CampaignMapPresentation';
import { countUpgradeItems } from '../components/GearComparison';
import { applyMenuTooltipAnchor } from '../components/MenuTooltipPresentation';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderCampaignTooltipContent(state: GameStateDto): string {
  const waveLine = state.phaseRun
    ? `Wave ${state.phaseRun.waveIndex + 1}/${state.phaseRun.waveCount}${state.phaseRun.isBossWave ? ' (Boss)' : ''}`
    : 'Wave —';
  const theme = getCampaignMapTheme(state.mapId);
  const cleared = countClearedPhasesForMap(state.campaignProgress.clearedPhaseIds, state.mapId);
  const total = phaseCountForMap(state.mapId);
  const fillPct = total > 0 ? Math.round((cleared / total) * 100) : 0;

  return `
    <strong class="campaign-tooltip-title">${escapeHtml(state.mapName)}</strong>
    <span class="campaign-tooltip-line campaign-tooltip-biome">${escapeHtml(theme.biomeLabel)}</span>
    <span class="campaign-tooltip-line campaign-tooltip-flavor">${escapeHtml(getMapFlavorText(state.mapId))}</span>
    ${
      state.mapCombatHint
        ? `<span class="campaign-tooltip-line campaign-tooltip-combat-hint">${escapeHtml(state.mapCombatHint)}</span>`
        : ''
    }
    ${
      state.phaseChallengeHint
        ? `<span class="campaign-tooltip-line campaign-tooltip-challenge-hint">${escapeHtml(state.phaseChallengeHint)}</span>`
        : ''
    }
    <span class="campaign-tooltip-line">Campanha: ${escapeHtml(state.campaignName)}</span>
    <span class="campaign-tooltip-line">Fase: ${escapeHtml(state.phaseLabel)}</span>
    <span class="campaign-tooltip-line">${escapeHtml(waveLine)}</span>
    <span class="campaign-tooltip-line">Tier ${state.stage}</span>
    <div
      class="campaign-tooltip-progress"
      role="progressbar"
      aria-valuenow="${cleared}"
      aria-valuemin="0"
      aria-valuemax="${total}"
      aria-label="Progresso do mapa"
    >
      <div class="campaign-tooltip-progress-track">
        <div class="campaign-tooltip-progress-fill" style="width: ${fillPct}%"></div>
      </div>
      <span class="campaign-tooltip-progress-label">${cleared}/${total} concluídas</span>
    </div>
  `;
}

function buildCampaignTooltipKey(state: GameStateDto): string {
  const waveKey = state.phaseRun
    ? `${state.phaseRun.waveIndex}/${state.phaseRun.waveCount}/${state.phaseRun.isBossWave}`
    : 'none';
  const cleared = countClearedPhasesForMap(state.campaignProgress.clearedPhaseIds, state.mapId);
  return `${state.mapId}|${state.campaignName}|${state.mapName}|${state.phaseLabel}|${state.phaseChallengeHint}|${waveKey}|${state.stage}|${cleared}`;
}

function createIcon(assetPath: string, alt: string, className: string): HTMLImageElement {
  const img = document.createElement('img');
  img.className = className;
  img.alt = alt;
  img.loading = 'eager';
  img.decoding = 'async';
  img.src = getAssetUrl(assetPath);
  return img;
}

function ensureButtonIcon(button: HTMLButtonElement, assetPath: string): HTMLImageElement {
  let icon = button.querySelector<HTMLImageElement>(':scope > .btn-icon');
  if (!icon) {
    icon = createIcon(assetPath, '', 'btn-icon');
    icon.setAttribute('aria-hidden', 'true');
    button.prepend(icon);
    return icon;
  }

  const nextSrc = getAssetUrl(assetPath);
  if (icon.src !== nextSrc) {
    icon.src = nextSrc;
  }
  icon.loading = 'eager';
  return icon;
}

function ensureBadge(button: HTMLButtonElement): HTMLElement {
  let badge = button.querySelector<HTMLElement>(':scope > .action-icon-badge');
  if (!badge) {
    badge = document.createElement('span');
    badge.className = 'action-icon-badge hidden';
    button.append(badge);
  }
  return badge;
}

function setupStatPill(
  container: HTMLElement,
  assetPath: string,
  alt: string,
): HTMLElement {
  container.replaceChildren();
  const icon = createIcon(assetPath, alt, 'stat-icon');
  const value = document.createElement('span');
  container.append(icon, document.createTextNode(' '), value);
  return value;
}

function updateBadge(badge: HTMLElement, value: number): void {
  if (value <= 0) {
    badge.classList.add('hidden');
    badge.textContent = '';
    return;
  }

  badge.classList.remove('hidden');
  badge.textContent = String(value);
}

export class GameHudController {
  private readonly campaignMapEl: HTMLElement;
  private readonly campaignPhaseEl: HTMLElement;
  private readonly campaignWaveValueEl: HTMLElement;
  private readonly campaignWaveBlockEl: HTMLElement;
  private readonly campaignTooltipEl: HTMLElement;
  private readonly goldValueEl: HTMLElement;
  private readonly chestValueEl: HTMLElement;
  private readonly chestProgressValueEl: HTMLElement;
  private readonly heroesBadgeEl: HTMLElement;
  private readonly inventoryBadgeEl: HTMLElement;
  private readonly stashBadgeEl: HTMLElement;
  private readonly optimizeBadgeEl: HTMLElement;
  private readonly upgradesBadgeEl: HTMLElement;
  private readonly chestBadgeEl: HTMLElement;
  private readonly openAllChestsBadgeEl: HTMLElement;
  private lastCampaignTooltipKey = '';

  constructor(
    private readonly campaignContextBtn: HTMLButtonElement,
    private readonly goldLabel: HTMLElement,
    private readonly chestLabel: HTMLElement,
    private readonly chestProgressLabel: HTMLElement,
    private readonly openHeroesBtn: HTMLButtonElement,
    private readonly openFormationBtn: HTMLButtonElement,
    private readonly openShopBtn: HTMLButtonElement,
    private readonly openInventoryBtn: HTMLButtonElement,
    private readonly openStashBtn: HTMLButtonElement,
    private readonly openForgeBtn: HTMLButtonElement,
    private readonly optimizeLoadoutBtn: HTMLButtonElement,
    private readonly openAllChestsBtn: HTMLButtonElement,
    private readonly openUpgradesBtn: HTMLButtonElement,
    private readonly openChestBtn: HTMLButtonElement,
    private readonly pauseBattleBtn: HTMLButtonElement,
    private readonly resumeBattleBtn: HTMLButtonElement,
    private readonly pauseLoadoutBtn: HTMLButtonElement,
    private readonly continueLoadoutBtn: HTMLButtonElement,
    private readonly openBattleStatsBtn: HTMLButtonElement,
  ) {
    const left = document.createElement('span');
    left.className = 'campaign-context-btn__left';

    const trail = document.createElement('span');
    trail.className = 'campaign-context-btn__trail';

    this.campaignMapEl = document.createElement('span');
    this.campaignMapEl.className = 'campaign-context-btn__map';
    this.campaignPhaseEl = document.createElement('span');
    this.campaignPhaseEl.className = 'campaign-context-btn__phase';
    trail.append(this.campaignMapEl, this.campaignPhaseEl);

    const mapIcon = createIcon(ASSETS.ui.campaign, '', 'campaign-context-btn__icon');
    mapIcon.setAttribute('aria-hidden', 'true');
    left.append(mapIcon, trail);

    this.campaignWaveBlockEl = document.createElement('span');
    this.campaignWaveBlockEl.className = 'campaign-context-btn__right';
    const waveLabel = document.createElement('span');
    waveLabel.className = 'campaign-context-btn__wave-label';
    waveLabel.textContent = 'Wave';
    this.campaignWaveValueEl = document.createElement('span');
    this.campaignWaveValueEl.className = 'campaign-context-btn__wave-value';
    this.campaignWaveBlockEl.append(waveLabel, this.campaignWaveValueEl);

    this.campaignTooltipEl = document.createElement('span');
    this.campaignTooltipEl.className = 'campaign-tooltip-content hidden';

    this.campaignContextBtn.replaceChildren(left, this.campaignWaveBlockEl, this.campaignTooltipEl);

    this.goldValueEl = setupStatPill(this.goldLabel, ASSETS.ui.gold, 'Ouro');
    this.chestValueEl = setupStatPill(this.chestLabel, ASSETS.ui.chest, 'Baús');
    this.chestProgressValueEl = setupStatPill(
      this.chestProgressLabel,
      ASSETS.ui.chest,
      'Próximo baú',
    );

    ensureButtonIcon(this.openHeroesBtn, ASSETS.ui.heroes);
    this.heroesBadgeEl = ensureBadge(this.openHeroesBtn);

    ensureButtonIcon(this.openFormationBtn, ASSETS.ui.defense);

    ensureButtonIcon(this.openShopBtn, ASSETS.ui.shop);

    ensureButtonIcon(this.openInventoryBtn, ASSETS.ui.inventory);
    this.inventoryBadgeEl = ensureBadge(this.openInventoryBtn);

    ensureButtonIcon(this.openStashBtn, ASSETS.ui.chestOpen);
    this.stashBadgeEl = ensureBadge(this.openStashBtn);

    ensureButtonIcon(this.openForgeBtn, ASSETS.ui.forge);

    ensureButtonIcon(this.optimizeLoadoutBtn, ASSETS.ui.attack);
    this.optimizeBadgeEl = ensureBadge(this.optimizeLoadoutBtn);

    ensureButtonIcon(this.openUpgradesBtn, ASSETS.ui.rune);
    this.upgradesBadgeEl = ensureBadge(this.openUpgradesBtn);

    ensureButtonIcon(this.openChestBtn, ASSETS.ui.chest);
    this.chestBadgeEl = ensureBadge(this.openChestBtn);

    ensureButtonIcon(this.openAllChestsBtn, ASSETS.ui.chestOpen);
    this.openAllChestsBadgeEl = ensureBadge(this.openAllChestsBtn);
  }

  render(
    state: GameStateDto,
    options: {
      openingChests: boolean;
      loadoutPauseActive?: boolean;
      battlePauseActive?: boolean;
    },
  ): void {
    const phaseId = state.phaseRun?.phaseId ?? state.campaignProgress.selectedPhaseId;
    const hasWave = Boolean(state.phaseRun);
    const waveText = state.phaseRun
      ? `${state.phaseRun.waveIndex + 1}/${state.phaseRun.waveCount}`
      : '—';
    const cleared = countClearedPhasesForMap(state.campaignProgress.clearedPhaseIds, state.mapId);
    const total = phaseCountForMap(state.mapId);

    this.campaignContextBtn.setAttribute('data-campaign-theme', state.mapId);
    this.campaignMapEl.textContent = state.mapName;
    this.campaignPhaseEl.textContent = phaseId;
    this.campaignWaveValueEl.textContent = waveText;
    this.campaignWaveBlockEl.classList.toggle('campaign-context-btn__right--empty', !hasWave);
    this.campaignContextBtn.title = `Abrir campanha · ${state.mapName} · ${cleared}/${total} concluídas`;
    this.campaignContextBtn.setAttribute(
      'aria-label',
      `Abrir campanha: ${state.mapName} ${phaseId}${hasWave ? `, wave ${waveText}` : ''}`,
    );

    const tooltipKey = buildCampaignTooltipKey(state);
    if (tooltipKey !== this.lastCampaignTooltipKey) {
      this.campaignTooltipEl.innerHTML = renderCampaignTooltipContent(state);
      this.lastCampaignTooltipKey = tooltipKey;
    }

    this.goldValueEl.textContent = String(state.gold);
    this.chestValueEl.textContent = String(state.pendingChestCount);

    const progress = state.chestProgress;
    this.chestProgressValueEl.textContent = `${progress.current}/${progress.target}`;
    this.chestProgressLabel.title = 'Vitórias até o próximo baú';

    const upgradeCount = countUpgradeItems(state);
    const flags = state.featureFlags;
    const atCamp = state.canEditParty;
    const heroPointsCount = state.heroes.filter((hero) => hero.hasUnspentPoints).length;

    this.openHeroesBtn.classList.toggle('hidden', !atCamp);
    applyMenuTooltipAnchor(this.openHeroesBtn, 'heroes', {
      detail:
        heroPointsCount > 0
          ? `${heroPointsCount} herói(s) com pontos de aprimoramento`
          : undefined,
    });
    updateBadge(this.heroesBadgeEl, atCamp ? heroPointsCount : 0);

    this.openFormationBtn.classList.toggle('hidden', !atCamp);
    applyMenuTooltipAnchor(this.openFormationBtn, 'formation', {
      detail: `Party ativa: ${state.activeParty.length}/3`,
    });

    this.openShopBtn.classList.toggle('hidden', !atCamp);
    applyMenuTooltipAnchor(this.openShopBtn, 'shop');

    this.openInventoryBtn.classList.toggle('hidden', !atCamp);
    applyMenuTooltipAnchor(this.openInventoryBtn, 'inventory', {
      detail: `Espaço: ${state.storageCapacity.inventoryUsed}/${state.storageCapacity.inventoryLimit}`,
    });
    updateBadge(
      this.inventoryBadgeEl,
      atCamp
        ? upgradeCount > 0
          ? upgradeCount
          : state.storageCapacity.inventoryUsed >= state.storageCapacity.inventoryLimit
            ? 1
            : 0
        : 0,
    );

    if (atCamp && state.storageCapacity.stashUnlocked) {
      this.openStashBtn.classList.remove('hidden');
      applyMenuTooltipAnchor(this.openStashBtn, 'stash', {
        detail: `Itens guardados: ${state.storageCapacity.stashUsed}/${state.storageCapacity.stashLimit}`,
      });
      updateBadge(this.stashBadgeEl, state.storageCapacity.stashUsed);
    } else {
      this.openStashBtn.classList.add('hidden');
      updateBadge(this.stashBadgeEl, 0);
    }

    if (flags.divineForge) {
      this.openForgeBtn.classList.remove('hidden');
      applyMenuTooltipAnchor(this.openForgeBtn, 'forge');
    } else {
      this.openForgeBtn.classList.add('hidden');
    }

    // OTIMIZAR EQUIPE DESATIVADO (2026-08): botão da tela principal sempre oculto.
    const canOptimize = false;
    // const canOptimize = atCamp && flags.optimizeLoadout;
    this.optimizeLoadoutBtn.classList.toggle('hidden', !canOptimize);
    this.optimizeLoadoutBtn.disabled = !canOptimize || upgradeCount === 0;
    applyMenuTooltipAnchor(this.optimizeLoadoutBtn, 'optimize', {
      detail: upgradeCount > 0 ? `${upgradeCount} upgrade(s) disponível(is)` : undefined,
    });
    updateBadge(this.optimizeBadgeEl, canOptimize ? upgradeCount : 0);

    this.openAllChestsBtn.classList.toggle(
      'hidden',
      !flags.openAllChests || state.pendingChestCount < 2,
    );

    applyMenuTooltipAnchor(this.openUpgradesBtn, 'upgrades', {
      detail:
        state.purchasableUpgradeCount > 0
          ? `${state.purchasableUpgradeCount} runa(s) disponível(is)`
          : undefined,
    });
    updateBadge(this.upgradesBadgeEl, state.purchasableUpgradeCount);

    const hasChests = state.pendingChestCount > 0;
    this.openChestBtn.disabled = !hasChests || options.openingChests;
    this.openAllChestsBtn.disabled =
      !flags.openAllChests || state.pendingChestCount < 2 || options.openingChests;
    this.openChestBtn.classList.toggle('chest-available', hasChests);
    updateBadge(this.chestBadgeEl, hasChests ? state.pendingChestCount : 0);
    updateBadge(
      this.openAllChestsBadgeEl,
      flags.openAllChests && state.pendingChestCount >= 2 ? state.pendingChestCount : 0,
    );
    applyMenuTooltipAnchor(this.openChestBtn, 'chest', {
      detail: hasChests
        ? `${state.pendingChestCount} baú(s) aguardando`
        : 'Nenhum baú disponível',
    });

    const loadoutPause = Boolean(options.loadoutPauseActive);
    const battlePause = Boolean(options.battlePauseActive);
    const canPauseBattle =
      Boolean(state.phaseRun) &&
      !state.canEditParty &&
      !loadoutPause &&
      !battlePause &&
      !state.combatIntermission;

    this.pauseBattleBtn.classList.toggle('hidden', !canPauseBattle);
    this.pauseBattleBtn.disabled = !canPauseBattle;

    this.resumeBattleBtn.classList.toggle('hidden', !battlePause || loadoutPause);

    // Mid-missão → hub via barra desativado por agora (retomar só pelo mapa).
    this.pauseLoadoutBtn.classList.add('hidden');
    this.pauseLoadoutBtn.disabled = true;
    this.pauseLoadoutBtn.hidden = true;

    // Combate inicia pelo mapa (START). Batalhar na barra fica desnecessário.
    this.continueLoadoutBtn.classList.add('hidden');
    this.continueLoadoutBtn.disabled = true;

    applyMenuTooltipAnchor(this.openBattleStatsBtn, 'stats', {
      detail: 'Pode abrir em janela destacada',
    });
  }
}
