import { CampaignOverviewDto, ActSceneDto } from '../../application/dto/CampaignDto';
import { GameStateDto } from '../../application/dto/GameStateDto';
import { IGameClient } from '../../application/ports/IGameClient';
import {
  CampaignViewMode,
  getStoredCampaignViewMode,
  isMapNewToPlayer,
  markMapSeen,
  setStoredCampaignViewMode,
} from '../campaign/CampaignViewStorage';
import {
  CampaignModalRenderer,
  isMapUnlocked,
  resolveInitialMapId,
  type CampaignMapPanelOptions,
} from '../components/CampaignModalRenderer';
import { renderCampaignViewToggle } from '../components/CampaignMapPresentation';
import {
  clearMissionPopoverPortal,
  MISSION_POPOVER_PORTAL_ID,
  syncMissionPopoverPlacement,
} from '../components/CampaignMissionMapPresentation';
import { bindCampaignTooltips, hideCampaignTooltip } from '../components/CampaignTooltipBinder';
import { bindEnemyTooltips, hideEnemyTooltip } from '../components/EnemyTooltipBinder';
import { ModalController } from '../components/ModalController';

export type CampaignPresentationMode = 'modal' | 'embedded';

export type CampaignHost = {
  mode: CampaignPresentationMode;
  body: HTMLElement;
  /** Toggle mapa-mundo/região — no modal usa o título do sheet. */
  header: HTMLElement | null;
};

export class CampaignFlow {
  private campaign: CampaignOverviewDto | null = null;
  private activeMapId = 'stendra';
  private pendingMissionId: string | null = null;
  private viewMode: CampaignViewMode = 'region';
  private actSceneReader: ((scene: ActSceneDto) => void) | null = null;
  private host: CampaignHost | null = null;
  private onStateHandler: ((state: GameStateDto) => void) | null = null;

  private onMissionStarted: ((state: GameStateDto) => void) | null = null;
  private onMapViewChange: (() => void) | null = null;

  constructor(
    private readonly client: IGameClient,
    private readonly modal: ModalController,
    private readonly renderer = new CampaignModalRenderer(),
  ) {}

  setActSceneReader(handler: (scene: ActSceneDto) => void): void {
    this.actSceneReader = handler;
  }

  setMissionStartedHandler(handler: (state: GameStateDto) => void): void {
    this.onMissionStarted = handler;
  }

  /** Notifica troca de visão / seleção de local — usado pelo tutorial do mapa. */
  setMapViewListener(handler: () => void): void {
    this.onMapViewChange = handler;
  }

  isEmbeddedActive(): boolean {
    return this.host?.mode === 'embedded';
  }

  /** True quando o popover de um local está aberto na visão de região. */
  isMissionPreviewOpen(): boolean {
    return this.viewMode === 'region' && this.pendingMissionId !== null;
  }

  async open(host: CampaignHost, onState: (state: GameStateDto) => void): Promise<void> {
    this.host = host;
    this.onStateHandler = onState;

    const response = await this.client.send({ type: 'GET_CAMPAIGN_OVERVIEW' });
    if (!response.ok || !response.campaign) return;

    const hadCampaign = this.campaign !== null;
    this.campaign = response.campaign;

    const activeMapStillValid = this.campaign.maps.some(
      (map) => map.id === this.activeMapId && isMapUnlocked(map),
    );

    if (!hadCampaign || !activeMapStillValid) {
      this.activeMapId = resolveInitialMapId(response.campaign);
      this.pendingMissionId = null;
    }

    if (host.mode === 'embedded') {
      this.viewMode = 'region';
    } else if (!hadCampaign) {
      this.viewMode = this.resolveInitialViewMode(response.campaign);
    }

    this.renderSurface();
    this.bindInteractions();
    this.scrollPendingMissionIntoView();
    this.onMapViewChange?.();
  }

  detachEmbedded(): void {
    if (this.host?.mode !== 'embedded') return;
    this.host = null;
    this.onStateHandler = null;
    hideCampaignTooltip();
    hideEnemyTooltip();
    clearMissionPopoverPortal();
  }

  private resolveInitialViewMode(campaign: CampaignOverviewDto): CampaignViewMode {
    const stored = getStoredCampaignViewMode();
    if (stored) return stored;

    const unlockedCount = campaign.maps.filter((map) => map.unlocked).length;
    return unlockedCount > 1 ? 'world' : 'region';
  }

  private shouldShowUnlockBanner(): boolean {
    if (!this.campaign || this.viewMode !== 'region') return false;
    const activeMap = this.campaign.maps.find((map) => map.id === this.activeMapId);
    if (!activeMap || !activeMap.unlocked) return false;
    return isMapNewToPlayer(activeMap.id, activeMap.unlocked);
  }

  private surfaceBody(): HTMLElement {
    if (!this.host) throw new Error('CampaignFlow sem host');
    return this.host.body;
  }

  private panelOptions(): CampaignMapPanelOptions {
    return {
      showUnlockBanner: this.shouldShowUnlockBanner(),
      pendingMissionId: this.pendingMissionId,
      variant: this.host?.mode === 'embedded' ? 'pins-only' : 'full',
    };
  }

  private renderSurface(): void {
    const body = this.surfaceBody();
    if (!this.campaign) return;

    body.innerHTML = this.renderer.render(
      this.campaign,
      this.activeMapId,
      null,
      this.viewMode,
      this.panelOptions(),
    );

    if (this.viewMode === 'region' && this.shouldShowUnlockBanner()) {
      markMapSeen(this.activeMapId);
    }

    this.mountHeaderToggle();
    bindCampaignTooltips(body);
    bindEnemyTooltips(body);
    syncMissionPopoverPlacement(body);
  }

  private chromeRoot(): HTMLElement {
    if (!this.host) throw new Error('CampaignFlow sem host');
    if (this.host.header) return this.host.header;
    return (this.host.body.closest('.modal-dialog') as HTMLElement | null) ?? this.host.body;
  }

  private mountHeaderToggle(): void {
    if (!this.campaign || this.host?.mode === 'embedded') return;
    const html = renderCampaignViewToggle(this.campaign, this.viewMode);
    if (this.host?.header) {
      this.host.header.innerHTML = html;
      bindCampaignTooltips(this.host.header);
      return;
    }

    this.modal.setTitleHtml(html);
    bindCampaignTooltips(this.modal.getTitleElement());
  }

  private bindInteractions(): void {
    const body = this.surfaceBody();
    hideCampaignTooltip();
    hideEnemyTooltip();
    this.bindViewToggle();
    this.bindWorldMapNodes();
    this.bindMissionButtons();
    this.bindStartButton();
    this.bindMissionPopoverDismiss();
    this.bindActSceneButtons();
  }

  private bindMissionPopoverDismiss(): void {
    const body = this.surfaceBody();
    body.addEventListener('pointerdown', (event) => {
      if (!this.pendingMissionId || this.viewMode !== 'region') return;

      const target = event.target as HTMLElement | null;
      if (!target?.closest) return;
      if (!target.closest('[data-campaign-map-panel]')) return;
      if (target.closest('[data-mission-id]')) return;
      if (target.closest('[data-campaign-mission-preview]')) return;
      if (target.closest('#enemy-tooltip-portal')) return;
      if (target.closest(`#${MISSION_POPOVER_PORTAL_ID}`)) return;

      this.pendingMissionId = null;
      this.refreshRegionView();
    });
  }

  private bindActSceneButtons(): void {
    const body = this.surfaceBody();
    body.querySelectorAll<HTMLButtonElement>('[data-act-scene-read]').forEach((button) => {
      button.addEventListener('click', () => {
        const sceneId = button.dataset.actSceneRead;
        if (!sceneId || !this.campaign) return;

        const map = this.campaign.maps.find((entry) => entry.id === this.activeMapId);
        const scene = map?.actScenes.find((entry) => entry.id === sceneId);
        if (!scene || !scene.unlocked) return;

        this.actSceneReader?.(scene);
      });
    });
  }

  private bindViewToggle(): void {
    this.chromeRoot()
      .querySelectorAll<HTMLButtonElement>('[data-campaign-view]')
      .forEach((button) => {
        button.addEventListener('click', () => {
          const mode = button.dataset.campaignView as CampaignViewMode | undefined;
          if (!mode || mode === this.viewMode) return;
          this.viewMode = mode;
          setStoredCampaignViewMode(mode);
          this.refreshViewMode();
        });
      });
  }

  private bindWorldMapNodes(): void {
    const body = this.surfaceBody();
    body.querySelectorAll<HTMLButtonElement>('[data-campaign-world-map]').forEach((button) => {
      button.addEventListener('click', () => {
        const mapId = button.dataset.campaignWorldMap;
        if (!mapId || button.getAttribute('aria-disabled') === 'true' || !this.campaign) return;

        const map = this.campaign.maps.find((entry) => entry.id === mapId);
        if (!map || !isMapUnlocked(map)) return;

        this.activeMapId = mapId;
        this.pendingMissionId = null;
        this.viewMode = 'region';
        setStoredCampaignViewMode('region');
        if (this.host?.mode === 'modal') {
          this.modal.close();
          return;
        }
        this.refreshViewMode();
      });
    });
  }

  private bindMissionButtons(): void {
    const body = this.surfaceBody();
    body.querySelectorAll<HTMLButtonElement>('[data-mission-id]').forEach((button) => {
      button.addEventListener('click', () => {
        const missionId = button.dataset.missionId;
        if (!missionId || button.disabled) return;
        this.pendingMissionId = this.pendingMissionId === missionId ? null : missionId;
        this.refreshRegionView();
      });
    });
  }

  private bindStartButton(): void {
    const roots: ParentNode[] = [this.surfaceBody()];
    const portal = document.getElementById(MISSION_POPOVER_PORTAL_ID);
    if (portal) roots.push(portal);

    for (const root of roots) {
      root.querySelectorAll<HTMLButtonElement>('[data-campaign-start-mission]').forEach((button) => {
        if (button.dataset.campaignStartBound === 'true') return;
        button.dataset.campaignStartBound = 'true';
        button.addEventListener('click', () => {
          const missionId = button.dataset.campaignStartMission;
          if (!missionId || button.disabled) return;
          void this.confirmMission(missionId, button);
        });
      });
    }
  }

  private scrollPendingMissionIntoView(): void {
    const body = this.surfaceBody();
    requestAnimationFrame(() => {
      body
        .querySelector('.campaign-mission-pin--pending, .campaign-world-node--active')
        ?.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        });
    });
  }

  private syncCampaignTheme(): void {
    const body = this.surfaceBody();
    body.querySelector('.campaign-modal')?.setAttribute('data-campaign-theme', this.activeMapId);
    body.querySelector('[data-campaign-map-panel]')?.setAttribute('data-campaign-theme', this.activeMapId);
  }

  private updateViewToggleUi(): void {
    const body = this.surfaceBody();
    this.chromeRoot()
      .querySelectorAll<HTMLButtonElement>('[data-campaign-view]')
      .forEach((button) => {
        const mode = button.dataset.campaignView as CampaignViewMode | undefined;
        const active = mode === this.viewMode;
        button.classList.toggle('active', active);
        button.setAttribute('aria-selected', active ? 'true' : 'false');
      });

    body.querySelector('.campaign-modal')?.setAttribute('data-campaign-view', this.viewMode);
  }

  private refreshViewMode(): void {
    if (!this.campaign) return;

    hideCampaignTooltip();
    hideEnemyTooltip();
    this.updateViewToggleUi();

    const body = this.surfaceBody();
    const panelHost = body.querySelector('[data-campaign-map-panel]') as HTMLElement | null;
    body.querySelector('[data-campaign-map-tabs]')?.remove();

    if (this.viewMode === 'world') {
      if (panelHost) {
        clearMissionPopoverPortal();
        panelHost.classList.add('campaign-map-panel--world');
        panelHost.setAttribute('aria-label', 'Mapa-mundo');
        panelHost.setAttribute('data-campaign-theme', this.activeMapId);
        panelHost.innerHTML = this.renderer.renderWorldPanel(this.campaign, this.activeMapId);
        bindCampaignTooltips(panelHost);
      }
      this.bindWorldMapNodes();
      this.scrollPendingMissionIntoView();
      this.onMapViewChange?.();
      return;
    }

    const activeMap = this.campaign.maps.find((map) => map.id === this.activeMapId);
    if (panelHost && activeMap) {
      clearMissionPopoverPortal();
      panelHost.classList.remove('campaign-map-panel--world');
      panelHost.innerHTML = this.renderer.renderMapPanel(activeMap, null, this.panelOptions());
      panelHost.setAttribute('aria-label', activeMap.name);
      panelHost.setAttribute('data-campaign-theme', this.activeMapId);
      if (this.shouldShowUnlockBanner()) {
        markMapSeen(this.activeMapId);
      }
      bindCampaignTooltips(panelHost);
      bindEnemyTooltips(panelHost);
      syncMissionPopoverPlacement(panelHost);
    }

    this.syncCampaignTheme();
    this.bindMissionButtons();
    this.bindStartButton();
    this.scrollPendingMissionIntoView();
    this.onMapViewChange?.();
  }

  private refreshRegionView(): void {
    if (!this.campaign) return;

    const body = this.surfaceBody();
    const panelHost = body.querySelector('[data-campaign-map-panel]');
    const activeMap = this.campaign.maps.find((map) => map.id === this.activeMapId);

    if (panelHost && activeMap) {
      clearMissionPopoverPortal();
      panelHost.innerHTML = this.renderer.renderMapPanel(activeMap, null, {
        ...this.panelOptions(),
        showUnlockBanner: isMapNewToPlayer(activeMap.id, activeMap.unlocked),
      });
      panelHost.setAttribute('aria-label', activeMap.name);
      if (isMapNewToPlayer(activeMap.id, activeMap.unlocked)) {
        markMapSeen(activeMap.id);
      }
      bindCampaignTooltips(panelHost);
      bindEnemyTooltips(panelHost);
      syncMissionPopoverPlacement(panelHost);
    }

    this.syncCampaignTheme();
    this.bindMissionButtons();
    this.bindStartButton();
    this.scrollPendingMissionIntoView();
    this.onMapViewChange?.();
  }

  private async confirmMission(missionId: string, button: HTMLButtonElement): Promise<void> {
    if (button.classList.contains('campaign-phase-preview-start--loading')) return;

    button.classList.add('campaign-phase-preview-start--loading');
    button.disabled = true;

    const response = await this.client.send({ type: 'START_MISSION', missionId });
    if (!response.ok) {
      button.classList.remove('campaign-phase-preview-start--loading');
      button.disabled = false;
      return;
    }

    clearMissionPopoverPortal();
    this.onStateHandler?.(response.state);
    if (this.host?.mode === 'modal') {
      this.modal.close();
    }
    this.onMissionStarted?.(response.state);
  }
}
